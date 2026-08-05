/* HackerKernel — home page interactions */
(function () {
  'use strict';

  /* ---------- Generic step slider ---------- */
  function slider(trackId, prevSel, nextSel, step, perView) {
    var track = document.getElementById(trackId);
    if (!track) return;

    var prev = document.querySelector(prevSel);
    var next = document.querySelector(nextSel);
    var index = 0;
    var max = Math.max(0, track.children.length - perView);

    function render() {
      track.style.transform = 'translateX(' + (-index * step) + 'px)';
    }

    if (prev) prev.addEventListener('click', function () {
      index = index > 0 ? index - 1 : max;
      render();
    });

    if (next) next.addEventListener('click', function () {
      index = index < max ? index + 1 : 0;
      render();
    });
  }

  slider('services-track', '.services__arrows .arrow-btn--prev', '.services__arrows .arrow-btn--next', 346, 3);
  slider('ind-track', '#ind-prev', '#ind-next', 244, 4);

  /* ---------- Marquee rows: duplicate content for a seamless loop ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-marquee]'), function (row) {
    row.innerHTML += row.innerHTML;
  });

  /* ---------- Slide-in menu: burger morphs into the cross ---------- */
  var burger = document.getElementById('menu-toggle');
  var overlay = document.getElementById('menu-overlay');

  if (burger && overlay) {
    var setMenu = function (open) {
      document.body.classList.toggle('is-menu-open', open);
      overlay.classList.toggle('is-open', open);
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    burger.addEventListener('click', function () {
      setMenu(!overlay.classList.contains('is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) setMenu(false);
    });

    /* follow a link, then let the panel close behind it */
    Array.prototype.forEach.call(overlay.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* ---------- Case-study filter tabs ---------- */
  var filters = document.querySelectorAll('.cs-filter');
  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* ---------- Navbar backdrop appears once the page moves ---------- */
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var syncNavbar = function () {
      navbar.classList.toggle('is-scrolled', window.pageYOffset > 8);
    };
    window.addEventListener('scroll', syncNavbar, { passive: true });
    syncNavbar();
  }

  /* ---------- Eased page scrolling ----------
     The wheel sets a target; a rAF loop glides the page towards it, so a notch
     travels a shorter distance and settles instead of snapping. Touch devices
     and reduced-motion users keep the native behaviour. */
  var EASE = 0.085;   /* per-frame approach: lower = longer glide */
  var SPEED = 0.75;   /* distance per wheel notch: lower = calmer */

  var noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (!noMotion && !coarse) {
    document.documentElement.classList.add('js-smooth');

    var target = window.pageYOffset;
    var current = target;
    var running = false;

    var limit = function () {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    };

    var clamp = function (v) {
      return Math.max(0, Math.min(v, limit()));
    };

    var frame = function () {
      var diff = target - current;

      if (Math.abs(diff) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        running = false;
        return;
      }

      current += diff * EASE;
      window.scrollTo(0, current);
      requestAnimationFrame(frame);
    };

    var start = function () {
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    };

    var locked = function () {
      return document.body.classList.contains('is-menu-open');
    };

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || locked()) return;      /* leave pinch-zoom alone */

      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;                  /* lines -> px */
      else if (e.deltaMode === 2) delta *= window.innerHeight;

      e.preventDefault();
      target = clamp(target + delta * SPEED);
      start();
    }, { passive: false });

    /* Anything we are not driving (keyboard, scrollbar, restored position)
       becomes the new baseline. */
    window.addEventListener('scroll', function () {
      if (!running) {
        current = target = window.pageYOffset;
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (!running) current = target = window.pageYOffset;
      else target = clamp(target);
    });

    /* In-page anchors ride the same easing */
    document.addEventListener('click', function (e) {
      var link = e.target && e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var dest = document.querySelector(hash);
      if (!dest) return;

      e.preventDefault();
      current = window.pageYOffset;
      target = clamp(current + dest.getBoundingClientRect().top);
      start();
    });
  }
})();
