/**
 * Newsletter Form — Feature Module
 */
const NewsletterFeature = {
    init() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'Đang xử lý...';
            submitBtn.disabled = true;

            // TODO: Replace with actual API call
            setTimeout(() => {
                submitBtn.innerHTML = 'Đã đăng ký!';
                submitBtn.style.background = 'var(--color-primary)';
                emailInput.value = '';

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }
};

window.NewsletterFeature = NewsletterFeature;
