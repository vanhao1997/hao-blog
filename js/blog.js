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
    if (searchInput && typeof Utils.debounce !== 'undefined') {
        searchInput.addEventListener('input', Utils.debounce(() => {
            currentPage = 1;
            renderBlogGrid();
        }, 300));
    } else if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            renderBlogGrid();
        });
    }
});
