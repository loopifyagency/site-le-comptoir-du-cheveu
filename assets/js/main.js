/* ==========================================================================
   Le Comptoir Du Cheveu — mouvement
   GSAP + ScrollTrigger + SplitText + Draggable + Lenis (tous auto-hébergés).
   Règles : courbes expo/power3, transform + opacity en priorité,
   états de départ posés ici (jamais en CSS) pour que le contenu reste visible
   si le script échoue, prefers-reduced-motion respecté.
   ========================================================================== */
(function () {
  'use strict';

  var d = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var PLANITY = 'https://www.planity.com/le-comptoir-du-cheveu-29200-brest';
  var lenis = null;

  /* ------------------------------------------------------------------------
     Horaires : statut « ouvert / fermé » calculé à l'heure de Brest
     ------------------------------------------------------------------------ */
  var HOURS = { 2: [11, 20], 3: [11, 20], 4: [11, 20], 5: [11, 20], 6: [10, 18] };
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function parisNow() {
    var f = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    var p = {};
    f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var dayIdx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
    return { day: dayIdx, mins: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10), ymd: p.year + '-' + p.month + '-' + p.day };
  }

  function initStatus() {
    function tick() {
      var n;
      try { n = parisNow(); } catch (e) { return; }
      var h = HOURS[n.day], open = !!(h && n.mins >= h[0] * 60 && n.mins < h[1] * 60), text = '';
      if (open) {
        text = 'Ouvert · jusqu’à ' + h[1] + ' h';
      } else {
        for (var i = 0; i < 8; i++) {
          var dd = (n.day + i) % 7, hh = HOURS[dd];
          if (hh && (i > 0 || n.mins < hh[0] * 60)) {
            text = 'Fermé · ouvre ' + (i === 0 ? 'aujourd’hui' : i === 1 ? 'demain' : DAYS[dd]) + ' à ' + hh[0] + ' h';
            break;
          }
        }
      }
      $$('[data-status]').forEach(function (el) {
        el.setAttribute('data-open', open ? 'true' : 'false');
        var t = $('[data-status-text]', el);
        if (t) t.textContent = text;
      });
      $$('.hours__row').forEach(function (row) {
        var today = parseInt(row.getAttribute('data-day'), 10) === n.day;
        row.classList.toggle('is-today', today);
        if (today) row.setAttribute('aria-current', 'date'); else row.removeAttribute('aria-current');
      });
      /* Note du jour férié : visible jusqu'au 11 novembre 2026 inclus */
      $$('[data-armistice]').forEach(function (el) { el.hidden = n.ymd > '2026-11-11'; });
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ------------------------------------------------------------------------
     FAQ : accordéon (un seul ouvert à la fois)
     ------------------------------------------------------------------------ */
  function initFaq() {
    var items = $$('.qa');
    items.forEach(function (qa) {
      var btn = $('button', qa);
      btn.addEventListener('click', function () {
        var willOpen = !qa.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          $('button', o).setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          qa.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
        if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 760);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Défilement fluide (Lenis) + ancres
     ------------------------------------------------------------------------ */
  function initLenis() {
    if (reduced.matches || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.7, force: true, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function initAnchors(closeMenu) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (href.length < 2) return;
      var target = href === '#top' ? 0 : document.querySelector(href);
      if (target === null) return;
      e.preventDefault();
      if (closeMenu) closeMenu();
      scrollToTarget(target);
      if (target !== 0) {
        target.setAttribute('tabindex', '-1');
        setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (err) { /* noop */ } }, 900);
      }
    });
    var up = $('#to-top');
    if (up) up.addEventListener('click', function () { scrollToTarget(0); });
  }

  /* ------------------------------------------------------------------------
     Menu mobile plein écran
     ------------------------------------------------------------------------ */
  function initMenu() {
    var burger = $('#burger'), menu = $('#menu');
    if (!burger || !menu) return function () {};
    var links = $$('[data-menu-link]', menu);
    links.forEach(function (a) { a.innerHTML = '<span>' + a.textContent + '</span>'; });
    var spans = $$('span', menu.querySelector('.menu__nav'));
    var open = false;

    function set(state) {
      if (open === state) return;
      open = state;
      d.classList.toggle('menu-open', state);
      burger.setAttribute('aria-expanded', String(state));
      menu.setAttribute('aria-hidden', String(!state));
      menu.inert = !state;
      var dur = reduced.matches ? 0.01 : 1;
      if (state) {
        menu.classList.add('is-open');
        if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
        gsap.to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur * 0.9, ease: 'expo.inOut' });
        gsap.fromTo(spans, { yPercent: 115 }, { yPercent: 0, duration: dur, ease: 'expo.out', stagger: 0.07, delay: reduced.matches ? 0 : 0.3 });
        gsap.fromTo($$('.menu__foot > *'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: dur * 0.9, ease: 'expo.out', stagger: 0.08, delay: reduced.matches ? 0 : 0.55 });
        setTimeout(function () { if (open && links[0]) links[0].focus({ preventScroll: true }); }, reduced.matches ? 20 : 500);
      } else {
        gsap.to(menu, {
          clipPath: 'inset(0% 0% 100% 0%)', duration: dur * 0.7, ease: 'expo.inOut',
          onComplete: function () { menu.classList.remove('is-open'); if (!open) { if (lenis) lenis.start(); else document.body.style.overflow = ''; } }
        });
      }
    }

    burger.addEventListener('click', function () { set(!open); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { set(false); burger.focus(); } });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) set(false); });
    return function () { set(false); };
  }

  /* ------------------------------------------------------------------------
     Barre de progression + en-tête qui se cache
     ------------------------------------------------------------------------ */
  function initHeader() {
    var header = $('#header'), bar = $('#progress');
    var setBar = gsap.quickSetter(bar, 'scaleX');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        setBar(self.progress);
        if (d.classList.contains('menu-open')) return;
        var y = self.scroll();
        if (self.direction === 1 && y > 240) header.classList.add('is-hidden');
        else if (self.direction === -1 || y <= 240) header.classList.remove('is-hidden');
      }
    });
    /* Ciseaux du logo : un coup de lame au survol */
    var logo = $('.logo');
    if (logo && !reduced.matches) {
      var a = $('.logo .scissors__a'), b = $('.logo .scissors__b');
      var snip = gsap.timeline({ paused: true })
        .to(a, { rotation: -16, svgOrigin: '32 32', duration: 0.14, ease: 'power2.out' }, 0)
        .to(b, { rotation: 16, svgOrigin: '32 32', duration: 0.14, ease: 'power2.out' }, 0)
        .to([a, b], { rotation: 0, svgOrigin: '32 32', duration: 0.5, ease: 'expo.out' });
      logo.addEventListener('mouseenter', function () { snip.restart(); });
      logo.addEventListener('focus', function () { snip.restart(); });
    }
  }

  /* ------------------------------------------------------------------------
     Préchargeur : les ciseaux coupent le pointillé, l'écran s'ouvre en deux
     ------------------------------------------------------------------------ */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function imagesReady(sel) {
    return Promise.all($$(sel).map(function (img) {
      if (img.complete) return 0;
      return new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
    }));
  }

  function runLoader(onSplitStart) {
    var loader = $('#loader');
    return new Promise(function (resolve) {
      function done() {
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        d.classList.remove('is-loading');
        if (lenis) lenis.start();
        resolve();
      }
      if (!loader) { onSplitStart(); done(); return; }
      if (lenis) lenis.stop();

      if (reduced.matches) {
        onSplitStart();
        gsap.to(loader, { autoAlpha: 0, duration: 0.35, onComplete: done });
        return;
      }

      var count = $('#loader-count'), scissors = $('.loader__scissors'), dots = $('.loader__dots');
      var top = $('.loader__half--top'), bottom = $('.loader__half--bottom');
      var a = $('.scissors__a', loader), b = $('.scissors__b', loader);
      var W = window.innerWidth, st = { p: 0 };
      gsap.set(scissors, { x: -60 });

      var blades = gsap.timeline({ repeat: -1, yoyo: true })
        .fromTo(a, { rotation: 4 }, { rotation: -15, svgOrigin: '32 32', duration: 0.16, ease: 'sine.inOut' }, 0)
        .fromTo(b, { rotation: -4 }, { rotation: 15, svgOrigin: '32 32', duration: 0.16, ease: 'sine.inOut' }, 0);

      var cutDone = new Promise(function (r) {
        gsap.to(st, {
          p: 100, duration: 1.9, ease: 'power2.inOut',
          onUpdate: function () {
            var x = -60 + (W + 120) * (st.p / 100);
            count.textContent = Math.round(st.p);
            gsap.set(scissors, { x: x });
            dots.style.clipPath = 'inset(0 0 0 ' + Math.max(0, x) + 'px)';
          },
          onComplete: r
        });
      });
      var assets = Promise.race([
        Promise.all([document.fonts ? document.fonts.ready : 0, imagesReady('.hero__prints img')]),
        wait(4000)
      ]);

      Promise.all([cutDone, assets]).then(function () {
        blades.kill();
        count.textContent = '100';
        gsap.to([scissors, dots], { autoAlpha: 0, duration: 0.25 });
        var split = gsap.timeline({ onComplete: done });
        split.to(top, { yPercent: -101, duration: 1.3, ease: 'expo.inOut' }, 0.1)
          .to(bottom, { yPercent: 101, duration: 1.3, ease: 'expo.inOut' }, 0.1)
          .call(onSplitStart, null, 0.45);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Hero : entrée, lampe de comptoir, lampes suspendues
     ------------------------------------------------------------------------ */
  var heroChars = null;
  function prepareHero() {
    var words = $$('.hero__word');
    if (reduced.matches) return;
    var split = SplitText.create(words, { type: 'chars', mask: 'chars', charsClass: 'ch' });
    heroChars = split.chars;
    gsap.set(heroChars, { yPercent: 118 });
    gsap.set('.hero__le', { autoAlpha: 0, rotation: -22, y: 18 });
    $$('.print', $('.hero')).forEach(function (p) {
      gsap.set(p, { rotation: parseFloat(p.getAttribute('data-r')) || 0, transformOrigin: '50% 0%' });
    });
    gsap.set('.hero .print', { autoAlpha: 0, y: function () { return -window.innerHeight * 0.75; }, rotation: function (i, el) { return (parseFloat(el.getAttribute('data-r')) || 0) + gsap.utils.random(-22, 22); } });
    gsap.set('.lamp__cord', { scaleY: 0 });
    gsap.set('.lamp__bulb', { autoAlpha: 0 });
    gsap.set(['.hero__lede', '.hero__ctas > *', '.hero__status'], { y: 34, autoAlpha: 0 });
    gsap.set('.hero__chalk', { autoAlpha: 0 });
  }

  function playHero() {
    var fab = $('.fab');
    if (fab) fab.classList.add('is-in');
    if (reduced.matches) return;
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroChars, { yPercent: 0, duration: 1.6, stagger: { each: 0.04 } }, 0)
      .to('.hero__le', { autoAlpha: 1, rotation: -8, y: 0, duration: 1.3 }, 0.6)
      .to('.hero .print', {
        autoAlpha: 1, y: 0, duration: 1.9, stagger: 0.14,
        rotation: function (i, el) { return parseFloat(el.getAttribute('data-r')) || 0; }
      }, 0.1)
      .to('.lamp__cord', { scaleY: 1, duration: 1.6, stagger: 0.15 }, 0.2)
      .to('.lamp__bulb', { autoAlpha: 1, duration: 0.8, stagger: 0.15 }, 0.9)
      .to('.hero__chalk', { autoAlpha: 1, duration: 1.4 }, 0.8)
      .to(['.hero__lede', '.hero__ctas > *', '.hero__status'], { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.09 }, 0.75);
  }

  function initLamps() {
    var hero = $('.hero');
    if (!hero || reduced.matches) return;

    /* Lampes suspendues : balancier + petit scintillement */
    $$('.lamp').forEach(function (l, i) {
      gsap.to(l, { rotation: gsap.utils.random(2, 3.4) * (i % 2 ? 1 : -1), transformOrigin: '50% 0%', duration: gsap.utils.random(2.8, 3.8), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.5 });
      var bulb = $('.lamp__bulb', l);
      gsap.timeline({ repeat: -1, repeatDelay: 4 + i * 2.3, delay: 3 + i })
        .to(bulb, { opacity: 0.35, duration: 0.06 }).to(bulb, { opacity: 1, duration: 0.05 })
        .to(bulb, { opacity: 0.5, duration: 0.05 }).to(bulb, { opacity: 1, duration: 0.14 });
    });

    /* « Lampe de comptoir » : la lumière suit le curseur et révèle les notes à la craie */
    var active = true;
    var w = window.innerWidth, h = window.innerHeight;
    var cur = { x: w * 0.72, y: h * 0.34 }, tgt = { x: cur.x, y: cur.y }, usePointer = false;
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: function (s) { active = s.isActive; } });
    if (fine.matches) {
      hero.addEventListener('pointermove', function (e) {
        usePointer = true;
        var r = hero.getBoundingClientRect();
        tgt.x = e.clientX - r.left; tgt.y = e.clientY - r.top;
      }, { passive: true });
    }
    gsap.ticker.add(function (time, delta) {
      if (!active) return;
      if (!usePointer) {
        var t = time;
        var r = hero.getBoundingClientRect();
        tgt.x = r.width * (0.5 + 0.34 * Math.sin(t * 0.45));
        tgt.y = r.height * (0.34 + 0.2 * Math.sin(t * 0.7 + 1.3));
      }
      var k = Math.min(1, (delta / 1000) * 5);
      cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k;
      hero.style.setProperty('--lx', cur.x.toFixed(1) + 'px');
      hero.style.setProperty('--ly', cur.y.toFixed(1) + 'px');
    });
  }

  /* ------------------------------------------------------------------------
     Marquee : vitesse et sens pilotés par le scroll
     ------------------------------------------------------------------------ */
  function initMarquee() {
    if (reduced.matches) return;
    var section = $('.marquee');
    var bands = $$('.band', section).map(function (band) {
      var track = $('.band__track', band), group = $('.band__group', track);
      return { dir: parseFloat(band.getAttribute('data-dir')) || -1, track: track, group: group, gw: 1, pos: 0, set: gsap.quickSetter(track, 'x', 'px') };
    });
    /* Largeur d'un groupe : à remesurer quand les polices arrivent et au redimensionnement */
    function measure() {
      bands.forEach(function (b) {
        b.gw = b.group.getBoundingClientRect().width || 1;
        var need = Math.ceil((window.innerWidth * 1.3 + b.gw) / b.gw) + 1;
        for (var i = b.track.children.length; i < need; i++) b.track.appendChild(b.group.cloneNode(true));
      });
    }
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    var mz; window.addEventListener('resize', function () { clearTimeout(mz); mz = setTimeout(measure, 200); });
    var vel = 0, dirScroll = 1, ts = 1, inView = false;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) { vel = s.getVelocity(); if (s.direction) dirScroll = s.direction; } });
    ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: function (s) { inView = s.isActive; } });
    gsap.ticker.add(function (time, delta) {
      var dt = delta / 1000;
      var target = dirScroll * (1 + Math.min(Math.abs(vel) / 320, 6));
      ts += (target - ts) * Math.min(1, dt * 5);
      if (!inView) return;
      bands.forEach(function (b) {
        b.pos = (((b.pos + 80 * ts * dt) % b.gw) + b.gw) % b.gw;
        b.set(b.dir < 0 ? -b.pos : b.pos - b.gw);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Interactions : tilt, magnétique, curseur
     ------------------------------------------------------------------------ */
  function initTilt(selector, max, sheen) {
    $$(selector).forEach(function (el) {
      gsap.set(el, { transformPerspective: 900 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 2 * max);
        rx(-(py - 0.5) * 2 * max);
        if (sheen) { el.style.setProperty('--sx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--sy', (py * 100).toFixed(1) + '%'); }
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  function initMagnetic() {
    var els = $$('[data-magnetic]').map(function (el) {
      var inner = $('.btn__in', el);
      return {
        el: el, inner: inner,
        x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
        ix: inner ? gsap.quickTo(inner, 'x', { duration: 0.8, ease: 'power3.out' }) : null,
        iy: inner ? gsap.quickTo(inner, 'y', { duration: 0.8, ease: 'power3.out' }) : null,
        on: false
      };
    });
    window.addEventListener('pointermove', function (e) {
      els.forEach(function (m) {
        var r = m.el.getBoundingClientRect();
        var pad = Math.max(60, r.width * 0.22);
        var inside = e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
        if (inside) {
          var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          m.x(dx * 0.32); m.y(dy * 0.42);
          if (m.ix) { m.ix(dx * 0.1); m.iy(dy * 0.14); }
          m.on = true;
        } else if (m.on) {
          m.x(0); m.y(0); if (m.ix) { m.ix(0); m.iy(0); }
          m.on = false;
        }
      });
    }, { passive: true });
  }

  function initCursor() {
    var c = $('#cursor');
    if (!c) return;
    gsap.set(c, { autoAlpha: 0 });
    var xTo = gsap.quickTo(c, 'x', { duration: 0.28, ease: 'power3.out' });
    var yTo = gsap.quickTo(c, 'y', { duration: 0.28, ease: 'power3.out' });
    var shown = false;
    window.addEventListener('pointermove', function (e) {
      if (!shown) { shown = true; gsap.set(c, { x: e.clientX, y: e.clientY }); gsap.to(c, { autoAlpha: 1, duration: 0.3 }); }
      xTo(e.clientX); yTo(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest && e.target.closest('a, button, [data-cursor], [data-magnetic], .review, .board');
      var big = hot && !hot.matches('.review, .board');
      gsap.to(c, { scale: big ? 3.6 : hot ? 1.8 : 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    });
    document.documentElement.addEventListener('pointerleave', function () { gsap.to(c, { autoAlpha: 0, duration: 0.2 }); shown = false; });
  }

  /* ------------------------------------------------------------------------
     Carrousel d'avis : glisser, boutons, clavier, pause (WCAG 2.2.2)
     ------------------------------------------------------------------------ */
  function initCarousel() {
    var root = $('#carousel'); if (!root) return;
    var viewport = $('#carousel-viewport'), track = $('#carousel-track'), slides = $$('.review', track);
    var prev = $('#carousel-prev'), next = $('#carousel-next'), pauseBtn = $('#carousel-pause');
    var now = $('#carousel-now'), fill = $('#carousel-fill'), count = $('#carousel-count');
    var last = slides.length - 1, idx = 0, playing = !reduced.matches, hover = false, focusIn = false, dragging = false, visible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.35 }).observe(root);
    } else { visible = true; }

    function padLeft() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
    function minX() { return Math.min(0, viewport.clientWidth - track.scrollWidth); }
    function snaps() { var p = padLeft(), m = minX(); return slides.map(function (s) { return Math.max(m, -(s.offsetLeft - p)); }); }

    function announce() {
      count.setAttribute('aria-live', 'polite');
      setTimeout(function () { count.setAttribute('aria-live', 'off'); }, 1500);
    }
    function setIdx(i, say) {
      idx = clamp(i, 0, last);
      now.textContent = idx + 1;
      gsap.to(fill, { scaleX: (idx + 1) / slides.length, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
      if (say) announce();
    }
    function goTo(i, say) {
      setIdx(i, say);
      gsap.to(track, { x: snaps()[idx], duration: reduced.matches ? 0.01 : 1.15, ease: 'expo.out', overwrite: 'auto' });
    }
    function nearest(x) {
      var xs = snaps(), best = 0;
      xs.forEach(function (v, i) { if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i; });
      if (Math.abs(x - minX()) < 10) best = last;
      return best;
    }

    var drag = null;
    if (window.Draggable) {
      drag = Draggable.create(track, {
        type: 'x', bounds: { minX: minX(), maxX: 0 }, edgeResistance: 0.85, allowContextMenu: true, cursor: 'grab', activeCursor: 'grabbing',
        onPress: function () { dragging = true; gsap.killTweensOf(track); },
        onRelease: function () { dragging = false; goTo(nearest(this.x + (this.deltaX || 0) * 6), true); }
      })[0];
    }

    prev.addEventListener('click', function () { goTo(idx - 1, true); });
    next.addEventListener('click', function () { goTo(idx + 1, true); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx - 1, true); }
    });

    function syncPause() {
      pauseBtn.setAttribute('aria-pressed', String(!playing));
      pauseBtn.setAttribute('aria-label', playing ? 'Mettre en pause le défilement automatique' : 'Reprendre le défilement automatique');
      $('use', pauseBtn).setAttribute('href', playing ? '#i-pause' : '#i-play');
    }
    pauseBtn.addEventListener('click', function () { playing = !playing; syncPause(); });
    syncPause();

    root.addEventListener('mouseenter', function () { hover = true; });
    root.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('focusin', function () { focusIn = true; });
    root.addEventListener('focusout', function () { focusIn = false; });
    setInterval(function () {
      if (!playing || !visible || hover || focusIn || dragging || document.hidden) return;
      goTo(idx >= last ? 0 : idx + 1, false);
    }, 6500);

    var rz;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        if (drag) drag.applyBounds({ minX: minX(), maxX: 0 });
        gsap.set(track, { x: snaps()[idx] });
        if (drag) drag.update();
      }, 150);
    });
    setIdx(0, false);
  }

  /* ------------------------------------------------------------------------
     Sections animées au scroll (GSAP matchMedia)
     ------------------------------------------------------------------------ */
  function initScroll() {
    var mm = gsap.matchMedia();
    var DESK = '(min-width: 900px) and (prefers-reduced-motion: no-preference)';
    var MOBILE = '(max-width: 899px) and (prefers-reduced-motion: no-preference)';
    var MOTION = '(prefers-reduced-motion: no-preference)';

    /* --- Hero : parallax multicouche --- */
    mm.add(MOTION, function () {
      var st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero__bg', { yPercent: 5, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__ghost', { xPercent: -16, ease: 'none', scrollTrigger: st });
      $$('.layer').forEach(function (l) {
        var s = parseFloat(l.getAttribute('data-speed')) || 0.2;
        gsap.to(l, { y: function () { return -s * window.innerHeight * 0.9; }, ease: 'none', scrollTrigger: st });
      });
      gsap.to('.hero__lamps', { y: function () { return -window.innerHeight * 0.22; }, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__content', { y: function () { return window.innerHeight * 0.06; }, ease: 'none', scrollTrigger: st });
    });

    /* --- Savoir-faire : section pinnée en 4 temps (bureau) --- */
    mm.add(DESK, function () {
      d.classList.add('pinned');
      var stage = $('#story-stage');
      var steps = $$('.step', stage), shots = $$('.story__shot', stage), nodes = $$('.story__node', stage), fill = $('.story__rail-fill', stage);
      var imgs = shots.map(function (s) { return $('img', s); });
      var n = steps.length;

      gsap.set(steps, { opacity: function (i) { return i ? 0 : 1; }, y: function (i) { return i ? 40 : 0; } });
      shots.forEach(function (s, i) { s.style.zIndex = i; });
      gsap.set(shots.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(shots[0], { clipPath: 'inset(0% 0% 0% 0%)' });
      gsap.set(imgs, { scale: 1.15 });

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 3.4); },
          pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 3
        },
        onUpdate: function () {
          var t = tl.time();
          nodes.forEach(function (nd, i) { nd.classList.toggle('is-on', t >= i - 0.1); });
        }
      });
      tl.to(fill, { scaleY: 1, duration: n - 1 }, 0);
      imgs.forEach(function (img, i) {
        var p = Math.max(0, i - 0.3);
        tl.to(img, { scale: 1.02, duration: n - p }, p);
      });
      for (var i = 0; i < n - 1; i++) {
        tl.to(steps[i], { opacity: 0, y: -36, duration: 0.25, ease: 'power2.in' }, i + 0.72)
          .to(steps[i + 1], { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, i + 0.85)
          .to(shots[i + 1], { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power3.inOut' }, i + 0.68);
      }
      tl.to({}, { duration: 0.4 }, n - 0.4 + 0.0);

      return function () { d.classList.remove('pinned'); };
    });

    /* --- La carte : défilement horizontal piloté par le scroll (bureau) --- */
    mm.add(DESK, function () {
      d.classList.add('pinned');
      var pin = $('#carte-pin'), track = $('#carte-track'), bar = $('#carte-bar');
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8,
          anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
          onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
        }
      });
      $$('.board, .carte__outro', track).forEach(function (b) {
        var rows = $$('.row, .carte__outro-title, .carte__outro-btns', b);
        gsap.from(rows, {
          y: 26, opacity: 0, duration: 0.95, ease: 'expo.out', stagger: 0.07,
          scrollTrigger: { trigger: b, containerAnimation: tween, start: 'left 94%', toggleActions: 'play none none reverse' }
        });
      });
      return function () { d.classList.remove('pinned'); };
    });

    /* --- La carte en pile (mobile) --- */
    mm.add(MOBILE, function () {
      $$('.board, .carte__outro').forEach(function (b) {
        gsap.from(b, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 90%', once: true } });
      });
    });

    /* --- Tout le reste, créé après les sections épinglées (ordre = ordre de la page) --- */
    mm.add(MOTION, function () {
      /* Titres : mots / lignes qui montent derrière un masque */
      $$('[data-split]').forEach(function (el) {
        var type = el.getAttribute('data-split') === 'words' ? 'words' : 'lines';
        SplitText.create(el, {
          type: type, mask: type, linesClass: 'line', wordsClass: 'word', autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self[type], {
              yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: type === 'lines' ? 0.1 : 0.08,
              scrollTrigger: { trigger: el, start: 'top 87%', once: true }
            });
          }
        });
      });
      $$('[data-reveal]').forEach(function (el) {
        gsap.from(el, { y: 32, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      });

      /* Ticket : s'imprime et les chiffres comptent */
      var ticket = $('#ticket');
      if (ticket) {
        var counters = $$('[data-count]', ticket);
        counters.forEach(function (c) { c.textContent = '0' + (c.getAttribute('data-suffix') || ''); });
        gsap.set(ticket, { clipPath: 'inset(0% 0% 100% 0%)', y: -30 });
        ScrollTrigger.create({
          trigger: ticket, start: 'top 80%', once: true,
          onEnter: function () {
            gsap.to(ticket, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 2.6, ease: 'power2.inOut' });
            counters.forEach(function (c, i) {
              var o = { v: 0 }, end = parseFloat(c.getAttribute('data-count')), suf = c.getAttribute('data-suffix') || '';
              gsap.to(o, { v: end, duration: 2.2, ease: 'expo.out', delay: 0.5 + i * 0.35, onUpdate: function () { c.innerHTML = Math.round(o.v) + suf; } });
            });
          }
        });
        gsap.to(ticket, { rotation: -1.2, ease: 'none', scrollTrigger: { trigger: ticket, start: 'top bottom', end: 'bottom top', scrub: true } });
      }

      /* Galerie : révélation en cercle, colonnes décalées, image qui bouge dans son cadre */
      var grid = $('.gallery__grid');
      if (grid) {
        var shots = $$('.shot', grid);
        gsap.fromTo($$('.shot__frame', grid), { clipPath: 'circle(0% at 50% 50%)' },
          { clipPath: 'circle(88% at 50% 50%)', duration: 1.8, ease: 'expo.out', stagger: 0.13, scrollTrigger: { trigger: grid, start: 'top 82%', once: true } });
        shots.forEach(function (s) {
          var sp = parseFloat(s.getAttribute('data-speed')) || 0;
          if (window.innerWidth >= 900) {
            gsap.fromTo(s, { y: sp * 900 }, { y: -sp * 900, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } });
          }
          gsap.fromTo($('.shot__par', s), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
          if (!fine.matches) {
            ScrollTrigger.create({ trigger: s, start: 'center 64%', end: 'center 36%', toggleClass: { targets: s, className: 'is-color' } });
          }
        });
        gsap.to('.gallery__ghost', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
      }

      /* Avis : les notes arrivent une à une */
      gsap.from($$('.review'), {
        y: 90, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: '#carousel', start: 'top 85%', once: true }
      });

      /* Rendez-vous : le sceau tourne un peu plus vite quand on scrolle */
      var ring = $('.seal__ring');
      if (ring) {
        gsap.fromTo('.seal', { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.seal', start: 'top 92%', once: true } });
      }
      gsap.from('.cta__tel', { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cta__row', start: 'top 88%', once: true } });

      /* Carte Google Maps et façade */
      gsap.from('.map', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.venir__map', start: 'top 85%', once: true } });
      gsap.from('.map__photo', { y: 60, autoAlpha: 0, rotation: 14, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.venir__map', start: 'top 70%', once: true } });

      /* Pied de page : le nom monte lettre par lettre */
      SplitText.create('.footer__line', {
        type: 'chars', mask: 'chars', charsClass: 'ch', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.chars, {
            yPercent: 118, duration: 1.5, ease: 'expo.out', stagger: 0.03,
            scrollTrigger: { trigger: '.footer__name', start: 'top 94%', once: true }
          });
        }
      });
    });

    return mm;
  }

  /* ------------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------------ */
  function safe(fn, name) {
    try { return fn(); } catch (e) { if (window.console) console.error('[comptoir] ' + (name || fn.name), e); }
  }

  function staticFallback() {
    d.classList.add('is-static');
    d.classList.remove('is-loading');
    var l = $('#loader'); if (l && l.parentNode) l.parentNode.removeChild(l);
    var fab = $('.fab'); if (fab) fab.classList.add('is-in');
  }

  function boot() {
    safe(initStatus, 'status');
    safe(initFaq, 'faq');

    if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
      staticFallback();
      var m = $('#burger');
      if (m) m.addEventListener('click', function () { $('#menu').classList.toggle('is-open'); });
      return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText, window.Draggable);
    if (reduced.matches) d.classList.add('is-static');
    d.classList.toggle('pinned', window.matchMedia('(min-width: 900px)').matches && !reduced.matches);

    safe(initLenis, 'lenis');
    var closeMenu = safe(initMenu, 'menu');
    safe(function () { initAnchors(closeMenu); }, 'anchors');
    safe(prepareHero, 'prepareHero');

    safe(initScroll, 'scroll');
    safe(initHeader, 'header');
    safe(initMarquee, 'marquee');
    safe(initLamps, 'lamps');
    safe(initCarousel, 'carousel');

    if (fine.matches && !reduced.matches) {
      safe(function () { initTilt('.board', 3.2, true); }, 'tilt-boards');
      safe(function () { initTilt('[data-tilt-soft]', 6, false); }, 'tilt-shots');
      safe(initMagnetic, 'magnetic');
      safe(initCursor, 'cursor');
    }

    runLoader(function () { safe(playHero, 'playHero'); }).then(function () {
      ScrollTrigger.refresh();
    });

    /* Les positions dépendent des polices et des images : on recalcule quand elles arrivent */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  try { boot(); } catch (e) {
    if (window.console) console.error('[comptoir] démarrage', e);
    staticFallback();
  }
})();
