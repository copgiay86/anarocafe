/* Blog loader - Fixed version */
const SOURCES = [
  {owner:"copgiay86", repo:"anarocafe", branch:"main"},
  {owner:"copgiay86", repo:"anarocafe-vert", branch:"main"},
  {owner:"copgiay86", repo:"anarocafe", branch:"master"},
  {owner:"copgiay86", repo:"anarocafe-vert", branch:"master"},
];
const POSTS_DIR = "posts";
const DISPLAY_LIMIT = 6;

async function fetchJSON(url) {
  const res = await fetch(url, { 
    headers: { 
      "Accept": "application/vnd.github+json",
      "User-Agent": "ANARO-Blog-1.0"
    }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return res.text();
}

async function resolveSource() {
  const tried = [];
  for (const s of SOURCES) {
    const listApi = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${POSTS_DIR}?ref=${s.branch}`;
    try {
      const files = await fetchJSON(listApi);
      if (Array.isArray(files) && files.length > 0) {
        const md = files.filter(f => f.type === "file" && /\.md$/i.test(f.name));
        if (md.length > 0) { // Fixed: only return if we have actual .md files
          console.info("[Blog] Using source:", s, `(found ${md.length} files)`);
          return { ...s, files: md }; // Return only .md files
        }
      }
    } catch (e) {
      tried.push({source: s, error: String(e)});
      console.warn(`Failed to access ${s.owner}/${s.repo}@${s.branch}:`, e.message);
      continue;
    }
  }
  const err = new Error("Không tìm được thư mục /posts trong các repo/nhánh đã thử.");
  err.tried = tried;
  throw err;
}

function parseFrontMatter(md) {
  // More robust front-matter parsing
  const lines = md.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { meta: {}, body: md };
  }
  
  let frontMatterEnd = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      frontMatterEnd = i;
      break;
    }
  }
  
  if (frontMatterEnd === -1) {
    return { meta: {}, body: md };
  }
  
  const frontMatterLines = lines.slice(1, frontMatterEnd);
  const body = lines.slice(frontMatterEnd + 1).join('\n').trim();
  
  const meta = {};
  frontMatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let val = line.slice(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || 
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      
      if (key.toLowerCase() === "tags") {
        val = val.split(",").map(s => s.trim()).filter(Boolean);
      } else if (["popular", "featured"].includes(key.toLowerCase())) {
        val = /^true$/i.test(val);
      } else if (key.toLowerCase() === "views") {
        val = parseInt(val, 10) || 0;
      }
      meta[key] = val;
    }
  });
  
  return { meta, body };
}

function formatDate(dstr) {
  if (!dstr) return "";
  try {
    const d = new Date(dstr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    }
  } catch (e) {
    console.warn("Invalid date format:", dstr);
  }
  return String(dstr);
}

function slugFromName(name) { 
  return name.replace(/\.md$/i, ""); 
}

function postUrlFromSlug(slug) {
  const u = new URL("post.html", window.location.href);
  u.searchParams.set("slug", slug);
  return u.toString();
}

function firstParagraph(mdBody) {
  if (!mdBody) return "";
  const para = mdBody.split(/\n{2,}/).map(s => s.trim()).find(Boolean) || "";
  return para.replace(/[#>*`_~\-!\[\]\(\)]+/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(s, n) { 
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s; 
}

function computeIsNew(dateStr) { 
  if (!dateStr) return false;
  const now = new Date(); 
  const d = new Date(dateStr); 
  if (isNaN(d.getTime())) return false; 
  return ((now - d) / (1000 * 60 * 60 * 24)) <= 21; 
}

function computeIsPopular(meta) { 
  if (meta.popular === true) return true; 
  if (typeof meta.views === "number" && meta.views >= 100) return true; 
  return false; 
}

function tagChips(tags) { 
  if (!Array.isArray(tags)) return "";
  return tags.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join(""); 
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function cardHTML(p) {
  const cover = p.cover ? 
    `<div class="thumb"><img src="${escapeHtml(p.cover)}" loading="lazy" alt="${escapeHtml(p.title)}"></div>` : 
    `<div class="thumb thumb--placeholder">📖</div>`;
  const newBadge = p.isNew ? `<span class="badge new">Bài mới</span>` : "";
  const hotBadge = p.isHot ? `<span class="badge hot">Đọc nhiều</span>` : "";
  
  return `
  <article class="blog-card">
    <a class="card-link" href="${postUrlFromSlug(p.slug)}" aria-label="${escapeHtml(p.title)}">
      <div class="badges">${newBadge}${hotBadge}</div>
      ${cover}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <div class="meta">${escapeHtml(formatDate(p.date))}</div>
        <p class="desc">${escapeHtml(p.desc)}</p>
        <div class="tags">${tagChips(p.tags)}</div>
      </div>
    </a>
  </article>`;
}

async function renderBlogList() {
  const list = document.getElementById("blog-grid");
  const status = document.getElementById("status");
  const moreBtn = document.getElementById("moreBtn");
  
  if (!list) {
    console.error("Element #blog-grid not found");
    return;
  }
  
  try {
    status.textContent = "Đang kiểm tra nguồn bài viết...";
    const src = await resolveSource();
    const RAW_BASE = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${src.branch}/`;
    
    status.textContent = "Đang tải bài viết...";
    const mdFiles = src.files; // Already filtered in resolveSource
    
    if (!mdFiles.length) { 
      status.textContent = "Chưa có bài trong /posts."; 
      if (moreBtn) moreBtn.style.display = "none"; 
      return; 
    }
    
    const posts = [];
    for (const item of mdFiles) {
      try {
        const text = await fetchText(RAW_BASE + item.path);
        const { meta, body } = parseFrontMatter(text);
        const slug = slugFromName(item.name);
        const title = meta.title || slug;
        const desc = meta.description || truncate(firstParagraph(body), 160);
        const tags = Array.isArray(meta.tags) ? meta.tags : [];
        const date = meta.date || "";
        const cover = meta.cover || "";
        const isNew = computeIsNew(date);
        const isHot = computeIsPopular(meta);
        
        posts.push({ slug, title, desc, tags, date, cover, isNew, isHot });
      } catch (e) { 
        console.warn("Skip file:", item.name, e.message); 
      }
    }
    
    // Sort by date (newest first), then by slug
    posts.sort((a, b) => {
      const da = Date.parse(a.date || "") || 0;
      const db = Date.parse(b.date || "") || 0;
      if (db !== da) return db - da; 
      return a.slug.localeCompare(b.slug);
    });
    
    status.textContent = "";
    
    if (!posts.length) { 
      list.innerHTML = "<p>Không có bài hợp lệ (.md có front-matter).</p>"; 
      if (moreBtn) moreBtn.style.display = "none"; 
      return; 
    }
    
    let idx = 0;
    function renderBatch() { 
      const batch = posts.slice(idx, idx + DISPLAY_LIMIT); 
      list.insertAdjacentHTML("beforeend", batch.map(cardHTML).join("")); 
      idx += DISPLAY_LIMIT; 
      if (moreBtn) {
        moreBtn.style.display = idx < posts.length ? "inline-flex" : "none"; 
      }
    }
    
    renderBatch(); 
    if (moreBtn) {
      moreBtn.onclick = renderBatch;
    }
    
  } catch (e) {
    console.error("Blog loading error:", e);
    const hint = (e.tried && e.tried.length)
      ? "Đã thử các nguồn: " + e.tried.map(t => `${t.source.owner}/${t.source.repo}@${t.source.branch}`).join(", ")
      : "";
    status.textContent = "Không lấy được bài. " + hint;
    if (moreBtn) moreBtn.style.display = "none";
  }
}

async function renderSinglePost() {
  const root = document.getElementById("post-root");
  const status = document.getElementById("status");
  
  if (!root) {
    console.error("Element #post-root not found");
    return;
  }
  
  try {
    status.textContent = "Đang kiểm tra nguồn...";
    const src = await resolveSource();
    const list = src.files;
    
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("slug") || "").toLowerCase();
    
    if (!slug) {
      status.textContent = "Không có slug được chỉ định.";
      return;
    }
    
    const match = list.find(f => f.type === "file" && f.name.toLowerCase() === `${slug}.md`);
    if (!match) { 
      status.textContent = "Không tìm thấy bài viết."; 
      return; 
    }
    
    const RAW_BASE = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${src.branch}/`;
    status.textContent = "Đang tải bài...";
    
    const text = await fetchText(RAW_BASE + match.path);
    const { meta, body } = parseFrontMatter(text);
    const title = meta.title || slug;
    const date = formatDate(meta.date || "");
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const cover = meta.cover || "";
    
    // Use marked and DOMPurify if available, fallback to basic parsing
    let html;
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      html = DOMPurify.sanitize(marked.parse(body));
    } else {
      // Basic markdown parsing fallback
      html = body
        .replace(/\n\n/g, '</p><p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>');
      html = '<p>' + html + '</p>';
    }
    
    document.title = `${title} — Blog ANARO`;
    
    const coverImg = cover ? `<img class="post-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(title)}">` : "";
    
    root.innerHTML = `
      <article class="post-article">
        ${coverImg}
        <h1 class="post-title">${escapeHtml(title)}</h1>
        <div class="post-meta">${escapeHtml(date)} ${tags.length ? "·" : ""} ${tagChips(tags)}</div>
        <div class="post-content">${html}</div>
        <p><a class="back-btn" href="blog.html">← Quay lại Blog</a></p>
      </article>`;
    
    status.textContent = "";
  } catch (e) {
    console.error("Post loading error:", e);
    status.textContent = "Không tải được bài.";
  }
}

window.Blog = { renderBlogList, renderSinglePost };
