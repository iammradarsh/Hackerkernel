/* HackerKernel — loading screen.

   The mark builds itself: the two halves of the ring draw from twelve
   o'clock and meet at the bottom, then the H slides out from under the left
   half and the K from under the right, which is the order the logo itself
   reads in. Once it is whole the ring keeps turning, so the screen says
   "still working" rather than "finished" while the page is still arriving.

   Injected rather than pasted into every document, for the same reason the
   mobile drawer is: one screen, one animation, one exit path. A page opts in
   with a single tag placed immediately after <body>, and nothing else -
   markup and styling both live here and in style.css.

   Being JS-injected is also the failsafe. With scripting off there is no
   overlay to get stuck behind, and if anything below throws before the exit
   is armed the hard timeout still lifts it.

   Styling lives in style.css under "LOADING SCREEN". Geometry is the same
   80x80 grid as assets/hk-logo.svg - keep the two in step. */
(function () {
  'use strict';

  /* a second copy would sit on top of the first and never be dismissed */
  if (document.getElementById('hk-loader')) return;

  /* the tag belongs immediately after <body>: run from <head> and there is
     nothing to append to yet, and running any later means the screen arrives
     after the page it is meant to cover */
  if (!document.body) return;

  var root = document.documentElement;

  /* How long the screen stays up at minimum. The ring needs 0.85s to close
     and the letters land at 1.2s, so anything shorter than this shows a mark
     that is still assembling as it leaves. A cached page hits `load` in
     ~50ms, which is precisely when that would happen. */
  var MIN_MS = 1400;

  /* If `load` never comes - a hung font, an image that neither loads nor
     errors, a throw in the block below - the page is still readable. The
     screen comes off on its own. */
  var MAX_MS = 7000;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Markup ----------
     The mark is inlined rather than pointed at assets/hk-logo.svg: the arcs
     and the letters have to be reachable as elements for the draw and the
     slide, and an <img> hands over a picture, not a document. The clip id is
     scoped with a `-load` suffix so it cannot collide with a copy of the
     logo file inlined elsewhere on the page. */
  var el = document.createElement('div');
  el.id = 'hk-loader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', 'Loading');
  el.innerHTML =
    '<div class="hk-load__inner">' +
      '<svg class="hk-load__mark" viewBox="0 0 80 80" aria-hidden="true">' +
        '<clipPath id="hk-load-face"><circle cx="40" cy="40" r="28.5"/></clipPath>' +
        '<circle cx="40" cy="40" r="40" fill="#171717"/>' +
        '<circle cx="40" cy="40" r="31" fill="#272727"/>' +
        '<g class="hk-load__ring">' +
          '<path class="hk-load__arc hk-load__arc--w" d="M40 7A33 33 0 0 0 40 73"/>' +
          '<path class="hk-load__arc hk-load__arc--r" d="M40 7A33 33 0 0 1 40 73"/>' +
        '</g>' +
        '<g clip-path="url(#hk-load-face)">' +
          '<path class="hk-load__h" fill="#ed313a" d="M11.5 6h8v68h-8zM30.5 6h8v68h-8zM11.5 33.5h27v9h-27z"/>' +
          '<g class="hk-load__k">' +
            '<path fill="#f6f7f8" d="M40.5 6h8v68h-8z"/>' +
            '<path fill="none" stroke="#f6f7f8" stroke-width="8" stroke-linejoin="miter" d="M73.5 8.5 51 38.5 73.5 68.5"/>' +
          '</g>' +
        '</g>' +
      '</svg>' +
      '<p class="hk-load__word"><span>Hacker</span><span>Kernel</span></p>' +
      '<div class="hk-load__rail"><i class="hk-load__bar"></i></div>' +
      '<p class="hk-load__pct">0%</p>' +
    '</div>';

  root.classList.add('hk-loading');
  document.body.appendChild(el);

  var bar = el.querySelector('.hk-load__bar');
  var pct = el.querySelector('.hk-load__pct');

  /* ---------- Progress ----------
     Measured, not mimed. The bar answers three real questions - is the
     document parsed, how many of its images have resolved, has `load` fired
     - and only the gap between them is smoothed. It can therefore sit still
     on a slow image, which is the honest thing for it to do. */
  var target = 0.08;
  var shown = 0;

  function bump(to) { if (to > target) target = to; }

  function watchImages() {
    var imgs = document.images;
    var total = imgs.length;
    var done = 0;
    var i;

    if (!total) { bump(0.92); return; }

    var tick = function () {
      done++;
      bump(0.4 + 0.52 * (done / total));
    };

    for (i = 0; i < total; i++) {
      /* one that is already decoded will never fire an event */
      if (imgs[i].complete) done++;
      else {
        imgs[i].addEventListener('load', tick);
        imgs[i].addEventListener('error', tick);
      }
    }

    bump(0.4 + 0.52 * (done / total));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bump(0.4);
      watchImages();
    });
  } else {
    bump(0.4);
    watchImages();
  }

  var raf = window.requestAnimationFrame ||
            function (fn) { return window.setTimeout(fn, 16); };

  var over = false;

  (function paint() {
    /* chase the target rather than jump to it: the bar accelerates into a
       burst of images resolving and eases as it catches up */
    shown += (target - shown) * 0.08;
    if (target - shown < 0.001) shown = target;

    bar.style.transform = 'scaleX(' + shown + ')';
    pct.textContent = Math.round(shown * 100) + '%';

    if (!over) raf(paint);
  }());

  /* ---------- Exit ---------- */
  var started = new Date().getTime();

  function finish() {
    if (over) return;
    over = true;

    /* whatever the bar had reached, the page is here - land it on 100
       instead of leaving a half-filled rail on screen as it goes */
    bar.style.transform = 'scaleX(1)';
    pct.textContent = '100%';

    el.classList.add('is-done');

    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      root.classList.remove('hk-loading');
      root.classList.add('hk-loaded');

      /* anything that wants to run its own entrance can wait for this
         rather than for `load`, which fired while the screen was still up */
      try { window.dispatchEvent(new CustomEvent('hk:loaded')); } catch (e) {}
    }, reduced ? 260 : 820);
  }

  function ready() {
    bump(1);
    var left = MIN_MS - (new Date().getTime() - started);
    window.setTimeout(finish, reduced ? 0 : Math.max(0, left));
  }

  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready);

  window.setTimeout(finish, MAX_MS);
}());
