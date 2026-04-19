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
                    // Try to find the "Liên hệ" or "Contact" column
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
