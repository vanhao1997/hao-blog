/**
 * Social Share Buttons — Hao Blog
 * Renders floating share buttons on single post pages
 */
(function () {
    // Only activate on post pages
    if (!document.querySelector('.post-content')) return;

    const style = document.createElement('style');
    style.textContent = `
    .social-share-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 999;
    }

    .share-btn {
      width: 44px;
      height: 44px;
      border: 2px solid var(--color-black, #1F2937);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.2rem;
      box-shadow: 3px 3px 0px var(--color-black, #1F2937);
      transition: all 0.2s ease;
      text-decoration: none;
      color: white;
    }
    .share-btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0px var(--color-black, #1F2937);
    }

    .share-btn.facebook { background: #1877F2; }
    .share-btn.twitter { background: #0F1419; }
    .share-btn.linkedin { background: #0A66C2; }
    .share-btn.zalo { background: #0068FF; font-size: 0.65rem; font-weight: 700; }
    .share-btn.copy-link { background: var(--color-primary, #22C55E); }

    .share-btn.copy-link.copied {
      background: #16A34A;
    }

    .share-toggle {
      width: 48px;
      height: 48px;
      border: 3px solid var(--color-black, #1F2937);
      border-radius: 14px;
      background: var(--color-white, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.3rem;
      box-shadow: 3px 3px 0px var(--color-black, #1F2937);
      transition: all 0.2s ease;
    }
    .share-toggle:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0px var(--color-black, #1F2937);
      background: var(--color-primary, #22C55E);
    }

    .share-buttons {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, opacity 0.3s ease;
      opacity: 0;
    }
    .share-buttons.open {
      max-height: 300px;
      opacity: 1;
    }

    @media (max-width: 768px) {
      .social-share-bar {
        bottom: 12px;
        right: 12px;
      }
      .share-btn {
        width: 38px;
        height: 38px;
        font-size: 1rem;
        border-radius: 10px;
      }
      .share-toggle {
        width: 42px;
        height: 42px;
      }
    }

    [data-theme="dark"] .share-toggle {
      background: #1E293B;
      border-color: #475569;
      box-shadow: 3px 3px 0px #475569;
    }
    [data-theme="dark"] .share-btn {
      border-color: #475569;
      box-shadow: 3px 3px 0px #475569;
    }
  `;
    document.head.appendChild(style);

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const bar = document.createElement('div');
    bar.className = 'social-share-bar';
    bar.innerHTML = `
    <div class="share-buttons" id="shareButtons">
      <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" class="share-btn facebook" title="Chia sẻ Facebook">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href="https://twitter.com/intent/tweet?url=${url}&text=${title}" target="_blank" class="share-btn twitter" title="Chia sẻ Twitter/X">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" class="share-btn linkedin" title="Chia sẻ LinkedIn">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="https://zalo.me/share?u=${url}" target="_blank" class="share-btn zalo" title="Chia sẻ Zalo">Zalo</a>
      <button class="share-btn copy-link" id="copyLinkBtn" title="Sao chép link">🔗</button>
    </div>
    <button class="share-toggle" id="shareToggle" title="Chia sẻ bài viết">📤</button>
  `;
    document.body.appendChild(bar);

    // Toggle share buttons
    const toggle = document.getElementById('shareToggle');
    const buttons = document.getElementById('shareButtons');
    toggle.addEventListener('click', () => {
        buttons.classList.toggle('open');
        toggle.innerHTML = buttons.classList.contains('open') ? '✕' : '📤';
    });

    // Copy link
    document.getElementById('copyLinkBtn').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const btn = document.getElementById('copyLinkBtn');
            btn.innerHTML = '✅';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = '🔗';
                btn.classList.remove('copied');
            }, 2000);
        } catch (e) {
            // Fallback
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }
    });
})();
