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

  /* ---------- Process steps: carousel drives the layer diagram ----------
     Each slide carries data-node — the diagram node it corresponds to — so
     stepping the carousel lights the matching pill, connector and stack layer. */
  var plTrack = document.getElementById('pl-track');
  if (plTrack) {
    var SLIDE_STEP = 382;                       /* 302 slide + 80 gap */
    var plSlides = plTrack.querySelectorAll('.pl-slide');
    var plDots = document.querySelectorAll('#pl-dots i');
    var plNodes = document.querySelectorAll('.pl-node');
    var plLayers = document.querySelectorAll('.pl-layer');
    var plIndex = 0;

    var showStep = function (i) {
      plIndex = (i + plSlides.length) % plSlides.length;
      plTrack.style.transform = 'translateX(' + (-plIndex * SLIDE_STEP) + 'px)';

      var node = plSlides[plIndex].getAttribute('data-node');

      Array.prototype.forEach.call(plDots, function (d, n) {
        d.classList.toggle('is-active', n === plIndex);
      });
      Array.prototype.forEach.call(plNodes, function (n) {
        n.classList.toggle('is-active', n.getAttribute('data-node') === node);
      });
      Array.prototype.forEach.call(plLayers, function (l) {
        l.classList.toggle('is-active', l.getAttribute('data-layer') === node);
      });
    };

    var prevBtn = document.querySelector('.pl-arrow--prev');
    var nextBtn = document.querySelector('.pl-arrow--next');
    if (prevBtn) prevBtn.addEventListener('click', function () { showStep(plIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showStep(plIndex + 1); });

    /* clicking a diagram node jumps the carousel to it */
    Array.prototype.forEach.call(plNodes, function (n) {
      n.addEventListener('click', function () {
        var want = n.getAttribute('data-node');
        for (var i = 0; i < plSlides.length; i++) {
          if (plSlides[i].getAttribute('data-node') === want) { showStep(i); return; }
        }
      });
    });

    showStep(0);
  }

  /* ---------- Augmented Teams: single-open accordion ---------- */
  var teamsList = document.getElementById('teams-list');
  if (teamsList) {
    var teams = teamsList.querySelectorAll('.tm');
    Array.prototype.forEach.call(teams, function (row) {
      row.addEventListener('click', function () {
        var wasOpen = row.classList.contains('is-open');
        Array.prototype.forEach.call(teams, function (other) {
          other.classList.remove('is-open');
          other.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          row.classList.add('is-open');
          row.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Benefits: hovering a column swaps the backdrop ---------- */
  var benCard = document.getElementById('benefits-card');
  if (benCard) {
    var benCols = benCard.querySelectorAll('.wp-col');
    var benBgs = benCard.querySelectorAll('.wp__bg img');
    var benIndex = 0;

    var showBenefit = function (i) {
      benIndex = (i + benCols.length) % benCols.length;
      Array.prototype.forEach.call(benCols, function (c, n) {
        c.classList.toggle('is-active', n === benIndex);
      });
      Array.prototype.forEach.call(benBgs, function (b, n) {
        b.classList.toggle('is-active', n === benIndex);
      });
    };

    Array.prototype.forEach.call(benCols, function (col, n) {
      col.addEventListener('mouseenter', function () { showBenefit(n); });
      col.addEventListener('focus', function () { showBenefit(n); });
      col.addEventListener('click', function () { showBenefit(n); });
    });

    var benPrev = benCard.querySelector('.wp__arrow--prev');
    var benNext = benCard.querySelector('.wp__arrow--next');
    if (benPrev) benPrev.addEventListener('click', function () { showBenefit(benIndex - 1); });
    if (benNext) benNext.addEventListener('click', function () { showBenefit(benIndex + 1); });
  }

  /* ---------- About: the process wire draws itself as you scroll ----------
     The red dotted path is painted through a mask whose stroke unrolls from
     nothing to its full length, so the wire reads as filling in. Everything
     hanging off it — headings, numbered stops, copy blocks — eases in on its
     own as it reaches the viewport, which keeps the two effects independent. */
  var wireReveal = document.getElementById('ab-wire-reveal');
  var wireArt = document.getElementById('ab-wire-art');

  if (wireReveal && wireArt) {
    var wireSvg = wireArt.querySelector('.ab-wire__svg');
    var wireRisers = wireArt.querySelectorAll('.ab-rise');
    var wireQueued = false;

    var drawWire = function () {
      wireQueued = false;

      var box = wireSvg.getBoundingClientRect();
      var vh = window.innerHeight;

      /* 0 while the head of the wire is still below 70% of the viewport,
         1 once its tail has climbed past 40% */
      var head = vh * 0.7;
      var tail = vh * 0.4;
      var span = box.height + head - tail;
      var p = span > 0 ? (head - box.top) / span : 0;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);

      wireReveal.setAttribute('stroke-dashoffset', String(1000 - 1000 * p));

      Array.prototype.forEach.call(wireRisers, function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < vh * 0.88) el.classList.add('is-in');
      });
    };

    var queueWire = function () {
      if (!wireQueued) {
        wireQueued = true;
        requestAnimationFrame(drawWire);
      }
    };

    window.addEventListener('scroll', queueWire, { passive: true });
    window.addEventListener('resize', queueWire);
    drawWire();
  }

  /* ---------- About: Our Story — one year per arrow click ----------
     Every year sits on the rail as a small stop; the active one is also drawn
     big at the head of the rail. Stepping forward slides the rail one stop
     left, so the next year takes the big slot and the years already told fade
     out behind it. */
  var jrTrack = document.getElementById('jr-track');
  var jrBig = document.getElementById('jr-big');

  if (jrTrack && jrBig) {
    var JR_STEP = 364;                    /* 346 column + 18 gap */
    var jrYears = jrTrack.querySelectorAll('.jr__year');
    var jrCards = jrBig.querySelectorAll('.jr__bigcard');
    var jrPrev = document.querySelector('.jr__arrow--prev');
    var jrNext = document.querySelector('.jr__arrow--next');
    var jrLast = jrCards.length - 1;
    var jrIndex = 0;

    var showYear = function (i) {
      jrIndex = i < 0 ? 0 : (i > jrLast ? jrLast : i);

      jrTrack.style.transform = 'translateX(' + (-jrIndex * JR_STEP) + 'px)';

      Array.prototype.forEach.call(jrYears, function (y, n) {
        y.classList.toggle('is-past', n <= jrIndex);
      });
      Array.prototype.forEach.call(jrCards, function (c, n) {
        c.classList.toggle('is-active', n === jrIndex);
      });

      if (jrPrev) jrPrev.disabled = jrIndex === 0;
      if (jrNext) jrNext.disabled = jrIndex === jrLast;
    };

    if (jrPrev) jrPrev.addEventListener('click', function () { showYear(jrIndex - 1); });
    if (jrNext) jrNext.addEventListener('click', function () { showYear(jrIndex + 1); });

    /* clicking a stop on the rail jumps straight to that year */
    Array.prototype.forEach.call(jrYears, function (y, n) {
      y.addEventListener('click', function () { showYear(n); });
    });

    showYear(0);
  }

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
