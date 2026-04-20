const TRANSLATIONS = {
    vi: {
        "nav_home": "🏠 Trang chủ",
        "nav_contact": "📞 Liên hệ",
        "nav_newsletter": "📨 Bản tin",
        "search_placeholder": "Tìm kiếm bài viết...",
        "popular_posts": "🔥 Bài viết nổi bật",
        "latest_posts": "🌟 Bài viết mới nhất",
        "footer_desc": "Chia sẻ kiến thức công nghệ, lập trình và kinh nghiệm phát triển phần mềm.",
        "subscribe": "Đăng ký nhận bài viết mới",
        "subscribe_btn": "Đăng ký",
        "email_placeholder": "Nhập email của bạn...",
        "read_more": "Đọc tiếp →",
        "post_not_found": "Không tìm thấy bài viết.",
        "contact_title": "📞 Liên Hệ Với Chúng Tôi",
        "contact_desc": "Để lại thông tin và lời nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.",
        "form_name": "Họ và tên *",
        "form_email": "Email *",
        "form_subject": "Chủ đề",
        "form_message": "Nội dung *",
        "form_submit": "Gửi Liên Hệ",
        "category_all": "Tất cả",
        "translated_by_ai": "Bài viết này được dịch tự động bởi AI",
        "tools": "🧰 Công cụ"
    },
    en: {
        "nav_home": "🏠 Home",
        "nav_contact": "📞 Contact",
        "nav_newsletter": "📨 Newsletter",
        "search_placeholder": "Search posts...",
        "popular_posts": "🔥 Popular",
        "latest_posts": "🌟 Latest Posts",
        "footer_desc": "Sharing tech knowledge, programming, and software development experiences.",
        "subscribe": "Subscribe for updates",
        "subscribe_btn": "Subscribe",
        "email_placeholder": "Enter your email...",
        "read_more": "Read more →",
        "post_not_found": "Post not found.",
        "contact_title": "📞 Contact Us",
        "contact_desc": "Leave your info and message, we will get back to you soon.",
        "form_name": "Full Name *",
        "form_email": "Email *",
        "form_subject": "Subject",
        "form_message": "Message *",
        "form_submit": "Send Message",
        "category_all": "All",
        "translated_by_ai": "This post was automatically translated by AI",
        "tools": "🧰 Tools"
    },
    fr: {
        "nav_home": "🏠 Accueil",
        "nav_contact": "📞 Contact",
        "nav_newsletter": "📨 Newsletter",
        "search_placeholder": "Rechercher...",
        "popular_posts": "🔥 Populaire",
        "latest_posts": "🌟 Derniers articles",
        "footer_desc": "Partage de connaissances technologiques, de programmation et d'expériences.",
        "subscribe": "Abonnez-vous aux mises à jour",
        "subscribe_btn": "S'abonner",
        "email_placeholder": "Entrez votre email...",
        "read_more": "Lire la suite →",
        "post_not_found": "Article introuvable.",
        "contact_title": "📞 Contactez-nous",
        "contact_desc": "Laissez vos informations et votre message, nous vous répondrons bientôt.",
        "form_name": "Nom complet *",
        "form_email": "Email *",
        "form_subject": "Sujet",
        "form_message": "Message *",
        "form_submit": "Envoyer",
        "category_all": "Tout",
        "translated_by_ai": "Cet article a été traduit automatiquement par l'IA",
        "tools": "🧰 Outils"
    },
    ja: {
        "nav_home": "🏠 ホーム",
        "nav_contact": "📞 連絡先",
        "nav_newsletter": "📨 ニュースレター",
        "search_placeholder": "検索...",
        "popular_posts": "🔥 人気記事",
        "latest_posts": "🌟 最新記事",
        "footer_desc": "テクノロジーの知識、プログラミング、ソフトウェア開発の経験を共有します。",
        "subscribe": "最新情報に登録",
        "subscribe_btn": "登録",
        "email_placeholder": "メールアドレス...",
        "read_more": "続きを読む →",
        "post_not_found": "記事が見つかりません。",
        "contact_title": "📞 お問い合わせ",
        "contact_desc": "情報とメッセージを残してください。すぐにお返事します。",
        "form_name": "氏名 *",
        "form_email": "メール *",
        "form_subject": "件名",
        "form_message": "メッセージ *",
        "form_submit": "送信",
        "category_all": "すべて",
        "translated_by_ai": "この記事はAIによって自動翻訳されました",
        "tools": "🧰 ツール"
    }
};

let currentLang = localStorage.getItem('blog_lang') || 'vi';

function switchLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem('blog_lang', lang);
    applyTranslations();

    // Dispatch event to re-fetch dynamic content if needed
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

function applyTranslations() {
    const dict = TRANSLATIONS[currentLang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder) el.placeholder = dict[key];
                if (el.type === 'submit' || el.type === 'button') el.value = dict[key];
            } else {
                el.innerHTML = dict[key];
            }
        }
    });

    // Update <html lang="x">
    document.documentElement.lang = currentLang;
}

// Attach directly on load
document.addEventListener('DOMContentLoaded', () => {
    // Generate markup for language switcher if #langSwitcherContainer exists
    const container = document.getElementById('langSwitcherContainer');
    if (container) {
        container.innerHTML = `
            <select id="langSelector" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9rem; background: #fff; cursor: pointer; color: #334155;">
                <option value="vi" ${currentLang === 'vi' ? 'selected' : ''}>🇻🇳 VI</option>
                <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
                <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
                <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>🇯🇵 JA</option>
            </select>
        `;
        document.getElementById('langSelector').addEventListener('change', (e) => {
            switchLanguage(e.target.value);
        });
    }

    applyTranslations();
});
