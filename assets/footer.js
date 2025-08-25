// === ANARO shared footer loader ===
// Inserts /partials/footer.html into every page.
// Usage in each page (near </body>):
// <div data-include-footer></div>
// <link rel="stylesheet" href="/assets/footer.css">
// <script>window.ANARO_FOOTER_URL='/partials/footer.html?v=20250825'</script>
// <script defer src="/assets/footer.js"></script>
(function () {
  var DEFAULT_URL = '/partials/footer.html';
  var FOOTER_URL = (typeof window !== 'undefined' && window.ANARO_FOOTER_URL) ? window.ANARO_FOOTER_URL : DEFAULT_URL;

  function pickMountPoint() {
    var explicit = document.querySelector('[data-include-footer]');
    if (explicit) return explicit;
    var existing = document.querySelector('footer');
    if (existing) return existing;
    var mount = document.createElement('div');
    document.body.appendChild(mount);
    return mount;
  }

  function loadFooterHTML(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('Fetch footer failed: ' + res.status);
      return res.text();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadFooterHTML(FOOTER_URL).then(function (html) {
      var mount = pickMountPoint();
      // Replace the mount node (avoid nesting footer inside placeholder)
      mount.outerHTML = html;
    }).catch(function (e) {
      console.warn('[ANARO] Footer load error:', e);
    });
  });
})();
