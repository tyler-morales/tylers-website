(function () {
    "use strict";

    var storageKey = "theme";
    var docEl = document.documentElement;
    var toggle = document.getElementById("theme-toggle");
    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var currentMode = getInitialMode();

    applyMode(currentMode, false);

    if (toggle) {
        toggle.addEventListener("click", function () {
            currentMode = currentMode === "dark" ? "light" : "dark";
            applyMode(currentMode, true);
        });
    }

    function getStoredMode() {
        try {
            return localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    function setStoredMode(mode) {
        try {
            localStorage.setItem(storageKey, mode);
        } catch (error) {}
    }

    function getInitialMode() {
        var storedMode = getStoredMode();
        if (storedMode === "light" || storedMode === "dark") {
            return storedMode;
        }
        return mediaQuery && mediaQuery.matches ? "dark" : "light";
    }

    function applyMode(mode, persist) {
        docEl.setAttribute("data-theme", mode);
        updateToggle(mode);
        if (persist) {
            setStoredMode(mode);
        }
    }

    function updateToggle(mode) {
        if (!toggle) {
            return;
        }
        var isDark = mode === "dark";
        var emoji = isDark ? "🕯️" : "💡";
        var ariaLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
        toggle.textContent = emoji;
        toggle.setAttribute("aria-label", ariaLabel);
        toggle.setAttribute("data-theme-mode", mode);
    }
})();

