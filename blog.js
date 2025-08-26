/* Enhanced Blog loader với template processing và tính năng tương tác nâng cao */
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
      "User-Agent": "ANARO-Blog/2.0"
    }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ANARO-Blog/2.0"
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
          // Handle both string and array formats
          if (val.startsWith('[') && val.endsWith(']')) {
            val = val.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
          } else {
            val = val.split(",").map(s => s.trim()).filter(Boolean);
          }
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

// Enhanced shortcode processing cho template
function processShortcodes(body) {
  if (!body) return body;
  
  // Process CTA boxes: {{cta|title|description|price|image|link}}
  body = body.replace(/\{\{cta\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^}]+)\}\}/g, 
    (match, title, desc, price, image, link) => {
      const hasDiscount = price.includes('đ') && price.split('đ').length > 2;
      return `
<div class="cta-box">
  <div class="cta-content">
    <div class="cta-image">
      <img src="${escapeHtml(image.trim())}" alt="${escapeHtml(title.trim())}" loading="lazy">
    </div>
    <div class="cta-info">
      <h3 class="cta-title">${escapeHtml(title.trim())}</h3>
      <p class="cta-desc">${escapeHtml(desc.trim())}</p>
      <div class="cta-price">${escapeHtml(price.trim())}</div>
      <a href="${escapeHtml(link.trim())}" class="cta-btn">🛒 Đặt mua ngay</a>
    </div>
  </div>
</div>`;
    });

  // Process info tables: {{table|header1,header2|row1col1,row1col2|row2col1,row2col2}}
  body = body.replace(/\{\{table\|([^}]+)\}\}/g, (match, content) => {
    const rows = content.split('|').map(row => row.trim());
    if (rows.length < 2) return match;
    
    const headers = rows[0].split(',').map(h => h.trim());
    const dataRows = rows.slice(1).map(row => row.split(',').map(cell => cell.trim()));
    
    let tableHtml = `
<div class="table-wrapper">
  <table class="info-table">
    <thead>
      <tr>`;
    
    headers.forEach(header => {
      tableHtml += `<th>${escapeHtml(header)}</th>`;
    });
    
    tableHtml += `</tr></thead><tbody>`;
    
    dataRows.forEach(row => {
      tableHtml += `<tr>`;
      headers.forEach((header, index) => {
        const cellValue = row[index] || '';
        tableHtml += `<td data-label="${escapeHtml(header)}">${escapeHtml(cellValue)}</td>`;
      });
      tableHtml += `</tr>`;
    });
    
    tableHtml += `</tbody></table></div>`;
    return tableHtml;
  });

  // Process related posts: {{related|title1,link1|title2,link2}}
  body = body.replace(/\{\{related\|([^}]+)\}\}/g, (match, content) => {
    const items = content.split('|').map(item => {
      const [title, link] = item.split(',').map(s => s.trim());
      return { title, link };
    });
    
    let relatedHtml = `
<div class="related-posts">
  <h3>📖 Bài viết liên quan</h3>
  <ul class="related-list">`;
  
    items.forEach(item => {
      if (item.title && item.link) {
        relatedHtml += `<li><a href="${escapeHtml(item.link)}">${escapeHtml(item.title)}</a></li>`;
      }
    });
    
    relatedHtml += `</ul></div>`;
    return relatedHtml;
  });

  return body;
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
  return daysDiff <= 21; // 3 weeks
}

function computeIsPopular(meta) {
  if (meta.popular === true) return true;
  if (typeof meta.views === "number" && meta.views >= 50) return true;
  return false;
}

function tagChips(tags) {
  if (!Array.isArray(tags)) return "";
  return tags.map(t => `<span class="chip" onclick="filterByTag('${escapeHtml(t)}')">${escapeHtml(t)}</span>`).join("");
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Enhanced card HTML với badges và interactivity
function cardHTML(p) {
  const cover = p.cover ? 
    `<div class="thumb">
       <img src="${escapeHtml(p.cover)}" loading="lazy" alt="${escapeHtml(p.title)}" 
            onerror="this.parentNode.className='thumb thumb--placeholder'; this.parentNode.innerHTML='<span>📝</span>'">
     </div>` : 
    `<div class="thumb thumb--placeholder"><span>📝</span></div>`;
  
  const newBadge = p.isNew ? `<span class="badge new">Bài mới</span>` : "";
  const hotBadge = p.isHot ? `<span class="badge hot">Đọc nhiều</span>` : "";
  const readTime = Math.max(1, Math.ceil((p.desc || '').length / 200));
  
  return `
    <article class="blog-card" data-tags="${(p.tags || []).join(',').toLowerCase()}">
      <a class="card-link" href="${postUrlFromSlug(p.slug)}" aria-label="${escapeHtml(p.title)}">
        <div class="badges">${newBadge}${hotBadge}</div>
        ${cover}
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
          <div class="meta">
            <span class="date">${formatDate(p.date)}</span>
            ${p.date ? '·' : ''} <span class="read-time">${readTime} phút đọc</span>
          </div>
          <p class="desc">${escapeHtml(truncate(p.desc, 120))}</p>
          <div class="tags">${tagChips(p.tags)}</div>
        </div>
      </a>
    </article>`;
}

// Extract Table of Contents từ markdown
function extractTOC(body) {
  if (!body) return [];
  
  const headings = [];
  const lines = body.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+?)(\s*\{#([^}]+)\})?$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const customId = match[4];
      const id = customId || text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      headings.push({ level, text, id });
    }
  }
  
  return headings;
}

// Generate TOC HTML với nested structure
function generateTOCHTML(headings) {
  if (!headings.length) return '';
  
  const tocItems = headings.map(h => 
    `<li class="toc-level-${h.level}">
       <a href="#${h.id}" class="toc-link">${escapeHtml(h.text)}</a>
     </li>`
  ).join('');
  
  return `
    <details class="toc-dropdown" open>
      <summary>📋 Mục lục bài viết</summary>
      <ul class="toc-list">
        ${tocItems}
      </ul>
    </details>`;
}

// Add IDs to headings trong HTML
function addHeadingIds(html) {
  return html.replace(/<h([2-4])>([^<]+)<\/h[2-4]>/g, (match, level, text) => {
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}

// Global filter function
function filterByTag(tag) {
  if (typeof window.BlogControls !== 'undefined' && window.BlogControls.filterAndDisplayPosts) {
    // Trigger tag filter
    window.currentFilter = tag.toLowerCase();
    
    // Update UI
    document.querySelectorAll('.filter-tag').forEach(btn => {
      btn.classList.remove('active');
      btn.style.background = 'var(--white)';
      btn.style.color = 'var(--brand)';
    });
    
    const tagBtn = document.querySelector(`[data-tag="${tag.toLowerCase()}"]`);
    if (tagBtn) {
      tagBtn.classList.add('active');
      tagBtn.style.background = 'var(--brand)';
      tagBtn.style.color = 'white';
    }
    
    window.BlogControls.filterAndDisplayPosts();
  }
}

// Setup interactive elements
function setupPostInteractivity() {
  // Smooth scroll cho TOC links
  document.addEventListener('click', function(e) {
    if (e.target.matches('.toc-link')) {
      e.preventDefault();
      const targetId = e.target.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
        
        // Update active TOC item
        document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
      }
    }
  });

  // Track scroll position for TOC highlighting
  let ticking = false;
  function updateTOCHighlight() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const headings = document.querySelectorAll('h2, h3, h4');
        let activeHeading = null;
        
        headings.forEach(heading => {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 100) {
            activeHeading = heading;
          }
        });
        
        document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
        if (activeHeading) {
          const activeLink = document.querySelector(`.toc-link[href="#${activeHeading.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
        
        ticking = false;
      });
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', updateTOCHighlight);

  // Click handlers cho CTA tracking
  document.addEventListener('click', function(e) {
    if (e.target.matches('.cta-btn')) {
      console.log('CTA clicked:', e.target.href);
      
      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          event_category: 'CTA',
          event_label: e.target.href
        });
      }
    }
  });
}

async function renderBlogList() {
  const list = document.getElementById("blog-grid");
  const status = document.getElementById("status");
  const moreBtn = document.getElementById("moreBtn");
  
  if (!list || !status) {
    console.error('[Blog] Required DOM elements not found');
    return;
  }
  
  try {
    status.textContent = "Đang kiểm tra nguồn bài viết...";
    const src = await resolveSource();
    const RAW_BASE = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${src.branch}/`;
    
    status.textContent = "Đang tải bài viết...";
    const mdFiles = src.files;
    
    if (!mdFiles.length) { 
      status.textContent = "Chưa có bài trong /posts.";
      document.getElementById('empty-state').style.display = 'block';
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
        
        posts.push({ 
          slug, title, desc, tags, date, cover, isNew, isHot,
          views: meta.views || 0,
          meta, body // Store for later use
        });
        
      } catch (e) { 
        console.warn("Skip file:", item.name, e.message); 
      }
    }
    
    // Sort by date, then by title
    posts.sort((a, b) => {
      const dateA = Date.parse(a.date || "") || 0;
      const dateB = Date.parse(b.date || "") || 0;
      
      if (dateB !== dateA) return dateB - dateA;
      return a.title.localeCompare(b.title);
    });
    
    status.textContent = "";
    
    if (!posts.length) {
      document.getElementById('empty-state').style.display = 'block';
      return; 
    }
    
    // Store posts globally for filtering
    window.Blog.allPosts = posts;
    
    let currentIndex = 0;
    
    function renderBatch() {
      const batch = posts.slice(currentIndex, currentIndex + DISPLAY_LIMIT);
      list.insertAdjacentHTML("beforeend", batch.map(cardHTML).join(""));
      currentIndex += DISPLAY_LIMIT;
      
      if (moreBtn) {
        moreBtn.style.display = currentIndex < posts.length ? "inline-flex" : "none";
        const remainingCount = document.getElementById('remaining-count');
        if (remainingCount) {
          remainingCount.textContent = `(còn ${posts.length - currentIndex} bài)`;
        }
      }
    }
    
    renderBatch();
    if (moreBtn) moreBtn.onclick = renderBatch;
    
  } catch (e) {
    console.error('[Blog] Error:', e);
    
    const hint = (e.tried && e.tried.length)
      ? "Đã thử các nguồn: " + e.tried.map(t => `${t.source.owner}/${t.source.repo}@${t.source.branch}`).join(", ")
      : "";
    
    status.textContent = "Không lấy được bài viết. " + hint;
    if (moreBtn) moreBtn.style.display = "none";
    document.getElementById('empty-state').style.display = 'block';
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
      const errorTemplate = document.getElementById('error-template');
      if (errorTemplate) {
        errorTemplate.style.display = 'block';
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
          errorMessage.textContent = `Không tìm thấy bài viết với slug: ${slug}`;
        }
      }
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
    const description = meta.description || truncate(firstParagraph(body), 160);
    
    // Update page metadata
    if (typeof updateMetaTags === 'function') {
      updateMetaTags(title, description, cover, window.location.href);
    }
    
    // Process shortcodes trước khi convert markdown
    const processedBody = processShortcodes(body);
    
    // Extract TOC
    const tocHeadings = extractTOC(processedBody);
    const tocHTML = generateTOCHTML(tocHeadings);
    
    // Convert to HTML và add heading IDs
    let html = DOMPurify.sanitize(marked.parse(processedBody));
    html = addHeadingIds(html);
    
    document.title = `${title} - Blog ANARO Coffee`;
    
    const coverImg = cover ? `
      <div class="post-cover-wrapper">
        <img class="post-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" 
             onerror="this.style.display='none'">
      </div>` : "";
    
    const readTime = Math.max(1, Math.ceil(body.length / 1000));
    const viewCount = meta.views || 0;
    
    root.innerHTML = `
      <article class="post-article" itemscope itemtype="https://schema.org/BlogPosting">
        ${coverImg}
        <header class="post-header">
          <h1 class="post-title" itemprop="headline">${escapeHtml(title)}</h1>
          <div class="post-meta">
            <time class="post-date" datetime="${meta.date || ''}" itemprop="datePublished">${date}</time>
            ${date ? '·' : ''} <span class="read-time">${readTime} phút đọc</span>
            ${viewCount > 0 ? `· <span class="view-count">${viewCount} lượt xem</span>` : ''}
            ${tags.length ? '·' : ''} <div class="post-tags">${tagChips(tags)}</div>
          </div>
        </header>
        
        <div class="post-content" itemprop="articleBody">
          ${tocHTML}
          ${html}
        </div>
        
        <footer class="post-footer">
          <div class="post-navigation">
            <a class="back-btn" href="blog.html">← Quay lại Blog</a>
          </div>
          
          <div class="post-sharing">
            <h4>Chia sẻ bài viết này:</h4>
            <div class="sharing-buttons">
              <button onclick="shareOnFacebook()" class="share-btn facebook">
                <i class="fab fa-facebook-f"></i> Facebook
              </button>
              <button onclick="shareOnTwitter()" class="share-btn twitter">
                <i class="fab fa-twitter"></i> Twitter
              </button>
              <button onclick="copyToClipboard()" class="share-btn copy">
                <i class="fas fa-link"></i> Sao chép link
              </button>
            </div>
          </div>
        </footer>
      </article>`;
    
    status.textContent = "";
    // Thêm function này vào blog.js (sau function addHeadingIds)

// Enhance tables với data-label cho responsive
function enhanceTables(html) {
  // Tạo một DOM parser tạm thời
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const tables = tempDiv.querySelectorAll('table');
  tables.forEach(table => {
    // Thêm class và wrapper
    table.classList.add('info-table');
    
    // Tạo wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    
    // Lấy headers cho data-label
    const headers = table.querySelectorAll('thead th, tr:first-child td');
    const headerTexts = Array.from(headers).map(th => th.textContent.trim());
    
    // Thêm data-label cho tất cả td trong tbody
    const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headerTexts[index]) {
          cell.setAttribute('data-label', headerTexts[index]);
        }
      });
    });
  });
  
  return tempDiv.innerHTML;
}

// Sửa lại function renderSinglePost
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
      const errorTemplate = document.getElementById('error-template');
      if (errorTemplate) {
        errorTemplate.style.display = 'block';
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
          errorMessage.textContent = `Không tìm thấy bài viết với slug: ${slug}`;
        }
      }
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
    const description = meta.description || truncate(firstParagraph(body), 160);
    
    // Update page metadata
    if (typeof updateMetaTags === 'function') {
      updateMetaTags(title, description, cover, window.location.href);
    }
    
    // Process shortcodes trước khi convert markdown
    const processedBody = processShortcodes(body);
    
    // Extract TOC
    const tocHeadings = extractTOC(processedBody);
    const tocHTML = generateTOCHTML(tocHeadings);
    
    // Convert to HTML và add heading IDs
    let html = DOMPurify.sanitize(marked.parse(processedBody));
    html = addHeadingIds(html);
    
    // *** THÊM BƯỚC NÀY: Enhance tables sau khi convert markdown ***
    html = enhanceTables(html);
    
    document.title = `${title} - Blog ANARO Coffee`;
    
    const coverImg = cover ? `
      <div class="post-cover-wrapper">
        <img class="post-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" 
             onerror="this.style.display='none'">
      </div>` : "";
    
    const readTime = Math.max(1, Math.ceil(body.length / 1000));
    const viewCount = meta.views || 0;
    
    root.innerHTML = `
      <article class="post-article" itemscope itemtype="https://schema.org/BlogPosting">
        ${coverImg}
        <header class="post-header">
          <h1 class="post-title" itemprop="headline">${escapeHtml(title)}</h1>
          <div class="post-meta">
            <time class="post-date" datetime="${meta.date || ''}" itemprop="datePublished">${date}</time>
            ${date ? '·' : ''} <span class="read-time">${readTime} phút đọc</span>
            ${viewCount > 0 ? `· <span class="view-count">${viewCount} lượt xem</span>` : ''}
            ${tags.length ? '·' : ''} <div class="post-tags">${tagChips(tags)}</div>
          </div>
        </header>
        
        <div class="post-content" itemprop="articleBody">
          ${tocHTML}
          ${html}
        </div>
        
        <footer class="post-footer">
          <div class="post-navigation">
            <a class="back-btn" href="blog.html">← Quay lại Blog</a>
          </div>
          
          <div class="post-sharing">
            <h4>Chia sẻ bài viết này:</h4>
            <div class="sharing-buttons">
              <button onclick="shareOnFacebook()" class="share-btn facebook">
                <i class="fab fa-facebook-f"></i> Facebook
              </button>
              <button onclick="shareOnTwitter()" class="share-btn twitter">
                <i class="fab fa-twitter"></i> Twitter
              </button>
              <button onclick="copyToClipboard()" class="share-btn copy">
                <i class="fas fa-link"></i> Sao chép link
              </button>
            </div>
          </div>
        </footer>
      </article>`;
    
    status.textContent = "";
    
    // Setup interactive features
    setupPostInteractivity();
    
    // Track page view
    console.log(`[Blog] Post viewed: ${title}`);
    
  } catch (e) {
    console.error('[Blog] Error:', e);
    status.textContent = "Không tải được bài viết.";
    
    if (typeof showError === 'function') {
      showError("Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại sau.");
    }
  }
}

// Cập nhật exports
window.Blog = { 
  renderBlogList, 
  renderSinglePost,
  allPosts: [],
  processShortcodes,
  extractTOC,
  generateTOCHTML,
  setupPostInteractivity,
  filterByTag,
  enhanceTables  // Thêm function mới
};

// Export utility functions
window.BlogUtils = {
  escapeHtml,
  formatDate,
  truncate,
  tagChips,
  cardHTML,
  slugFromName,
  postUrlFromSlug,
  enhanceTables  // Thêm function mới
};
    
    // Setup interactive features
    setupPostInteractivity();
    
    // Track page view
    console.log(`[Blog] Post viewed: ${title}`);
    
  } catch (e) {
    console.error('[Blog] Error:', e);
    status.textContent = "Không tải được bài viết.";
    
    if (typeof showError === 'function') {
      showError("Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại sau.");
    }
  }
}

// Export functions globally
window.Blog = { 
  renderBlogList, 
  renderSinglePost,
  allPosts: [],
  processShortcodes,
  extractTOC,
  generateTOCHTML,
  setupPostInteractivity,
  filterByTag
};

// Export utility functions
window.BlogUtils = {
  escapeHtml,
  formatDate,
  truncate,
  tagChips,
  cardHTML,
  slugFromName,
  postUrlFromSlug
};
