/**
 * Search Feature Module — Hao Blog
 * Fullscreen search overlay with debounced live results
 */
(function () {
    // Create search overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    overlay.innerHTML = `
    <div class="search-modal">
      <div class="search-header">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" placeholder="Tìm kiếm bài viết..." autocomplete="off" autofocus>
        </div>
        <button class="search-close" id="searchClose">✕</button>
      </div>
      <div class="search-results" id="searchResults">
        <div class="search-hint">Nhập từ khóa để tìm kiếm bài viết...</div>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
    #searchOverlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      animation: fadeIn 0.2s ease;
    }
    #searchOverlay.active { display: flex; }

    .search-modal {
      background: var(--color-white, #fff);
      border: 3px solid var(--color-black, #1F2937);
      border-radius: 20px;
      box-shadow: 8px 8px 0px var(--color-black, #1F2937);
      width: 90%;
      max-width: 600px;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 2px solid var(--color-black, #1F2937);
    }

    .search-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-icon { font-size: 1.2rem; }

    #searchInput {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1.1rem;
      font-family: var(--font-body, 'DM Sans', sans-serif);
      background: transparent;
      color: var(--color-black, #1F2937);
    }

    #searchInput::placeholder { color: #9ca3af; }

    .search-close {
      width: 36px;
      height: 36px;
      border: 2px solid var(--color-black, #1F2937);
      border-radius: 10px;
      background: var(--color-gray-light, #F3F4F6);
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .search-close:hover {
      background: var(--color-coral, #FDA4AF);
    }

    .search-results {
      overflow-y: auto;
      padding: 12px 20px;
      flex: 1;
    }

    .search-hint {
      text-align: center;
      color: #9ca3af;
      padding: 40px 0;
      font-size: 0.95rem;
    }

    .search-result-item {
      display: flex;
      gap: 14px;
      padding: 14px 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
      text-decoration: none;
      color: var(--color-black, #1F2937);
      align-items: flex-start;
    }
    .search-result-item:hover {
      background: rgba(34, 197, 94, 0.08);
    }

    .search-result-thumb {
      width: 64px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid var(--color-black, #1F2937);
      flex-shrink: 0;
      background: var(--color-primary, #22C55E);
    }

    .search-result-info {
      flex: 1;
      min-width: 0;
    }

    .search-result-title {
      font-family: var(--font-heading, 'Space Grotesk', sans-serif);
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .search-result-excerpt {
      font-size: 0.8rem;
      color: #6B7280;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .search-result-meta {
      font-size: 0.7rem;
      color: #9ca3af;
      margin-top: 4px;
    }

    .search-no-results {
      text-align: center;
      padding: 40px 0;
      color: #6B7280;
    }
    .search-no-results span { font-size: 2rem; display: block; margin-bottom: 8px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Search trigger button in header */
    .search-trigger {
      width: 36px;
      height: 36px;
      border: 2px solid var(--color-black, #1F2937);
      border-radius: 10px;
      background: var(--color-white, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      box-shadow: 2px 2px 0px var(--color-black, #1F2937);
      transition: all 0.15s ease;
    }
    .search-trigger:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0px var(--color-black, #1F2937);
      background: var(--color-primary, #22C55E);
      color: white;
    }
  `;
    document.head.appendChild(style);

    // Inject search button into all headers
    document.querySelectorAll('.header-inner .nav').forEach(nav => {
        const btn = document.createElement('button');
        btn.className = 'search-trigger';
        btn.id = 'searchTrigger';
        btn.setAttribute('aria-label', 'Search');
        btn.innerHTML = '🔍';
        btn.addEventListener('click', openSearch);
        nav.insertBefore(btn, nav.firstChild);
    });

    // Functions
    let debounceTimer = null;

    function openSearch() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('searchInput').focus(), 100);
    }

    function closeSearch() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '<div class="search-hint">Nhập từ khóa để tìm kiếm bài viết...</div>';
    }

    // Close button
    document.getElementById('searchClose').addEventListener('click', closeSearch);

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeSearch();
        // Ctrl+K or Cmd+K to open search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
    });

    // Live search with debounce
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
            document.getElementById('searchResults').innerHTML = '<div class="search-hint">Nhập ít nhất 2 ký tự...</div>';
            return;
        }

        document.getElementById('searchResults').innerHTML = '<div class="search-hint">Đang tìm kiếm...</div>';

        debounceTimer = setTimeout(async () => {
            try {
                const response = await API.getPosts({ search: query, is_published: true, limit: 10 });
                const posts = response.data || [];
                renderResults(posts, query);
            } catch (err) {
                document.getElementById('searchResults').innerHTML = '<div class="search-hint">Có lỗi xảy ra khi tìm kiếm.</div>';
            }
        }, 300);
    });

    function renderResults(posts, query) {
        const container = document.getElementById('searchResults');

        if (posts.length === 0) {
            container.innerHTML = `<div class="search-no-results"><span>🔍</span>Không tìm thấy kết quả cho "<strong>${escapeHTML(query)}</strong>"</div>`;
            return;
        }

        container.innerHTML = posts.map(post => {
            const excerpt = (post.excerpt || '').substring(0, 120);
            const date = post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : '';
            const thumb = post.featured_image
                ? `<img class="search-result-thumb" src="${post.featured_image}" alt="" loading="lazy">`
                : `<div class="search-result-thumb" style="display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.9rem;">H</div>`;

            return `
        <a href="/blog/${post.slug}" class="search-result-item">
          ${thumb}
          <div class="search-result-info">
            <div class="search-result-title">${highlightMatch(post.title, query)}</div>
            <div class="search-result-excerpt">${escapeHTML(excerpt)}</div>
            <div class="search-result-meta">${post.category_name || ''} · ${date}</div>
          </div>
        </a>
      `;
        }).join('');
    }

    function highlightMatch(text, query) {
        const escaped = escapeHTML(text);
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escaped.replace(regex, '<mark style="background:#bbf7d0;padding:0 2px;border-radius:3px;">$1</mark>');
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
