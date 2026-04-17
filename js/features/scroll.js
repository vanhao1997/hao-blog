/**
 * Scroll Features — Animations, Header Effect, Back to Top, Smooth Scroll
 */
const ScrollFeature = {
    init() {
        this.initScrollAnimations();
        this.initHeaderEffect();
        this.initBackToTop();
        this.initSmoothScroll();
        this.initStaggerChildren();
        this.initLazyLoading();
        this.initPageTransition();
    },

    initScrollAnimations() {
        const scrollElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right');
        if (scrollElements.length === 0) return;

        const handleScroll = () => {
            scrollElements.forEach(el => {
                const top = el.getBoundingClientRect().top;
                if (top <= window.innerHeight * 0.85) {
                    el.classList.add('visible');
                }
            });
        };

        handleScroll(); // Initial check
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => { handleScroll(); ticking = false; });
                ticking = true;
            }
        });
    },

    initHeaderEffect() {
        const header = document.querySelector('.header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            header.style.boxShadow = window.pageYOffset > 100
                ? '0 4px 20px rgba(0, 0, 0, 0.1)'
                : 'none';
        });
    },

    initBackToTop() {
        const btn = document.createElement('button');
        btn.id = 'backToTop';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Lên đầu trang');
        document.body.appendChild(btn);

        const style = document.createElement('style');
        style.textContent = `
            #backToTop {
                position:fixed;bottom:32px;right:32px;z-index:9990;
                width:48px;height:48px;border-radius:14px;
                background:var(--color-primary,#22C55E);color:#fff;
                border:3px solid var(--color-black,#1F2937);
                box-shadow:4px 4px 0 var(--color-black,#1F2937);
                font-size:1.3rem;font-weight:700;cursor:pointer;
                opacity:0;visibility:hidden;transition:all .3s ease;font-family:inherit;
            }
            #backToTop.visible{opacity:1;visibility:visible}
            #backToTop:hover{transform:translateY(-3px);box-shadow:4px 7px 0 var(--color-black,#1F2937)}
        `;
        document.head.appendChild(style);

        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                    window.scrollTo({
                        top: target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },

    initStaggerChildren() {
        const containers = document.querySelectorAll('.stagger-children');
        if (containers.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.2 });

        containers.forEach(c => observer.observe(c));
    },

    initLazyLoading() {
        // data-src lazy loading
        const images = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        obs.unobserve(img);
                    }
                });
            });
            images.forEach(img => observer.observe(img));
        } else {
            images.forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
        }

        // Native lazy loading for all images
        document.querySelectorAll('img:not([loading])').forEach(img => {
            img.setAttribute('loading', 'lazy');
        });
    },

    initPageTransition() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        setTimeout(() => { document.body.style.opacity = '1'; }, 50);
    }
};

window.ScrollFeature = ScrollFeature;
