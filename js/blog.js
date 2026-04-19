// Blog Page Scripts (Refactored — uses core/utils.js + core/components.js)
// Features: Category Filter, Search, Pagination (12/page)

const POSTS_PER_PAGE = 12;
let allPosts = []; // Global cache for posts
let currentFilter = 'all';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    loadCategories();
    attachFilterListeners();
});

function attachFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.getAttribute('data-category');
            currentPage = 1;
            currentFilter = category;
            renderBlogGrid();
        });
    });
}

async function loadCategories() {
    try {
        const categories = await API.getCategories();
        const filterContainer = document.querySelector('.filter-buttons');

        if (filterContainer && categories.length > 0) {
            let html = '<button class="filter-btn active" data-category="all">Tất cả</button>';
            html += categories.map(c => `<button class="filter-btn" data-category="${c.id}">${Utils.escapeHTML(c.name)}</button>`).join('');
            filterContainer.innerHTML = html;
            attachFilterListeners();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadPosts() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    if (allPosts.length === 0) {
        grid.innerHTML = '<div class="loading-spinner"></div>';
        try {
            const response = await API.getPosts({ is_published: true, limit: 500 });
            allPosts = response.data || [];
        } catch (error) {
            console.error('Error loading posts:', error);
            grid.innerHTML = '<p class="error-msg">Không thể tải bài viết.</p>';
            return;
        }
    }

    renderBlogGrid();
}

function getFilteredPosts() {
    let filtered = currentFilter === 'all'
        ? allPosts
        : allPosts.filter(p => p.category_id === currentFilter);

    // Apply Search Filter
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (query) {
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(query)) ||
            (p.category_name && p.category_name.toLowerCase().includes(query))
        );
    }

    return filtered;
}

function renderBlogGrid() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    const filteredPosts = getFilteredPosts();

    if (filteredPosts.length === 0) {
        grid.innerHTML = '<p class="no-posts" style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8fafc; border-radius: 16px;">Không tìm thấy bài viết nào phù hợp.</p>';
        renderPagination(0);
        return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);

    grid.innerHTML = '';
    pagePosts.forEach((post, index) => {
        const card = Components.createPostCard(post, { index, style: 'default' });
        grid.appendChild(card);
    });

    renderPagination(totalPages);

    // Scroll to top of grid on page change
    if (currentPage > 1) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderPagination(totalPages) {
    let paginationEl = document.getElementById('blogPagination');
    if (!paginationEl) {
        paginationEl = document.createElement('div');
        paginationEl.id = 'blogPagination';
        const grid = document.getElementById('postsGrid');
        if (grid && grid.parentNode) grid.parentNode.insertBefore(paginationEl, grid.nextSibling);
    }

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';

    // Prev button
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Trước</button>`;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    if (startPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
        html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Tiếp →</button>`;
    html += '</div>';

    paginationEl.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(getFilteredPosts().length / POSTS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderBlogGrid();
}

// Add Search Listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            if (searchDropdown) searchDropdown.style.display = 'none';
        }
    });

    if (searchInput) {
        const handleSearch = () => {
            const query = searchInput.value.toLowerCase().trim();
            currentPage = 1;
            renderBlogGrid(); // Keep normal grid filtering

            // Dropdown logic
            if (searchDropdown) {
                if (query.length < 2) {
                    searchDropdown.style.display = 'none';
                    return;
                }

                const filtered = allPosts.filter(post =>
                    post.title.toLowerCase().includes(query) ||
                    (post.excerpt && post.excerpt.toLowerCase().includes(query))
                ).slice(0, 5);

                if (filtered.length > 0) {
                    searchDropdown.innerHTML = filtered.map(post => `
                        <li style="border-bottom: 1px solid #f1f5f9;">
                            <a href="/blog/${post.slug}" style="display: flex; align-items: center; padding: 12px 16px; text-decoration: none; color: inherit; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                <div style="width: 48px; height: 48px; border-radius: 8px; background: url('${post.featured_image || '/images/og-cover.png'}') center/cover; flex-shrink: 0; margin-right: 12px;"></div>
                                <div>
                                    <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; color: #1e293b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${Utils.escapeHTML(post.title)}</h4>
                                    <span style="font-size: 0.75rem; color: #64748b;">${Utils.formatDate(post.published_at)}</span>
                                </div>
                            </a>
                        </li>
                    `).join('');
                    searchDropdown.style.display = 'block';
                } else {
                    searchDropdown.innerHTML = '<li style="padding: 16px; text-align: center; color: #64748b; font-size: 0.9rem;">Không tìm thấy kết quả phù hợp.</li>';
                    searchDropdown.style.display = 'block';
                }
            }
        };

        if (typeof Utils.debounce !== 'undefined') {
            searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
        } else {
            searchInput.addEventListener('input', handleSearch);
        }
    }
});
