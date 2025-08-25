/* Blog loader hotfix: auto-detect repo/branch and clearer errors */
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
      "User-Agent": "ANARO-Blog/1.0"
    }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ANARO-Blog/1.0"
    }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${url}`);
  return res.text();
}

async function resolveSource() {
  const tried = [];
  for (const s of SOURCES) {
    const listApi = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${POSTS_DIR}?ref=${s.branch}`;
    try {
      console.log(`[Blog] Trying: ${s.owner}/${s.repo}@${s.branch}`);
      const files = await fetchJSON(listApi);
      
      if (Array.isArray(files)) {
        const mdFiles = files.filter(f => f.type === "file" && /\.md$/i.test(f.name));
        // FIX: Đổi từ >= 0 thành > 0
        if (mdFiles.length > 0) {
          console.info("[Blog] Using source:", s, `(found ${mdFiles.length} markdown files)`);
          return { ...s, files: mdFiles };
        } else {
          console.warn(`[Blog] No markdown files found in ${s.owner}/${s.repo}@${s.branch}/${POSTS_DIR}`);
        }
      } else {
        console.warn(`[Blog] Invalid response format from ${listApi}`);
      }
    } catch (e) {
      const errorMsg = e.message.includes('404') ? 'Repository/branch not found' : String(e);
      tried.push({source: s, error: errorMsg});
      console.warn(`[Blog] Failed ${s.owner}/${s.repo}@${s.branch}:`, errorMsg);
      continue;
    }
  }
  
  const err = new Error("Không tìm được thư mục /posts trong các repo/nhánh đã thử.");
  err.tried = tried;
  throw err;
}

function parseFrontMatter(md) {
  const FM_BOUNDARY = /^---\s*$/m;
  const parts = md.split(FM_BOUNDARY);
  
  if (parts.length >= 3 && md.trimStart().startsWith('---')) {
    const raw = parts[1].trim();
    const body = parts.slice(2).join('---').trim();
    const meta = {};
    
    raw.split(/\r?\n/).forEach(line => {
      const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        
        // Parse different field types
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
  
  return { meta: {}, body: md };
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
    console.warn('Date parsing error:', e, 'for date:', dstr);
  }
  
  return dstr;
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
  return para
    .replace(/[#>*`_~\-!\[\]\(\)]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  
  const daysDiff = (now - d) / (1000 * 60 * 60 * 24);
  return daysDiff <= 21;
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

// ADD: HTML escaping function for security
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function cardHTML(p) {
  const cover = p.cover ? 
    `<div class="thumb"><img src="${escapeHtml(p.cover)}" loading="lazy" alt="${escapeHtml(p.title)}"></div>` : 
    `<div class="thumb thumb--placeholder"><span>📝</span></div>`;
  
  const newBadge = p.isNew ? `<span class="badge new">Bài mới</span>` : "";
  const hotBadge = p.isHot ? `<span class="badge hot">Đọc nhiều</span>` : "";
  
  return `
    <article class="blog-card">
      <a class="card-link" href="${postUrlFromSlug(p.slug)}" aria-label="${escapeHtml(p.title)}">
        <div class="badges">${newBadge}${hotBadge}</div>
        ${cover}
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
          <div class="meta">${formatDate(p.date)}</div>
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
  
  if (!list || !status || !moreBtn) {
    console.error('[Blog] Required DOM elements not found');
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
      moreBtn.style.display = "none"; 
      return; 
    }
    
    const posts = [];
    let loadedCount = 0;
    
    for (const item of mdFiles) {
      try {
        status.textContent = `Đang tải bài viết... (${++loadedCount}/${mdFiles.length})`;
        const text = await fetchText(RAW_BASE + POSTS_DIR + "/" + item.name);
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
    
    // Sort by date (newest first), then by title
    posts.sort((a, b) => {
      const dateA = Date.parse(a.date || "") || 0;
      const dateB = Date.parse(b.date || "") || 0;
      
      if (dateB !== dateA) return dateB - dateA;
      return a.slug.localeCompare(b.slug);
    });
    
    status.textContent = "";
    
    if (!posts.length) {
      list.innerHTML = "<p>Không có bài hợp lệ (.md có front-matter).</p>"; 
      moreBtn.style.display = "none"; 
      return; 
    }
    
    let currentIndex = 0;
    
    function renderBatch() {
      const batch = posts.slice(currentIndex, currentIndex + DISPLAY_LIMIT);
      list.insertAdjacentHTML("beforeend", batch.map(cardHTML).join(""));
      currentIndex += DISPLAY_LIMIT;
      moreBtn.style.display = currentIndex < posts.length ? "inline-flex" : "none";
    }
    
    renderBatch();
    moreBtn.onclick = renderBatch;
    
  } catch (e) {
    console.error('[Blog] Error:', e);
    
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
  
  if (!root || !status) {
    console.error('[Blog] Required DOM elements not found');
    return;
  }
  
  try {
    status.textContent = "Đang kiểm tra nguồn...";
    const src = await resolveSource();
    
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("slug") || "").toLowerCase();
    
    if (!slug) {
      status.textContent = "Không có slug bài viết.";
      return;
    }
    
    const match = src.files.find(f => f.type === "file" && slugFromName(f.name).toLowerCase() === slug);
    
    if (!match) { 
      status.textContent = "Không tìm thấy bài viết."; 
      return; 
    }
    
    const RAW_BASE = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${src.branch}/`;
    status.textContent = "Đang tải bài...";
    
    const text = await fetchText(RAW_BASE + POSTS_DIR + "/" + match.name);
    const { meta, body } = parseFrontMatter(text);
    
    const title = meta.title || slug;
    const date = formatDate(meta.date || "");
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const cover = meta.cover || "";
    
    // Use DOMPurify and marked to safely render markdown
    const html = DOMPurify.sanitize(marked.parse(body));
    
    document.title = `${title} — Blog ANARO`;
    
    const coverImg = cover ? `<img class="post-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(title)}">` : "";
    
    root.innerHTML = `
      <article class="post-article">
        ${coverImg}
        <h1 class="post-title">${escapeHtml(title)}</h1>
        <div class="post-meta">${date} ${tags.length ? "·" : ""} ${tagChips(tags)}</div>
        <div class="post-content">${html}</div>
        <p><a class="back-btn" href="blog.html">← Quay lại Blog</a></p>
      </article>`;
    
    status.textContent = "";
    
  } catch (e) {
    console.error('[Blog] Error:', e);
    status.textContent = "Không tải được bài.";
  }
}

// Export functions
window.Blog = { renderBlogList, renderSinglePost };
