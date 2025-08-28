/**
 * ANARO COFFEE BLOG - PRODUCT INTEGRATION SYSTEM
 * Dependencies: blog-config.css, blog-components.css
 */

// Product data structure (extracted from index-cart.html)
const ANARO_PRODUCTS = [
  {
    id: 'arabica-cau-dat',
    category: 'light',
    categoryName: 'ÊM NHẸ – THANH',
    name: 'Arabica Cầu Đất',
    bestFor: 'Người yêu hương vị trái cây, uống nhẹ nhàng',
    stats: { strength: 2, caffeine: 2, roast: 2 },
    methods: { phin: 2, espresso: 2, pour: 2 },
    price: { '250g': '100.000đ', '500g': '210.000đ', '1kg': '360.000đ' },
    description: 'Arabica Cầu Đất với hương vị trái cây tự nhiên, độ chua nhẹ và vị ngọt thanh thoát',
    image: 'images/arabica-cau-dat.jpg'
  },
  {
    id: 'arabica-da-lat',
    category: 'light',
    categoryName: 'ÊM NHẸ – THANH',
    name: 'Arabica Đà Lạt',
    bestFor: 'Hương vị cân bằng, classic và thanh thoát',
    stats: { strength: 2, caffeine: 2, roast: 2 },
    methods: { phin: 3, espresso: 2, pour: 3 },
    price: { '250g': '90.000đ', '500g': '195.000đ', '1kg': '330.000đ' },
    description: 'Arabica Đà Lạt với hương vị cân bằng, thanh thoát và dễ uống',
    image: 'images/arabica-da-lat.jpg'
  },
  {
    id: 'blend-3',
    category: 'light',
    categoryName: 'ÊM NHẸ – THANH',
    name: 'Blend Số 3 (A Đà Lạt 50% · R 50%)',
    bestFor: 'Cầu nối giữa nhẹ và đậm; cà phê sữa đá hàng ngày',
    stats: { strength: 3, caffeine: 3, roast: 3 },
    methods: { phin: 3, espresso: 2, pour: 2 },
    price: { '250g': '85.000đ', '500g': '181.250đ', '1kg': '302.500đ' },
    description: 'Blend cân bằng giữa Arabica Đà Lạt và Robusta, phù hợp pha sữa',
    image: 'images/blend-3.jpg'
  },
  {
    id: 'blend-9',
    category: 'light',
    categoryName: 'ÊM NHẸ – THANH',
    name: 'Blend Số 9 (A Cầu Đất 50% · R Honey 50%)',
    bestFor: 'Đậm nhưng hậu ngọt; hợp sữa đá/bạc xỉu',
    stats: { strength: 3, caffeine: 3, roast: 2 },
    methods: { phin: 3, espresso: 3, pour: 1 },
    price: { '250g': '95.000đ', '500g': '201.250đ', '1kg': '342.500đ' },
    description: 'Blend đặc biệt với Arabica Cầu Đất và Robusta Honey, hậu ngọt tự nhiên',
    image: 'images/blend-9.jpg'
  },
  {
    id: 'blend-2',
    category: 'balanced',
    categoryName: 'CÂN BẰNG – TRÒN VỊ',
    name: 'Blend Số 2 (A Đà Lạt 30% · R 70%)',
    bestFor: 'Ly sữa có mùi Arabica rõ, body & caffeine tốt',
    stats: { strength: 4, caffeine: 4, roast: 4 },
    methods: { phin: 3, espresso: 3, pour: 2 },
    price: { '250g': '80.000đ', '500g': '173.750đ', '1kg': '287.500đ' },
    description: 'Blend cân bằng với 30% Arabica Đà Lạt và 70% Robusta, body đầy đặn',
    image: 'images/blend-2.jpg'
  },
  {
    id: 'blend-10',
    category: 'balanced',
    categoryName: 'CÂN BẰNG – TRÒN VỊ',
    name: 'Blend Số 10 (A Cầu Đất 30% · R Honey 70%)',
    bestFor: 'Đậm – tròn, hậu ngọt hơn nhờ Robusta Honey',
    stats: { strength: 4, caffeine: 4, roast: 4 },
    methods: { phin: 3, espresso: 3, pour: 2 },
    price: { '250g': '93.000đ', '500g': '197.750đ', '1kg': '335.500đ' },
    description: 'Blend cao cấp với Arabica Cầu Đất và Robusta Honey, vị tròn đầy',
    image: 'images/blend-10.jpg'
  },
  {
    id: 'tam-bo-6',
    category: 'balanced',
    categoryName: 'CÂN BẰNG – TRÒN VỊ',
    name: 'Tẩm bơ Số 6 (A Đà Lạt 30% · R 70%)',
    bestFor: 'Chỉ dành cho pha phin',
    stats: { strength: 4, caffeine: 4, roast: 3 },
    methods: { phin: 3 },
    price: { '250g': '85.000đ', '500g': '178.750đ', '1kg': '297.500đ' },
    description: 'Cà phê tẩm bơ truyền thống, chỉ dành cho pha phin',
    image: 'images/tam-bo-6.jpg'
  },
  {
    id: 'tam-bo-7',
    category: 'balanced',
    categoryName: 'CÂN BẰNG – TRÒN VỊ',
    name: 'Tẩm bơ Số 7 (A Đà Lạt 50% · R 50%)',
    bestFor: 'Chỉ dành cho pha phin',
    stats: { strength: 3, caffeine: 3, roast: 3 },
    methods: { phin: 3 },
    price: { '250g': '90.000đ', '500g': '186.250đ', '1kg': '312.500đ' },
    description: 'Cà phê tẩm bơ cân bằng với tỷ lệ 50-50 Arabica và Robusta',
    image: 'images/tam-bo-7.jpg'
  },
  {
    id: 'robusta-honey',
    category: 'strong',
    categoryName: 'ĐẬM MẠNH – HẬU DÀI',
    name: 'Robusta Honey',
    bestFor: 'Đậm nhưng ngọt hậu; hợp sữa',
    stats: { strength: 4, caffeine: 4, roast: 4 },
    methods: { phin: 3, espresso: 2 },
    price: { '250g': '89.000đ', '500g': '192.500đ', '1kg': '325.000đ' },
    description: 'Robusta chế biến honey process, đậm đà nhưng có độ ngọt hậu tự nhiên',
    image: 'images/robusta-honey.jpg'
  },
  {
    id: 'robusta-moc',
    category: 'strong',
    categoryName: 'ĐẬM MẠNH – HẬU DÀI',
    name: 'Robusta Mộc',
    bestFor: 'Đen nóng/đen đá rất đậm, mộc, hậu dài',
    stats: { strength: 5, caffeine: 5, roast: 4 },
    methods: { phin: 3, espresso: 3 },
    price: { '250g': '75.000đ', '500g': '167.500đ', '1kg': '275.000đ' },
    description: 'Robusta nguyên chất, vị đậm mạnh truyền thống, hậu dài',
    image: 'images/robusta-moc.jpg'
  },
  {
    id: 'culi-moc',
    category: 'strong',
    categoryName: 'ĐẬM MẠNH – HẬU DÀI',
    name: 'Culi Mộc',
    bestFor: 'Đậm mượt, hậu dài',
    stats: { strength: 5, caffeine: 5, roast: 4 },
    methods: { phin: 3, espresso: 3 },
    price: { '250g': '75.000đ', '500g': '167.500đ', '1kg': '275.000đ' },
    description: 'Culi Robusta cao cấp, hạt to đồng đều, vị đậm mượt',
    image: 'images/culi-moc.jpg'
  }
];

// Main Blog Products API
window.BlogProducts = {
  
  // Cache for performance
  _cache: {
    products: null,
    lastUpdated: null
  },

  /**
   * Initialize the product system
   */
  init: function() {
    this._cache.products = ANARO_PRODUCTS;
    this._cache.lastUpdated = new Date();
    this._initEventListeners();
    console.log('BlogProducts initialized with', ANARO_PRODUCTS.length, 'products');
  },

  /**
   * Extract products from index-cart.html (alternative method)
   */
  extractProducts: async function() {
    try {
      const response = await fetch('index-cart.html');
      const html = await response.text();
      
      // Parse HTML and extract product data from JavaScript
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const scripts = doc.querySelectorAll('script');
      
      let products = [];
      for (let script of scripts) {
        const content = script.textContent;
        if (content.includes('products') && content.includes('arabica')) {
          // Extract products array from JavaScript
          const match = content.match(/products\s*=\s*(\[[\s\S]*?\]);/);
          if (match) {
            products = JSON.parse(match[1]);
            break;
          }
        }
      }
      
      this._cache.products = products.length ? products : ANARO_PRODUCTS;
      this._cache.lastUpdated = new Date();
      return this._cache.products;
    } catch (error) {
      console.warn('Failed to extract from index-cart.html, using fallback data:', error);
      this._cache.products = ANARO_PRODUCTS;
      return ANARO_PRODUCTS;
    }
  },

  /**
   * Get all products
   */
  getProducts: function() {
    return this._cache.products || ANARO_PRODUCTS;
  },

  /**
   * Find product by ID
   */
  findProduct: function(productId) {
    const products = this.getProducts();
    return products.find(p => p.id === productId);
  },

  /**
   * Filter products by criteria
   */
  filterProducts: function(criteria = {}) {
    const products = this.getProducts();
    return products.filter(product => {
      if (criteria.category && product.category !== criteria.category) return false;
      if (criteria.strength && !criteria.strength.includes(product.stats.strength)) return false;
      if (criteria.methods && !Object.keys(criteria.methods).some(method => product.methods[method] >= (criteria.methods[method] || 2))) return false;
      return true;
    });
  },

  /**
   * Render individual product CTA
   */
  renderProductCTA: function(productId, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }

    const product = this.findProduct(productId);
    if (!product) {
      container.innerHTML = '<div class="blog-error">Sản phẩm không tồn tại</div>';
      return;
    }

    const opts = {
      showPrice: true,
      showDescription: true,
      showMethods: true,
      ctaText: 'Mua ngay',
      learnText: 'Tìm hiểu thêm',
      ...options
    };

    container.innerHTML = this._generateProductCTAHTML(product, opts);
    this._attachProductEvents(container);
  },

  /**
   * Render related products by category
   */
  renderRelatedProducts: function(category, containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }

    const relatedProducts = this.filterProducts({ category }).slice(0, limit);
    
    if (relatedProducts.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <h3 class="blog-related-products-title">Sản phẩm liên quan</h3>
      <div class="blog-related-products-grid">
        ${relatedProducts.map(product => this._generateProductCardHTML(product)).join('')}
      </div>
    `;
    
    this._attachProductEvents(container);
  },

  /**
   * Render product recommendations
   */
  renderRecommendations: function(productIds, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }

    const products = productIds.map(id => this.findProduct(id)).filter(Boolean);
    
    if (products.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = `
      <section class="blog-recommendations">
        <h3 class="blog-recommendations-title">Sản phẩm đề xuất</h3>
        <div class="blog-recommendations-grid">
          ${products.map(product => this._generateProductCardHTML(product)).join('')}
        </div>
      </section>
    `;
    
    this._attachProductEvents(container);
  },

  /**
   * Add to cart integration
   */
  addToCart: function(productId, options = {}) {
    const product = this.findProduct(productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    const cartData = {
      id: productId,
      name: product.name,
      size: options.size || '250g',
      grind: options.grind || 'whole',
      quantity: options.quantity || 1,
      price: product.price[options.size || '250g']
    };

    // Try to integrate with existing cart system
    if (window.addToCart && typeof window.addToCart === 'function') {
      window.addToCart(cartData);
    } else if (window.cart && window.cart.add) {
      window.cart.add(cartData);
    } else {
      // Fallback: store in localStorage (for demo)
      const cart = JSON.parse(localStorage.getItem('anaro_cart') || '[]');
      cart.push(cartData);
      localStorage.setItem('anaro_cart', JSON.stringify(cart));
      this._showCartNotification(product.name);
    }
  },

  // Private methods
  _generateProductCTAHTML: function(product, options) {
    const dotsHTML = this._generateDotsHTML(product.stats.strength);
    const methodsHTML = options.showMethods ? this._generateMethodsHTML(product.methods) : '';
    const priceHTML = options.showPrice ? `<div class="blog-product-price">${product.price['250g']}</div>` : '';
    
    return `
      <div class="blog-product-cta" data-product-id="${product.id}">
        <div class="blog-product-image">
          <img src="${product.image}" alt="${product.name}" class="blog-image" />
        </div>
        <div class="blog-product-content">
          <div class="blog-product-category">${product.categoryName}</div>
          <h4 class="blog-product-name">${product.name}</h4>
          ${options.showDescription ? `<p class="blog-product-description">${product.description}</p>` : ''}
          <div class="blog-product-best">${product.bestFor}</div>
          <div class="blog-product-rating">
            <span>Độ đậm:</span> ${dotsHTML}
          </div>
          ${methodsHTML}
          ${priceHTML}
          <div class="blog-product-actions">
            <button class="blog-btn blog-btn-primary blog-product-buy-btn" data-action="buy" data-product-id="${product.id}">
              ${options.ctaText}
            </button>
            <button class="blog-btn blog-btn-outline blog-product-learn-btn" data-action="learn" data-product-id="${product.id}">
              ${options.learnText}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  _generateProductCardHTML: function(product) {
    const dotsHTML = this._generateDotsHTML(product.stats.strength);
    const methodsHTML = this._generateMethodsHTML(product.methods);
    
    return `
      <div class="blog-product-card" data-product-id="${product.id}">
        <div class="blog-product-image">
          <img src="${product.image}" alt="${product.name}" class="blog-image" />
        </div>
        <div class="blog-product-info">
          <div class="blog-product-category">${product.categoryName}</div>
          <h4 class="blog-product-name">${product.name}</h4>
          <p class="blog-product-best">${product.bestFor}</p>
          <div class="blog-product-rating">
            <span>Độ đậm:</span> ${dotsHTML}
          </div>
          ${methodsHTML}
          <div class="blog-product-price">${product.price['250g']}</div>
          <button class="blog-btn blog-btn-primary blog-product-buy-btn" data-action="buy" data-product-id="${product.id}">
            Mua ngay
          </button>
        </div>
      </div>
    `;
  },

  _generateDotsHTML: function(strength) {
    const dots = [];
    for (let i = 1; i <= 5; i++) {
      dots.push(`<span class="blog-rating-dot ${i <= strength ? 'active' : ''}"></span>`);
    }
    return dots.join('');
  },

  _generateMethodsHTML: function(methods) {
    const methodNames = { phin: 'Phin', espresso: 'Espresso', pour: 'Pour Over' };
    const methodsArray = [];
    
    Object.entries(methods).forEach(([method, rating]) => {
      if (rating >= 2) {
        const stars = '★'.repeat(rating);
        methodsArray.push(`<span class="blog-method-badge">${methodNames[method]} ${stars}</span>`);
      }
    });
    
    return methodsArray.length ? `<div class="blog-product-methods">${methodsArray.join('')}</div>` : '';
  },

  _attachProductEvents: function(container) {
    const buyButtons = container.querySelectorAll('[data-action="buy"]');
    const learnButtons = container.querySelectorAll('[data-action="learn"]');
    
    buyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.productId;
        this.addToCart(productId);
      });
    });
    
    learnButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.productId;
        // Navigate to product page or show modal
        window.location.href = `#product-${productId}`;
      });
    });
  },

  _initEventListeners: function() {
    // Auto-render products with data attributes
    document.addEventListener('DOMContentLoaded', () => {
      const autoRenderElements = document.querySelectorAll('[data-blog-product]');
      autoRenderElements.forEach(el => {
        const productId = el.dataset.blogProduct;
        if (productId) {
          this.renderProductCTA(productId, el.id);
        }
      });
    });
  },

  _showCartNotification: function(productName) {
    const notification = document.createElement('div');
    notification.className = 'blog-cart-notification';
    notification.innerHTML = `
      <div class="blog-cart-notification-content">
        <span class="blog-cart-icon">🛒</span>
        <span>Đã thêm "${productName}" vào giỏ hàng</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BlogProducts.init());
} else {
  BlogProducts.init();
}
