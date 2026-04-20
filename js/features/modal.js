/**
 * Contact Modal — Feature Module
 */
const ModalFeature = {
    init() {
        const contactBtn = document.getElementById('contactBtn');
        const contactModal = document.getElementById('contactModal');
        const modalClose = document.getElementById('modalClose');
        const modalContactForm = document.getElementById('modalContactForm');

        const openModal = () => {
            if (!contactModal) return;
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            if (!contactModal) return;
            contactModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (contactBtn) contactBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (contactModal) {
            contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeModal(); });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && contactModal?.classList.contains('active')) closeModal();
        });

        // Modal form submission
        if (modalContactForm) {
            modalContactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = modalContactForm.querySelector('button[type="submit"]');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang gửi...'; }

                try {
                    const res = await fetch('/api/contact.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: modalContactForm.querySelector('[name="name"]')?.value || 'Khách',
                            email: modalContactForm.querySelector('[name="email"]')?.value || '',
                            subject: modalContactForm.querySelector('[name="subject"]')?.value || 'Liên hệ nhanh',
                            message: modalContactForm.querySelector('[name="message"]')?.value || ''
                        })
                    });
                    const data = await res.json();

                    if (data.success) {
                        modalContactForm.reset();
                        closeModal();
                        this.showThankYou();
                    } else {
                        throw new Error(data.error || 'Gửi thất bại');
                    }
                } catch (err) {
                    alert('❌ ' + (err.message || 'Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ qua email.'));
                }

                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Gửi tin nhắn →'; }
            });
        }
    },

    showThankYou() {
        const existing = document.getElementById('globalThankYouPopup');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'globalThankYouPopup';
        overlay.innerHTML = `
            <div class="ty-popup">
                <button class="ty-close">&times;</button>
                <div class="ty-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" stroke="#22C55E" stroke-width="4" fill="#22C55E" fill-opacity="0.1"/>
                        <path d="M20 33L28 41L44 23" stroke="#22C55E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="ty-check"/>
                    </svg>
                </div>
                <h3 class="ty-title">Cảm ơn bạn!</h3>
                <p class="ty-msg">Tin nhắn đã được gửi thành công.<br>Mình sẽ phản hồi sớm nhất có thể!</p>
                <button class="btn btn-primary btn-lg ty-ok">Tuyệt vời! ✨</button>
            </div>
        `;

        if (!document.getElementById('tyPopupStyles')) {
            const style = document.createElement('style');
            style.id = 'tyPopupStyles';
            style.textContent = `
                #globalThankYouPopup {
                    position:fixed;inset:0;z-index:99999;
                    background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);
                    display:flex;align-items:center;justify-content:center;
                    opacity:0;transition:opacity .3s ease;
                }
                #globalThankYouPopup.active{opacity:1}
                .ty-popup{
                    background:var(--color-white,#fff);border:3px solid var(--color-black,#1F2937);
                    border-radius:24px;padding:48px 40px;text-align:center;max-width:420px;width:90%;
                    box-shadow:8px 8px 0 var(--color-black,#1F2937);
                    transform:scale(.8);transition:transform .4s cubic-bezier(.34,1.56,.64,1);position:relative;
                }
                #globalThankYouPopup.active .ty-popup{transform:scale(1)}
                .ty-close{position:absolute;top:16px;right:20px;background:none;border:none;font-size:28px;cursor:pointer;color:var(--color-gray,#6B7280);line-height:1}
                .ty-close:hover{color:var(--color-black,#1F2937)}
                .ty-icon{margin-bottom:20px}
                .ty-check{stroke-dasharray:40;stroke-dashoffset:40;animation:tyDrawCheck .6s .3s ease forwards}
                @keyframes tyDrawCheck{to{stroke-dashoffset:0}}
                .ty-title{font-size:1.8rem;font-weight:700;margin-bottom:12px;color:var(--color-black,#1F2937)}
                .ty-msg{color:var(--color-gray,#6B7280);font-size:1rem;line-height:1.6;margin-bottom:28px}
                .ty-ok{width:100%;font-size:1.1rem}
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        const close = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };
        overlay.querySelector('.ty-close').addEventListener('click', close);
        overlay.querySelector('.ty-ok').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    }
};

window.ModalFeature = ModalFeature;
window.showThankYouPopup = ModalFeature.showThankYou.bind(ModalFeature);
