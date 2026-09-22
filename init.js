(function() {
    'use strict';

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(name + '-screen');
        if (target) target.classList.add('active');
    }

    function setupLobby() {
        console.log('[setup] Lobby initialized');
    }

    function setupOnlineEvents() {
        console.log('[setup] Online events initialized');
    }

    function loop() {
        requestAnimationFrame(loop);
    }

    function setupInputHandlers() {
        console.log('[setup] Input handlers initialized');
    }

    function initDOM() {
        console.log('[init] DOM initialized');
    }

    (async function boot() {
        try {
            initDOM();
            setupOnlineEvents();
            setupLobby();
            setupInputHandlers();
            
            if (typeof Game !== 'undefined') Game.initTokens();
            if (typeof Board !== 'undefined') Board.initObserver();
            
            loop();
            showScreen('menu');
            console.log('[boot] Application started successfully.');
        } catch (err) {
            console.error('[boot] Error:', err);
            showScreen('menu');
        }
    })();
})();
