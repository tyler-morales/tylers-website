(function () {
    "use strict";

    var DEBUG = false;
    var DEFAULT_THRESHOLD = 120;

    var tocNav = document.querySelector("#TableOfContentsNav, #TableOfContents, .toc");
    if (!tocNav) {
        var tocContainer = document.querySelector("[data-toc]");
        if (tocContainer) {
            tocNav = tocContainer.querySelector("#TableOfContentsNav, #TableOfContents, .toc");
        }
    }
    if (!tocNav) {
        return;
    }

    var links = Array.prototype.slice.call(tocNav.querySelectorAll('a[href^="#"]'));
    if (!links.length) {
        return;
    }

    var contentRoot =
        document.querySelector(".post-content") ||
        document.querySelector(".project-content") ||
        document.querySelector(".content") ||
        document.querySelector("main") ||
        document.body;

    var idToLink = new Map();
    links.forEach(function (link) {
        var hash = link.getAttribute("href") || "";
        var id = hash.charAt(0) === "#" ? hash.slice(1) : "";
        if (id) {
            idToLink.set(id, link);
        }
    });

    function slugify(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[\s]+/g, "-")
            .replace(/[^\w-]/g, "");
    }

    function ensureHeadingId(id, linkText) {
        var heading = document.getElementById(id);
        if (heading) {
            return heading;
        }

        var candidates = Array.prototype.slice.call(
            contentRoot.querySelectorAll("h2, h3, h4")
        );
        var desired = id || slugify(linkText || "");
        if (!desired) {
            return null;
        }
        for (var i = 0; i < candidates.length; i += 1) {
            var candidate = candidates[i];
            if (candidate.id) {
                continue;
            }
            if (slugify(candidate.textContent || "") === desired) {
                candidate.id = desired;
                return candidate;
            }
        }
        return null;
    }

    links.forEach(function (link) {
        var hash = link.getAttribute("href") || "";
        var id = hash.charAt(0) === "#" ? hash.slice(1) : "";
        if (!id) {
            return;
        }
        ensureHeadingId(id, link.textContent || "");
    });

    var headings = Array.prototype.slice
        .call(contentRoot.querySelectorAll("h2[id], h3[id], h4[id]"))
        .filter(function (heading) {
            return idToLink.has(heading.id);
        });

    if (!headings.length) {
        return;
    }

    var topList = tocNav.querySelector("ul");
    var groupItems = [];
    if (topList) {
        groupItems = Array.prototype.slice.call(topList.children).filter(function (item) {
            return item.tagName === "LI" && item.querySelector("ul");
        });
        groupItems.forEach(function (item) {
            item.classList.add("toc-group");
        });
    }

    var idToGroup = new Map();
    groupItems.forEach(function (item) {
        var link = item.querySelector(":scope > a") || item.querySelector("a");
        if (!link) {
            return;
        }
        var hash = link.getAttribute("href") || "";
        var id = hash.charAt(0) === "#" ? hash.slice(1) : "";
        if (id) {
            idToGroup.set(id, item);
        }
    });

    var parentH2ByIndex = [];
    var currentH2 = null;
    headings.forEach(function (heading, index) {
        if (heading.tagName === "H2") {
            currentH2 = heading.id;
        }
        parentH2ByIndex[index] = currentH2;
    });

    var lastActiveId = null;
    var lastActiveGroupId = null;
    var scheduled = false;
    var scrollContainer = getScrollContainer(contentRoot);

    function setActive(headingId) {
        if (!headingId) {
            return;
        }
        if (headingId !== lastActiveId) {
            links.forEach(function (link) {
                link.classList.toggle("is-active", idToLink.get(headingId) === link);
            });
            lastActiveId = headingId;
        }

        if (!groupItems.length) {
            return;
        }

        var groupId = lastActiveGroupId;
        var headingIndex = headings.findIndex(function (heading) {
            return heading.id === headingId;
        });
        if (headingIndex !== -1) {
            groupId = parentH2ByIndex[headingIndex];
        }
        if (groupId && groupId !== lastActiveGroupId) {
            groupItems.forEach(function (item) {
                item.classList.toggle("is-open", item === idToGroup.get(groupId));
            });
            lastActiveGroupId = groupId;
        }
    }

    function getThreshold() {
        var height = scrollContainer === window
            ? window.innerHeight
            : scrollContainer.clientHeight;
        return Math.round(height * 0.2) || DEFAULT_THRESHOLD;
    }

    function computeActiveHeading() {
        var threshold = getThreshold();
        var active = headings[0];
        var containerTop = 0;
        if (scrollContainer !== window) {
            containerTop = scrollContainer.getBoundingClientRect().top;
        }
        for (var i = 0; i < headings.length; i += 1) {
            var top = headings[i].getBoundingClientRect().top - containerTop;
            if (DEBUG) {
                console.log("toc heading", headings[i].id, "top:", top);
            }
            if (top <= threshold) {
                active = headings[i];
            } else {
                break;
            }
        }
        if (DEBUG) {
            console.log("toc active", active && active.id);
        }
        return active ? active.id : null;
    }

    function update() {
        scheduled = false;
        var activeId = computeActiveHeading();
        setActive(activeId);
    }

    function scheduleUpdate() {
        if (scheduled) {
            return;
        }
        scheduled = true;
        requestAnimationFrame(update);
    }

    function activateFromHash() {
        if (!window.location.hash) {
            return false;
        }
        var id = window.location.hash.slice(1);
        if (idToLink.has(id)) {
            setActive(id);
            scheduleUpdate();
            return true;
        }
        return false;
    }

    if (!activateFromHash()) {
        setActive(computeActiveHeading());
    }

    if (scrollContainer === window) {
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
    } else {
        scrollContainer.addEventListener("scroll", scheduleUpdate, { passive: true });
    }
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);
    window.addEventListener("hashchange", activateFromHash);

    function getScrollContainer(element) {
        var current = element;
        while (current && current !== document.body) {
            var style = window.getComputedStyle(current);
            var overflowY = style.overflowY;
            if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) {
                return current;
            }
            current = current.parentElement;
        }
        return window;
    }
})();

