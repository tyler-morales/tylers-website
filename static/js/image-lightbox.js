(() => {
    const imageSelector = ".post-content img";
    const overlayId = "image-lightbox";
    let overlay = null;
    let overlayImg = null;
    let closeButton = null;
    let activeTrigger = null;

    const ensureOverlay = () => {
        if (overlay) {
            return;
        }

        overlay = document.createElement("div");
        overlay.id = overlayId;
        overlay.className = "image-lightbox";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-hidden", "true");

        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "image-lightbox__close";
        closeButton.setAttribute("aria-label", "Close image");
        closeButton.textContent = "Close";

        overlayImg = document.createElement("img");
        overlayImg.className = "image-lightbox__img";
        overlayImg.alt = "";
        overlayImg.decoding = "async";

        overlay.appendChild(closeButton);
        overlay.appendChild(overlayImg);
        document.body.appendChild(overlay);

        closeButton.addEventListener("click", closeOverlay);
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                closeOverlay();
            }
        });
    };

    const openOverlay = (img) => {
        const src = img.currentSrc || img.src;
        if (!src) {
            return;
        }

        ensureOverlay();
        activeTrigger = img;
        overlayImg.src = src;
        overlayImg.alt = img.alt || "";
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("image-lightbox-open");
        closeButton.focus();
    };

    const closeOverlay = () => {
        if (!overlay) {
            return;
        }

        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("image-lightbox-open");
        overlayImg.removeAttribute("src");

        if (activeTrigger && typeof activeTrigger.focus === "function") {
            activeTrigger.focus();
        }
        activeTrigger = null;
    };

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const img = target.closest(imageSelector);
        if (!img || img.closest("a")) {
            return;
        }

        event.preventDefault();
        openOverlay(img);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay && overlay.classList.contains("is-open")) {
            closeOverlay();
        }
    });
})();
