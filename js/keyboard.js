/* =========================================================
   eSPUD — keyboard.js
   Site-wide keyboard accessibility:
   - Skip-to-content link
   - Intuitive global shortcuts (h/r/p/t navigation, ? for help)
   - Accessible help dialog with focus trap
   - Esc closes any open dialog
   Loaded on every page; degrades gracefully when elements are absent.
   ========================================================= */
(() => {
  'use strict';

  const doc = document;

  /* ---------- Skip-to-content link ---------- */
  // Pick a sensible main-content target: an explicit <main>, else the first
  // <section> after the header. Make it programmatically focusable.
  const mainTarget =
    doc.querySelector('main, [role="main"]') ||
    doc.querySelector('header + section, .nav + section') ||
    doc.querySelector('section');

  if (mainTarget) {
    if (!mainTarget.id) mainTarget.id = 'main';
    if (!mainTarget.hasAttribute('tabindex')) mainTarget.setAttribute('tabindex', '-1');

    const skip = doc.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + mainTarget.id;
    skip.textContent = 'Skip to content';
    skip.addEventListener('click', (e) => {
      e.preventDefault();
      mainTarget.focus();
      mainTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    doc.body.insertBefore(skip, doc.body.firstChild);
  }

  /* ---------- Map shortcut keys to the page's own sections ----------
     The site is one page with no header menu, so each key scrolls to a
     section when it exists and falls back to the home link elsewhere
     (e.g. the microBERT detail page). */
  const toTop = {
    click() {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname);
    },
  };
  const home = location.pathname === '/' || location.pathname.endsWith('/index.html')
    ? toTop
    : { click() { location.href = '/'; } };
  const jump = (id) => {
    const el = doc.getElementById(id);
    if (!el) return home;
    return {
      click() {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      },
    };
  };

  const targets = {
    h: home,
    r: jump('research'),
    p: jump('projects'),
    t: jump('team'),
  };

  /* ---------- Keyboard shortcuts help dialog ---------- */
  const SHORTCUTS = [
    { keys: ['?'], desc: 'Show / hide this help' },
    { keys: ['H'], desc: 'Home' },
    { keys: ['R'], desc: 'Research' },
    { keys: ['P'], desc: 'Projects' },
    { keys: ['T'], desc: 'Team' },
    { keys: ['Tab'], desc: 'Move to next link or button' },
    { keys: ['Shift', 'Tab'], desc: 'Move to previous' },
    { keys: ['Enter'], desc: 'Activate the focused link / button' },
    { keys: ['Esc'], desc: 'Close this help' },
  ];

  let dialog, lastFocused;

  function buildDialog() {
    const backdrop = doc.createElement('div');
    backdrop.className = 'kbd-backdrop';
    backdrop.hidden = true;

    const rows = SHORTCUTS.map((s) => {
      const keys = s.keys.map((k) => `<kbd>${k}</kbd>`).join('<span class="kbd-plus">+</span>');
      return `<div class="kbd-row"><div class="kbd-keys">${keys}</div><div class="kbd-desc">${s.desc}</div></div>`;
    }).join('');

    backdrop.innerHTML = `
      <div class="kbd-modal" role="dialog" aria-modal="true" aria-labelledby="kbdTitle">
        <div class="kbd-modal-head">
          <h2 id="kbdTitle">Keyboard shortcuts</h2>
          <button class="kbd-close" type="button" aria-label="Close keyboard shortcuts">&times;</button>
        </div>
        <div class="kbd-list">${rows}</div>
        <p class="kbd-hint">Press <kbd>?</kbd> any time to toggle this panel.</p>
      </div>`;

    doc.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDialog();
    });
    backdrop.querySelector('.kbd-close').addEventListener('click', closeDialog);
    return backdrop;
  }

  function focusable(container) {
    return Array.from(
      container.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.disabled && el.offsetParent !== null);
  }

  function openDialog() {
    if (!dialog) dialog = buildDialog();
    lastFocused = doc.activeElement;
    dialog.hidden = false;
    doc.body.classList.add('kbd-modal-open');
    const f = focusable(dialog);
    if (f.length) f[0].focus();
  }

  function closeDialog() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    doc.body.classList.remove('kbd-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function isDialogOpen() {
    return dialog && !dialog.hidden;
  }

  /* ---------- Back-to-top button (every page) ---------- */
  (function backToTop() {
    const btn = doc.createElement('button');
    btn.className = 'to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
    doc.body.appendChild(btn);

    const onScroll = () => {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      const main = doc.getElementById('main');
      if (main && typeof main.focus === 'function') main.focus();
    });
  })();

  /* ---------- Global key handler ---------- */
  doc.addEventListener('keydown', (e) => {
    // Never hijack typing or browser/OS shortcuts.
    const t = e.target;
    const typing =
      t && (t.isContentEditable ||
        /^(input|textarea|select)$/i.test(t.tagName));
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

    // Focus trap while the dialog is open.
    if (isDialogOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
      if (e.key === 'Tab') {
        const f = focusable(dialog);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.key === '?') { e.preventDefault(); closeDialog(); return; }
      return; // swallow other shortcuts while open
    }

    if (e.key === '?') { e.preventDefault(); openDialog(); return; }

    // Single-key navigation — first letter of each destination.
    const key = e.key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(targets, key)) {
      const link = targets[key];
      if (link) { e.preventDefault(); link.click(); }
    }
  });
})();
