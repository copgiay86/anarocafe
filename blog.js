/* ===== UNIFIED BLOG CSS - Improved Version ===== */
/* Thay thế blog.css hiện tại với version cải tiến */

:root {
  /* Colors */
  --bg: #f6efe9;
  --text: #2a221d;
  --panel: #a47148;
  --ink: #F8EBDD;
  --border: #e9d7c5;
  --brand: #6b3f25;
  --muted: #806a5b;
  --white: #fff;
  
  /* New semantic colors */
  --success: #27ae60;
  --warning: #f39c12;
  --error: #e74c3c;
  --info: #3498db;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 15px 35px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}

/* ===== RESET & BASE ===== */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  background: linear-gradient(180deg, var(--white) 0%, var(--bg) 50%, #f0e2d6 100%);
  line-height: 1.6;
  font-size: 16px;
  overflow-x: hidden;
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* ===== LAYOUT COMPONENTS ===== */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

/* ===== HEADER ===== */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  transition: var(--transition-fast);
}

.site-header.scrolled {
  box-shadow: var(--shadow-md);
}

.site-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  min-height: 64px;
}

.brand {
  font-weight: 900;
  color: var(--brand);
  text-decoration: none;
  letter-spacing: 0.5px;
  font-size: 1.2rem;
  transition: var(--transition-fast);
}

.brand:hover {
  transform: scale(1.02);
}

.site-nav {
  display: flex;
  gap: var(--space-lg);
}

.site-nav a {
  color: var(--brand);
  text-decoration: none;
  font-weight: 600;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  position: relative;
}

.site-nav a:hover,
.site-nav a.active {
  background: var(--ink);
  color: var(--brand);
}

.site-nav a.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--brand);
  border-radius: var(--radius-full);
}

/* Mobile navigation */
@media (max-width: 768px) {
  .site-nav {
    gap: var(--space-md);
  }
  
  .site-nav a {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.9rem;
  }
}

/* ===== MAIN CONTENT ===== */
.main {
  padding: var(--space-xl) 0;
  min-height: 60vh;
}

/* ===== BLOG HERO ===== */
.blog-hero {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.page-title {
  margin: 0 0 var(--space-md) 0;
  color: var(--brand);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
}

.blog-intro {
  color: var(--muted);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ===== CONTROLS & FILTERS ===== */
.blog-controls {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
  padding: var(--space-lg);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-box::before {
  content: '🔍';
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  font-size: 1rem;
}

#search-input {
  width: 100%;
  padding: var(--space-md) var(--space-md) var(--space-md) 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--white);
  transition: var(--transition-fast);
}

#search-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(107, 63, 37, 0.1);
}

.filter-tags {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.filter-tag {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--brand);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition-fast);
  user-select: none;
}

.filter-tag:hover {
  background: var(--ink);
  transform: translateY(-1px);
}

.filter-tag.active {
  background: var(--brand);
  color: var(--white);
  box-shadow: var(--shadow-md);
}

/* ===== STATS ===== */
.blog-stats {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--ink) 0%, var(--border) 100%);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--muted);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.stat-item strong {
  color: var(--brand);
}

.search-result {
  color: var(--brand);
  font-weight: 600;
}

/* ===== BLOG GRID ===== */
.blog-grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  margin-bottom: var(--space-2xl);
  
  /* Masonry-like layout on larger screens */
  grid-auto-rows: max-content;
}

@media (min-width: 768px) {
  .blog-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .blog-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ===== BLOG CARDS ===== */
.blog-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
  position: relative;
  height: fit-content;
}

.blog-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-xl);
  border-color: var(--brand);
}

.car
