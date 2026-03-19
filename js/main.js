/* ============================================
   NGUYỄN VĂN HẢO - CLAY BLOG
   Main JavaScript
   ============================================ */

// ============================================
// 1. MOBILE MENU TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const menuToggle = document.getElementById('menuToggle');
  const navList = document.getElementById('navList');

  if (menuToggle && navList) {
    menuToggle.addEventListener('click', function () {
      navList.classList.toggle('active');
      menuToggle.classList.toggle('active');

      // Animate hamburger to X
      const spans = menuToggle.querySelectorAll('span');
      if (navList.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Close menu when clicking on a link
    const navLinks = navList.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        navList.classList.remove('active');
        menuToggle.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      });
    });
  }
});

// ============================================
// 2. POST FILTERING
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const posts = document.querySelectorAll('.post-card-link-wrapper[data-category]');

  if (filterButtons.length > 0 && posts.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function () {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');

        const category = this.getAttribute('data-category');

        posts.forEach(post => {
          const postCategory = post.getAttribute('data-category');

          if (category === 'all' || postCategory === category) {
            post.style.display = 'block';
            post.style.opacity = '0';
            post.style.transform = 'translateY(20px)';

            setTimeout(() => {
              post.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
              post.style.opacity = '1';
              post.style.transform = 'translateY(0)';
            }, 50);
          } else {
            post.style.display = 'none';
          }
        });
      });
    });
  }
});

// ============================================
// 3. CONTACT MODAL
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const contactBtn = document.getElementById('contactBtn');
  const contactModal = document.getElementById('contactModal');
  const modalClose = document.getElementById('modalClose');
  const modalContactForm = document.getElementById('modalContactForm');

  // Open modal
  if (contactBtn && contactModal) {
    contactBtn.addEventListener('click', function (e) {
      e.preventDefault();
      contactModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal
  if (modalClose && contactModal) {
    modalClose.addEventListener('click', function () {
      contactModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close on overlay click
  if (contactModal) {
    contactModal.addEventListener('click', function (e) {
      if (e.target === contactModal) {
        contactModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Close on ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
      contactModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Modal form submission handled by Formspree
  /*
  if (modalContactForm) {
    modalContactForm.addEventListener('submit', function (e) {
      // Allow native submission to Formspree
    });
  }
  */
});

// ============================================
// 4. THEME: LIGHT MODE ONLY
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const html = document.documentElement;

  // Force light mode only — clear any saved dark preference
  localStorage.removeItem('theme');
  html.setAttribute('data-theme', 'light');
});

// ============================================
// 5. CLEANUP OLD SETTINGS (Force Vietnamese)
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  // Clear any old language settings
  localStorage.removeItem('lang');
});


// ============================================
// 5. LOGO
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  // Danh sách logo (Bạn có thể thay link ảnh nếu muốn)
  const brandLogos = [
    { name: 'Facebook', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' },
    { name: 'GoogleAds', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg' },
    { name: 'ChatGPT', url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
    { name: 'Gemini', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg' },
    { name: 'TikTok', url: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg' },
    { name: 'Zalo', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg' },
    { name: 'AIStuido', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Google_AI_Studio_icon_%28July_2025%29.svg' },
    { name: 'Deepseek', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/DeepSeek_logo.svg' },
    { name: 'Youtube', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg' },
    { name: 'Meta', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
    { name: 'Claude', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg' }
  ];

  const elements = document.querySelectorAll('.js-random-logo');

  // 4 Vị trí góc cực kỳ sát với ảnh trung tâm
  const fixedPositions = [
    { top: '-20px', left: '-20px' },
    { top: '-20px', right: '-20px' },
    { bottom: '-15px', left: '-15px' },
    { bottom: '-15px', right: '-15px' }
  ];

  // Trộn ngẫu nhiên vị trí và logo
  const shuffledPositions = [...fixedPositions].sort(() => 0.5 - Math.random());
  const shuffledLogos = [...brandLogos].sort(() => 0.5 - Math.random());

  elements.forEach((el, index) => {
    if (index >= fixedPositions.length) return;

    const pos = shuffledPositions[index];
    const logo = shuffledLogos[index];

    // 1. Gán vị trí
    el.style.top = 'auto'; el.style.bottom = 'auto'; el.style.left = 'auto'; el.style.right = 'auto';
    Object.keys(pos).forEach(key => el.style[key] = pos[key]);

    // 2. Chèn logo vào trong
    el.innerHTML = `<img src="${logo.url}" alt="${logo.name}" title="${logo.name}">`;

    // 3. Animation Delay khác nhau cho mỗi cái
    el.style.animationDelay = (index * 0.7) + 's';

    // 4. (Tùy chọn) Thêm màu nền nhẹ theo brand
    if (logo.name === 'Facebook') el.style.backgroundColor = '#e7f3ff';
    if (logo.name === 'ChatGPT') el.style.backgroundColor = '#f0fff4';
    if (logo.name === 'Google') el.style.backgroundColor = '#fff5f5';
  });
});

// ============================================
// 6. SCROLL ANIMATIONS
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const scrollElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right');

  const elementInView = (el, percentageScroll = 100) => {
    const elementTop = el.getBoundingClientRect().top;
    return (
      elementTop <=
      ((window.innerHeight || document.documentElement.clientHeight) * (percentageScroll / 100))
    );
  };

  const displayScrollElement = (element) => {
    element.classList.add('visible');
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el, 85)) {
        displayScrollElement(el);
      }
    });
  };

  // Initial check
  handleScrollAnimation();

  // Add scroll listener with throttle
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScrollAnimation();
        ticking = false;
      });
      ticking = true;
    }
  });
});

// ============================================
// 7. NEWSLETTER FORM
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const newsletterForm = document.getElementById('newsletterForm');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = this.querySelector('input[type="email"]');
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      // Show loading state
      submitBtn.innerHTML = 'Đang xử lý...';
      submitBtn.disabled = true;

      // Simulate form submission
      setTimeout(() => {
        // Success state
        submitBtn.innerHTML = 'Đã đăng ký!';
        submitBtn.style.background = 'var(--color-primary)';
        emailInput.value = '';

        // Reset after 3 seconds
        setTimeout(() => {
          submitBtn.innerHTML = originalBtnText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }
});

// ============================================
// 8. CONTACT FORM (Contact Page)
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contactForm');

  // Contact form submission handled by Formspree
  /*
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
       // Allow native submission
    });
  }
  */
});

// ============================================
// 9. SMOOTH SCROLL
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // Skip if it's just "#"
      if (href === '#') return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();

        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});

// ============================================
// 10. BUTTON RIPPLE EFFECT
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(button => {
    button.addEventListener('click', function (e) {
      // Add press animation
      this.style.transform = 'translate(2px, 2px)';
      this.style.boxShadow = '2px 2px 0px var(--color-black)';

      setTimeout(() => {
        this.style.transform = '';
        this.style.boxShadow = '';
      }, 150);
    });
  });
});

// ============================================
// 11. HEADER SCROLL EFFECT
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
      header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });
});

// ============================================
// 12. LAZY LOADING IMAGES
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const images = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.dataset.src;
          image.removeAttribute('data-src');
          imageObserver.unobserve(image);
        }
      });
    });

    images.forEach(image => {
      imageObserver.observe(image);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    images.forEach(image => {
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    });
  }
});

// ============================================
// 13. PAGE TRANSITION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  // Add fade-in effect on page load
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.3s ease';

  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 50);
});

// ============================================
// 14. STAGGER ANIMATION FOR CHILDREN
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const staggerContainers = document.querySelectorAll('.stagger-children');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  staggerContainers.forEach(container => {
    observer.observe(container);
  });
});

// ============================================
// 15. CONSOLE EASTER EGG
// ============================================
console.log(`
%c███╗   ██╗██╗   ██╗██╗  ██╗
%c████╗  ██║██║   ██║██║  ██║
%c██╔██╗ ██║██║   ██║███████║
%c██║╚██╗██║╚██╗ ██╔╝██╔══██║
%c██║ ╚████║ ╚████╔╝ ██║  ██║
%c╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝

%cNguyễn Văn Hảo — Digital Marketing Blog
%cMade in Vietnam
%ccontact@nguyenvanhao.name.vn
`,
  'color: #22C55E; font-weight: bold;',
  'color: #22C55E; font-weight: bold;',
  'color: #22C55E; font-weight: bold;',
  'color: #22C55E; font-weight: bold;',
  'color: #22C55E; font-weight: bold;',
  'color: #22C55E; font-weight: bold;',
  'color: #1F2937; font-size: 14px; font-weight: bold;',
  'color: #6B7280; font-size: 12px;',
  'color: #6B7280; font-size: 12px;'
);
