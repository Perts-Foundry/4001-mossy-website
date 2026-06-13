// 4001 Mossy Bank Lane site interactions.
// Vanilla JS, no dependencies. Progressive enhancement: with JS disabled the
// page still works (gallery images are visible, links function, nav is open).

(function () {
  "use strict";

  // --------------------------- Footer year ------------------------------
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // --------------------------- Mobile nav -------------------------------
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close the menu after tapping a link (single-page anchors).
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ----------------------------- Lightbox -------------------------------
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var galleryButtons = Array.prototype.slice.call(
    document.querySelectorAll(".gallery-item"),
  );

  if (lightbox && lightboxImg && galleryButtons.length) {
    var currentIndex = 0;
    var lastFocused = null;

    // Everything except the lightbox itself; made inert while it's open so
    // assistive tech and the tab order are scoped to the modal. (The Tab trap
    // below is a fallback for browsers without inert support.)
    var backgroundRegions = Array.prototype.slice.call(
      document.querySelectorAll("header, main > section, footer"),
    );
    var setBackgroundInert = function (state) {
      backgroundRegions.forEach(function (el) {
        el.inert = state;
      });
    };

    var showImage = function (index) {
      var count = galleryButtons.length;
      currentIndex = (index + count) % count;
      var btn = galleryButtons[currentIndex];
      var full = btn.getAttribute("data-full");
      var caption = btn.getAttribute("data-caption") || "";
      lightboxImg.setAttribute("src", full);
      lightboxImg.setAttribute("alt", caption);
      lightboxCaption.textContent = caption;
    };

    var openLightbox = function (index) {
      lastFocused = document.activeElement;
      showImage(index);
      lightbox.hidden = false;
      setBackgroundInert(true);
      document.body.style.overflow = "hidden";
      var closeBtn = lightbox.querySelector(".lightbox-close");
      if (closeBtn) {
        closeBtn.focus();
      }
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      setBackgroundInert(false);
      document.body.style.overflow = "";
      lightboxImg.setAttribute("src", "");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    };

    galleryButtons.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        openLightbox(index);
      });
    });

    lightbox.addEventListener("click", function (event) {
      var el = event.target.closest("[data-close], [data-prev], [data-next]");
      if (!el) {
        return;
      }
      if (el.hasAttribute("data-close")) {
        closeLightbox();
      } else if (el.hasAttribute("data-prev")) {
        showImage(currentIndex - 1);
      } else if (el.hasAttribute("data-next")) {
        showImage(currentIndex + 1);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) {
        return;
      }
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        showImage(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        showImage(currentIndex + 1);
      } else if (event.key === "Tab") {
        // Simple focus trap: keep focus on the visible controls.
        var focusable = lightbox.querySelectorAll("button");
        if (!focusable.length) {
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
})();
