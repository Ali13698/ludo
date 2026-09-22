(function() {
    'use strict';

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(name + '-screen');
        if (target) target.classList.add('active');
    }

    async function boot() {
        try {
            if (typeof initDOM === 'function') initDOM();
            if (typeof setupOnlineEvents === 'function') setupOnlineEvents();
            if (typeof setupLobby === 'function') setupLobby();
            if (typeof setupInputHandlers === 'function') setupInputHandlers();
            if (typeof Game !== 'undefined' && typeof Game.initTokens === 'function') Game.initTokens();
            if (typeof Board !== 'undefined' && typeof Board.initObserver === 'function') Board.initObserver();
            if (typeof loop === 'function') loop();

            showScreen('menu');
        } catch (err) {
            console.error('[boot] Error:', err);
            showScreen('menu');
        }
    }

    window.addEventListener('DOMContentLoaded', boot);
})();
