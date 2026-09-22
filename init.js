(function() {
    'use strict';

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

    async function boot() {
        try {
            initDOM();
            console.log('[boot] Application initialized successfully.');
        } catch (err) {
            console.error('[boot] Error:', err);
        }
    }

    window.addEventListener('DOMContentLoaded', boot);
})();
