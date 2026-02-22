(function () {
    var supportsViewTransitions =
        "viewTransitionName" in document.documentElement.style;
    if (!supportsViewTransitions) {
        return;
    }

    var reducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
        try {
            sessionStorage.removeItem("vt-intent");
            sessionStorage.removeItem("vt-name");
        } catch (error) { }
        return;
    }

    function getTransitionName(element) {
        return element.getAttribute("data-view-transition-name") || "";
    }

    function applyViewTransitionNames() {
        var elements = document.querySelectorAll("[data-view-transition-name]");
        elements.forEach(function (element) {
            var name = getTransitionName(element);
            if (name) {
                element.style.viewTransitionName = name;
            }
        });
    }

    function clearIntent() {
        try {
            sessionStorage.removeItem("vt-intent");
            sessionStorage.removeItem("vt-name");
        } catch (error) { }
    }

    function setIntent(name) {
        try {
            sessionStorage.setItem("vt-intent", "project-image");
            sessionStorage.setItem("vt-name", name);
        } catch (error) { }
    }

    function enableTransitionIfMatched() {
        var intent = "";
        var name = "";
        try {
            intent = sessionStorage.getItem("vt-intent") || "";
            name = sessionStorage.getItem("vt-name") || "";
        } catch (error) { }

        if (intent !== "project-image" || !name) {
            return;
        }

        var match = document.querySelector(
            '.project-cover-image[data-view-transition-name="' + name + '"]'
        );
        if (match) {
            document.documentElement.classList.add("vt-project-image");
        }

        clearIntent();
    }

    applyViewTransitionNames();

    if (document.querySelector(".projects-page")) {
        function handleCoverIntent(target) {
            if (!(target instanceof Element)) {
                return;
            }

            var image = target.closest(".project-cover-image");
            if (!image) {
                return;
            }

            var link = image.closest("a[href]");
            if (!link) {
                return;
            }

            var name = getTransitionName(image);
            if (!name) {
                return;
            }

            document.documentElement.classList.add("vt-project-image");
            setIntent(name);
        }

        document.addEventListener("pointerdown", function (event) {
            if (event.defaultPrevented || event.button !== 0) {
                return;
            }
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            handleCoverIntent(event.target);
        });

        document.addEventListener("click", function (event) {
            if (event.defaultPrevented || event.button !== 0) {
                return;
            }
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            handleCoverIntent(event.target);
        });
    }

    if (document.querySelector(".project-single")) {
        enableTransitionIfMatched();
    }
})();

