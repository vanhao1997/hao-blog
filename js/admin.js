// Admin JavaScript

// Check authentication
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login';
        return null;
    }

    // Update user name in header
    const userName = document.getElementById('userName');
    if (userName && session.user) {
        userName.textContent = session.user.email.split('@')[0];
    }

    return session;
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'login';
        });
    }
});

// Load dashboard stats
async function loadDashboardStats() {
    try {
        // Total posts
        const { count: total } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true });
        document.getElementById('totalPosts').textContent = total || 0;

        // Published posts
        const { count: published } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true }).eq('is_published', true);
        document.getElementById('publishedPosts').textContent = published || 0;

        // Draft posts
        document.getElementById('draftPosts').textContent = (total || 0) - (published || 0);

        // Total images
        const { count: images } = await supabaseClient.from('images').select('*', { count: 'exact', head: true });
        document.getElementById('totalImages').textContent = images || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent posts for dashboard
async function loadRecentPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*, category:categories(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const tbody = document.getElementById('recentPosts');
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">Chưa có bài viết nào</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => `
      <tr>
        <td><strong>${escapeHtml(post.title)}</strong></td>
        <td>${post.category?.name || '-'}</td>
        <td><span class="status-badge ${post.is_published ? 'published' : 'draft'}">${post.is_published ? 'Đã xuất bản' : 'Bản nháp'}</span></td>
        <td>${formatDate(post.created_at)}</td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Load all posts for management
async function loadAllPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*, category:categories(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('postsTable');
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Chưa có bài viết. <a href="#" onclick="openPostModal()">Tạo bài viết mới</a></td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => `
      <tr>
        <td><strong>${escapeHtml(post.title)}</strong></td>
        <td>${post.category?.name || '-'}</td>
        <td><span class="status-badge ${post.is_published ? 'published' : 'draft'}">${post.is_published ? 'Đã xuất bản' : 'Bản nháp'}</span></td>
        <td>${formatDate(post.created_at)}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editPost('${post.id}')" title="Sửa">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" onclick="deletePost('${post.id}')" title="Xóa">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Load categories for select
async function loadCategoriesSelect() {
    try {
        const { data: categories } = await supabaseClient.from('categories').select('*').order('name');
        const select = document.getElementById('postCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Chọn danh mục</option>' +
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Save post
async function savePost(formData) {
    const isEdit = !!formData.id;

    const postData = {
        title: formData.title,
        slug: formData.slug || slugify(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image: formData.featured_image,
        category_id: formData.category_id || null,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
        read_time: formData.read_time || '5 phút đọc'
    };

    try {
        if (isEdit) {
            const { error } = await supabaseClient.from('posts').update(postData).eq('id', formData.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from('posts').insert(postData);
            if (error) throw error;
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete post
async function deletePost(id) {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
        const { error } = await supabaseClient.from('posts').delete().eq('id', id);
        if (error) throw error;
        loadAllPosts();
        showToast('Đã xóa bài viết', 'success');
    } catch (error) {
        showToast('Lỗi khi xóa: ' + error.message, 'error');
    }
}

// Load images
async function loadImages() {
    try {
        const { data: images, error } = await supabaseClient
            .from('images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const grid = document.getElementById('imagesGrid');
        if (!grid) return;

        if (images.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Chưa có hình ảnh nào. Upload hình ảnh đầu tiên!</p>';
            return;
        }

        grid.innerHTML = images.map(img => `
      <div class="image-card">
        <img src="${img.url}" alt="${escapeHtml(img.alt_text || img.filename)}" loading="lazy">
        <div class="image-card-info">
          <div class="image-card-name">${escapeHtml(img.filename)}</div>
          <div class="image-card-actions">
            <button class="btn btn-secondary" onclick="copyImageUrl('${img.url}')" style="padding: 4px 8px; font-size: 12px;">Copy URL</button>
            <button class="action-btn delete" onclick="deleteImage('${img.id}')" title="Xóa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

// Copy image URL
function copyImageUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Đã copy URL', 'success');
    });
}

// Delete image
async function deleteImage(id) {
    if (!confirm('Bạn có chắc muốn xóa hình ảnh này?')) return;

    try {
        const { error } = await supabaseClient.from('images').delete().eq('id', id);
        if (error) throw error;
        loadImages();
        showToast('Đã xóa hình ảnh', 'success');
    } catch (error) {
        showToast('Lỗi khi xóa: ' + error.message, 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'}; color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 3000;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Export for global use
window.checkAuth = checkAuth;
window.loadDashboardStats = loadDashboardStats;
window.loadRecentPosts = loadRecentPosts;
window.loadAllPosts = loadAllPosts;
window.loadCategoriesSelect = loadCategoriesSelect;
window.savePost = savePost;
window.deletePost = deletePost;
window.loadImages = loadImages;
window.copyImageUrl = copyImageUrl;
window.deleteImage = deleteImage;
window.formatDate = formatDate;
window.showToast = showToast;
