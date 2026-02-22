(function () {
    var container = document.querySelector(".projects-page");
    if (!container) {
        return;
    }

    var buttons = Array.prototype.slice.call(
        container.querySelectorAll(".projects-view-button")
    );
    if (!buttons.length) {
        return;
    }

    var storageKey = "projectsViewMode";
    var defaultView = "grid";

    function setView(view) {
        container.setAttribute("data-projects-view", view);
        buttons.forEach(function (button) {
            var isActive = button.getAttribute("data-view") === view;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    try {
        var stored = localStorage.getItem(storageKey);
        if (stored === "grid" || stored === "list") {
            setView(stored);
        } else {
            setView(defaultView);
        }
    } catch (error) {
        setView(defaultView);
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            var view = button.getAttribute("data-view");
            if (!view) {
                return;
            }
            setView(view);
            try {
                localStorage.setItem(storageKey, view);
            } catch (error) {}
        });
    });
})();

