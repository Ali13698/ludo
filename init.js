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

            if (typeof setupOnlineEvents === 'function') setupOnlineEvents();
            if (typeof setupLobby === 'function') setupLobby();
            if (typeof setupInputHandlers === 'function') setupInputHandlers();

            showScreen('menu'); 
            
            console.log('[boot] Application initialized successfully with all modules.');
        } catch (err) {
            console.error('[boot] Error during boot:', err);
        }
    }

    window.addEventListener('DOMContentLoaded', boot);
})();
