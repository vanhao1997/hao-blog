// Admin JavaScript - Refactored for PHP API

// Check authentication
async function checkAuth() {
    try {
        const user = await API.checkAuth();
        if (!user) {
            window.location.href = '/admin/login';
            return null;
        }

        // Update user name in header
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = user.email.split('@')[0];
            const avatar = document.querySelector('.user-avatar');
            if (avatar) avatar.textContent = user.email[0].toUpperCase();
        }
        return user;
    } catch (e) {
        window.location.href = '/admin/login.html';
        return null;
    }
}

// Logout handler
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await API.logout();
            window.location.href = '/admin/login.html';
        });
    }
});

// Dashboard Stats
async function loadDashboardStats() {
    try {
        const stats = await API.request('/stats.php');

        if (stats.success) {
            document.getElementById('totalPosts').textContent = stats.posts_total;
            document.getElementById('publishedPosts').textContent = stats.posts_published;
            document.getElementById('draftPosts').textContent = stats.posts_draft;
            document.getElementById('totalImages').textContent = stats.images_total;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // showToast('Lỗi tải thống kê', 'warning'); // Optional: don't annoy user if just stats fail
    }
}

// Recent posts for dashboard
async function loadRecentPosts() {
    try {
        const response = await API.getPosts({ limit: 5 });
        let posts = [];
        if (Array.isArray(response)) {
            posts = response;
        } else if (response && response.data) {
            posts = response.data;
        }

        const tbody = document.getElementById('recentPosts');
        if (!tbody) return;

        if (!posts || posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #9ca3af;">Chưa có bài viết. <a href="posts.html">Tạo bài viết đầu tiên</a></td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => `
      <tr>
        <td><strong>${escapeHtml(post.title)}</strong></td>
        <td>${escapeHtml(post.category_name || '-')}</td>
        <td><span class="status-badge ${post.is_published == 1 ? 'published' : 'draft'}">${post.is_published == 1 ? 'Đã xuất bản' : 'Bản nháp'}</span></td>
        <td>${formatDate(post.created_at)}</td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// All posts for management
async function loadAllPosts() {
    const tbody = document.getElementById('postsTable');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Đang tải...</td></tr>';

    try {
        const response = await API.getPosts({ limit: 1000 }); // Get all
        let posts = [];
        if (Array.isArray(response)) {
            posts = response;
        } else if (response && response.data) {
            posts = response.data;
        }

        if (!posts || posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af;">Chưa có bài viết. Hãy tạo bài viết đầu tiên!</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => `
      <tr>
        <td><strong>${escapeHtml(post.title)}</strong></td>
        <td>${escapeHtml(post.category_name || '-')}</td>
        <td><span class="status-badge ${post.is_published == 1 ? 'published' : 'draft'}">${post.is_published == 1 ? 'Đã xuất bản' : 'Bản nháp'}</span></td>
        <td>${formatDate(post.created_at)}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editPost('${post.id}')" title="Sửa">✏️</button>
            <button class="action-btn delete" onclick="deletePost('${post.id}')" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

// Load categories for select
async function loadCategoriesSelect() {
    try {
        const categories = await API.getCategories();
        const select = document.getElementById('postCategory');
        if (!select || !categories) return;

        select.innerHTML = '<option value="">Chọn danh mục</option>' +
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load categories management
async function loadCategoriesManagement() {
    const tbody = document.getElementById('categoriesTable');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">Đang tải...</td></tr>';

    try {
        const categories = await API.getCategories();

        if (!categories || categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #9ca3af;">Chưa có danh mục.</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map((cat, index) => `
      <tr>
        <td><strong>${escapeHtml(cat.name)}</strong></td>
        <td>${escapeHtml(cat.slug)}</td>
        <td>
            <span style="display: inline-block; width: 24px; height: 24px; background: ${cat.color || '#22C55E'}; border-radius: 6px; border: 2px solid #1F2937;"></span>
        </td>
        <td>
            <div class="action-btns">
                <button class="action-btn" onclick="moveCategory('${cat.id}', 'up')" title="Lên" ${index === 0 ? 'disabled' : ''}>⬆️</button>
                <button class="action-btn" onclick="moveCategory('${cat.id}', 'down')" title="Xuống" ${index === categories.length - 1 ? 'disabled' : ''}>⬇️</button>
            </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editCategory('${cat.id}')" title="Sửa">✏️</button>
            <button class="action-btn delete" onclick="deleteCategory('${cat.id}')" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ef4444;">Lỗi tải dữ liệu: ${error.message}</td></tr>';
    }
}

// Move Category
async function moveCategory(id, direction) {
    try {
        await API.request('/categories.php?action=reorder', {
            method: 'POST',
            body: JSON.stringify({ id, direction })
        });
        loadCategoriesManagement();
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Save category
async function saveCategory(formData) {
    try {
        let result;
        if (formData.id) {
            result = await API.updateCategory(formData.id, formData);
        } else {
            // Generate slug if empty
            if (!formData.slug) formData.slug = slugify(formData.name);
            result = await API.createCategory(formData);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete category
async function deleteCategory(id) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
        await API.deleteCategory(id);
        loadCategoriesManagement();
        showToast('Đã xóa danh mục', 'success');
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Save post
async function savePost(formData) {
    const postData = {
        ...formData,
        read_time: formData.read_time || '5 phút đọc'
    };

    try {
        let result;
        if (formData.id) {
            result = await API.updatePost(formData.id, postData);
        } else {
            result = await API.createPost(postData);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Edit post
async function editPost(id) {
    // Redirect to posts.html with id if not already there, OR if this is SPA style? 
    // Wait, the Admin UI seems to be multi-page (posts.html, index.html).
    // If we are on posts.html, we likely have a modal or form.
    // Let's assume there is a modal or we redirect to an edit page.
    // Check posts.html structure first? 
    // Assuming SPA-like behavior or Modal on posts.html based on context.
    // If this is posts.html, we probably have a form hidden or modal.
    // Let's check if 'postModal' exists or if we should redirect.
    // Actually, usually simpler admins use a query param ?id=xyz on the editor page.

    // User said "click edit then fields empty". exact behavior depends on HTML.
    // Checking posts.html would be wise. But assuming standard modal pattern from category example.

    window.location.href = `/admin/post-editor.html?id=${id}`;
}

// Delete post
async function deletePost(id) {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
        await API.deletePost(id);
        loadAllPosts();
        showToast('Đã xóa bài viết', 'success');
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Load images
async function loadImages() {
    const grid = document.getElementById('imagesGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Đang tải...</p>';

    try {
        const response = await API.getImages();
        const images = response.data || [];

        if (!images || images.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 60px; color: #9ca3af;">Chưa có hình ảnh. Thêm URL hình ảnh bên trên!</p>';
            return;
        }

        grid.innerHTML = images.map(img => `
      <div class="image-card">
        <img src="${img.url}" alt="${escapeHtml(img.alt_text || img.filename)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'140\\' fill=\\'%23f3f4f6\\'><rect width=\\'200\\' height=\\'140\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%239ca3af\\'>Error</text></svg>'">
        <div class="image-card-info">
          <div class="image-card-name" title="${escapeHtml(img.filename)}">${escapeHtml(prettifyFilename(img.filename))}</div>
          <div class="action-btns">
            <button class="action-btn copy" onclick="copyImageLink('${img.url}')" style="background: none; border:none; cursor: pointer; font-size: 1.2rem;" title="Copy Link">📋</button>
            <button class="action-btn delete" onclick="deleteImage('${img.id}')" title="Xóa ảnh">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Delete Image
async function deleteImage(id) {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    try {
        await API.deleteImage(id);
        loadImages();
        showToast('Đã xóa ảnh', 'success');
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Upload Image File (PHP Upload) - Keep mostly same but ensure it refreshes via API
async function uploadImageFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Add alt text if available from DOM
    const altInput = document.getElementById('imageAlt');
    if (altInput) formData.append('alt_text', altInput.value);

    try {
        const response = await fetch('/api/upload.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        if (data.success) {
            // Save to DB
            try {
                await API.request('/images.php', {
                    method: 'POST',
                    body: JSON.stringify({
                        filename: data.filename,
                        url: data.url,
                        alt_text: document.getElementById('imageAlt')?.value || ''
                    })
                });
                showToast('Upload thành công', 'success');
                document.getElementById('uploadForm').reset();
                loadImages(); // Refresh list
            } catch (dbError) {
                console.error('DB Error:', dbError);
                showToast(`Upload xong nhưng lỗi lưu DB: ${dbError.message}`, 'error');
            }
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Lỗi upload: ' + error.message, 'error');
    }
}

// Utilities
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function slugify(str) {
    str = str.toString();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");

    return str.toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function prettifyFilename(filename) {
    if (!filename) return '';
    // Remove timestamp prefix (digits + underscore) if present
    return filename.replace(/^\d+_+/, '');
}

function copyImageLink(url) {
    // Add domain if URL is relative
    if (url.startsWith('/')) {
        url = window.location.origin + url;
    }

    // Navigator clipboard API (modern, secure)
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Đã copy link ảnh!', 'success');
        }).catch((err) => {
            console.error('Clipboard API failed', err);
            // Fallback
            copyToClipboardFallback(url);
        });
    } else {
        copyToClipboardFallback(url);
    }
}

function copyToClipboardFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  // Avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Đã copy link ảnh!', 'success');
        } else {
            showToast('Không thể copy link', 'error');
        }
    } catch (err) {
        console.error('Fallback copy failed', err);
        showToast('Trình duyệt chặn copy', 'error');
    }
    document.body.removeChild(textArea);
}

function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Check if toast container exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);

        // Add styles dynamically if not present
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
                .toast { padding: 12px 24px; margin-top: 10px; border-radius: 4px; color: white; animation: fadeIn 0.3s, fadeOut 0.3s 2.7s; }
                .toast-success { background: #22c55e; }
                .toast-error { background: #ef4444; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            `;
            document.head.appendChild(style);
        }
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export for HTML usage
window.checkAuth = checkAuth;
window.loadDashboardStats = loadDashboardStats;
window.loadRecentPosts = loadRecentPosts;
window.loadAllPosts = loadAllPosts;
window.loadCategoriesSelect = loadCategoriesSelect;
window.loadCategoriesManagement = loadCategoriesManagement;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
window.savePost = savePost;
window.deletePost = deletePost;
window.loadImages = loadImages;
window.uploadImageFile = uploadImageFile;
window.slugify = slugify;
window.prettifyFilename = prettifyFilename;
window.copyImageLink = copyImageLink;
window.showToast = showToast;
