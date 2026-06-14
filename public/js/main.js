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
      document.querySelectorAll(
        "header, .announce-bar, main > section, footer, .back-to-top",
      ),
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

  // Honor the OS "reduce motion" setting for our JS-driven scrolling.
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // --------------------------- Back to top ------------------------------
  // Reveal a floating "back to top" button once the visitor has scrolled
  // well past the hero, then smooth-scroll up on click.
  var backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    var toggleBackToTop = function () {
      if (window.scrollY > 600) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    };
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            toggleBackToTop();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
    toggleBackToTop();
    backToTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }

  // ----------------------- Collapsible galleries ------------------------
  // Show only the first few photos by default and add a "Show all" toggle, so
  // the page is much shorter on first load. Without JS, every photo shows
  // (progressive enhancement); the toggle is created here, not in the markup.
  var setupCollapsible = function (grid, visibleCount) {
    if (!grid) {
      return;
    }
    var items = Array.prototype.slice.call(grid.children);
    var total = items.length;
    if (total <= visibleCount) {
      return;
    }

    var expanded = false;
    var applyVisibility = function () {
      items.forEach(function (li, i) {
        li.hidden = !expanded && i >= visibleCount;
      });
    };

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost gallery-more-btn";
    if (grid.id) {
      btn.setAttribute("aria-controls", grid.id);
    }
    var syncButton = function () {
      btn.textContent = expanded
        ? "Show fewer photos"
        : "Show all " + total + " photos";
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
    };

    btn.addEventListener("click", function () {
      expanded = !expanded;
      applyVisibility();
      syncButton();
      if (!expanded) {
        // Collapsing can leave the viewport far below the grid; bring it back.
        grid.scrollIntoView({
          block: "start",
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    });

    applyVisibility();
    syncButton();

    var wrap = document.createElement("div");
    wrap.className = "gallery-more";
    wrap.appendChild(btn);
    grid.parentNode.insertBefore(wrap, grid.nextSibling);
  };

  setupCollapsible(document.getElementById("gallery-grid"), 8);
  setupCollapsible(document.getElementById("amenity-grid"), 6);

  // --------------------------- Hero carousel ----------------------------
  // Auto-rotating crossfade behind the hero text. The images are decorative
  // (the heading carries the info). Respects reduced-motion (starts paused) and
  // exposes a pause/play control so it can be stopped (WCAG 2.2.2). Without JS,
  // the first slide simply stays put.
  var heroCarousel = document.querySelector(".hero-carousel");
  if (heroCarousel) {
    var heroSlides = Array.prototype.slice.call(
      heroCarousel.querySelectorAll(".hero-slide"),
    );
    if (heroSlides.length > 1) {
      var heroIndex = 0;
      var heroTimer = null;
      var heroPlaying = false;
      var HERO_INTERVAL = 5000;
      var heroToggle = document.querySelector(".hero-toggle");

      var showSlide = function (next) {
        heroSlides[heroIndex].classList.remove("is-active");
        heroIndex = (next + heroSlides.length) % heroSlides.length;
        heroSlides[heroIndex].classList.add("is-active");
      };
      var heroTick = function () {
        showSlide(heroIndex + 1);
      };

      var startHero = function () {
        if (heroPlaying) {
          return;
        }
        heroPlaying = true;
        heroTimer = window.setInterval(heroTick, HERO_INTERVAL);
        if (heroToggle) {
          heroToggle.dataset.state = "playing";
          heroToggle.setAttribute("aria-label", "Pause photo slideshow");
        }
      };
      var stopHero = function () {
        heroPlaying = false;
        if (heroTimer) {
          window.clearInterval(heroTimer);
          heroTimer = null;
        }
        if (heroToggle) {
          heroToggle.dataset.state = "paused";
          heroToggle.setAttribute("aria-label", "Play photo slideshow");
        }
      };

      if (heroToggle) {
        heroToggle.hidden = false;
        heroToggle.addEventListener("click", function () {
          if (heroPlaying) {
            stopHero();
          } else {
            startHero();
          }
        });
      }

      if (prefersReducedMotion) {
        stopHero();
      } else {
        startHero();
        // Don't advance while the tab is in the background; resume on return
        // unless the visitor explicitly paused.
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) {
            if (heroTimer) {
              window.clearInterval(heroTimer);
              heroTimer = null;
            }
          } else if (heroPlaying && !heroTimer) {
            heroTimer = window.setInterval(heroTick, HERO_INTERVAL);
          }
        });
      }
    }
  }
})();
