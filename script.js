/*
 * JavaScript for the ANARO Coffee catalog page.
 *
 * This script loads product data from products.json, renders the catalog
 * dynamically and sets up filter buttons and mobile navigation.  It also
 * injects structured data for each product into the head of the document
 * to improve SEO.  Images defined in products.json should exist under
 * the "images" directory; each product card will display its image with
 * a descriptive alt attribute.
 */

// Global state storing the loaded products
let products = [];

/**
 * Fetch product data from the JSON file.
 * Returns a promise that resolves to an array of product objects.
 */
async function fetchProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) {
      throw new Error('Không thể tải danh sách sản phẩm');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Create a rating block consisting of filled and empty dots with accessible labels.
 * @param {number} value - number of filled dots
 * @param {number} max - total number of dots
 * @param {string} label - label for screen reader
 */
function createDotRating(value, max = 5, label = 'Điểm') {
  const ratingId = `rating-${Math.random().toString(36).substr(2, 9)}`;
  const dots = Array.from({ length: max }, (_, i) => {
    const cls = i < value ? 'dot filled' : 'dot';
    return `<span class="${cls}" aria-hidden="true"></span>`;
  }).join('');
  return `
    <span class="rating" role="img" aria-labelledby="${ratingId}" aria-describedby="${ratingId}-desc">
      ${dots}
    </span>
    <span id="${ratingId}" class="sr-only">${label}: ${value}/${max}</span>
    <span id="${ratingId}-desc" class="sr-only">Đánh giá bằng chấm tròn từ 1 đến ${max}</span>
  `;
}

/**
 * Build method stars (Phin/Espresso/Pour over) for each product.
 * @param {Object} methods - map of method name to rating (1-3)
 */
function createMethodBlock(methods) {
  const methodMap = {
    phin: { icon: '', name: 'Phin' },
    espresso: { icon: '☕', name: 'Espresso' },
    pour: { icon: '', name: 'Pour Over' }
  };
  return Object.entries(methods)
    .filter(([, rating]) => rating > 0)
    .map(([key, rating]) => {
      const { icon, name } = methodMap[key] || { icon: '', name: key };
      const stars = '★'.repeat(rating) + '☆'.repeat(Math.max(3 - rating, 0));
      const methodId = `method-${Math.random().toString(36).substr(2, 9)}`;
      return `
        <div class="method" role="img" aria-labelledby="${methodId}">
          <span aria-hidden="true">${icon}</span>
          <span>${name}</span>
          <span aria-hidden="true">${stars}</span>
          <span id="${methodId}" class="sr-only">${name}: ${rating}/3 sao</span>
        </div>
      `;
    })
    .join('');
}

/**
 * Build the HTML for a single product card.
 * @param {Object} product - product data from JSON
 */
function createProductCard(product) {
  const cardId = `card-${product.id}`;
  // Build price chips
  const priceChips = Object.entries(product.price)
    .map(([size, price]) => `<span class="chip" role="listitem" aria-label="${size} giá ${price}"><span>${size}</span><small>${price}</small></span>`)
    .join('');
  return `
    <article class="card" id="${product.id}" aria-labelledby="${cardId}-title" aria-describedby="${cardId}-desc">
      <header class="card-header">
        <img src="${product.image}" alt="${product.name}" style="width:100%; border-radius: var(--radius) var(--radius) 0 0;">
        <h3 id="${cardId}-title" class="card-title">${product.name}</h3>
      </header>
      <p id="${cardId}-desc" class="best-for">Thích hợp nhất cho: ${product.bestFor}</p>
      <div class="stats" role="group" aria-label="Thông số sản phẩm">
        <div>☕ Độ đậm: ${createDotRating(product.stats.strength, 5, 'Độ đậm')}</div>
        <div>⏰ Caffeine: ${createDotRating(product.stats.caffeine, 5, 'Hàm lượng caffeine')}</div>
        <div>Mức rang: ${createDotRating(product.stats.roast, 5, 'Mức độ rang')}</div>
      </div>
      <div class="methods" role="group" aria-label="Phương pháp pha phù hợp">
        ${createMethodBlock(product.methods)}
      </div>
      <div class="pack">
        <strong>Đóng gói &amp; giá:</strong>
        <div class="chips" role="list" aria-label="Tùy chọn kích cỡ và giá">
          ${priceChips}
        </div>
      </div>
      <div class="actions">
        <a class="btn btn-primary" href="index-cart.html#${product.id}" aria-describedby="${cardId}-buy-desc">Mua ngay</a>
        <span id="${cardId}-buy-desc" class="sr-only">Mua ${product.name} với các tùy chọn kích cỡ khác nhau</span>
        <a class="btn" href="faq.html" aria-describedby="${cardId}-faq-desc">Câu hỏi</a>
        <span id="${cardId}-faq-desc" class="sr-only">Xem câu hỏi thường gặp về ${product.name}</span>
      </div>
      <div class="card-footer">ANARO Coffee Guide · © 2025</div>
    </article>
  `;
}

/**
 * Render the catalog into the DOM.  Groups products by category name and
 * updates the aria-label on the catalog to reflect the number of products.
 * @param {string} filterCategory - the category to filter by ("all" for none)
 */
function renderCatalog(filterCategory = 'all') {
  const catalogEl = document.getElementById('catalog');
  if (!catalogEl) return;
  // Filter products by category
  const filtered = filterCategory === 'all' ? products : products.filter(p => p.category === filterCategory);
  // Group by categoryName
  const groups = {};
  filtered.forEach(prod => {
    if (!groups[prod.categoryName]) {
      groups[prod.categoryName] = [];
    }
    groups[prod.categoryName].push(prod);
  });
  // Build HTML
  const html = Object.entries(groups)
    .map(([categoryName, list]) => {
      const sectionId = `section-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const items = list.map(prod => `<div role="listitem">${createProductCard(prod)}</div>`).join('');
      return `
        <section class="category" aria-labelledby="${sectionId}-title">
          <h2 id="${sectionId}-title" class="category-title">${categoryName}</h2>
          <div class="grid" role="list" aria-label="Danh sách sản phẩm ${categoryName}">
            ${items}
          </div>
        </section>
      `;
    })
    .join('');
  catalogEl.innerHTML = html;
  catalogEl.setAttribute('aria-label', `Hiển thị ${filtered.length} sản phẩm`);
}

/**
 * Insert structured data for each product into the document head.  Search
 * engines can read this to better understand each offer.  This function
 * should be called after products are loaded.
 */
function injectProductStructuredData() {
  const head = document.head;
  products.forEach(prod => {
    const offer = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': prod.name,
      'description': prod.description,
      'image': `${window.location.origin}/${prod.image}`,
      'offers': {
        '@type': 'Offer',
        'priceCurrency': 'VND',
        'price': prod.price['250g'].replace(/\D/g, ''),
        'url': `${window.location.origin}/index-cart.html#${prod.id}`,
        'availability': 'http://schema.org/InStock'
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(offer);
    head.appendChild(script);
  });
}

/**
 * Set up event handlers on filter buttons.  When a button is clicked, update
 * its pressed state and rerender the catalog with the selected category.
 */
function initializeFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // reset all pressed states
      buttons.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const category = btn.dataset.category;
      renderCatalog(category);
      // move focus to the catalog so screen readers announce updated content
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) catalogEl.focus();
    });
    // keyboard support: space or enter triggers click
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/**
 * Initialize the mobile navigation menu.  Adds listeners to open/close
 * the menu and trap focus when open.
 */
function initializeMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.getElementById('menuPanel');
  if (!toggle || !panel) return;

  const openMenu = () => {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    const first = panel.querySelector('button, a');
    if (first) first.focus();
  };
  const closeMenu = () => {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  };
  toggle.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.contains('open') ? closeMenu() : openMenu();
  });
  toggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });
  panel.addEventListener('click', e => {
    if (e.target.closest('a, .filter-btn')) {
      setTimeout(closeMenu, 100);
    }
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== toggle) {
      closeMenu();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closeMenu();
    }
  });
  panel.addEventListener('keydown', e => {
    if (e.key === 'Tab' && panel.classList.contains('open')) {
      const focusable = panel.querySelectorAll('button:not([disabled]), a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  products = await fetchProducts();
  if (products.length > 0) {
    // Inject product structured data for each product
    injectProductStructuredData();
  }
  // Render initial catalog and set up UI
  renderCatalog();
  initializeFilters();
  initializeMobileNav();
  // Announce to screen readers that the page has loaded
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `Trang web đã tải hoàn tất. Có ${products.length} sản phẩm cà phê.`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1500);
});