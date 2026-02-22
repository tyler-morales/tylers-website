/* global window, document */
(function () {
    "use strict";

    if (window.location.pathname.indexOf("/search") === 0) {
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var rawQuery = (params.get("q") || "").trim();
    if (!rawQuery) {
        return;
    }

    var tokens = rawQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(function (token) {
            return token && token.length > 2;
        });

    if (!tokens.length) {
        return;
    }

    var root = document.querySelector("main");
    if (!root) {
        return;
    }

    var scopedSelector = [".post-content", ".project-content", ".content", "article"];
    var contentRoot = root;
    scopedSelector.some(function (selector) {
        var candidate = root.querySelector(selector);
        if (candidate) {
            contentRoot = candidate;
            return true;
        }
        return false;
    });

    var titleEl = root.querySelector("h1");
    var roots = [contentRoot];
    if (titleEl && !contentRoot.contains(titleEl)) {
        roots.unshift(titleEl);
    }

    var regex = new RegExp("(" + tokens.map(escapeRegExp).join("|") + ")", "ig");
    var firstMatch = null;

    roots.forEach(function (scopeRoot) {
        var walker = document.createTreeWalker(scopeRoot, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (isExcluded(node.parentElement)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var node;
        while ((node = walker.nextNode())) {
            if (highlightTextNode(node) && !firstMatch) {
                firstMatch = scopeRoot.querySelector("mark.search-hit");
            }
        }
    });

    if (firstMatch) {
        firstMatch.scrollIntoView({ block: "center", behavior: "smooth" });
        setupCleanup();
    }

    function highlightTextNode(textNode) {
        var text = textNode.nodeValue;
        regex.lastIndex = 0;
        if (!regex.test(text)) {
            return false;
        }
        regex.lastIndex = 0;
        var fragment = document.createDocumentFragment();
        var lastIndex = 0;
        var match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            var mark = document.createElement("mark");
            mark.className = "search-hit";
            mark.textContent = match[0];
            fragment.appendChild(mark);
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        textNode.parentNode.replaceChild(fragment, textNode);
        return true;
    }

    function isExcluded(element) {
        if (!element) {
            return false;
        }
        return Boolean(element.closest("script, style, pre, code, nav, header, footer, input, textarea, select, button, .search-component"));
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function clearHighlights() {
        var marks = document.querySelectorAll("mark.search-hit");
        marks.forEach(function (mark) {
            var textNode = document.createTextNode(mark.textContent);
            if (mark.parentNode) {
                mark.parentNode.replaceChild(textNode, mark);
            }
        });
        roots.forEach(function (scopeRoot) {
            scopeRoot.normalize();
        });
    }

    function setupCleanup() {
        var cleanup = function () {
            clearHighlights();
        };
        window.addEventListener("click", cleanup, { once: true });
        window.addEventListener("keydown", cleanup, { once: true });
        setTimeout(cleanup, 20000);
    }
})();

