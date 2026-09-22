// init.js - اصلاح‌شده برای حذف وابستگی به تلگرام و رفع تأخیر ۳۰ ثانیه‌ای
(function() {
    'use strict';

    // تابع loadTelegramSDK به طور کامل حذف شد تا هیچ درخواستی به دامنه تلگرام ارسال نشود.

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(name + '-screen');
        if (target) target.classList.add('active');
    }

    // ادامه کدهای بوت و لابی بدون تغییر...
    async function boot() {
        try {
            // حذف کامل await loadTelegramSDK();
            
            // اجرای فوری باقی مراحل
            console.log('[boot] Starting application initialization...');
            showScreen('menu');
            
        } catch (err) {
            console.error('[boot] Error:', err);
        }
    }

    window.addEventListener('DOMContentLoaded', boot);
})();
