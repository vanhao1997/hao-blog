/**
 * Newsletter Form — Feature Module
 */
const NewsletterFeature = {
    init() {
        this.initSidebarForm();
        this.initLeadMagnet();
    },

    initSidebarForm() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const email = emailInput.value.trim();

            if (!email) return;

            submitBtn.innerHTML = 'Đang xử lý...';
            submitBtn.disabled = true;

            try {
                const res = await fetch('/api/newsletter.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    submitBtn.innerHTML = '✅ Đã đăng ký!';
                    submitBtn.style.background = 'var(--color-primary)';
                    emailInput.value = '';
                } else {
                    submitBtn.innerHTML = '❌ ' + (data.error || 'Lỗi');
                    submitBtn.style.background = '#EF4444';
                }
            } catch (err) {
                submitBtn.innerHTML = '❌ Lỗi kết nối';
                submitBtn.style.background = '#EF4444';
            }

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        });
    },

    initLeadMagnet() {
        // Prevent showing on admin pages or if already seen
        if (window.location.pathname.startsWith('/admin')) return;
        if (localStorage.getItem('leadMagnetSeen') === 'true') return;

        let hasTriggered = false;

        const showModal = () => {
            if (hasTriggered) return;
            hasTriggered = true;
            localStorage.setItem('leadMagnetSeen', 'true');

            const modalHtml = `
                <div id="leadMagnetModal" class="modal-overlay" style="display: flex; z-index: 99999;">
                    <div class="modal-content" style="max-width: 450px; text-align: center; position: relative;">
                        <button class="modal-close" onclick="document.getElementById('leadMagnetModal').remove()">✕</button>
                        <div style="font-size: 3.5rem; margin-bottom: 16px;">🎁</div>
                        <h3 style="font-size: 1.5rem; font-family: var(--font-heading); margin-bottom: 12px; color: var(--color-text);">Tải miễn phí E-book!</h3>
                        <p style="color: #64748b; margin-bottom: 24px; font-size: 0.95rem; line-height: 1.6;">Nhận trọn bộ cẩm nang <strong>Performance Marketing & Tối ưu Chuyển đổi 2026</strong>. Nhập email để nhận ngay qua hòm thư.</p>
                        <form id="leadMagnetForm" style="display: flex; flex-direction: column; gap: 12px;">
                            <input type="email" placeholder="Nhập địa chỉ email của bạn..." required class="form-input" style="width:100%; border-radius: 8px;">
                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 8px;">Gửi tài liệu cho tôi →</button>
                        </form>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Hide scrollbar but keep layout intact
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + 'px';

            const cleanupModal = () => {
                const modal = document.getElementById('leadMagnetModal');
                if (modal) modal.remove();
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            };

            // Override original inline close button onclick
            document.querySelector('#leadMagnetModal .modal-close').onclick = cleanupModal;

            const lmForm = document.getElementById('leadMagnetForm');
            lmForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = lmForm.querySelector('button');
                const email = lmForm.querySelector('input').value.trim();
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Đang gửi...';
                btn.disabled = true;

                try {
                    const res = await fetch('/api/newsletter.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    if (res.ok) {
                        btn.innerHTML = '✅ Đã gửi thành công!';
                        btn.style.background = 'var(--color-primary)';
                        setTimeout(cleanupModal, 2000);
                    } else {
                        btn.innerHTML = '❌ Email đã đăng ký';
                        btn.style.background = '#EF4444';
                        setTimeout(() => { btn.innerHTML = originalText; btn.style.background = ''; btn.disabled = false; }, 2000);
                    }
                } catch (err) {
                    btn.innerHTML = '❌ Lỗi kết nối';
                    btn.style.background = '#EF4444';
                    setTimeout(() => { btn.innerHTML = originalText; btn.style.background = ''; btn.disabled = false; }, 2000);
                }
            });

            // Close on background click
            document.getElementById('leadMagnetModal').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) cleanupModal();
            });
        };

        // Trigger on exit intent (mouse cursor moves above browser viewport)
        document.addEventListener('mouseout', (e) => {
            if (e.clientY < 10 && e.relatedTarget == null && !hasTriggered) {
                showModal();
            }
        });

        // Fallback Trigger: 15 seconds reading time
        setTimeout(() => {
            if (!hasTriggered) {
                showModal();
            }
        }, 15000);
    }
};

window.NewsletterFeature = NewsletterFeature;

