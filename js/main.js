/* ============================================
   NGUYỄN VĂN HẢO — CLAY BLOG
   Main JavaScript (Controller)
   ============================================
   
   This file initializes all feature modules.
   Actual logic lives in js/core/ and js/features/.
   ============================================ */

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { });
  });
}

// Initialize all features on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Core features (every page)
  if (typeof GlobalSettings !== 'undefined') GlobalSettings.init();
  if (typeof MenuFeature !== 'undefined') MenuFeature.init();
  if (typeof ScrollFeature !== 'undefined') ScrollFeature.init();
  if (typeof ModalFeature !== 'undefined') ModalFeature.init();
  if (typeof NewsletterFeature !== 'undefined') NewsletterFeature.init();
  if (typeof HeroFeature !== 'undefined') HeroFeature.init();
});

// Console Easter Egg
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

// === Global Settings Injector ===
const GlobalSettings = {
  async init() {
    try {
      const res = await fetch('/api/settings.php');
      const result = await res.json();

      if (result.success && result.data) {
        this.applySettings(result.data);
      }
    } catch (e) {
      console.error('Failed to load global settings:', e);
    }
  },

  applySettings(settings) {
    // 1. Header Menu
    if (settings.header_menu) {
      try {
        const navList = document.getElementById('navList');
        if (navList) {
          const menuItems = JSON.parse(settings.header_menu);
          const currentPath = window.location.pathname;

          // Ensure "Dự án" is always present in the menu
          const hasShowcase = menuItems.some(item => item.url === '/showcase');
          if (!hasShowcase) {
            menuItems.push({ name: 'Dự án', url: '/showcase' });
          }

          navList.innerHTML = menuItems.map(item => {
            const isActive = currentPath === item.url || (item.url !== '/' && currentPath.startsWith(item.url));
            return `<li><a href="${item.url}" class="nav-link ${isActive ? 'active' : ''}">${Utils.escapeHTML(item.name)}</a></li>`;
          }).join('');
        }
      } catch (e) { console.error('Menu parse error', e); }
    }

    // 2. Footer Info
    if (settings.footer_info) {
      try {
        const columns = document.querySelectorAll('.footer-column');
        if (columns.length >= 2) {
          const contactCol = Array.from(columns).find(col => {
            const h4 = col.querySelector('h4');
            return h4 && (h4.textContent.includes('Liên hệ') || h4.textContent.includes('Contact'));
          });

          if (contactCol) {
            const ul = contactCol.querySelector('ul');
            const info = JSON.parse(settings.footer_info);
            if (ul && info) {
              ul.innerHTML = `
                                <li>${Utils.escapeHTML(info.contact || '')}</li>
                                <li>Zalo: ${Utils.escapeHTML(info.zalo || '')}</li>
                                <li>${Utils.escapeHTML(info.address || '')}</li>
                            `;
            }
          }
        }
      } catch (e) { console.error('Footer info parse error', e); }
    }

    // 3. Custom Scripts injected to head
    if (settings.custom_scripts && settings.custom_scripts.trim() !== '') {
      try {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = settings.custom_scripts;
        Array.from(wrapper.childNodes).forEach(node => {
          if (node.tagName === 'SCRIPT') {
            const script = document.createElement('script');
            if (node.src) script.src = node.src;
            script.textContent = node.textContent;
            document.head.appendChild(script);
          } else if (node.nodeType === 1 || node.nodeType === 8) { // Element or Comment
            document.head.appendChild(node.cloneNode(true));
          }
        });
      } catch (e) { console.error('Custom script injection error', e); }
    }
  }
};

window.GlobalSettings = GlobalSettings;
