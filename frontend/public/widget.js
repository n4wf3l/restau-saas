/**
 * NA Innovations — Public reservation widget.
 * Drop-in vanilla JS. Zero dependencies. Works on any HTML site.
 *
 * Usage:
 *   <div data-na-widget="reservation" data-restaurant="your-slug"></div>
 *   <script src="https://yourplatform.com/widget.js" async></script>
 *
 * Optional data-attributes on the mount div:
 *   data-label      → button label (default: "Réserver une table")
 *   data-theme      → "dark" | "light" (default: "dark")
 *   data-base-url   → override the platform origin (default: inferred from script src)
 *
 * The widget renders a styled button in place. Clicking it opens a fullscreen
 * modal iframe pointing at /r/<slug>/reservation, letting the visitor complete
 * the booking inside your site without leaving the page.
 */
(function () {
  'use strict';

  // ─── Infer the platform base URL from the widget script's own src ─────
  function inferBaseUrl() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('/widget.js') !== -1) {
        try { return new URL(src).origin; } catch (_) { /* fall through */ }
      }
    }
    return window.location.origin;
  }

  var GLOBAL_BASE_URL = inferBaseUrl();
  var ROOT_ID = 'na-widget-modal-root';

  // ─── Inject shared styles once ────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById('na-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'na-widget-styles';
    style.textContent = [
      '.na-widget-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;',
      'padding:.85rem 1.6rem;font:600 .8rem/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
      'letter-spacing:.15em;text-transform:uppercase;border-radius:6px;cursor:pointer;',
      'transition:background .2s,transform .1s;border:0;text-decoration:none}',
      '.na-widget-btn:active{transform:scale(.97)}',
      '.na-widget-btn.na-dark{background:#e3ccad;color:#2d201a}',
      '.na-widget-btn.na-dark:hover{background:#d4b18a}',
      '.na-widget-btn.na-light{background:#2d201a;color:#faf7f2}',
      '.na-widget-btn.na-light:hover{background:#523e32}',
      '.na-widget-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.85);',
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
      'display:flex;align-items:center;justify-content:center;padding:1rem;',
      'opacity:0;transition:opacity .3s ease-out;pointer-events:none}',
      '.na-widget-modal.na-open{opacity:1;pointer-events:auto}',
      '.na-widget-frame{position:relative;width:100%;max-width:1100px;height:100%;max-height:92vh;',
      'background:#0a0a0a;border:1px solid rgba(255,255,255,.15);border-radius:12px;',
      'overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.5);',
      'transform:scale(.96);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
      '.na-widget-modal.na-open .na-widget-frame{transform:scale(1)}',
      '.na-widget-frame iframe{width:100%;height:100%;border:0;display:block}',
      '.na-widget-close{position:absolute;top:12px;right:12px;z-index:2;',
      'width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.6);',
      'border:1px solid rgba(255,255,255,.25);color:#fff;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;transition:background .2s}',
      '.na-widget-close:hover{background:rgba(0,0,0,.85)}',
      '.na-widget-close svg{width:18px;height:18px}',
      '@media(max-width:640px){.na-widget-frame{max-height:100vh;height:100vh;border-radius:0}}'
    ].join('');
    document.head.appendChild(style);
  }

  // ─── Modal singleton — lazily created ─────────────────────────────────
  function ensureModal() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'na-widget-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Formulaire de réservation');

    var frame = document.createElement('div');
    frame.className = 'na-widget-frame';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'na-widget-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>';
    closeBtn.addEventListener('click', closeModal);

    var iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Réservation');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('loading', 'lazy');

    frame.appendChild(closeBtn);
    frame.appendChild(iframe);
    root.appendChild(frame);
    // Close on backdrop click
    root.addEventListener('click', function (e) { if (e.target === root) closeModal(); });
    document.body.appendChild(root);

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('na-open')) closeModal();
    });

    // Close when the embedded page signals via postMessage
    // (fires when the user clicks the X inside the reservation modal)
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'na-widget:close') closeModal();
    });

    return root;
  }

  function openModal(url) {
    var root = ensureModal();
    var iframe = root.querySelector('iframe');
    iframe.src = url;
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    // Delay class add so transition triggers
    requestAnimationFrame(function () { root.classList.add('na-open'); });
  }

  function closeModal() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    root.classList.remove('na-open');
    document.body.style.overflow = '';
    // Free up the iframe after transition
    setTimeout(function () {
      var iframe = root.querySelector('iframe');
      if (iframe) iframe.src = 'about:blank';
    }, 350);
  }

  // ─── Mount one widget instance into a container div ───────────────────
  function mount(container) {
    if (container.dataset.naMounted === '1') return;
    container.dataset.naMounted = '1';

    var slug = container.getAttribute('data-restaurant');
    if (!slug) {
      console.warn('[NA widget] missing data-restaurant on', container);
      return;
    }

    var label = container.getAttribute('data-label') || 'Réserver une table';
    var theme = (container.getAttribute('data-theme') || 'dark').toLowerCase();
    var baseUrl = (container.getAttribute('data-base-url') || GLOBAL_BASE_URL).replace(/\/$/, '');
    // Dedicated chrome-free embed route (no navbar/footer, just the reservation flow)
    var reservationUrl = baseUrl + '/embed/reserve?tenant=' + encodeURIComponent(slug);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'na-widget-btn ' + (theme === 'light' ? 'na-light' : 'na-dark');
    btn.textContent = label;
    btn.addEventListener('click', function () { openModal(reservationUrl); });

    container.innerHTML = '';
    container.appendChild(btn);
  }

  // ─── Bootstrap ─────────────────────────────────────────────────────────
  function init() {
    ensureStyles();
    var mounts = document.querySelectorAll('[data-na-widget="reservation"]');
    for (var i = 0; i < mounts.length; i++) mount(mounts[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose a manual mount API for late-inserted widgets (SPAs, tabs, etc.)
  window.NAWidget = { mount: mount, refresh: init, close: closeModal };
})();
