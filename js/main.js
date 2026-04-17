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
