/* HackerKernel — shared mobile navigation (≤768px).

   One component for every page. The drawer and the burger that opens it are
   built here rather than pasted into thirteen documents, so there is exactly
   one link list, one set of markup, one animation and one close path — a page
   cannot fall behind by being edited and the others not.

   Loaded before Script.js on purpose: the menu is the one thing on the page
   that has to work even if something further down that file throws.

   Styling lives in style.css under "SHARED MOBILE NAVIGATION" (which of the
   two navigations the viewport gets) and in the `.m-nav*` rules inside the
   768 query (the panel itself). Both are inert above the breakpoint, so
   nothing here can reach the desktop layout. */
(function () {
  'use strict';

  var inner = document.querySelector('.navbar .navbar__inner');
  if (!inner) return;

  /* a page still carrying hand-written drawer markup keeps it — this never
     stacks a second panel on top of one that is already there */
  if (document.getElementById('m-nav')) return;

  /* ---------- Links ----------
     The same destinations everywhere. Anything that lives on one page is
     addressed by that page, not by a home-page anchor, so a service with its
     own page is always reached through it.

     `#contact` is the exception: every page but industry-detail.html carries
     its own, so it is resolved against the document rather than hard-coded to
     the home footer. */
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var contact = document.getElementById('contact') ? '#contact' : 'index.html#contact';

  var LINKS = [
    { label: 'Home',               href: 'index.html' },
    { label: 'About Us',           href: 'about.html' },
    { label: 'Explore Ai With us', href: 'ai-solution.html' },
    { label: 'Services',           href: 'index.html#services' },
    { label: 'Salesforce',         href: 'salesforce.html' },
    { label: 'Staff Augmentation', href: 'staff-augmentation.html' },
    { label: 'Case Studies',       href: 'case-study.html' },
    { label: 'Industries',         href: 'index.html#industries' },
    { label: 'Career',             href: 'career.html' },
    { label: 'Contact Us',         href: contact }
  ];

  var SOCIALS = [
    { label: 'Instagram', href: 'https://www.instagram.com/hackerkernel' },
    { label: 'Facebook',  href: 'https://www.facebook.com/hackerkernel' },
    { label: 'Linkedin',  href: 'https://www.linkedin.com/company/hackerkernel' }
  ];

  function file(href) {
    var cut = href.indexOf('#');
    return (cut < 0 ? href : href.slice(0, cut)).toLowerCase();
  }

  /* `index.html#services` is a page jump from everywhere except index.html,
     where leaving the file name on would reload the page instead of scrolling
     down it */
  function resolve(href) {
    var cut = href.indexOf('#');
    if (cut <= 0) return href;
    return file(href) === here ? href.slice(cut) : href;
  }

  var linksHtml = LINKS.map(function (link) {
    var href = resolve(link.href);
    var current = href.charAt(0) !== '#' && file(href) === here;
    return '<a href="' + href + '"' + (current ? ' aria-current="page"' : '') + '>' +
             link.label +
           '</a>';
  }).join('');

  var socialsHtml = SOCIALS.map(function (social) {
    return '<a href="' + social.href + '" target="_blank" rel="noopener">' +
             social.label +
           '</a>';
  }).join('');

  /* ---------- Markup ----------
     Appended to <body>, outside .page-shell, so the panel is never clipped by
     the rounded grey frame or by a section's overflow. */
  var drawer = document.createElement('div');
  drawer.className = 'm-nav';
  drawer.id = 'm-nav';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML =
    '<div class="m-nav__scrim" data-mnav-close></div>' +
    '<aside class="m-nav__panel" role="dialog" aria-modal="true" aria-label="Main menu">' +
      '<div class="m-nav__head">' +
        '<a class="logo" href="index.html">' +
          '<img class="logo__mark" src="assets/hk-logo.png" alt="HackerKernel">' +
          '<span class="logo__text"><span>Hacker</span><span>Kernel</span></span>' +
        '</a>' +
        '<button class="m-nav__close" type="button" aria-label="Close menu" data-mnav-close>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<nav class="m-nav__links" aria-label="Main">' + linksHtml + '</nav>' +
      '<div class="m-nav__foot">' +
        /* an anchor, not a button: on the pages that carry the slide-in
           enquiry form the click below opens it, and everywhere else the
           href stands on its own */
        '<a class="pill-btn m-nav__cta" href="' + contact + '" data-mnav-talk>' +
          '<span class="pill-btn__label">Let&rsquo;s Talk Business</span>' +
          '<span class="pill-btn__circle"><img src="assets/arrow-btn.svg" alt=""></span>' +
        '</a>' +
        '<div class="m-nav__socials">' + socialsHtml + '</div>' +
      '</div>' +
    '</aside>';

  document.body.appendChild(drawer);

  /* The trigger. `.nav-burger` is display:none in the base sheet, so this
     never renders on desktop — where .nav-links or the split-panel overlay
     still own the header. No <img>: assets/menu-icon.svg clips its own bars
     away, so the CSS draws them. */
  var burger = inner.querySelector('.nav-burger');

  if (!burger) {
    burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Open menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'm-nav');
    inner.appendChild(burger);
  }

  /* ---------- Behaviour ---------- */
  var panel = drawer.querySelector('.m-nav__panel');
  var closeBtn = drawer.querySelector('.m-nav__close');
  var isOpen = false;

  /* `refocus` is what separates a close the reader asked for — Escape, the ✕,
     the scrim — from one the page performed on its own. Following a link or
     growing past the breakpoint must not drag focus back to a burger that is
     no longer where the reader is looking. */
  function setOpen(next, refocus) {
    if (next === isOpen) return;         /* every close path is idempotent */
    isOpen = next;

    drawer.classList.toggle('is-open', next);
    drawer.setAttribute('aria-hidden', next ? 'false' : 'true');
    burger.setAttribute('aria-expanded', next ? 'true' : 'false');
    burger.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-mnav-open', next);

    if (next) {
      panel.scrollTop = 0;
      closeBtn.focus({ preventScroll: true });
    } else if (refocus) {
      burger.focus({ preventScroll: true });
    }
  }

  burger.addEventListener('click', function () { setOpen(!isOpen, true); });

  /* the scrim and the ✕ both carry data-mnav-close */
  Array.prototype.forEach.call(drawer.querySelectorAll('[data-mnav-close]'), function (el) {
    el.addEventListener('click', function () { setOpen(false, true); });
  });

  /* follow the link, then let the panel slide out behind it — an in-page
     target would otherwise be scrolled to under a drawer still covering it */
  Array.prototype.forEach.call(drawer.querySelectorAll('a'), function (link) {
    link.addEventListener('click', function () { setOpen(false, false); });
  });

  /* The drawer is the only way to the enquiry form on mobile, on the pages
     that have one. Script.js publishes it as window.hkOpenTalk; where it is
     absent the anchor's own #contact href is left to run.

     The timer lets the panel finish sliding out first and puts the call past
     the click that triggered it — the form's own outside-click handler would
     otherwise see this anchor as "outside" and shut it again immediately. */
  var talk = drawer.querySelector('[data-mnav-talk]');

  talk.addEventListener('click', function (e) {
    if (typeof window.hkOpenTalk !== 'function') return;
    e.preventDefault();
    window.setTimeout(function () { window.hkOpenTalk(true); }, 340);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) setOpen(false, true);
  });

  /* the panel is aria-modal, and the page behind the scrim is still in the
     tab order — Tab has to come back round rather than walk out onto it */
  panel.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;

    var stops = panel.querySelectorAll('a[href], button');
    if (!stops.length) return;

    var first = stops[0];
    var last = stops[stops.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* rotating to a desktop width with the drawer open would strand the scroll
     lock on a body that no longer has a panel over it */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) setOpen(false, false);
  });
})();
