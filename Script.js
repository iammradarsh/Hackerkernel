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

  slider('ind-track', '#ind-prev', '#ind-next', 244, 4);

  /* ---------- Services: fold-left rail ----------
     The row never translates. Next folds the leftmost open card down to a third
     of its width and leaves it parked on the left; the cards after it are carried
     along by the flex row as that one width interpolates, so the following card
     arrives from the right without anything being moved by hand. Prev unfolds the
     last strip again.

     Three folded strips measure one card, so six folds plus one open card come to
     1038 — the rail's own three-card width — and the final step lands flush. That
     also caps the travel: svcN runs 0..cards-1 and needs no other clamp.

     Hover is independent and moves nothing, so a highlight cannot slide off the
     card the pointer is on. The arrows are the only thing that changes layout. */
  var svcSlider = document.querySelector('.services__slider');
  var svcTrack = document.getElementById('services-track');
  var svcView = svcSlider && svcSlider.querySelector('.services__viewport');

  if (svcSlider && svcTrack && svcView) {
    var SVC_PITCH = 346;                    /* open card width — the row has no gaps */
    var SVC_FOLD = SVC_PITCH / 3;           /* folded strip; three make one card */

    var svcCards = Array.prototype.slice.call(svcTrack.children);
    var svcPrev = svcSlider.querySelector('.arrow-btn--prev');
    var svcNext = svcSlider.querySelector('.arrow-btn--next');
    var svcTouch = window.matchMedia('(hover: none) and (pointer: coarse)');

    var svcLast = svcCards.length - 1;       /* one card always stays open */
    var svcN = 0;                            /* how many are folded onto the left */
    var svcAt = -1;                          /* highlighted card, -1 for none */

    /* the deepest a strip can get, which is the shade the stylesheet ramps to */
    svcTrack.style.setProperty('--svc-max', Math.max(svcLast, 1));

    /* the design gives the arrow that has somewhere to go the primary red and
       the other the body grey, so availability is a visual state, not a guess */
    var svcArrows = function (at, span) {
      if (svcPrev) {
        svcPrev.classList.toggle('is-live', at > 0.5);
        svcPrev.setAttribute('aria-disabled', at > 0.5 ? 'false' : 'true');
      }
      if (svcNext) {
        svcNext.classList.toggle('is-live', at < span - 0.5);
        svcNext.setAttribute('aria-disabled', at < span - 0.5 ? 'false' : 'true');
      }
    };

    var svcRender = function () {
      /* one class per card plus the fold count, and nothing else — the width and
         the shade are both the stylesheet's business, so a click writes no
         geometry at all. --svc-n is what lets each strip work out how deep in
         the stack it sits, and so which grey the design gives it. */
      svcTrack.style.setProperty('--svc-n', svcN);

      for (var i = 0; i < svcCards.length; i++) {
        svcCards[i].classList.toggle('is-collapsed', i < svcN);
      }

      /* on touch the platform owns the scroll, so read the arrows off it */
      if (svcTouch.matches) svcArrows(svcView.scrollLeft, svcView.scrollWidth - svcView.clientWidth);
      else svcArrows(svcN, svcLast);
    };

    var svcFocus = function (i) {
      if (i === svcAt) return;
      if (svcAt >= 0 && svcCards[svcAt]) svcCards[svcAt].classList.remove('is-active');
      svcAt = i;
      if (i >= 0) svcCards[i].classList.add('is-active');
    };

    var svcStep = function (delta) {
      /* touch keeps the native scroll below, where folding a card to 115px would
         only make an already narrow rail harder to read */
      if (svcTouch.matches) {
        if (svcView.scrollBy) svcView.scrollBy({ left: delta * SVC_PITCH, behavior: 'smooth' });
        else svcView.scrollLeft += delta * SVC_PITCH;
        return;
      }

      svcN = Math.min(Math.max(svcN + delta, 0), svcLast);
      svcRender();
    };

    if (svcPrev) svcPrev.addEventListener('click', function () { svcStep(-1); });
    if (svcNext) svcNext.addEventListener('click', function () { svcStep(1); });

    /* one delegated pair rather than a listener per card; pointerover also
       fires for the card's own children, and re-focusing the same index is a
       no-op, so the extra events cost nothing */
    svcTrack.addEventListener('pointerover', function (e) {
      if (e.pointerType === 'touch') return;
      var card = e.target.closest && e.target.closest('.svc-card');
      if (card) svcFocus(svcCards.indexOf(card));
    });

    svcView.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      svcFocus(-1);
    });

    /* keyboard: tabbing to a card brings it fully into the rail first — unfolding
       it if it is one of the strips, or folding whatever it takes if it sits off
       the right-hand edge */
    svcTrack.addEventListener('focusin', function (e) {
      var card = e.target.closest && e.target.closest('.svc-card');
      if (!card) return;

      var i = svcCards.indexOf(card);
      if (i < svcN) svcN = i;
      while (svcN < svcLast &&
             svcN * SVC_FOLD + (i - svcN + 1) * SVC_PITCH > svcView.clientWidth + 1) svcN++;

      svcFocus(i);
      svcRender();
    });

    svcTrack.addEventListener('focusout', function (e) {
      if (!svcTrack.contains(e.relatedTarget)) svcFocus(-1);
    });

    /* Touch has no hover, so the first tap focuses a card and only the second
       follows its link — otherwise the highlight would never be seen at all. */
    svcTrack.addEventListener('click', function (e) {
      if (!svcTouch.matches) return;

      var card = e.target.closest && e.target.closest('.svc-card');
      if (!card) return;

      var i = svcCards.indexOf(card);
      if (i === svcAt) return;

      if (card.tagName === 'A') e.preventDefault();
      svcFocus(i);
    });

    svcView.addEventListener('scroll', function () {
      if (svcTouch.matches) svcArrows(svcView.scrollLeft, svcView.scrollWidth - svcView.clientWidth);
    });

    /* the rail is gutter-relative, so how many cards fit changes with the window */
    window.addEventListener('resize', svcRender);

    svcRender();
  }

  /* ---------- Marquee rows: stamp out copies for a seamless loop ----------
     A pass is one authored set of cards plus the gap that trails the last one
     — translate by exactly that and the copy behind lands where the original
     started, so the seam never shows. The rows are seeded at different offsets
     and hold different numbers of cards, so the two passes are different
     lengths and the rows drift out of step instead of marching as a grid. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-marquee]'), function (row) {
    var cards = Array.prototype.slice.call(row.children);
    if (!cards.length) return;

    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    var pass = row.getBoundingClientRect().width + gap;
    if (!pass) return;

    /* enough width to stay covered at either end of the travel, whatever the
       row's seeded offset — the widest seed in the design is 390px */
    var view = row.parentNode.getBoundingClientRect().width;
    var need = view + pass + 400;

    while (row.getBoundingClientRect().width < need) {
      var copy = document.createDocumentFragment();
      for (var i = 0; i < cards.length; i++) copy.appendChild(cards[i].cloneNode(true));
      row.appendChild(copy);
    }

    row.style.setProperty('--marq-pass', pass + 'px');
  });

  /* ---------- Testimonials: coverflow rail ----------
     The five cards are stamped out three times over, so stepping never reaches
     an end: when the active index wanders out of the middle copy we shift it
     back by one copy with the transition switched off — the copies are
     identical, so the jump lands on the same picture and is invisible.

     Everything visual keys off distance-from-centre, which is written onto
     each card as data-pos: CSS reads it for the height ramp, the quote reveal
     and the fade. Cards declare data-kind="video" (plays its clip in place)
     or "quote" (a still whose written review expands). */
  var tvView = document.getElementById('test-vids');
  var tvTrack = document.getElementById('tvid-track');

  if (tvView && tvTrack) {
    var TV_STEP = 236;          /* 204 card + 32 gap */
    var TV_HALF = 102;          /* half a card */
    var TV_COPIES = 3;
    var TV_HOLD = 5200;         /* dwell before the rail advances itself */
    var TV_GRAB = 5;            /* px of travel before a press counts as a drag */
    var TV_LEAD = 2;            /* the card that opens centred — the third one,
                                   so the rail starts video / quote / VIDEO /
                                   quote / video, as the design has it */

    var tvSet = tvTrack.children.length;
    var tvSeed = tvTrack.innerHTML;
    for (var tvC = 1; tvC < TV_COPIES; tvC++) tvTrack.innerHTML += tvSeed;

    var tvCards = tvTrack.children;         /* live — index maps straight to position */
    var tvAt = tvSet + TV_LEAD;             /* inside the middle copy */

    /* The active index never leaves the middle copy, so that copy always holds
       one of every testimonial — it is the one screen readers get. The outer
       two are scenery: hidden from the accessibility tree, and their buttons
       taken out of the tab order so nothing focusable hides inside them. */
    for (var tvI = 0; tvI < tvCards.length; tvI++) {
      if (tvI >= tvSet && tvI < tvSet * 2) continue;
      tvCards[tvI].setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(tvCards[tvI].querySelectorAll('button'), function (b) {
        b.setAttribute('tabindex', '-1');
      });
    }

    var tvShift = 0;                        /* live drag offset, px */
    var tvHeld = false;
    var tvFrom = 0;
    var tvDragged = false;
    var tvHover = false;
    var tvTimer = null;
    var tvIdle = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var tvRender = function (animate) {
      tvTrack.style.transition = animate ? '' : 'none';
      tvTrack.style.transform = 'translateX(' +
        (tvView.clientWidth / 2 - (tvAt * TV_STEP + TV_HALF) + tvShift) + 'px)';

      for (var i = 0; i < tvCards.length; i++) {
        var away = Math.abs(i - tvAt);
        tvCards[i].setAttribute('data-pos', away > 3 ? 3 : away);
      }
    };

    var tvHalt = function (card) {
      card.classList.remove('is-playing');

      var clip = card.querySelector('.tvid__video');
      if (clip) {
        clip.pause();
        clip.currentTime = 0;
      }

      var btn = card.querySelector('.tvid__play');
      var who = card.querySelector('.tvid__name');
      if (btn && who) btn.setAttribute('aria-label', 'Play ' + who.textContent + '’s video testimonial');
    };

    var tvHush = function () {
      Array.prototype.forEach.call(tvTrack.querySelectorAll('.tvid.is-playing'), tvHalt);
    };

    var tvStart = function (card) {
      var src = card.getAttribute('data-video');
      if (!src) return;

      var clip = card.querySelector('.tvid__video');
      if (!clip) {
        clip = document.createElement('video');
        clip.className = 'tvid__video';
        clip.src = src;
        clip.preload = 'auto';
        clip.setAttribute('playsinline', '');       /* iOS: stay in the card */
        clip.playsInline = true;
        clip.addEventListener('ended', function () { tvHalt(card); tvQueue(); });
        /* no file dropped in yet, or a codec the browser won't take — drop
           back to the poster rather than leaving a dead black rectangle */
        clip.addEventListener('error', function () { tvHalt(card); });
        card.insertBefore(clip, card.querySelector('.tvid__shade'));
      }

      card.classList.add('is-playing');

      var btn = card.querySelector('.tvid__play');
      var who = card.querySelector('.tvid__name');
      if (btn && who) btn.setAttribute('aria-label', 'Pause ' + who.textContent + '’s video testimonial');

      var kick = clip.play();
      if (kick && kick.catch) kick.catch(function () { tvHalt(card); });

      tvSleep();
    };

    var tvToggle = function (card) {
      if (card.classList.contains('is-playing')) {
        tvHalt(card);
        tvQueue();
      } else {
        tvHush();
        tvStart(card);
      }
    };

    var tvSleep = function () {
      if (tvTimer) {
        clearTimeout(tvTimer);
        tvTimer = null;
      }
    };

    var tvQueue = function () {
      tvSleep();
      if (tvIdle || tvHover || tvHeld) return;
      if (tvTrack.querySelector('.tvid.is-playing')) return;
      tvTimer = setTimeout(function () { tvGo(1); }, TV_HOLD);
    };

    var tvGo = function (delta) {
      var next = tvAt + delta;

      /* stepped out of the middle copy — rebase onto the identical card one
         copy over, unanimated, then run the real step from there */
      if (next < tvSet || next >= tvSet * 2) {
        var jump = next < tvSet ? tvSet : -tvSet;
        tvAt += jump;
        next += jump;
        tvRender(false);                          /* still carrying tvShift, so the
                                                     picture does not move */
        void tvTrack.offsetWidth;                 /* commit before re-arming */
      }

      tvAt = next;
      tvShift = 0;                                /* the rail settles on the card,
                                                     absorbing any drag left over */
      tvHush();
      tvRender(true);
      tvQueue();
    };

    tvTrack.addEventListener('click', function (e) {
      if (tvDragged) return;                      /* that was a drag, not a click */

      var card = e.target.closest && e.target.closest('.tvid');
      if (!card) return;

      var idx = Array.prototype.indexOf.call(tvCards, card);

      if (e.target.closest('.tvid__more')) {
        var open = !card.classList.contains('is-expanded');
        card.classList.toggle('is-expanded', open);
        e.target.closest('.tvid__more').setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }

      if (e.target.closest('.tvid__play')) {
        if (idx === tvAt) tvToggle(card);
        else { tvGo(idx - tvAt); tvStart(tvCards[tvAt]); }
        return;
      }

      /* clicking any off-centre card brings it to the middle */
      if (idx !== tvAt) tvGo(idx - tvAt);
      else if (card.getAttribute('data-kind') === 'video') tvToggle(card);
    });

    tvTrack.addEventListener('dragstart', function (e) { e.preventDefault(); });

    tvView.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      tvHeld = true;
      tvDragged = false;
      tvFrom = e.clientX;
      tvShift = 0;
      tvView.classList.add('is-dragging');
      tvSleep();
    });

    window.addEventListener('pointermove', function (e) {
      if (!tvHeld) return;
      tvShift = e.clientX - tvFrom;
      if (Math.abs(tvShift) > TV_GRAB) tvDragged = true;
      tvRender(false);
    });

    var tvRelease = function () {
      if (!tvHeld) return;
      tvHeld = false;
      tvView.classList.remove('is-dragging');

      /* round the travel to whole cards, but let a short flick still count */
      var steps = Math.round(-tvShift / TV_STEP);
      if (!steps && Math.abs(tvShift) > 45) steps = tvShift < 0 ? 1 : -1;

      /* tvGo clears tvShift itself, after its rebase has used it */
      if (steps) tvGo(steps);
      else { tvShift = 0; tvRender(true); tvQueue(); }

      /* the click born of this release has been and gone by the next tick, so
         the flag can drop and leave keyboard activation working again */
      setTimeout(function () { tvDragged = false; }, 0);
    };

    window.addEventListener('pointerup', tvRelease);
    window.addEventListener('pointercancel', tvRelease);

    tvView.addEventListener('mouseenter', function () { tvHover = true; tvSleep(); });
    tvView.addEventListener('mouseleave', function () { tvHover = false; tvQueue(); });

    tvView.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); tvGo(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); tvGo(1); }
    });

    var tvPrev = document.querySelector('.test-sec__arrows .arrow-btn--prev');
    var tvNext = document.querySelector('.test-sec__arrows .arrow-btn--next');
    if (tvPrev) tvPrev.addEventListener('click', function () { tvGo(-1); });
    if (tvNext) tvNext.addEventListener('click', function () { tvGo(1); });

    window.addEventListener('resize', function () { tvRender(false); });

    /* off-screen the rail neither advances nor keeps a clip running */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) tvQueue();
        else { tvSleep(); tvHush(); }
      }, { threshold: 0.2 }).observe(tvView);
    }

    tvRender(false);
    tvQueue();
  }

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

  /* ---------- Let's Talk Business: the side tab is the drawer handle ----------
     The tab travels left with the card, so the open state lives on <body>
     as well as on the panel — that is what the tab's transform keys off. */
  var talkTab = document.getElementById('talk-toggle');
  var talkForm = document.getElementById('talk-form');

  if (talkTab && talkForm) {
    var setTalk = function (open) {
      document.body.classList.toggle('is-talk-open', open);
      talkForm.classList.toggle('is-open', open);
      talkForm.setAttribute('aria-hidden', open ? 'false' : 'true');
      talkTab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = talkForm.querySelector('input, select, textarea');
        if (first) first.focus({ preventScroll: true });
      }
    };

    talkTab.addEventListener('click', function () {
      setTalk(!talkForm.classList.contains('is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && talkForm.classList.contains('is-open')) setTalk(false);
    });

    /* the drawer has no scrim, so closing on an outside click is what
       stops it hanging over the page once attention moves on */
    document.addEventListener('click', function (e) {
      if (!talkForm.classList.contains('is-open')) return;
      if (talkForm.contains(e.target) || talkTab.contains(e.target)) return;
      setTalk(false);
    });

    /* the burger and the drawer both own the right-hand edge — never both */
    if (burger) burger.addEventListener('click', function () { setTalk(false); });
  }

  /* ---------- Job details: "Apply For This Position" modal ---------- */
  var applyBtn = document.getElementById('jd-apply');
  var applyModal = document.getElementById('apply-modal');

  if (applyBtn && applyModal) {
    var applyCard = applyModal.querySelector('.jm-card');

    var setApply = function (open) {
      document.body.classList.toggle('is-apply-open', open);
      applyModal.classList.toggle('is-open', open);
      applyModal.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        var first = applyModal.querySelector('input');
        if (first) first.focus({ preventScroll: true });
      } else {
        applyBtn.focus({ preventScroll: true });
      }
    };

    applyBtn.addEventListener('click', function () { setApply(true); });

    Array.prototype.forEach.call(applyModal.querySelectorAll('[data-apply-close]'), function (btn) {
      btn.addEventListener('click', function () { setApply(false); });
    });

    /* the scrim is the modal itself, so only a hit outside the card counts */
    applyModal.addEventListener('click', function (e) {
      if (!applyCard.contains(e.target)) setApply(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && applyModal.classList.contains('is-open')) setApply(false);
    });

    /* Next has no step two and no endpoint yet — swallow the submit so it
       cannot navigate away and drop everything the applicant typed */
    applyCard.addEventListener('submit', function (e) { e.preventDefault(); });

    /* ── resume drop zone ── */
    var drop = document.getElementById('jd-resume');

    if (drop) {
      var dropInput = drop.querySelector('input[type="file"]');
      var dropName = drop.querySelector('.jm-drop__file');

      var showFile = function (file) {
        if (!file) return;
        drop.classList.add('has-file');
        dropName.textContent = file.name;
      };

      dropInput.addEventListener('change', function () { showFile(dropInput.files[0]); });

      ['dragenter', 'dragover'].forEach(function (type) {
        drop.addEventListener(type, function (e) {
          e.preventDefault();
          drop.classList.add('is-dragover');
        });
      });

      ['dragleave', 'drop'].forEach(function (type) {
        drop.addEventListener(type, function (e) {
          e.preventDefault();
          drop.classList.remove('is-dragover');
        });
      });

      drop.addEventListener('drop', function (e) {
        var files = e.dataTransfer && e.dataTransfer.files;
        if (!files || !files.length) return;
        /* hand the dropped file to the real input so the form submits it */
        dropInput.files = files;
        showFile(files[0]);
      });
    }
  }

  /* ---------- Case-study filter tabs ---------- */
  var filters = document.querySelectorAll('.cs-filter');
  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* ---------- Case study detail: View More ----------
     The button names the block it uncollapses through aria-controls, so the
     clamp lives entirely in CSS and this only has to flip a class. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-more]'), function (btn) {
    var block = document.getElementById(btn.getAttribute('aria-controls'));
    if (!block) return;

    btn.addEventListener('click', function () {
      var open = !block.classList.contains('is-open');

      block.classList.toggle('is-open', open);
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');

      var label = btn.querySelector('.csd-more__label');
      if (label) label.textContent = open ? 'View Less' : 'View More';
    });
  });

  /* ---------- Case study detail: the hero clip ----------
     The card already shows the thumbnail behind a blurred veil; pressing play
     drops a <video> over it. The element is built on first press so the file
     is never fetched for visitors who don't ask for it, and a missing file or
     an unplayable codec falls back to the veil rather than a black hole. */
  var csdHero = document.querySelector('.csd-hero--video');

  if (csdHero) {
    var csdPlay = csdHero.querySelector('.csd-hero__play');
    var csdClip = null;

    var csdStop = function () {
      csdHero.classList.remove('is-playing');
      if (csdClip) csdClip.pause();
      if (csdPlay) csdPlay.setAttribute('aria-label', 'Play the case study video');
    };

    if (csdPlay) csdPlay.addEventListener('click', function () {
      var src = csdHero.getAttribute('data-video');
      if (!src) return;

      if (!csdClip) {
        csdClip = document.createElement('video');
        csdClip.className = 'csd-hero__video';
        csdClip.src = src;
        csdClip.poster = csdHero.querySelector('.csd-hero__bg').getAttribute('src');
        csdClip.controls = true;
        csdClip.preload = 'auto';
        csdClip.setAttribute('playsinline', '');       /* iOS: stay in the card */
        csdClip.playsInline = true;
        csdClip.addEventListener('ended', csdStop);
        csdClip.addEventListener('error', csdStop);
        csdHero.appendChild(csdClip);
      }

      csdHero.classList.add('is-playing');

      var kick = csdClip.play();
      if (kick && kick.catch) kick.catch(csdStop);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && csdHero.classList.contains('is-playing')) csdStop();
    });
  }

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

  /* ---------- FAQ: single-open accordion ----------
     The design keeps exactly one row expanded, so re-clicking the open
     row collapses it and leaves the list closed. */
  var faqList = document.getElementById('tv-faq-list');
  if (faqList) {
    var faqRows = faqList.querySelectorAll('.tv-q');
    Array.prototype.forEach.call(faqRows, function (row) {
      row.addEventListener('click', function () {
        var wasOpen = row.classList.contains('is-open');
        Array.prototype.forEach.call(faqRows, function (other) {
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
     Every year is one stop on a single rail. Stepping forward slides the rail
     one stop left and moves the active class along with it, so the incoming
     year grows into the big slot while the one being left behind shrinks back
     to a plain stop and carries on out to the left. Nothing is swapped: the
     year that reads big is the same element that read small a moment ago. */
  var jrTrack = document.getElementById('jr-track');

  if (jrTrack) {
    var JR_STEP = 364;                    /* 346 column + 18 gap */
    var jrYears = jrTrack.querySelectorAll('.jr__year');
    var jrPrev = document.querySelector('.jr__arrow--prev');
    var jrNext = document.querySelector('.jr__arrow--next');
    var jrLast = jrYears.length - 1;
    var jrIndex = 0;

    var showYear = function (i) {
      jrIndex = i < 0 ? 0 : (i > jrLast ? jrLast : i);

      jrTrack.style.transform = 'translateX(' + (-jrIndex * JR_STEP) + 'px)';

      Array.prototype.forEach.call(jrYears, function (y, n) {
        y.classList.toggle('is-active', n === jrIndex);
        y.classList.toggle('is-past', n < jrIndex);
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

    /* Panels with a scroller of their own — the enquiry drawer above all —
       must keep the native wheel, or preventDefault below hands every notch
       to the page and they never move. The page only takes the wheel back
       once the panel has run out of room in the direction being asked for,
       which is what makes the hand-off at the ends feel like one scroller. */
    var ownScroller = function (node, delta) {
      while (node && node.nodeType === 1 && node !== document.body) {
        var flow = getComputedStyle(node).overflowY;

        if ((flow === 'auto' || flow === 'scroll') &&
            node.scrollHeight > node.clientHeight) {
          var room = delta < 0
            ? node.scrollTop
            : node.scrollHeight - node.clientHeight - node.scrollTop;
          if (room > 1) return true;
        }

        node = node.parentNode;
      }
      return false;
    };

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || locked()) return;      /* leave pinch-zoom alone */

      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;                  /* lines -> px */
      else if (e.deltaMode === 2) delta *= window.innerHeight;

      if (ownScroller(e.target, delta)) return;

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
