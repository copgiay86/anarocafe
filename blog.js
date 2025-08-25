/* GitHub-backed blog loader with card badges and responsive grid */
const OWNER = "copgiay86";
const REPO  = "anarocafe";
const BRANCH = "main";
const POSTS_DIR = "posts";
const GITHUB_LIST_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${POSTS_DIR}?ref=${BRANCH}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;

// Config
const DISPLAY_LIMIT = 6; // 3 x 2 rows on desktop

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" }});
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return res.text();
}

function parseFrontMatter(md) {
  const FM_BOUNDARY = /^---\s*$/m;
  const parts = md.split(FM_BOUNDARY);
  if (parts.length >= 3 && md.trimStart().startsWith('---')) {
    const raw = parts[1].trim();
    const body = parts.slice(2).join('---').trim();
    const meta = {};
    raw.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (m) {
        const key = m[1].trim();
        let val = m[2].trim();
        if (key.toLowerCase()==="tags") val = val.split(",").map(s=>s.trim()).filter(Boolean);
        if (["popular","featured"].includes(key.toLowerCase())) val = /^true$/i.test(val);
        if (key.toLowerCase()==="views") val = parseInt(val,10) || 0;
        meta[key] = val;
      }
    });
    return { meta, body };
  }
  return { meta:{}, body: md };
}

function formatDate(dstr) {
  try {
    const d = new Date(dstr);
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2,"0");
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    }
  } catch {}
  return dstr||"";
}

function slugFromName(name){ return name.replace(/\.md$/i,""); }
function postUrlFromSlug(slug){
  const u = new URL("post.html", window.location.href);
  u.searchParams.set("slug", slug);
  return u.toString();
}

function computeIsNew(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const diff = (now - d) / (1000*60*60*24);
  return diff <= 21; // within 21 days
}
function computeIsPopular(meta) {
  if (meta.popular === true) return true;
  if (typeof meta.views === "number" && meta.views >= 100) return true;
  return false;
}
function firstParagraph(mdBody) {
  const para = mdBody.split(/\n{2,}/).map(s=>s.trim()).find(Boolean) || "";
  return para.replace(/[#>*`*_~\-!\[\]\(\)]+/g," ").replace(/\s+/g," ").trim();
}
function truncate(s, n){ return s.length>n ? s.slice(0,n-1)+"…" : s; }

async function loadPosts() {
  const files = await fetchJSON(GITHUB_LIST_API);
  const mdFiles = files.filter(f => f.type==="file" && /\.md$/i.test(f.name));
  const results = [];
  for (const item of mdFiles) {
    try {
      const rawUrl = RAW_BASE + item.path;
      const text = await fetchText(rawUrl);
      const { meta, body } = parseFrontMatter(text);
      const slug = slugFromName(item.name);
      const title = meta.title || slug;
      const desc = meta.description || truncate(firstParagraph(body), 160);
      const tags = meta.tags || [];
      const date = meta.date || "";
      const cover = meta.cover || "";
      const isNew = computeIsNew(date);
      const isHot = computeIsPopular(meta);
      results.push({ slug, title, desc, tags, date, cover, isNew, isHot, path: item.path });
    } catch(e) {
      console.error("load post error", item.name, e);
    }
  }
  // sort by date desc then alpha
  results.sort((a,b)=>{
    const da = Date.parse(a.date||"") || 0;
    const db = Date.parse(b.date||"") || 0;
    if (db!==da) return db - da;
    return a.slug.localeCompare(b.slug);
  });
  return results;
}

function tagChips(tags){ return tags.map(t=>`<span class="chip">${t}</span>`).join(""); }

function cardHTML(p){
  const cover = p.cover ? `<div class="thumb"><img src="${p.cover}" loading="lazy" alt=""></div>` : `<div class="thumb thumb--placeholder" aria-label="no cover"></div>`;
  const newBadge = p.isNew ? `<span class="badge new">Bài mới</span>` : "";
  const hotBadge = p.isHot ? `<span class="badge hot">Đọc nhiều</span>` : "";
  return `
  <article class="blog-card">
    <a class="card-link" href="${postUrlFromSlug(p.slug)}" aria-label="${p.title}">
      <div class="badges">${newBadge}${hotBadge}</div>
      ${cover}
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <div class="meta">${formatDate(p.date)}</div>
        <p class="desc">${p.desc}</p>
        <div class="tags">${tagChips(p.tags)}</div>
      </div>
    </a>
  </article>`;
}

async function renderBlogList(){
  const list = document.getElementById("blog-grid");
  const status = document.getElementById("status");
  const moreBtn = document.getElementById("moreBtn");
  try {
    status.textContent = "Đang tải bài viết...";
    const posts = await loadPosts();
    status.textContent = "";
    if (!posts.length){
      list.innerHTML = `<p>Chưa có bài viết nào. Thêm tệp Markdown vào <code>/posts</code>.</p>`;
      moreBtn.style.display = "none";
      return;
    }
    let idx = 0;
    function renderBatch() {
      const batch = posts.slice(idx, idx + DISPLAY_LIMIT);
      list.insertAdjacentHTML("beforeend", batch.map(cardHTML).join(""));
      idx += DISPLAY_LIMIT;
      moreBtn.style.display = idx < posts.length ? "inline-flex" : "none";
    }
    renderBatch();
    moreBtn.onclick = renderBatch;
  } catch(e) {
    console.error(e);
    status.textContent = "Không tải được bài viết.";
  }
}

async function renderSinglePost() {
  const root = document.getElementById("post-root");
  const status = document.getElementById("status");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug){ root.innerHTML = "<p>Thiếu tham số <code>?slug=</code>.</p>"; return; }
  try {
    status.textContent = "Đang tải bài viết...";
    const files = await fetchJSON(GITHUB_LIST_API);
    const match = files.find(f => f.type==="file" && f.name.toLowerCase() === `${slug}.md`.toLowerCase());
    if (!match){ status.textContent = "Không tìm thấy bài viết."; return; }
    const text = await fetchText(RAW_BASE + match.path);
    const { meta, body } = parseFrontMatter(text);
    const title = meta.title || slug;
    const date = formatDate(meta.date || "");
    const tags = meta.tags || [];
    const cover = meta.cover || "";
    const html = DOMPurify.sanitize(marked.parse(body));
    document.title = `${title} — Blog ANARO`;

    // Build header & content
    const coverImg = cover ? `<img class="post-cover" src="${cover}" alt="">` : "";
    root.innerHTML = `
      <article class="post-article">
        ${coverImg}
        <h1 class="post-title">${title}</h1>
        <div class="post-meta">${date} ${tags.length ? "·" : ""} ${tagChips(tags)}</div>
        <div class="post-content">${html}</div>
        <p><a class="back-btn" href="blog.html">← Quay lại Blog</a></p>
      </article>
    `;
    status.textContent = "";
  } catch(e) {
    console.error(e);
    status.textContent = "Lỗi khi tải bài viết.";
  }
}

window.Blog = { renderBlogList, renderSinglePost };
