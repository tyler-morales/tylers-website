(function () {
  function markLoading(img) {
    if (!img || !(img instanceof HTMLImageElement)) {
      return;
    }
    if (img.complete && img.naturalWidth > 0) {
      img.classList.remove("image-loading");
      return;
    }
    img.classList.add("image-loading");
    var clear = function () {
      img.classList.remove("image-loading");
      img.removeEventListener("load", clear);
      img.removeEventListener("error", clear);
    };
    img.addEventListener("load", clear);
    img.addEventListener("error", clear);
  }

  function init() {
    Array.prototype.forEach.call(document.images, markLoading);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

