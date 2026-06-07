/* =========================================================
   eSPUD — main.js
   - Vanta.js NET background
   - Sticky-nav scroll state + mobile toggle
   - Scroll-triggered reveals
   - Animated counters
   - Project filters, showcase tabs, code copy, pipeline (used by
     commented-out sections — kept here so they work the moment
     those sections are uncommented in index.html).
   ========================================================= */

(() => {
  'use strict';

  /* ----- Footer year ----- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----- Vanta NET ----- */
  function initVanta() {
    if (typeof VANTA === 'undefined' || !VANTA.NET) return;
    const el = document.getElementById('vanta-bg');
    if (!el) return;
    // Respect reduced-motion preference
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    VANTA.NET({
      el: '#vanta-bg',
      mouseControls: !reduce,
      touchControls: !reduce,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x8b5cf6,
      backgroundColor: 0x0a0a0f,
      points: reduce ? 6.0 : 10.0,
      maxDistance: 22.0,
      spacing: 17.0,
      showDots: true
    });
  }
  // Vanta needs three.js; try immediately and on load as a fallback
  if (document.readyState !== 'loading') initVanta();
  else document.addEventListener('DOMContentLoaded', initVanta);
  window.addEventListener('load', initVanta, { once: true });

  /* ----- Nav: scroll state -----
     (Mobile menu toggle is wired in keyboard.js, which loads on every page.) */
  const nav = document.getElementById('nav');

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----- Reveal on scroll ----- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
    // Fallback: if any reveal is still hidden after first paint (e.g. observer
    // callback delayed for an already-visible large element), nudge it on.
    requestAnimationFrame(() => {
      reveals.forEach(el => {
        const r = el.getBoundingClientRect();
        const inView = r.top < window.innerHeight && r.bottom > 0;
        if (inView) el.classList.add('is-visible');
      });
    });
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ----- Counters ----- */
  const counters = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-counter'), 10) || 0;
        const duration = 1200;
        const start = performance.now();
        const from = 0;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(from + (target - from) * eased).toString();
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  }

  /* ----- Project filters (no-op until #projects is uncommented) ----- */
  const filterTabs = document.querySelectorAll('#projectFilters .filter-tab');
  const projectCards = document.querySelectorAll('#projectGrid .project-card');
  if (filterTabs.length && projectCards.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const filter = tab.getAttribute('data-filter');
        projectCards.forEach(card => {
          const cat = card.getAttribute('data-category');
          const show = filter === 'all' || cat === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ----- Showcase tabs ----- */
  const showcaseTabs = document.querySelectorAll('#showcaseTabs .showcase-tab');
  const showcasePanels = document.querySelectorAll('.showcase-panel');
  if (showcaseTabs.length && showcasePanels.length) {
    showcaseTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        showcaseTabs.forEach(t => t.classList.toggle('is-active', t === tab));
        showcasePanels.forEach(p => {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === target);
        });
      });
    });
  }

  /* ----- Code copy ----- */
  document.querySelectorAll('[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sel = btn.getAttribute('data-copy-target');
      const target = sel ? document.querySelector(sel) : null;
      if (!target) return;
      const text = target.innerText;
      try {
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = old; }, 1400);
      } catch (e) {
        // Fallback: select the text
        const range = document.createRange();
        range.selectNodeContents(target);
        const sel2 = window.getSelection();
        sel2.removeAllRanges();
        sel2.addRange(range);
      }
    });
  });

  /* ----- Pipeline subtle stagger animation (kicks off when in view) ----- */
  const pipeline = document.querySelector('.pipeline');
  if (pipeline && 'IntersectionObserver' in window) {
    const pio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const nodes = entry.target.querySelectorAll('.pipe-node, .pipe-arrow');
        nodes.forEach((n, i) => {
          n.style.opacity = '0';
          n.style.transform = 'translateY(6px)';
          n.style.transition = 'opacity .4s ease, transform .4s ease';
          setTimeout(() => {
            n.style.opacity = '1';
            n.style.transform = 'none';
          }, 80 * i);
        });
        pio.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    pio.observe(pipeline);
  }

})();
