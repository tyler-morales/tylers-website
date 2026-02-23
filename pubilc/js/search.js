/* global window, document */
(function () {
    "use strict";

    var INDEX_URL = "/index.json";
    var indexCache = null;
    var indexPromise = null;

    function getIndex() {
        if (indexCache) {
            return Promise.resolve(indexCache);
        }
        if (indexPromise) {
            return indexPromise;
        }

        var fallbackIndex = null;
        try {
            var cached = sessionStorage.getItem("searchIndex");
            if (cached) {
                var parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    fallbackIndex = parsed;
                }
            }
        } catch (error) {
            // Ignore storage errors and fall back to network.
        }

        indexPromise = fetch(INDEX_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Index fetch failed");
                }
                return response.json();
            })
            .then(function (data) {
                indexCache = Array.isArray(data) ? data : [];
                try {
                    sessionStorage.setItem("searchIndex", JSON.stringify(indexCache));
                } catch (error) {
                    // Ignore storage errors.
                }
                return indexCache;
            })
            .catch(function (error) {
                if (fallbackIndex) {
                    indexCache = fallbackIndex;
                    return indexCache;
                }
                throw error;
            })
            .finally(function () {
                indexPromise = null;
            });

        return indexPromise;
    }

    function normalize(value) {
        return (value || "").toString().toLowerCase();
    }

    function normalizeWhitespace(value) {
        return (value || "").toString().replace(/\s+/g, " ").trim();
    }

    function tokenize(query) {
        return normalize(query).split(/\s+/).filter(Boolean);
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function buildSnippet(page, searchTerms) {
        var bodyText = normalizeWhitespace(page.bodyText || "");
        if (!bodyText) {
            return defaultSnippet(page);
        }

        var matchIndex = findFirstMatchIndex(bodyText.toLowerCase(), searchTerms);
        if (matchIndex < 0) {
            return clipText(bodyText, 200);
        }

        var start = Math.max(0, matchIndex - 60);
        var end = Math.min(bodyText.length, start + 170);
        var snippet = bodyText.slice(start, end);
        if (start > 0) {
            snippet = "..." + snippet;
        }
        if (end < bodyText.length) {
            snippet += "...";
        }
        return snippet;
    }

    function defaultSnippet(page) {
        if (!page || !page.permalink) {
            return "";
        }
        if (page.permalink === "/contact/") {
            return "Go to the Contact page.";
        }
        return "";
    }

    function clipText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.slice(0, maxLength).trim() + "...";
    }

    function findFirstMatchIndex(text, searchTerms) {
        var index = -1;
        searchTerms.forEach(function (term) {
            var termIndex = text.indexOf(term);
            if (termIndex >= 0 && (index < 0 || termIndex < index)) {
                index = termIndex;
            }
        });
        return index;
    }

    function hasPrefixMatch(text, term) {
        if (!text || !term) {
            return false;
        }
        try {
            var regex = new RegExp("\\b" + escapeRegExp(term), "i");
            return regex.test(text);
        } catch (error) {
            return false;
        }
    }

    function scorePage(page, searchTerms) {
        var title = normalize(page.title);
        var bodyText = normalize(page.bodyText);
        var keywords = Array.isArray(page.keywords) ? normalize(page.keywords.join(" ")) : normalize(page.keywords);

        var score = 0;
        var matchedTerms = 0;

        searchTerms.forEach(function (term) {
            var termScore = 0;

            var titleIndex = title.indexOf(term);
            if (titleIndex >= 0) {
                termScore = Math.max(termScore, 1200 - titleIndex);
                if (hasPrefixMatch(title, term)) {
                    termScore += 800;
                }
            }

            var bodyIndex = bodyText.indexOf(term);
            if (bodyIndex >= 0) {
                termScore = Math.max(termScore, 220 - bodyIndex);
                if (hasPrefixMatch(bodyText, term)) {
                    termScore += 80;
                }
            }

            var keywordIndex = keywords.indexOf(term);
            if (keywordIndex >= 0) {
                termScore = Math.max(termScore, 500 - keywordIndex);
                if (hasPrefixMatch(keywords, term)) {
                    termScore += 200;
                }
            }

            if (termScore > 0) {
                matchedTerms += 1;
                score += termScore;
            }
        });

        if (matchedTerms === 0) {
            return 0;
        }

        score += matchedTerms * 250;
        if (matchedTerms === searchTerms.length && searchTerms.length > 1) {
            score += 600;
        }

        return score;
    }

    function findMatches(pages, searchTerms) {
        return pages
            .map(function (page) {
                var score = scorePage(page, searchTerms);
                if (score <= 0) {
                    return null;
                }
                return {
                    page: page,
                    score: score,
                    snippet: buildSnippet(page, searchTerms)
                };
            })
            .filter(Boolean)
            .sort(function (a, b) {
                return b.score - a.score;
            });
    }

    function getTypeLabel(page) {
        if (page.section === "projects") {
            return "Project";
        }
        if (page.section === "blog") {
            return "Post";
        }
        if (page.section == 'events') {
            return "Event";
        }
        if (page.section) {
            return "Page";
        }
        return "Page";
    }

    function highlightTerms(text, searchTerms) {
        var escaped = escapeHtml(text);
        searchTerms.forEach(function (term) {
            if (!term) {
                return;
            }
            var regex = new RegExp("(" + escapeRegExp(term) + ")", "ig");
            escaped = escaped.replace(regex, "<mark>$1</mark>");
        });
        return escaped;
    }

    function buildResultItem(result, searchTerms, index, query) {
        var item = document.createElement("li");
        item.className = "search-result-item";
        item.id = "search-result-" + index;

        var link = document.createElement("a");
        link.className = "search-result-link";
        link.href = buildResultHref(result.page.permalink || "#", query);

        var title = document.createElement("span");
        title.className = "search-result-title";
        title.textContent = result.page.title

        var badge = document.createElement("span");
        badge.className = "search-result-badge";
        badge.textContent = getTypeLabel(result.page);

        link.appendChild(title);
        link.appendChild(badge);
        item.appendChild(link);

        if (result.snippet) {
            var snippet = document.createElement("div");
            snippet.className = "search-result-snippet";
            snippet.innerHTML = highlightTerms(result.snippet, searchTerms);
            item.appendChild(snippet);
        }

        return item;
    }

    function buildResultHref(href, query) {
        if (!query || !href || href === "#") {
            return href;
        }
        try {
            var resolved = new URL(href, window.location.origin);
            resolved.searchParams.set("q", query);
            return resolved.pathname + resolved.search + resolved.hash;
        } catch (error) {
            return href;
        }
    }

    function updateResultsUI(state, query, results, searchTerms) {
        var statusEl = state.statusEl;
        var metaEl = state.metaEl;
        var listEl = state.resultsEl;
        var panelEl = state.panelEl;
        var instructionsEl = state.instructionsEl;
        var footerEl = state.footerEl;
        var mode = state.mode;
        var paginationEl = state.paginationEl;
        var pageStatusEl = state.pageStatusEl;
        var prevButton = state.prevButton;
        var nextButton = state.nextButton;

        listEl.innerHTML = "";
        state.activeIndex = -1;
        if (!query) {
            if (instructionsEl) {
                instructionsEl.hidden = mode !== "page";
            }
            if (mode === "dropdown") {
                panelEl.hidden = true;
            }
            statusEl.textContent = mode === "page" ? "Enter a search term to see results." : "";
            if (metaEl) {
                metaEl.hidden = true;
                metaEl.textContent = "";
            }
            if (paginationEl) {
                paginationEl.hidden = true;
            }
            return;
        }

        if (instructionsEl) {
            instructionsEl.hidden = true;
        }
        panelEl.hidden = false;

        if (mode === "page" && metaEl) {
            var elapsedNs = Math.max(0, Math.round(Number(state.elapsedMs) * 1000000));
            metaEl.hidden = false;
        } else if (metaEl) {
            metaEl.hidden = true;
            metaEl.textContent = "";
        }

        if (!results.length) {
            statusEl.textContent = "0 results for \"" + query + "\".";
            } else {
            statusEl.textContent = results.length + " results for \"" + query + "\".";
        }

        var fragment = document.createDocumentFragment();
        var limit = state.resultsLimit;
        var startIndex = 0;
        var endIndex = results.length;
        if (mode === "page") {
            var totalPages = Math.max(1, Math.ceil(results.length / limit));
            var currentPage = Math.min(Math.max(state.currentPage, 1), totalPages);
            state.currentPage = currentPage;
            startIndex = (currentPage - 1) * limit;
            endIndex = Math.min(results.length, startIndex + limit);

            if (paginationEl && pageStatusEl && prevButton && nextButton) {
                paginationEl.hidden = results.length === 0;
                pageStatusEl.textContent = (results.length ? (startIndex + 1) + "-" + endIndex : 0) +
                    " of " + results.length;
                prevButton.disabled = currentPage <= 1;
                nextButton.disabled = currentPage >= totalPages;
            }
        } else if (paginationEl) {
            paginationEl.hidden = true;
        }

        results.slice(startIndex, endIndex).forEach(function (result, index) {
            fragment.appendChild(buildResultItem(result, searchTerms, index, query));
        });
        listEl.appendChild(fragment);

        if (footerEl) {
            footerEl.hidden = mode !== "dropdown";
        }
        if (state.allLink) {
            state.allLink.href = "/search/?q=" + encodeURIComponent(query);
        }
    }

    function createDebouncer(delay) {
        var timeout = null;
        return function (fn) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(fn, delay);
        };
    }

    function setActiveResult(state, index) {
        var items = state.resultsEl.querySelectorAll(".search-result-item");
        items.forEach(function (item, itemIndex) {
            if (itemIndex === index) {
                item.classList.add("is-active");
            } else {
                item.classList.remove("is-active");
            }
        });
        state.activeIndex = index;
    }

    function getActiveLink(state) {
        if (state.activeIndex < 0) {
            return null;
        }
        var item = state.resultsEl.querySelectorAll(".search-result-item")[state.activeIndex];
        return item ? item.querySelector("a") : null;
    }

    function initSearchComponent(root) {
        var input = root.querySelector("[data-search-input]");
        var panelEl = root.querySelector("[data-search-panel]");
        var statusEl = root.querySelector("[data-search-status]");
        var metaEl = root.querySelector("[data-search-meta]");
        var resultsEl = root.querySelector("[data-search-results]");
        var instructionsEl = root.querySelector("[data-search-instructions]");
        var footerEl = root.querySelector("[data-search-footer]");
        var allLink = root.querySelector("[data-search-all]");
        var paginationEl = root.querySelector("[data-search-pagination]");
        var prevButton = root.querySelector("[data-search-prev]");
        var nextButton = root.querySelector("[data-search-next]");
        var pageStatusEl = root.querySelector("[data-search-page-status]");
        var mode = root.getAttribute("data-search-mode") || "dropdown";
        var debounced = createDebouncer(140);

        if (!input || !panelEl || !statusEl || !resultsEl) {
            return;
        }

        var state = {
            input: input,
            panelEl: panelEl,
            statusEl: statusEl,
            metaEl: metaEl,
            resultsEl: resultsEl,
            instructionsEl: instructionsEl,
            footerEl: footerEl,
            allLink: allLink,
            paginationEl: paginationEl,
            prevButton: prevButton,
            nextButton: nextButton,
            pageStatusEl: pageStatusEl,
            mode: mode,
            resultsLimit: mode === "page" ? 15 : 6,
            activeIndex: -1,
            currentPage: 1,
            elapsedMs: 0
        };

        function performSearch(query) {
            var trimmed = query.trim();
            var terms = tokenize(trimmed);
            if (!trimmed) {
                updateResultsUI(state, "", [], []);
                return;
            }

            statusEl.textContent = "Searching for \"" + trimmed + "\"...";
            getIndex()
                .then(function (index) {
                    var start = performance.now();
                    var results = findMatches(index, terms);
                    var end = performance.now();
                    state.elapsedMs = Math.round(end - start);
                    updateResultsUI(state, trimmed, results, terms);
                })
                .catch(function () {
                    statusEl.textContent = "Search index failed to load. Please try again.";
                });
        }

        input.addEventListener("input", function (event) {
            debounced(function () {
                if (mode === "page") {
                    state.currentPage = 1;
                    updateSearchURL(event.target.value, 1);
                }
                performSearch(event.target.value);
            });
        });

        input.addEventListener("focus", function () {
            if (input.value.trim()) {
                performSearch(input.value);
            }
        });

        input.addEventListener("keydown", function (event) {
            if (mode !== "dropdown") {
                return;
            }
            var items = state.resultsEl.querySelectorAll(".search-result-item");
            if (!items.length) {
                return;
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                var nextIndex = state.activeIndex + 1;
                if (nextIndex >= items.length) {
                    nextIndex = 0;
                }
                setActiveResult(state, nextIndex);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                var prevIndex = state.activeIndex - 1;
                if (prevIndex < 0) {
                    prevIndex = items.length - 1;
                }
                setActiveResult(state, prevIndex);
            } else if (event.key === "Enter") {
                var activeLink = getActiveLink(state);
                if (activeLink) {
                    event.preventDefault();
                    activeLink.click();
                }
            } else if (event.key === "Escape") {
                panelEl.hidden = true;
                state.activeIndex = -1;
            }
        });

        document.addEventListener("click", function (event) {
            if (mode !== "dropdown") {
                return;
            }
            if (!root.contains(event.target)) {
                panelEl.hidden = true;
                state.activeIndex = -1;
            }
        });

        resultsEl.addEventListener("click", function (event) {
            if (mode !== "dropdown") {
                return;
            }
            var link = event.target.closest(".search-result-link");
            if (!link) {
                return;
            }
            panelEl.hidden = true;
            resultsEl.innerHTML = "";
            statusEl.textContent = "";
            state.activeIndex = -1;
        });

        if (allLink && mode === "dropdown") {
            allLink.addEventListener("click", function () {
                panelEl.hidden = true;
                resultsEl.innerHTML = "";
                statusEl.textContent = "";
                input.value = "";
                state.activeIndex = -1;
            });
        }

        if (mode === "page" && paginationEl && prevButton && nextButton) {
            prevButton.addEventListener("click", function () {
                if (state.currentPage > 1) {
                    state.currentPage -= 1;
                    updateSearchURL(input.value, state.currentPage);
                    performSearch(input.value);
                }
            });
            nextButton.addEventListener("click", function () {
                state.currentPage += 1;
                updateSearchURL(input.value, state.currentPage);
                performSearch(input.value);
            });
        }

        if (mode === "dropdown" && window.location.pathname.indexOf("/search") === 0) {
            panelEl.hidden = true;
            resultsEl.innerHTML = "";
            statusEl.textContent = "";
            input.value = "";
            state.activeIndex = -1;
        }

        var params = new URLSearchParams(window.location.search);
        var rawQuery = (params.get("q") || "").trim();
        var pageParam = parseInt(params.get("page") || "1", 10);
        if (!Number.isFinite(pageParam) || pageParam < 1) {
            pageParam = 1;
        }
        state.currentPage = pageParam;
        if (rawQuery && mode === "dropdown") {
            input.value = "";
            panelEl.hidden = true;
            resultsEl.innerHTML = "";
            statusEl.textContent = "";
            state.activeIndex = -1;
        } else if (rawQuery && mode === "page") {
            input.value = rawQuery;
            performSearch(rawQuery);
        } else if (mode === "page") {
            updateResultsUI(state, "", [], []);
            panelEl.hidden = false;
        }
    }

    function updateSearchURL(query, page) {
        if (!window.history || !window.history.replaceState) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        if (query) {
            params.set("q", query);
        } else {
            params.delete("q");
        }
        if (page && page > 1) {
            params.set("page", String(page));
        } else {
            params.delete("page");
        }
        var search = params.toString();
        var next = window.location.pathname + (search ? "?" + search : "");
        window.history.replaceState({}, "", next);
    }

    function initSearchUI() {
        var components = document.querySelectorAll("[data-search-component]");
        if (!components.length) {
            return;
        }
        var onSearchPage = window.location.pathname.indexOf("/search") === 0;
        components.forEach(function (component) {
            var mode = component.getAttribute("data-search-mode") || "dropdown";
            if (onSearchPage && mode === "dropdown") {
                component.remove();
                return;
            }
            initSearchComponent(component);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSearchUI);
    } else {
        initSearchUI();
    }
})();

