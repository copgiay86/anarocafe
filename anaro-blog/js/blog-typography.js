/**
 * ANARO BLOG - TABLE OF CONTENTS & TYPOGRAPHY SYSTEM
 * Lightweight JavaScript for TOC generation and reading experience
 */

(function() {
  'use strict';

  // Global interface for the blog typography system
  window.BlogTypography = {
    generateTOC: generateTOC,
    calculateReadingTime: calculateReadingTime,
    addAnchorLinks: addAnchorLinks,
    init: init
  };

  // Legacy interface for backward compatibility
  window.BlogTOC = {
    init: init,
    updateActive: updateActiveSection
  };

  let activeSection = null;
  let headings = [];
  let tocContainer = null;
  let tocList = null;
  let isInitialized = false;

  /**
   * Initialize the typography system
   */
  function init() {
    if (isInitialized) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    try {
      addAnchorLinks();
      generateTOC();
      setupScrollListener();
      setupMobileToggle();
      calculateAndDisplayReadingTime();
      
      isInitialized = true;
      console.log('Blog Typography System initialized successfully');
    } catch (error) {
      console.warn('Blog Typography System initialization failed:', error);
    }
  }

  /**
   * Add anchor links to all headings
   */
  function addAnchorLinks() {
    const headingSelectors = '.blog-h2, .blog-h3, .blog-h4, h2, h3, h4';
    const headingElements = document.querySelectorAll(headingSelectors);

    headingElements.forEach(function(heading, index) {
      // Generate ID if not present
      if (!heading.id) {
        const id = generateSlug(heading.textContent, index);
        heading.id = id;
      }

      // Add anchor link
      const anchor = document.createElement('a');
      anchor.href = '#' + heading.id;
      anchor.className = 'blog-heading-anchor';
      anchor.textContent = '#';
      anchor.setAttribute('aria-label', 'Link to ' + heading.textContent);
      anchor.title = 'Link to this section';

      heading.appendChild(anchor);

      // Add smooth scroll behavior
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        scrollToElement(heading);
        
        // Update URL without triggering page jump
        if (history.replaceState) {
          history.replaceState(null, null, anchor.href);
        }
      });
    });
  }

  /**
   * Generate table of contents
   */
  function generateTOC(container) {
    // Find or create TOC container
    tocContainer = container || document.querySelector('.blog-toc');
    
    if (!tocContainer) {
      // Try to create TOC automatically
      const firstHeading = document.querySelector('.blog-h1, h1');
      if (firstHeading) {
        tocContainer = createTOCElement();
        firstHeading.parentNode.insertBefore(tocContainer, firstHeading.nextSibling);
      } else {
        return false; // Can't create TOC without a place to put it
      }
    }

    // Find all headings
    headings = Array.from(document.querySelectorAll('.blog-h2, .blog-h3, .blog-h4, h2, h3, h4'))
      .filter(function(heading) {
        return heading.textContent.trim().length > 0;
      });

    if (headings.length === 0) {
      tocContainer.style.display = 'none';
      return false;
    }

    // Build TOC structure
    buildTOCStructure();
    
    return true;
  }

  /**
   * Create TOC element structure
   */
  function createTOCElement() {
    const toc = document.createElement('nav');
    toc.className = 'blog-toc';
    toc.setAttribute('aria-label', 'Table of contents');

    const title = document.createElement('div');
    title.className = 'blog-toc-title';
    title.innerHTML = 'Table of Contents <button class="blog-toc-toggle" aria-label="Toggle table of contents">☰</button>';

    const list = document.createElement('ul');
    list.className = 'blog-toc-list';

    toc.appendChild(title);
    toc.appendChild(list);

    return toc;
  }

  /**
   * Build TOC structure from headings
   */
  function buildTOCStructure() {
    tocList = tocContainer.querySelector('.blog-toc-list');
    if (!tocList) {
      const list = document.createElement('ul');
      list.className = 'blog-toc-list';
      tocContainer.appendChild(list);
      tocList = list;
    }

    // Clear existing items
    tocList.innerHTML = '';

    headings.forEach(function(heading, index) {
      const level = getHeadingLevel(heading);
      const listItem = document.createElement('li');
      listItem.className = 'blog-toc-item';
      listItem.setAttribute('data-level', level);

      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.className = 'blog-toc-link';
      link.textContent = heading.textContent.replace('#', '').trim();
      link.setAttribute('data-heading-id', heading.id);

      // Add click handler for smooth scrolling
      link.addEventListener('click', function(e) {
        e.preventDefault();
        scrollToElement(heading);
        updateActiveSection(heading.id);
        
        // Update URL
        if (history.replaceState) {
          history.replaceState(null, null, link.href);
        }
      });

      listItem.appendChild(link);
      tocList.appendChild(listItem);
    });

    // Set initial active section
    updateActiveSection();
  }

  /**
   * Get heading level (2, 3, or 4)
   */
  function getHeadingLevel(heading) {
    if (heading.classList.contains('blog-h2') || heading.tagName.toLowerCase() === 'h2') {
      return '2';
    } else if (heading.classList.contains('blog-h3') || heading.tagName.toLowerCase() === 'h3') {
      return '3';
    } else if (heading.classList.contains('blog-h4') || heading.tagName.toLowerCase() === 'h4') {
      return '4';
    }
    return '2'; // default
  }

  /**
   * Setup scroll listener for active section highlighting
   */
  function setupScrollListener() {
    let scrollTimeout;
    
    window.addEventListener('scroll', function() {
      // Throttle scroll events
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(function() {
        updateActiveSection();
      }, 10);
    });
  }

  /**
   * Update active section highlighting
   */
  function updateActiveSection(forceId) {
    if (!tocList || headings.length === 0) return;

    let currentId = forceId;
    
    if (!currentId) {
      // Find the current section based on scroll position
      const scrollPosition = window.scrollY + 100; // Offset for better UX
      
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading.offsetTop <= scrollPosition) {
          currentId = heading.id;
          break;
        }
      }
    }

    // Remove active class from all links
    const tocLinks = tocList.querySelectorAll('.blog-toc-link');
    tocLinks.forEach(function(link) {
      link.classList.remove('blog-toc-active');
    });

    // Add active class to current section
    if (currentId) {
      const activeLink = tocList.querySelector('[data-heading-id="' + currentId + '"]');
      if (activeLink) {
        activeLink.classList.add('blog-toc-active');
        activeSection = currentId;
      }
    }
  }

  /**
   * Setup mobile toggle functionality
   */
  function setupMobileToggle() {
    const toggle = document.querySelector('.blog-toc-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const tocList = document.querySelector('.blog-toc-list');
      if (tocList) {
        tocList.classList.toggle('blog-toc-expanded');
        
        // Update aria-expanded
        const isExpanded = tocList.classList.contains('blog-toc-expanded');
        toggle.setAttribute('aria-expanded', isExpanded);
        
        // Update button text
        toggle.textContent = isExpanded ? '✕' : '☰';
      }
    });
  }

  /**
   * Calculate reading time for content
   */
  function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    let text = content;
    
    if (!text) {
      // Get text content from main content area
      const contentArea = document.querySelector('.blog-container, main, article');
      if (contentArea) {
        text = contentArea.textContent || contentArea.innerText;
      } else {
        text = document.body.textContent || document.body.innerText;
      }
    }
    
    if (typeof text !== 'string') {
      return '1 min read';
    }
    
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return minutes + ' min read';
  }

  /**
   * Calculate and display reading time
   */
  function calculateAndDisplayReadingTime() {
    const readingTimeElements = document.querySelectorAll('.blog-reading-time');
    
    if (readingTimeElements.length > 0) {
      const readingTime = calculateReadingTime();
      readingTimeElements.forEach(function(element) {
        element.textContent = readingTime;
      });
    }
  }

  /**
   * Smooth scroll to element
   */
  function scrollToElement(element) {
    if (!element) return;
    
    const offset = 20; // Small offset from top
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Generate URL-friendly slug from text
   */
  function generateSlug(text, index) {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 50); // Limit length
    
    return slug || 'heading-' + index;
  }

  /**
   * Utility function to check if element is in viewport
   */
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Handle hash changes (for direct navigation to sections)
   */
  function handleHashChange() {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        setTimeout(function() {
          scrollToElement(target);
          updateActiveSection(target.id);
        }, 100);
      }
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);

  // Handle initial hash on page load
  window.addEventListener('load', function() {
    if (window.location.hash) {
      handleHashChange();
    }
  });

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
