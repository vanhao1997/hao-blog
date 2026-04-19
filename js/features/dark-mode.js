/**
 * Dark Mode Toggle — Hao Blog
 * Saves preference to localStorage
 */
(function () {
    const STORAGE_KEY = 'hao-blog-theme';

    // Check saved preference or system preference
    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateToggleIcon(theme);
    }

    function updateToggleIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    // Apply theme immediately (before DOM loads to prevent flash)
    setTheme(getPreferredTheme());

    // Wait for DOM, then create toggle button
    function initToggle() {
        // Create toggle button
        const btn = document.createElement('button');
        btn.id = 'themeToggle';
        btn.className = 'theme-toggle';
        btn.innerHTML = getPreferredTheme() === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            setTheme(current === 'dark' ? 'light' : 'dark');
        });

        // Insert into header nav (before search trigger if exists)
        const nav = document.querySelector('.header-inner .nav');
        if (nav) {
            const searchBtn = nav.querySelector('.search-trigger');
            if (searchBtn) {
                nav.insertBefore(btn, searchBtn);
            } else {
                nav.insertBefore(btn, nav.firstChild);
            }
        }
    }

    // Inject CSS for toggle button + dark theme
    const style = document.createElement('style');
    style.textContent = `
    .theme-toggle {
      width: 36px;
      height: 36px;
      border: 2px solid var(--color-black, #1F2937);
      border-radius: 10px;
      background: var(--color-white, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      box-shadow: 2px 2px 0px var(--color-black, #1F2937);
      transition: all 0.15s ease;
    }
    .theme-toggle:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0px var(--color-black, #1F2937);
    }

    /* ============================
       DARK THEME OVERRIDES
       ============================ */
    [data-theme="dark"] {
      --color-background: #0F172A;
      --color-white: #1E293B;
      --color-black: #E2E8F0;
      --color-gray-light: #334155;
      --color-gray: #94A3B8;
      --color-gray-dark: #CBD5E1;
      --color-primary: #4ADE80;
      --color-primary-hover: #22C55E;
    }

    [data-theme="dark"] body {
      background: #0F172A;
      color: #E2E8F0;
    }

    [data-theme="dark"] .header {
      background: rgba(15, 23, 42, 0.95);
      border-color: #334155;
    }

    [data-theme="dark"] .clay-card,
    [data-theme="dark"] .post-card {
      background: #1E293B;
      border-color: #475569;
      box-shadow: 4px 4px 0px #475569;
    }

    [data-theme="dark"] .post-card:hover {
      box-shadow: 6px 6px 0px #4ADE80;
    }

    [data-theme="dark"] .post-card-body {
      background: #1E293B;
    }

    [data-theme="dark"] .post-card-title,
    [data-theme="dark"] h1, [data-theme="dark"] h2,
    [data-theme="dark"] h3, [data-theme="dark"] h4 {
      color: #F1F5F9;
    }

    [data-theme="dark"] .post-card-excerpt {
      color: #94A3B8;
    }

    [data-theme="dark"] .nav-link {
      color: #CBD5E1;
    }
    [data-theme="dark"] .nav-link:hover,
    [data-theme="dark"] .nav-link.active {
      color: #4ADE80;
    }

    [data-theme="dark"] .logo {
      color: #F1F5F9;
    }

    [data-theme="dark"] .logo-icon {
      background: #4ADE80;
      border-color: #E2E8F0;
      color: #0F172A;
    }

    [data-theme="dark"] .btn-primary {
      background: #4ADE80;
      color: #0F172A;
      border-color: #4ADE80;
    }

    [data-theme="dark"] .section-badge {
      border-color: #475569;
    }

    [data-theme="dark"] .tag {
      border-color: #475569;
    }

    [data-theme="dark"] .hero {
      background: #0F172A;
    }

    [data-theme="dark"] .hero-title {
      color: #F1F5F9;
    }

    [data-theme="dark"] .text-gradient {
      background: linear-gradient(135deg, #4ADE80, #22D3EE);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    [data-theme="dark"] .hero-stat-number {
      color: #4ADE80;
    }

    [data-theme="dark"] .filter-btn {
      background: #1E293B;
      border-color: #475569;
      color: #CBD5E1;
    }
    [data-theme="dark"] .filter-btn.active,
    [data-theme="dark"] .filter-btn:hover {
      background: #4ADE80;
      color: #0F172A;
      border-color: #4ADE80;
    }

    [data-theme="dark"] .footer {
      background: #020617;
    }

    [data-theme="dark"] .newsletter {
      background: #0F172A;
    }

    [data-theme="dark"] .newsletter-card {
      background: linear-gradient(135deg, #1E293B, #334155) !important;
      border-color: #475569;
    }

    [data-theme="dark"] .skill-badge {
      background: #1E293B;
      border-color: #475569;
      color: #CBD5E1;
      box-shadow: 3px 3px 0px #475569;
    }

    [data-theme="dark"] .about-intro,
    [data-theme="dark"] .section-description,
    [data-theme="dark"] .hero-description {
      color: #94A3B8;
    }

    [data-theme="dark"] .theme-toggle {
      background: #1E293B;
      border-color: #475569;
      box-shadow: 2px 2px 0px #475569;
    }

    [data-theme="dark"] .search-trigger {
      background: #1E293B;
      border-color: #475569;
      box-shadow: 2px 2px 0px #475569;
    }

    [data-theme="dark"] .menu-toggle span {
      background: #E2E8F0;
    }

    /* Dark mode for post page */
    [data-theme="dark"] .post-content {
      color: #CBD5E1;
    }

    [data-theme="dark"] .post-content a {
      color: #4ADE80;
    }

    [data-theme="dark"] .post-content pre,
    [data-theme="dark"] .post-content code {
      background: #0F172A;
      border-color: #334155;
    }

    [data-theme="dark"] .post-content blockquote {
      border-left-color: #4ADE80;
      background: rgba(74, 222, 128, 0.05);
    }

    [data-theme="dark"] .toc-sidebar {
      background: #1E293B;
      border-color: #475569;
    }

    [data-theme="dark"] .toc-link {
      color: #94A3B8;
    }
    [data-theme="dark"] .toc-link:hover,
    [data-theme="dark"] .toc-link.active {
      color: #4ADE80;
    }

    /* Search modal dark mode */
    [data-theme="dark"] .search-modal {
      background: #1E293B;
      border-color: #475569;
      box-shadow: 8px 8px 0px #475569;
    }
    [data-theme="dark"] .search-header {
      border-color: #475569;
    }
    [data-theme="dark"] #searchInput {
      color: #F1F5F9;
    }
    [data-theme="dark"] .search-close {
      background: #334155;
      border-color: #475569;
      color: #CBD5E1;
    }
    [data-theme="dark"] .search-result-item:hover {
      background: rgba(74, 222, 128, 0.08);
    }
    [data-theme="dark"] .search-result-title {
      color: #F1F5F9;
    }
    [data-theme="dark"] .search-result-thumb {
      border-color: #475569;
    }
  `;
    document.head.appendChild(style);

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggle);
    } else {
        initToggle();
    }
})();
