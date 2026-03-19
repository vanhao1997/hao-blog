// ========================================
// Temp Mail Tool - Mail.tm API Integration
// ========================================

const API_BASE = 'https://api.mail.tm';

// State
let currentAccount = null;
let authToken = null;
let autoRefreshInterval = null;

// DOM Elements
const emailDisplay = document.getElementById('emailDisplay');
const emailAddress = document.getElementById('emailAddress');
const emailText = document.getElementById('emailText');
const statusBadge = document.getElementById('statusBadge');
const createBtn = document.getElementById('createBtn');
const refreshBtn = document.getElementById('refreshBtn');
const messageCount = document.getElementById('messageCount');
const emptyInbox = document.getElementById('emptyInbox');
const messageList = document.getElementById('messageList');
const emailModal = document.getElementById('emailModal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ========================================
// API Functions
// ========================================

// Get available domains
async function getDomains() {
    try {
        const response = await fetch(`${API_BASE}/domains`);
        const data = await response.json();
        return data['hydra:member'] || [];
    } catch (error) {
        console.error('Error fetching domains:', error);
        showToast('Lỗi kết nối đến server', 'error');
        return [];
    }
}

// Generate random string
function generateRandomString(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Create new account
async function createAccount(address, password) {
    try {
        const response = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể tạo tài khoản');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
}

// Get authentication token
async function getToken(address, password) {
    try {
        const response = await fetch(`${API_BASE}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address, password })
        });
        
        if (!response.ok) {
            throw new Error('Không thể lấy token xác thực');
        }
        
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
}

// Get messages
async function getMessages() {
    if (!authToken) return [];
    
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể lấy danh sách email');
        }
        
        const data = await response.json();
        return data['hydra:member'] || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

// Get single message
async function getMessage(id) {
    if (!authToken) return null;
    
    try {
        const response = await fetch(`${API_BASE}/messages/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể đọc email');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching message:', error);
        return null;
    }
}

// ========================================
// UI Functions
// ========================================

// Create new email
async function createEmail() {
    createBtn.disabled = true;
    createBtn.innerHTML = `
        <div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
        Đang tạo...
    `;
    
    try {
        // Get domains
        const domains = await getDomains();
        if (domains.length === 0) {
            throw new Error('Không tìm thấy domain khả dụng');
        }
        
        // Generate random email
        const domain = domains[0].domain;
        const username = generateRandomString(12);
        const address = `${username}@${domain}`;
        const password = generateRandomString(16);
        
        // Create account
        currentAccount = await createAccount(address, password);
        
        // Get token
        authToken = await getToken(address, password);
        
        // Store credentials
        localStorage.setItem('tempMailCredentials', JSON.stringify({
            address,
            password,
            accountId: currentAccount.id
        }));
        
        // Update UI
        updateEmailDisplay(address);
        refreshBtn.disabled = false;
        showToast('Tạo email thành công!');
        
        // Initial refresh
        await refreshInbox();
        
    } catch (error) {
        showToast(error.message || 'Có lỗi xảy ra', 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tạo Email Mới
        `;
    }
}

// Update email display
function updateEmailDisplay(address) {
    const placeholder = emailDisplay.querySelector('.email-placeholder');
    if (placeholder) placeholder.classList.add('hidden');
    emailAddress.classList.remove('hidden');
    emailText.textContent = address;
    statusBadge.textContent = 'Đang hoạt động';
    statusBadge.classList.add('active');
}

// Copy email to clipboard
function copyEmail() {
    const email = emailText.textContent;
    navigator.clipboard.writeText(email).then(() => {
        showToast('Đã sao chép email!');
    }).catch(() => {
        showToast('Không thể sao chép', 'error');
    });
}

// Refresh inbox
async function refreshInbox() {
    if (!authToken) return;
    
    refreshBtn.disabled = true;
    const originalContent = refreshBtn.innerHTML;
    refreshBtn.innerHTML = `
        <div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
        Đang tải...
    `;
    
    try {
        const messages = await getMessages();
        renderMessages(messages);
        messageCount.textContent = `${messages.length} tin`;
    } catch (error) {
        showToast('Lỗi khi tải inbox', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalContent;
    }
}

// Render messages
function renderMessages(messages) {
    if (messages.length === 0) {
        emptyInbox.classList.remove('hidden');
        messageList.classList.add('hidden');
        return;
    }
    
    emptyInbox.classList.add('hidden');
    messageList.classList.remove('hidden');
    
    messageList.innerHTML = messages.map(msg => {
        const from = msg.from?.name || msg.from?.address || 'Không rõ';
        const initial = from.charAt(0).toUpperCase();
        const time = formatTime(msg.createdAt);
        const preview = msg.intro || 'Không có nội dung xem trước';
        
        return `
            <div class="message-item ${!msg.seen ? 'unread' : ''}" onclick="openMessage('${msg.id}')">
                <div class="message-avatar">${initial}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${escapeHtml(from)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-subject">${escapeHtml(msg.subject || '(Không có tiêu đề)')}</div>
                    <div class="message-preview">${escapeHtml(preview)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Open message modal
async function openMessage(id) {
    emailModal.classList.add('active');
    
    const modalSubject = document.getElementById('modalSubject');
    const modalFrom = document.getElementById('modalFrom');
    const modalTo = document.getElementById('modalTo');
    const modalDate = document.getElementById('modalDate');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = '<div class="loading-spinner"></div>';
    
    const message = await getMessage(id);
    
    if (message) {
        modalSubject.textContent = message.subject || '(Không có tiêu đề)';
        modalFrom.textContent = message.from?.address || 'Không rõ';
        modalTo.textContent = message.to?.[0]?.address || 'Không rõ';
        modalDate.textContent = formatDateTime(message.createdAt);
        
        // Prefer HTML content, fallback to text
        if (message.html && message.html.length > 0) {
            modalBody.innerHTML = message.html.join('');
        } else {
            modalBody.textContent = message.text || 'Email trống';
        }
    } else {
        modalBody.innerHTML = '<p style="color: var(--danger);">Không thể tải nội dung email</p>';
    }
}

// Close modal
function closeModal() {
    emailModal.classList.remove('active');
}

// Close modal on backdrop click
emailModal.addEventListener('click', (e) => {
    if (e.target === emailModal) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && emailModal.classList.contains('active')) {
        closeModal();
    }
});

// Toggle auto refresh
function toggleAutoRefresh() {
    const checkbox = document.getElementById('autoRefresh');
    
    if (checkbox.checked) {
        autoRefreshInterval = setInterval(refreshInbox, 10000);
        showToast('Đã bật tự động làm mới');
    } else {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        showToast('Đã tắt tự động làm mới');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// Utility Functions
// ========================================

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Initialize
// ========================================

// Try to restore previous session
async function init() {
    const stored = localStorage.getItem('tempMailCredentials');
    
    if (stored) {
        try {
            const { address, password } = JSON.parse(stored);
            authToken = await getToken(address, password);
            updateEmailDisplay(address);
            refreshBtn.disabled = false;
            await refreshInbox();
        } catch {
            localStorage.removeItem('tempMailCredentials');
        }
    }
}

init();
