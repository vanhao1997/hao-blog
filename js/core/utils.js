/**
 * ==========================================================================
 * SHARED UTILITIES — Hao Blog
 * ==========================================================================
 * Tất cả utility functions dùng chung giữa các pages.
 * Import: <script src="/js/core/utils.js"></script>
 * Usage: Utils.formatDate(date), Utils.slugify(text), etc.
 */

const Utils = {
    /**
     * Format date string to Vietnamese locale
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Check if a hex color is light or dark
     * @param {string} color - Hex color (e.g., '#22C55E')
     * @returns {boolean} true if light
     */
    isLightColor(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 155;
    },

    /**
     * Convert text to URL-friendly slug
     * @param {string} text - Input text
     * @returns {string} Slugified text
     */
    slugify(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/[\s_]+/g, '-') // Spaces to hyphens
            .replace(/-+/g, '-') // Collapse multiple hyphens
            .replace(/^-|-$/g, ''); // Trim hyphens
    },

    /**
     * Animate a number counting up
     * @param {string} elementId - DOM element ID
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateValue(elementId, start, end, duration) {
        const obj = document.getElementById(elementId);
        if (!obj) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    },

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - Raw string
     * @returns {string} Escaped string
     */
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
};

// Export globally
window.Utils = Utils;

// Legacy compatibility — keep old global functions working
window.formatDate = Utils.formatDate;
window.isLightColor = Utils.isLightColor;
window.slugify = Utils.slugify;
window.animateValue = Utils.animateValue;
