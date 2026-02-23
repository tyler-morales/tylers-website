/**
 * Replace Isso Gravatar images with the commenter's first-name initial.
 * Runs after Isso injects comments into #isso-thread; uses MutationObserver
 * so dynamically loaded comments are handled. Fallback: if structure differs,
 * avatars remain unchanged.
 */
(function () {
    "use strict";

    var thread = document.getElementById("isso-thread");
    if (!thread) return;

    var avatarColors = [
        "#5698c4",
        "#9abf88",
        "#e279a3",
        "#9163b6",
        "#c9906b",
        "#6b8dc9",
        "#7eb875",
        "#d4736e"
    ];

    function hashToIndex(str) {
        var n = 0;
        for (var i = 0; i < (str || "").length; i++) {
            n = (n * 31 + str.charCodeAt(i)) >>> 0;
        }
        return n;
    }

    function getInitial(commentEl) {
        var author =
            commentEl.querySelector(".isso-author") ||
            commentEl.querySelector("[class*='author']") ||
            commentEl.querySelector("a[href*='mailto']");
        var name = author ? (author.textContent || "").trim() : "";
        if (!name) return "?";
        return name.charAt(0).toUpperCase();
    }

    function applyInitial(commentEl) {
        if (commentEl.dataset.commentsAvatarApplied) return;
        var avatar =
            commentEl.querySelector(".isso-avatar") ||
            commentEl.querySelector("[class*='avatar']") ||
            commentEl.querySelector("img");
        if (!avatar) return;
        var initial = getInitial(commentEl);
        var colorIndex = hashToIndex(initial) % avatarColors.length;
        var span = document.createElement("span");
        span.className = "comments-avatar-initial";
        span.setAttribute("aria-hidden", "true");
        span.textContent = initial;
        span.style.backgroundColor = avatarColors[colorIndex];
        if (avatar.parentNode) {
            avatar.style.display = "none";
            avatar.setAttribute("aria-hidden", "true");
            avatar.parentNode.insertBefore(span, avatar.nextSibling);
        }
        commentEl.dataset.commentsAvatarApplied = "true";
    }

    function run() {
        var comments = thread.querySelectorAll(".isso-comment");
        for (var i = 0; i < comments.length; i++) {
            applyInitial(comments[i]);
        }
    }

    var observer = new MutationObserver(function () {
        run();
    });

    observer.observe(thread, { childList: true, subtree: true });

    if (thread.querySelector(".isso-comment")) {
        run();
    }
})();
