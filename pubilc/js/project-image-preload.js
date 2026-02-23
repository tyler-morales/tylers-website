(function () {
    var supportsViewTransitions =
        "viewTransitionName" in document.documentElement.style;
    if (!supportsViewTransitions) {
        return;
    }

    var reducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
        return;
    }

    var seen = new Set();

    function preloadImage(src) {
        if (!src || seen.has(src)) {
            return;
        }
        seen.add(src);
        var link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        document.head.appendChild(link);
    }

    function handleIntent(target) {
        if (!(target instanceof Element)) {
            return;
        }
        var image = target.closest(".project-cover-image");
        if (!image) {
            return;
        }
        var src = image.getAttribute("data-preload-src") || image.currentSrc || image.src;
        preloadImage(src);
    }

    if (document.querySelector(".projects-page")) {
        document.addEventListener("pointerdown", function (event) {
            handleIntent(event.target);
        });
        document.addEventListener("mouseover", function (event) {
            handleIntent(event.target);
        });
        document.addEventListener("focusin", function (event) {
            handleIntent(event.target);
        });
        document.addEventListener("touchstart", function (event) {
            handleIntent(event.target);
        }, { passive: true });
    }
})();

