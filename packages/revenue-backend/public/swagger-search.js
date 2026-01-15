/**
 * Custom Search Functionality for Swagger UI
 * Searches through API endpoints by path, method, summary, and description
 */

(function() {
  'use strict';

  // Wait for Swagger UI to load
  function initializeSearch() {
    const infoContainer = document.querySelector('.swagger-ui .information-container');
    if (!infoContainer) {
      setTimeout(initializeSearch, 100);
      return;
    }

    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'swagger-search-container';
    searchContainer.style.cssText = `
      margin: 20px 0;
      padding: 10px;
      background: #fafafa;
      border-radius: 4px;
      border: 1px solid #d9d9d9;
    `;

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search endpoints by path, method, or description...';
    searchInput.className = 'swagger-search-input';
    searchInput.style.cssText = `
      width: 85%;
      padding: 10px 15px;
      font-size: 14px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      box-sizing: border-box;
      outline: none;
      display: block;
      margin: 0 auto;
    `;

    // Create results counter
    const resultsCounter = document.createElement('div');
    resultsCounter.className = 'swagger-search-results';
    resultsCounter.style.cssText = `
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    `;

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(resultsCounter);

    // Insert after info container
    infoContainer.parentNode.insertBefore(searchContainer, infoContainer.nextSibling);

    // Search functionality
    function performSearch(searchTerm) {
      const operations = document.querySelectorAll('.swagger-ui .opblock');
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      let visibleCount = 0;
      let totalCount = operations.length;

      if (!lowerSearchTerm) {
        // Show all if search is empty
        operations.forEach(op => {
          op.style.display = '';
          const tagSection = op.closest('.opblock-tag-section');
          if (tagSection) tagSection.style.display = '';
        });
        resultsCounter.textContent = '';
        return;
      }

      operations.forEach(op => {
        // Get operation details
        const path = op.querySelector('.opblock-summary-path')?.textContent?.toLowerCase() || '';
        const method = op.querySelector('.opblock-summary-method')?.textContent?.toLowerCase() || '';
        const summary = op.querySelector('.opblock-summary-description')?.textContent?.toLowerCase() || '';

        // Try to get description from the operation (when expanded)
        const description = op.querySelector('.opblock-description-wrapper p')?.textContent?.toLowerCase() || '';

        // Search in all fields
        const matches =
          path.includes(lowerSearchTerm) ||
          method.includes(lowerSearchTerm) ||
          summary.includes(lowerSearchTerm) ||
          description.includes(lowerSearchTerm);

        if (matches) {
          op.style.display = '';
          visibleCount++;
          // Show parent tag section
          const tagSection = op.closest('.opblock-tag-section');
          if (tagSection) tagSection.style.display = '';
        } else {
          op.style.display = 'none';
        }
      });

      // Hide empty tag sections
      const tagSections = document.querySelectorAll('.swagger-ui .opblock-tag-section');
      tagSections.forEach(section => {
        const visibleOps = Array.from(section.querySelectorAll('.opblock')).filter(
          op => op.style.display !== 'none'
        );
        section.style.display = visibleOps.length > 0 ? '' : 'none';
      });

      // Update results counter
      resultsCounter.textContent = visibleCount === totalCount
        ? `Showing all ${totalCount} endpoints`
        : `Found ${visibleCount} of ${totalCount} endpoints`;

      if (visibleCount === 0) {
        resultsCounter.style.color = '#ff6b6b';
        resultsCounter.textContent = 'No endpoints found matching your search';
      } else {
        resultsCounter.style.color = '#666';
      }
    }

    // Debounce search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
      }, 150);
    });

    // Focus search input with Ctrl+K or Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
      // Clear search with Escape
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        performSearch('');
      }
    });

    // Highlight search input on focus
    searchInput.addEventListener('focus', () => {
      searchInput.style.borderColor = '#3b99fc';
      searchInput.style.boxShadow = '0 0 0 2px rgba(59, 153, 252, 0.1)';
    });

    searchInput.addEventListener('blur', () => {
      searchInput.style.borderColor = '#d9d9d9';
      searchInput.style.boxShadow = 'none';
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
  } else {
    initializeSearch();
  }
})();
