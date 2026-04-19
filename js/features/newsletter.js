/**
 * Newsletter Form — Feature Module
 */
const NewsletterFeature = {
    init() {
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
    }
};

window.NewsletterFeature = NewsletterFeature;

