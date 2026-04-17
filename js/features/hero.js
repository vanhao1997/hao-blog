/**
 * Hero Effects — Logo floating, Text Scramble, Button Ripple
 */
const HeroFeature = {
    init() {
        this.initFloatingLogos();
        this.initTextScramble();
        this.initButtonRipple();
        this.initTheme();
    },

    initFloatingLogos() {
        const brandLogos = [
            { name: 'Facebook', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' },
            { name: 'GoogleAds', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg' },
            { name: 'ChatGPT', url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
            { name: 'Gemini', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg' },
            { name: 'TikTok', url: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg' },
            { name: 'Zalo', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg' },
            { name: 'AIStudio', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Google_AI_Studio_icon_%28July_2025%29.svg' },
            { name: 'Deepseek', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/DeepSeek_logo.svg' },
            { name: 'Youtube', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg' },
            { name: 'Meta', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
            { name: 'Claude', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg' }
        ];

        const elements = document.querySelectorAll('.js-random-logo');
        const positions = [
            { top: '-20px', left: '-20px' },
            { top: '-20px', right: '-20px' },
            { bottom: '-15px', left: '-15px' },
            { bottom: '-15px', right: '-15px' }
        ];

        const shuffledPositions = [...positions].sort(() => 0.5 - Math.random());
        const shuffledLogos = [...brandLogos].sort(() => 0.5 - Math.random());

        elements.forEach((el, index) => {
            if (index >= positions.length) return;
            const pos = shuffledPositions[index];
            const logo = shuffledLogos[index];

            el.style.top = 'auto'; el.style.bottom = 'auto'; el.style.left = 'auto'; el.style.right = 'auto';
            Object.keys(pos).forEach(key => el.style[key] = pos[key]);
            el.innerHTML = `<img src="${logo.url}" alt="${logo.name}" title="${logo.name}">`;
            el.style.animationDelay = (index * 0.7) + 's';

            if (logo.name === 'Facebook') el.style.backgroundColor = '#e7f3ff';
            if (logo.name === 'ChatGPT') el.style.backgroundColor = '#f0fff4';
            if (logo.name === 'Google') el.style.backgroundColor = '#fff5f5';
        });
    },

    initTextScramble() {
        const el = document.getElementById('heroAccent');
        if (!el) return;

        const chars = 'abcdefghijklmnopqrstuvwxyz!@#$%&*';
        const finalText = el.textContent;
        el.textContent = '';

        setTimeout(() => {
            const length = finalText.length;
            const queue = [];
            for (let i = 0; i < length; i++) {
                queue.push({
                    from: '', to: finalText[i] || '',
                    start: Math.floor(Math.random() * 50),
                    end: Math.floor(Math.random() * 50) + Math.floor(Math.random() * 50)
                });
            }

            let frame = 0;
            function update() {
                let output = '';
                let complete = 0;
                for (let i = 0; i < queue.length; i++) {
                    let { from, to, start, end, char } = queue[i];
                    if (frame >= end) { complete++; output += to; }
                    else if (frame >= start) {
                        if (!char || Math.random() < 0.18) {
                            char = chars[Math.floor(Math.random() * chars.length)];
                            queue[i].char = char;
                        }
                        output += char;
                    } else { output += from; }
                }
                el.textContent = output;
                if (complete < queue.length) { requestAnimationFrame(update); frame++; }
            }
            requestAnimationFrame(update);
        }, 800);
    },

    initButtonRipple() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', function () {
                this.style.transform = 'translate(2px, 2px)';
                this.style.boxShadow = '2px 2px 0px var(--color-black)';
                setTimeout(() => { this.style.transform = ''; this.style.boxShadow = ''; }, 150);
            });
        });
    },

    initTheme() {
        // Force light mode only
        localStorage.removeItem('theme');
        localStorage.removeItem('lang');
        document.documentElement.setAttribute('data-theme', 'light');
    }
};

window.HeroFeature = HeroFeature;
