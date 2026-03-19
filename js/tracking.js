/**
 * ==========================================================================
 * TRACKING & ANALYTICS CONFIGURATION
 * ==========================================================================
 * File này chứa tất cả các tracking pixels và analytics code.
 * Chỉnh sửa các PIXEL_ID bên dưới để kích hoạt tracking.
 * 
 * Hướng dẫn:
 * 1. Thay thế 'YOUR_GTM_ID' bằng GTM Container ID (VD: GTM-XXXXXXX)
 * 2. Thay thế 'YOUR_FB_PIXEL_ID' bằng Facebook Pixel ID
 * 3. Thay thế 'YOUR_TIKTOK_PIXEL_ID' bằng TikTok Pixel ID  
 * 4. Thay thế 'YOUR_ZALO_OA_ID' bằng Zalo OA ID
 * 
 * Để tắt một pixel, đặt giá trị là null hoặc ''
 * ==========================================================================
 */

const TRACKING_CONFIG = {
    // Google Tag Manager - Quản lý tất cả tags tập trung
    gtm: {
        enabled: true,
        containerId: 'GTM-NZCL5K4D'
    },

    // Facebook/Meta Pixel
    facebook: {
        enabled: true,
        pixelId: '1211977667584398'
    },

    // TikTok Pixel
    tiktok: {
        enabled: true,
        pixelId: 'D64OLVBC77UBD797DEVG'
    },

    // Zalo Chat Widget
    zalo: {
        enabled: false, // Đặt true khi có OA ID
        oaId: 'YOUR_ZALO_OA_ID',
        welcomeMessage: 'Xin chào! Mình có thể giúp gì cho bạn?',
        autoPopup: 0, // 0 = tắt, 1 = bật
        width: 350,
        height: 420
    },

    // Google Analytics 4 (nếu không dùng GTM)
    ga4: {
        enabled: true,
        measurementId: 'G-NPYN1GBYQS' // VD: G-XXXXXXXXXX
    }
};

// ==========================================================================
// TRACKING INITIALIZATION - Không cần chỉnh sửa phần dưới
// ==========================================================================

(function () {
    'use strict';

    // Helper: Load external script
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        if (callback) script.onload = callback;
        document.head.appendChild(script);
    }

    // ==========================================================================
    // 1. GOOGLE TAG MANAGER
    // ==========================================================================
    if (TRACKING_CONFIG.gtm.enabled && TRACKING_CONFIG.gtm.containerId !== 'YOUR_GTM_ID') {
        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', TRACKING_CONFIG.gtm.containerId);

        // Add noscript iframe for GTM
        document.addEventListener('DOMContentLoaded', function () {
            const noscript = document.createElement('noscript');
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + TRACKING_CONFIG.gtm.containerId;
            iframe.height = '0';
            iframe.width = '0';
            iframe.style.display = 'none';
            iframe.style.visibility = 'hidden';
            noscript.appendChild(iframe);
            document.body.insertBefore(noscript, document.body.firstChild);
        });

        console.log('✅ GTM initialized:', TRACKING_CONFIG.gtm.containerId);
    }

    // ==========================================================================
    // 2. FACEBOOK PIXEL
    // ==========================================================================
    if (TRACKING_CONFIG.facebook.enabled && TRACKING_CONFIG.facebook.pixelId !== 'YOUR_FB_PIXEL_ID') {
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return;
            n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
            if (!f._fbq) f._fbq = n;
            n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
            t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', TRACKING_CONFIG.facebook.pixelId);
        fbq('track', 'PageView');

        // Add noscript pixel
        document.addEventListener('DOMContentLoaded', function () {
            const noscript = document.createElement('noscript');
            const img = document.createElement('img');
            img.height = 1;
            img.width = 1;
            img.style.display = 'none';
            img.src = 'https://www.facebook.net/tr?id=' + TRACKING_CONFIG.facebook.pixelId + '&ev=PageView&noscript=1';
            noscript.appendChild(img);
            document.body.appendChild(noscript);
        });

        console.log('✅ Facebook Pixel initialized:', TRACKING_CONFIG.facebook.pixelId);
    }

    // ==========================================================================
    // 3. TIKTOK PIXEL
    // ==========================================================================
    if (TRACKING_CONFIG.tiktok.enabled && TRACKING_CONFIG.tiktok.pixelId !== 'YOUR_TIKTOK_PIXEL_ID') {
        !function (w, d, t) {
            w.TiktokAnalyticsObject = t;
            var ttq = w[t] = w[t] || [];
            ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
            ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
            for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
            ttq.instance = function (t) {
                for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
                return e;
            };
            ttq.load = function (e, n) {
                var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i;
                ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
                ttq._o = ttq._o || {}; ttq._o[e] = n || {};
                var o = document.createElement("script");
                o.type = "text/javascript"; o.async = !0;
                o.src = i + "?sdkid=" + e + "&lib=" + t;
                var a = document.getElementsByTagName("script")[0];
                a.parentNode.insertBefore(o, a);
            };
            ttq.load(TRACKING_CONFIG.tiktok.pixelId);
            ttq.page();
        }(window, document, 'ttq');

        console.log('✅ TikTok Pixel initialized:', TRACKING_CONFIG.tiktok.pixelId);
    }

    // ==========================================================================
    // 4. ZALO CHAT WIDGET
    // ==========================================================================
    if (TRACKING_CONFIG.zalo.enabled && TRACKING_CONFIG.zalo.oaId !== 'YOUR_ZALO_OA_ID') {
        document.addEventListener('DOMContentLoaded', function () {
            // Create Zalo widget container
            const zaloWidget = document.createElement('div');
            zaloWidget.className = 'zalo-chat-widget';
            zaloWidget.setAttribute('data-oaid', TRACKING_CONFIG.zalo.oaId);
            zaloWidget.setAttribute('data-welcome-message', TRACKING_CONFIG.zalo.welcomeMessage);
            zaloWidget.setAttribute('data-autopopup', TRACKING_CONFIG.zalo.autoPopup);
            zaloWidget.setAttribute('data-width', TRACKING_CONFIG.zalo.width);
            zaloWidget.setAttribute('data-height', TRACKING_CONFIG.zalo.height);
            document.body.appendChild(zaloWidget);

            // Load Zalo SDK
            loadScript('https://sp.zalo.me/plugins/sdk.js');

            console.log('✅ Zalo Widget initialized:', TRACKING_CONFIG.zalo.oaId);
        });
    }

    // ==========================================================================
    // 5. GOOGLE ANALYTICS 4 (Standalone - nếu không dùng GTM)
    // ==========================================================================
    if (TRACKING_CONFIG.ga4.enabled && TRACKING_CONFIG.ga4.measurementId !== 'YOUR_GA4_ID') {
        loadScript('https://www.googletagmanager.com/gtag/js?id=' + TRACKING_CONFIG.ga4.measurementId, function () {
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', TRACKING_CONFIG.ga4.measurementId);
            window.gtag = gtag;

            console.log('✅ GA4 initialized:', TRACKING_CONFIG.ga4.measurementId);
        });
    }

    // ==========================================================================
    // HELPER FUNCTIONS - Dùng để track events
    // ==========================================================================
    window.TrackingHelper = {
        // Track Facebook event
        trackFB: function (eventName, params) {
            if (typeof fbq !== 'undefined') {
                fbq('track', eventName, params);
            }
        },

        // Track TikTok event
        trackTikTok: function (eventName, params) {
            if (typeof ttq !== 'undefined') {
                ttq.track(eventName, params);
            }
        },

        // Track GA4 event
        trackGA4: function (eventName, params) {
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, params);
            }
        },

        // Track all platforms at once
        trackAll: function (eventName, params) {
            this.trackFB(eventName, params);
            this.trackTikTok(eventName, params);
            this.trackGA4(eventName, params);
        }
    };

    // Log tracking status
    console.log('📊 Tracking.js loaded. Config:', TRACKING_CONFIG);

})();
