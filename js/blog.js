// Blog Page Scripts (Refactored — uses core/utils.js + core/components.js)
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    loadCategories();

    // Initial filter button listeners
    attachFilterListeners();
});

function attachFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.getAttribute('data-category');
            loadPosts(category);
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

let allPots = []; // Global cache for posts
let currentFilter = 'all';

async function loadPosts(categoryId = 'all') {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    if (allPots.length === 0) {
        grid.innerHTML = '<div class="loading-spinner"></div>';
        try {
            const response = await API.getPosts({ is_published: true, limit: 100 });
            allPots = response.data || [];
        } catch (error) {
            console.error('Error loading posts:', error);
            grid.innerHTML = '<p class="error-msg">Không thể tải bài viết.</p>';
            return;
        }
    }

    currentFilter = categoryId;
    renderBlogGrid();
}

function renderBlogGrid() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    // Apply Category Filter
    let filteredPosts = currentFilter === 'all'
        ? allPots
        : allPots.filter(p => p.category_id === currentFilter);

    // Apply Search Filter
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (query) {
        filteredPosts = filteredPosts.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(query)) ||
            (p.category_name && p.category_name.toLowerCase().includes(query))
        );
    }

    if (filteredPosts.length === 0) {
        grid.innerHTML = '<p class="no-posts" style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8fafc; border-radius: 16px;">Không tìm thấy bài viết nào phù hợp.</p>';
        return;
    }

    grid.innerHTML = '';
    filteredPosts.forEach((post, index) => {
        const card = Components.createPostCard(post, { index, style: 'default' });
        grid.appendChild(card);
    });
}

// Add Search Listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && typeof Utils.debounce !== 'undefined') {
        searchInput.addEventListener('input', Utils.debounce(() => {
            renderBlogGrid();
        }, 300));
    } else if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderBlogGrid();
        });
    }
});
