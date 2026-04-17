/**
 * ==========================================================================
 * SHARED COMPONENTS — Hao Blog
 * ==========================================================================
 * Reusable UI components: PostCard, Header/Footer loader.
 * Import: <script src="/js/core/components.js"></script>
 */

const Components = {
    /**
     * Render a blog post card
     * @param {Object} post - Post data
     * @param {Object} options - { index, style: 'default'|'compact'|'related' }
     * @returns {HTMLElement} Post card link wrapper
     */
    createPostCard(post, options = {}) {
        const { index = 0, style = 'default' } = options;
        const a = document.createElement('a');
        a.href = `/blog/${post.slug}`;
        a.className = 'post-card-link-wrapper';
        if (style === 'default') a.style.animationDelay = `${index * 100}ms`;

        const categoryColor = post.category_color || '#22C55E';
        const categoryTextColor = Utils.isLightColor(categoryColor) ? '#1F2937' : '#FFFFFF';
        const categoryTag = `<span class="post-card-category" style="background: ${categoryColor}; color: ${categoryTextColor};">${Utils.escapeHTML(post.category_name || 'Hao Blog')}</span>`;

        let imageHtml = '';
        if (post.featured_image) {
            imageHtml = `<div class="post-card-image" style="background-image: url('${post.featured_image}'); background-size: cover; background-position: center;${style === 'related' ? ' height: 150px;' : ''}">${categoryTag}</div>`;
        } else {
            imageHtml = `
                <div class="post-card-image" 
                    style="background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-mint) 100%);${style === 'related' ? ' height: 150px;' : ''} display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 3rem;">📄</span>
                    ${categoryTag}
                </div>
            `;
        }

        const titleStyle = style === 'related' ? ' style="font-size: 1rem; margin-top: 8px;"' : '';
        const excerptStyle = style === 'related'
            ? ' style="font-size: 0.9rem; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"'
            : '';

        let footerHtml = '';
        if (style === 'related') {
            footerHtml = `
                <div class="post-card-footer" style="margin-top: 12px;">
                    <span class="post-card-link">Đọc thêm →</span>
                </div>`;
        } else {
            footerHtml = `
                <div class="post-card-footer">
                    <span class="post-date">${Utils.formatDate(post.published_at)}</span>
                    <span class="post-read-time">${post.read_time || '5 phút đọc'}</span>
                </div>`;
        }

        a.innerHTML = `
            <article class="clay-card post-card">
                ${imageHtml}
                <div class="post-card-body">
                    <h3 class="post-card-title"${titleStyle}>${Utils.escapeHTML(post.title)}</h3>
                    <p class="post-card-excerpt"${excerptStyle}>${Utils.escapeHTML(post.excerpt || '')}</p>
                    ${footerHtml}
                </div>
            </article>
        `;

        return a;
    },

    /**
     * Load shared HTML partials (header/footer) into current page
     */
    async loadPartials() {
        try {
            const [headerRes, footerRes] = await Promise.all([
                fetch('/partials/header.html').then(r => r.ok ? r.text() : ''),
                fetch('/partials/footer.html').then(r => r.ok ? r.text() : '')
            ]);

            const headerSlot = document.getElementById('header-slot');
            const footerSlot = document.getElementById('footer-slot');

            if (headerSlot && headerRes) headerSlot.innerHTML = headerRes;
            if (footerSlot && footerRes) footerSlot.innerHTML = footerRes;

            // Highlight active nav link
            this.highlightActiveNav();
        } catch (e) {
            console.warn('Could not load partials:', e);
        }
    },

    /**
     * Highlight the current page's nav link
     */
    highlightActiveNav() {
        const path = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === path || (href !== '/' && path.startsWith(href))) {
                link.classList.add('active');
            } else if (href === '/' && path === '/') {
                link.classList.add('active');
            }
        });
    },

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success' | 'error' | 'info'
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;

        // Add styles if not present
        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                .toast-notification {
                    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
                    padding: 14px 24px; border-radius: 12px; font-size: 0.95rem;
                    color: #fff; font-weight: 500; opacity: 0;
                    transform: translateY(20px); transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border: 2px solid var(--color-black, #1F2937);
                }
                .toast-notification.visible { opacity: 1; transform: translateY(0); }
                .toast-success { background: #22C55E; }
                .toast-error { background: #EF4444; }
                .toast-info { background: #6366F1; }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Export globally
window.Components = Components;
window.showToast = Components.showToast.bind(Components);
