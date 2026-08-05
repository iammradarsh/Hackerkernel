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
})();
