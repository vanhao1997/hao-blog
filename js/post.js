// Post Page Scripts (Refactored — uses core/utils.js + core/components.js)

// === Reading Progress Bar ===
(function initProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'readingProgress';
    Object.assign(bar.style, {
        position: 'fixed', top: '0', left: '0', height: '3px', width: '0%',
        background: 'linear-gradient(90deg, #22C55E, #6EE7B7)',
        zIndex: '99999', transition: 'width 0.1s ease', borderRadius: '0 2px 2px 0'
    });
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / docHeight) * 100;
        bar.style.width = Math.min(scrolled, 100) + '%';
    }, { passive: true });
})();

// === Sidebar Table of Contents with Scroll Spy ===
function generateTOC() {
    const content = document.getElementById('postContent');
    const tocList = document.getElementById('tocList');
    const tocSidebar = document.getElementById('tocSidebar');
    if (!content || !tocList || !tocSidebar) return;

    const headings = content.querySelectorAll('h2, h3');
    if (headings.length < 2) {
        // Hide sidebar for very short posts
        tocSidebar.style.display = 'none';
        const layout = document.querySelector('.post-layout');
        if (layout) layout.style.gridTemplateColumns = '1fr';
        return;
    }

    // Build TOC links
    tocList.innerHTML = Array.from(headings).map((h, i) => {
        const id = 'heading-' + i;
        h.id = id;
        const isH3 = h.tagName === 'H3';
        return `<li><a href="#${id}" class="${isH3 ? 'toc-h3' : ''}" data-toc-index="${i}">${h.textContent}</a></li>`;
    }).join('');

    // Smooth scroll on click
    tocList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Update URL hash without jumping
                history.replaceState(null, '', link.getAttribute('href'));
            }
        });
    });

    // Scroll Spy: highlight current section
    const tocLinks = tocList.querySelectorAll('a');
    let ticking = false;

    function updateActiveLink() {
        let current = 0;
        headings.forEach((h, i) => {
            if (h.getBoundingClientRect().top <= 120) current = i;
        });
        tocLinks.forEach(link => link.classList.remove('active'));
        if (tocLinks[current]) {
            tocLinks[current].classList.add('active');
            // Scroll the sidebar to keep active link visible
            tocLinks[current].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(updateActiveLink); ticking = true; }
    }, { passive: true });

    // Initial highlight
    updateActiveLink();
}
document.addEventListener('DOMContentLoaded', async () => {
    // Get slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');

    // Fallback: path-based slug (e.g., /blog/my-slug via .htaccess)
    if (!slug) {
        const path = window.location.pathname;
        const match = path.match(/\/blog\/([^/]+)/);
        if (match && match[1]) slug = match[1];
    }

    if (!slug) {
        console.error('No slug found in URL');
        const content = document.getElementById('postContent');
        if (content) {
            content.innerHTML = '<div style="text-align:center; padding: 50px;"><h2>🔍 Không tìm thấy bài viết</h2><p>Xin vui lòng kiểm tra lại đường dẫn.</p><a href="/" class="btn btn-primary">Về trang chủ</a></div>';
        }
        return;
    }

    try {
        const post = await API.getPostBySlug(slug);

        if (post) {
            renderPost(post);
            loadRelatedPosts(post.category_id || null, post.id);
        } else {
            document.getElementById('postContent').innerHTML = '<div style="text-align:center; padding: 50px;"><h2>🚫 Bài viết không tồn tại</h2><p>Có thể bài viết đã bị xóa hoặc đường dẫn không đúng.</p></div>';
        }
    } catch (err) {
        console.error('Error fetching post:', err);
        document.getElementById('postContent').innerHTML = '<p>Có lỗi xảy ra khi tải bài viết.</p>';
    }
});

async function loadRelatedPosts(categoryId, currentPostId) {
    const grid = document.getElementById('relatedPostsGrid');
    if (!grid) return;

    try {
        const params = { limit: 4, is_published: true };
        if (categoryId) params.category_id = categoryId;

        const response = await API.getPosts(params);
        let posts = response.data || [];
        posts = posts.filter(p => p.id != currentPostId).slice(0, 3);

        if (posts.length === 0) {
            grid.innerHTML = '<p>Chưa có bài viết liên quan nào.</p>';
            return;
        }

        grid.innerHTML = '';
        posts.forEach(post => {
            // Use shared component instead of local createRelatedPostCard
            const card = Components.createPostCard(post, { style: 'related' });
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching related posts:', error);
        grid.innerHTML = '<p>Không thể tải bài viết liên quan.</p>';
    }
}

function renderPost(post) {
    // Update Title
    document.title = `${post.title} - Nguyễn Văn Hảo Blog`;
    document.getElementById('postTitle').innerText = post.title;

    // Update breadcrumb
    const breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = post.title;

    // Update Meta — use shared Utils.formatDate
    const date = Utils.formatDate(post.published_at);
    document.getElementById('postDate').innerText = date;

    // Auto Reading Time: ~200 words/min for Vietnamese
    const plainText = (post.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    const readMinutes = Math.max(1, Math.ceil(wordCount / 200));
    document.getElementById('postReadTime').innerText = `${readMinutes} phút đọc`;
    document.getElementById('postAuthor').innerText = 'Nguyễn Văn Hảo';

    // Category
    if (post.category_name) {
        const catEl = document.getElementById('postCategory');
        catEl.innerText = post.category_name;
        catEl.className = `tag tag-${post.category_slug}`;
    }

    // Featured Image
    const imgContainer = document.getElementById('postImage');
    if (post.featured_image) {
        imgContainer.innerHTML = '';
        imgContainer.style.background = 'none';
        imgContainer.style.padding = '0';

        const img = document.createElement('img');
        img.src = post.featured_image;
        img.alt = post.title;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '24px';
        imgContainer.appendChild(img);
    }

    // Content
    const contentEl = document.getElementById('postContent');
    contentEl.innerHTML = post.content;

    // Generate Table of Contents
    generateTOC();

    // Author Card
    contentEl.insertAdjacentHTML('beforeend', `
        <div class="clay-card author-card" style="margin-top: 40px;">
            <div style="width: 80px; height: 80px; background: var(--color-primary); border: 3px solid var(--color-black); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
                👨‍💻
            </div>
            <div class="author-info">
                <h4>Nguyễn Văn Hảo</h4>
                <p>Digital Marketer với đam mê chia sẻ kiến thức về Performance Marketing, Facebook Ads, Social Media và Content Marketing.</p>
            </div>
        </div>
    `);

    // Lazy Loading: add loading="lazy" to all content images
    contentEl.querySelectorAll('img').forEach(img => {
        img.setAttribute('loading', 'lazy');
        if (!img.alt) img.alt = post.title;
    });

    // JSON-LD Breadcrumb Schema for SEO
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": "https://nguyenvanhao.name.vn/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://nguyenvanhao.name.vn/blog" },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://nguyenvanhao.name.vn/blog/${post.slug}` }
        ]
    };
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(schemaScript);

    // Article Schema for SEO
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || '',
        "image": post.featured_image || 'https://nguyenvanhao.name.vn/images/og-cover.png',
        "author": { "@type": "Person", "name": "Nguyễn Văn Hảo" },
        "publisher": { "@type": "Organization", "name": "Nguyễn Văn Hảo Blog" },
        "datePublished": post.published_at,
        "dateModified": post.updated_at || post.published_at,
        "mainEntityOfPage": `https://nguyenvanhao.name.vn/blog/${post.slug}`,
        "wordCount": wordCount,
        "timeRequired": `PT${readMinutes}M`
    };
    const articleSchemaScript = document.createElement('script');
    articleSchemaScript.type = 'application/ld+json';
    articleSchemaScript.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(articleSchemaScript);
}
