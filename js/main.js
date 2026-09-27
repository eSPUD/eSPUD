/* =========================================================
   eSPUD — main.js
   The site is one static page; the only scripted behaviour
   here is the footer year. Keyboard shortcuts, the skip
   link, the mobile menu and back-to-top live in keyboard.js.
   ========================================================= */
(() => {
  'use strict';
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
