(function () {
    "use strict";

    var HEX_CODE_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

    function expandHex(value) {
        var hex = value.slice(1);
        if (hex.length === 3 || hex.length === 4) {
            return "#" + hex.split("").map(function (char) {
                return char + char;
            }).join("");
        }
        return "#" + hex;
    }

    function getReadableTextColor(expandedHex) {
        var colorHex = expandedHex.length === 9 ? expandedHex.slice(0, 7) : expandedHex;
        var r = parseInt(colorHex.slice(1, 3), 16) / 255;
        var g = parseInt(colorHex.slice(3, 5), 16) / 255;
        var b = parseInt(colorHex.slice(5, 7), 16) / 255;

        var luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
        return luminance > 0.53 ? "#111" : "#fff";
    }

    function getBorderColor(textColor) {
        return textColor === "#fff" ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.16)";
    }

    function decorateInlineHexColorCodes() {
        var nodes = document.querySelectorAll(
            ".post-content p code, .post-content li code, .post-content blockquote code, .post-content figcaption code"
        );

        nodes.forEach(function (node) {
            if (node.closest("pre")) {
                return;
            }

            var rawValue = (node.textContent || "").trim();
            if (!HEX_CODE_RE.test(rawValue)) {
                return;
            }

            var expanded = expandHex(rawValue);
            var textColor = getReadableTextColor(expanded);

            node.classList.add("code-color-chip");
            node.style.setProperty("--code-chip-bg", rawValue);
            node.style.setProperty("--code-chip-fg", textColor);
            node.style.setProperty("--code-chip-border", getBorderColor(textColor));
            node.setAttribute("title", rawValue);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", decorateInlineHexColorCodes);
    } else {
        decorateInlineHexColorCodes();
    }
})();
