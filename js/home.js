document.addEventListener('DOMContentLoaded', () => {
    // Load data
    loadStats();
    loadCategories();
    loadRecentPosts();
    loadHeroSlider();

    // Event Listeners for Filters
    // Event Listeners for Filters
    const postFilter = document.getElementById('filterButtons');
    if (postFilter) {
        postFilter.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;

            // Remove active class from all
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            const categoryId = btn.dataset.id || btn.value; // Handle both data-id and value
            loadRecentPosts(categoryId);
        });
    }

    // Modal Contact Form
    const modal = document.getElementById('contactModal');
    const openBtn = document.querySelector('.cta-button'); // "Liên hệ ngay" button
    const closeBtn = document.querySelector('.close-modal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', (e) => {
            if (openBtn.getAttribute('href') === '#contact') {
                e.preventDefault();
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

async function loadStats() {
    try {
        // Try API first
        const [postsRes, categoriesRes] = await Promise.all([
            API.getPosts({ count: true, is_published: true }),
            API.getCategories({ count: true })
        ]);

        const postCount = postsRes?.exact || 0;
        const catCount = categoriesRes?.exact || 0;

        animateValue("statPosts", 0, postCount, 2000);
        animateValue("statCategories", 0, catCount, 1500);
        animateValue("statExp", 0, 3, 1000);
    } catch (error) {
        console.warn('API unavailable, using demo data for stats');
        // Fallback to demo data
        if (window.DEMO_POSTS && window.DEMO_CATEGORIES) {
            animateValue("statPosts", 0, window.DEMO_POSTS.length, 2000);
            animateValue("statCategories", 0, window.DEMO_CATEGORIES.length, 1500);
            animateValue("statExp", 0, 3, 1000);
        }
    }
}

async function loadRecentPosts(categoryId = 'all') {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const params = {
            limit: 6,
            is_published: 'true'
        };

        if (categoryId !== 'all') {
            params.category_id = categoryId;
        }

        const response = await API.getPosts(params);
        let posts = response.data || [];

        // Fallback to demo data if API returns empty
        if (posts.length === 0 && window.DEMO_POSTS) {
            console.warn('No posts from API, using demo data');
            posts = categoryId === 'all'
                ? window.DEMO_POSTS
                : window.DEMO_POSTS.filter(p => p.category_id == categoryId);
        }

        if (posts.length === 0) {
            grid.innerHTML = '<p class="no-posts">Chưa có bài viết nào trong danh mục này.</p>';
            return;
        }

        grid.innerHTML = '';
        posts.forEach(post => {
            const card = createPostCard(post);
            grid.appendChild(card);
        });

    } catch (error) {
        console.warn('API error, using demo data for posts');
        // Fallback to demo data
        if (window.DEMO_POSTS) {
            const posts = categoryId === 'all'
                ? window.DEMO_POSTS.slice(0, 6)
                : window.DEMO_POSTS.filter(p => p.category_id == categoryId).slice(0, 6);

            grid.innerHTML = '';
            posts.forEach(post => {
                const card = createPostCard(post);
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p class="error-msg">Không thể tải bài viết.</p>';
        }
    }
}

async function loadCategories() {
    const filter = document.getElementById('filterButtons');
    if (!filter) return;

    try {
        let categories = await API.getCategories();

        // Fallback to demo data
        if ((!categories || categories.length === 0) && window.DEMO_CATEGORIES) {
            console.warn('Using demo categories');
            categories = window.DEMO_CATEGORIES;
        }

        if (categories && categories.length > 0) {
            let options = '<button class="filter-btn active" data-id="all">Tất cả bài viết</button>';
            options += categories.map(c => `<button class="filter-btn" value="${c.id}">${c.name}</button>`).join('');
            filter.innerHTML = options;
        }
    } catch (error) {
        console.warn('API error, using demo categories');
        if (window.DEMO_CATEGORIES) {
            let options = '<button class="filter-btn active" data-id="all">Tất cả bài viết</button>';
            options += window.DEMO_CATEGORIES.map(c => `<button class="filter-btn" value="${c.id}">${c.name}</button>`).join('');
            filter.innerHTML = options;
        }
    }
}

function createPostCard(post) {
    const a = document.createElement('a');
    a.href = `/blog/${post.slug}`; // Clean URL
    a.className = 'post-card-link-wrapper';

    const categoryColor = post.category_color || '#22C55E';
    const categoryTextColor = isLightColor(categoryColor) ? '#1F2937' : '#FFFFFF';
    let categoryTag = `<span class="post-card-category" style="background: ${categoryColor}; color: ${categoryTextColor};">${post.category_name || 'Hao Blog'}</span>`;

    let imageHtml = '';
    if (post.featured_image) {
        imageHtml = `<div class="post-card-image" style="background-image: url('${post.featured_image}'); background-size: cover; background-position: center;">${categoryTag}</div>`;
    } else {
        // Placeholder gradient
        imageHtml = `
            <div class="post-card-image" 
                style="background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-mint) 100%); display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 3rem;">📄</span>
                ${categoryTag}
            </div>
        `;
    }

    a.innerHTML = `
        <article class="clay-card post-card">
            ${imageHtml}
            <div class="post-card-body">
                <h3 class="post-card-title">${post.title}</h3>
                <p class="post-card-excerpt">${post.excerpt || ''}</p>
                <div class="post-card-footer">
                    <span class="post-date">${formatDate(post.published_at)}</span>
                    <span class="post-read-time">${post.read_time || '5 phút đọc'}</span>
                </div>
            </div>
        </article>
    `;

    return a;
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Helper function to determine if a color is light or dark
function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end; // Ensure final value is exact
        }
    };
    window.requestAnimationFrame(step);
}

// Hero Slider Implementation with Navigation Dots
async function loadHeroSlider() {
    const slider = document.getElementById('heroSlider');
    const sliderContainer = document.querySelector('.hero-slider-container');
    if (!slider) return;

    try {
        // Fetch posts for slider (e.g., latest 5)
        const response = await API.getPosts({ limit: 5, is_published: true });
        let posts = response.data || [];

        // Fallback to demo data if API returns empty or fails
        if (posts.length === 0 && window.DEMO_POSTS) {
            console.warn('Using demo data for hero slider');
            posts = window.DEMO_POSTS.slice(0, 5);
        }

        if (posts.length === 0) {
            slider.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #888;">Chưa có bài viết nổi bật</div>';
            return;
        }

        renderSlider(posts, slider, sliderContainer);

    } catch (error) {
        console.warn('API error, using demo data for slider');
        // Fallback to demo data
        if (window.DEMO_POSTS) {
            renderSlider(window.DEMO_POSTS.slice(0, 5), slider, sliderContainer);
        } else {
            slider.innerHTML = '';
        }
    }
}

function renderSlider(posts, slider, sliderContainer) {
    slider.innerHTML = posts.map((post, index) => {
        const activeClass = index === 0 ? 'active' : '';
        const categoryColor = post.category_color || '#22C55E';
        const categoryTextColor = isLightColor(categoryColor) ? '#1F2937' : '#FFFFFF';
        const categoryTag = `<span class="post-card-category" style="background: ${categoryColor}; color: ${categoryTextColor};">${post.category_name || 'Hao Blog'}</span>`;

        let imageStyle = '';
        if (post.featured_image) {
            imageStyle = `background-image: url('${post.featured_image}'); background-size: cover; background-position: center;`;
        } else {
            imageStyle = `background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-mint) 100%); display: flex; align-items: center; justify-content: center;`;
        }

        const imageContent = post.featured_image ? categoryTag : `<span style="font-size: 3rem;">📄</span>${categoryTag}`;

        return `
                <div class="hero-slide ${activeClass}" data-index="${index}">
                    <a href="/blog/${post.slug}" class="post-card-link-wrapper" style="height: 100%;">
                        <article class="clay-card post-card">
                            <div class="post-card-image" style="${imageStyle}">
                                ${post.featured_image ? '' : imageContent}
                                ${post.featured_image ? categoryTag : ''}
                            </div>
                            <div class="post-card-body">
                                <h3 class="post-card-title">${post.title}</h3>
                                <p class="post-card-excerpt">${post.excerpt || ''}</p>
                                <div class="post-card-footer">
                                    <span class="post-date">${formatDate(post.published_at)}</span>
                                </div>
                            </div>
                        </article>
                    </a>
                </div>
            `;
    }).join('');

    // Create Navigation Dots
    if (posts.length > 1 && sliderContainer) {
        const navHtml = `
                <div class="hero-slider-nav">
                    ${posts.map((_, index) => `
                        <button class="hero-slider-dot ${index === 0 ? 'active' : ''}" 
                                data-index="${index}" 
                                aria-label="Slide ${index + 1}"></button>
                    `).join('')}
                </div>
            `;
        sliderContainer.insertAdjacentHTML('beforeend', navHtml);
    }

    // Slider Logic
    let currentIndex = 0;
    const slides = slider.querySelectorAll('.hero-slide');
    const dots = sliderContainer ? sliderContainer.querySelectorAll('.hero-slider-dot') : [];
    const totalSlides = slides.length;
    let autoPlayInterval;

    function goToSlide(index) {
        slides[currentIndex].classList.remove('active');
        if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

        currentIndex = index;

        slides[currentIndex].classList.add('active');
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    function nextSlide() {
        goToSlide((currentIndex + 1) % totalSlides);
    }

    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // 5 second interval
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    // Dot click handlers
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            goToSlide(index);
            stopAutoPlay();
            startAutoPlay(); // Reset timer
        });
    });

    // Pause on hover
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoPlay);
        sliderContainer.addEventListener('mouseleave', startAutoPlay);
    }

    // Start auto play if multiple slides
    if (totalSlides > 1) {
        startAutoPlay();
    }
}
