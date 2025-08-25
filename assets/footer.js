<script>
(function(){
  function pickMount(){
    return document.querySelector('[data-include-footer],[data-include="footer"]') ||
      (function(){ const n=document.createElement('div'); document.body.appendChild(n); return n; })();
  }
  function ensureCSS(root){
    if(!document.querySelector('link[href*="assets/footer.css"]')){
      const link=document.createElement('link'); link.rel='stylesheet'; link.href = root+'assets/footer.css';
      document.head.appendChild(link);
    }
  }
  function computeRoot(){
    const el = document.currentScript || document.querySelector('script[src*="footer.js"]');
    const src = el ? new URL(el.getAttribute('src'), location.href) : new URL(location.href);
    // src …/assets/footer.js  -> root …/
    return src.href.replace(/assets\/footer\.js.*$/,'');
  }
  async function fetchFirst(urls){
    for(const u of urls){
      try{ const r = await fetch(u, {cache:'no-store'}); if(r.ok) return await r.text(); }catch(e){}
    }
    throw new Error('Footer partial not found in provided paths.');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const root = computeRoot();
    ensureCSS(root);

    const user = window.ANARO_FOOTER_URL; // optional override per page
    const candidates = [];
    if(user) candidates.push(new URL(user, location.href).href);
    candidates.push(root+'partials/footer.html');
    candidates.push('partials/footer.html');
    candidates.push(root+'footer.html'); // extra fallback

    try{
      const html = await fetchFirst(candidates);
      const mount = pickMount();
      mount.outerHTML = html;
    }catch(err){
      console.warn('[ANARO] Footer load failed:', err);
    }
  });
})();
</script>
