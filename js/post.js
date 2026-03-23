document.addEventListener('DOMContentLoaded', async () => {
    // Get slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');

    // Fallback: Try to get slug from path (e.g. /blog/my-slug)
    if (!slug) {
        // Basic path parsing used in static setup if rewrite rules are not full
        // If served via PHP/Apache, slug might be passed via query string or path info
        // We will assume URL structure: /blog.html?slug=xyz OR /blog/xyz (handled by .htaccess)
        // If .htaccess maps /blog/xyz -> /blog.html?slug=xyz, then 'slug' param is present.
        const path = window.location.pathname;
        const match = path.match(/\/blog\/([^/]+)/);
        if (match && match[1]) {
            slug = match[1];
        }
    }

    if (!slug) {
        // If still no slug, maybe we are just on /blog.html? Not likely for post.js usage.
        console.error('No slug found in URL');
        if (document.getElementById('postContent')) {
            document.getElementById('postContent').innerHTML = '<div style="text-align:center; padding: 50px;"><h2>🔍 Không tìm thấy bài viết</h2><p>Xin vui lòng kiểm tra lại đường dẫn.</p><a href="/" class="btn btn-primary">Về trang chủ</a></div>';
        }
        return;
    }

    try {
        const post = await API.getPostBySlug(slug);

        if (post) {
            renderPost(post);
            // Load related posts by category, excluding current post
            if (post.category_id) {
                loadRelatedPosts(post.category_id, post.id);
            } else {
                loadRelatedPosts(null, post.id); // Load any recent if no category
            }
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
        const params = {
            limit: 4,
            is_published: true
        };

        if (categoryId) params.category_id = categoryId;

        const response = await API.getPosts(params);
        let posts = response.data || [];

        // Filter out current post if API didn't do it (API doesn't have neq support in this simple version, do it in JS)
        posts = posts.filter(p => p.id != currentPostId).slice(0, 3);

        if (posts.length === 0) {
            grid.innerHTML = '<p>Chưa có bài viết liên quan nào.</p>';
            return;
        }

        grid.innerHTML = '';
        posts.forEach(post => {
            const card = createRelatedPostCard(post);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching related posts:', error);
        grid.innerHTML = '<p>Không thể tải bài viết liên quan.</p>';
    }
}

function createRelatedPostCard(post) {
    const a = document.createElement('a');
    a.href = `/blog/${post.slug}`; // Clean URL
    a.className = 'post-card-link-wrapper';

    let imageHtml = '';
    if (post.featured_image && post.featured_image.trim()) {
        imageHtml = `<div class="post-card-image" style="background-image: url('${post.featured_image}'); background-size: cover; background-position: center; height: 150px;"></div>`;
    } else {
        imageHtml = `
            <div class="post-card-image" 
                style="background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-mint) 100%); height: 150px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 3rem;">📄</span>
            </div>
        `;
    }

    a.innerHTML = `
        <article class="clay-card post-card">
            ${imageHtml}
            <div class="post-card-body">
                <span class="tag tag-${post.category_slug || 'default'}" style="font-size: 0.65rem;">${post.category_name || 'Blog'}</span>
                <h3 class="post-card-title" style="font-size: 1rem; margin-top: 8px;">
                    ${post.title}
                </h3>
                 <p class="post-card-excerpt"
                    style="font-size: 0.9rem; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.excerpt || ''}
                </p>
                <div class="post-card-footer" style="margin-top: 12px;">
                    <span class="post-card-link">Đọc thêm →</span>
                </div>
            </div>
        </article>
    `;
    return a;
}

function renderPost(post) {
    // Update Title
    document.title = `${post.title} - Nguyễn Văn Hảo Blog`;
    document.getElementById('postTitle').innerText = post.title;

    // Update Meta
    const date = new Date(post.published_at).toLocaleDateString('vi-VN');
    document.getElementById('postDate').innerText = date;
    document.getElementById('postReadTime').innerText = post.read_time || '5 phút đọc';

    // Author - Using static name for now as we don't have authors table populated or linked fully yet in API response beyond name
    // My SQL schema did not have authors table instructions but post.js referenced it.
    // The previous schema I generated uses `users` table but posts table description didn't link `author_id`.
    // I assumed single author (Admin) for simplified migration.
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

    // Append Author Card
    const authorCard = `
        <div class="clay-card author-card" style="margin-top: 40px;">
            <div
                style="width: 80px; height: 80px; background: var(--color-primary); border: 3px solid var(--color-black); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
                👨‍💻
            </div>
            <div class="author-info">
                <h4>Nguyễn Văn Hảo</h4>
                <p>Digital Marketer với đam mê chia sẻ kiến thức về Performance Marketing, Facebook Ads, Social Media và
                    Content Marketing.</p>
            </div>
        </div>
    `;

    contentEl.insertAdjacentHTML('beforeend', authorCard);
}
