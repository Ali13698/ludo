(function() {
    'use strict';

    function $(id) { return document.getElementById(id); }

    function showScreen(name) {
        var all = ['loading', 'menu', 'lobby', 'game'];
        all.forEach(function(id) {
            var el = $(id);
            if (!el) return;
            if (id === name) {
                el.classList.remove('hidden-preload', 'screen-hidden');
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    }

    function setupOptions() {
        document.querySelectorAll('.opts').forEach(function(opts) {
            opts.addEventListener('click', function(e) {
                var btn = e.target.closest('button');
                if (!btn) return;
                opts.querySelectorAll('button').forEach(function(b) { b.classList.remove('on'); });
                btn.classList.add('on');
            });
        });
    }

    function getSelected() {
        document.querySelectorAll('.opts').forEach(function(opts) {
            var key = opts.dataset.k;
            var active = opts.querySelector('.on');
            if (key && active && typeof CFG !== 'undefined') CFG[key] = active.dataset.v;
        });
    }

    function tgUser() {
        var tg = window.Telegram && window.Telegram.WebApp;
        var u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
        if (u && u.id) {
            console.log('[tgUser] real telegram user', u.id);
            return u;
        }
        var stored = localStorage.getItem('angel_test_uid');
        if (!stored) {
            stored = String(100000000 + Math.floor(Math.random() * 900000000));
            localStorage.setItem('angel_test_uid', stored);
        }
        console.log('[tgUser] fallback test user', stored);
        return {
            id: parseInt(stored, 10),
            first_name: 'مهمان',
            username: 'guest_' + stored
        };
    }

    function tgAlert(msg) {
        var tg = window.Telegram && window.Telegram.WebApp;
        if (tg && tg.showAlert) tg.showAlert(msg);
        else alert(msg);
    }

    function setupMenu() {
        var playBtn = $('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', function() {
                getSelected();
                showScreen('lobby');
            });
        }
        setupOptions();
    }

    function setupLobby() {
        var backBtn = $('backToMenu');
        if (backBtn) backBtn.addEventListener('click', function() { showScreen('menu'); });

        var status = $('lobbyStatus');

        var quickBtn = $('quickMatchBtn');
        if (quickBtn) {
            quickBtn.addEventListener('click', async function() {
                quickBtn.disabled = true;
                if (status) status.textContent = 'در حال اتصال...';
                try {
                    var res = await Online.initUser(tgUser());
                    if (!res || !res.ok) {
                        if (status) status.textContent = 'خطا: ' + ((res && res.error) || 'نامشخص');
                        quickBtn.disabled = false;
                        return;
                    }
                    if (status) status.textContent = 'در حال یافتن حریف...';
                    var r = await Online.quickMatch();
                    if (!r || !r.ok) {
                        if (status) status.textContent = 'خطا: ' + ((r && r.error) || 'نامشخص');
                        quickBtn.disabled = false;
                    }
                } catch (e) {
                    console.error('[quickMatch]', e);
                    if (status) status.textContent = 'خطا: ' + e.message;
                    quickBtn.disabled = false;
                }
            });
        }

        var createBtn = $('createRoomBtn');
        if (createBtn) {
            createBtn.addEventListener('click', async function() {
                try {
                    await Online.initUser(tgUser());
                    var r = await Online.createRoom();
                    if (r && r.ok) tgAlert('کد اتاق: ' + r.code);
                    else if (status) status.textContent = 'خطا: ' + ((r && r.error) || 'نامشخص');
                } catch (e) { console.error(e); }
            });
        }

        var joinBtn = $('joinRoomBtn2');
        if (joinBtn) {
            joinBtn.addEventListener('click', async function() {
                var code = prompt('کد اتاق را وارد کنید:');
                if (!code) return;
                try {
                    await Online.initUser(tgUser());
                    var r = await Online.joinRoom(code.toUpperCase());
                    if (!r || !r.ok) tgAlert('خطا: ' + ((r && r.error) || 'نامشخص'));
                } catch (e) { console.error(e); }
            });
        }
    }

    function setupGame() {
        var rollBtn = $('rollBtn');
        if (rollBtn) {
            rollBtn.addEventListener('click', function() {
                if (typeof Game !== 'undefined') Game.doRoll();
            });
        }
        var menuBtn = $('gameMenuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', function() {
                if (confirm('از بازی خارج شوی؟')) {
                    Online.leave();
                    showScreen('menu');
                }
            });
        }
    }

    function setupOnlineEvents() {
        Online.on('match_found', function(data) {
            console.log('[match_found]', data);
            S.isOnline = true;
            S.myIdx = data.playerIndex || 0;
            S.roomCode = data.code;
            S.opponent = data.opponent;
            if (typeof Game !== 'undefined') Game.newGame();
            showScreen('game');
            setTimeout(function() {
                if (typeof Board !== 'undefined' && Board.resize) Board.resize();
            }, 100);
        });

        Online.on('opponent_left', function() {
            tgAlert('حریف خارج شد');
            showScreen('lobby');
        });

        Online.on('game_action', function(msg) {
            var data = msg.data || {};
            if (typeof Game === 'undefined') return;
            if (data.type === 'dice') Game.applyOpponentDice(data.value);
            else if (data.type === 'move') Game.applyOpponentMove(data);
        });
    }

    function initTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            try { window.Telegram.WebApp.ready(); } catch(e) {}
            try { window.Telegram.WebApp.expand(); } catch(e) {}
        }
    }

    (async function boot() {
        try {
            initTelegram();

            if (typeof window.initDOM === 'function') {
                try { window.initDOM(); } catch (e) { console.error('[initDOM]', e); }
            }

            setupMenu();
            setupLobby();
            setupGame();
            setupOnlineEvents();

            if (typeof Board !== 'undefined' && Board.initObserver) {
                try { Board.initObserver(); } catch (e) { console.error('[Board.initObserver]', e); }
            }

            if (typeof Game !== 'undefined' && Game.initTokens) {
                try { Game.initTokens(); } catch (e) { console.error('[Game.initTokens]', e); }
            }

            var loader = $('loading');
            if (loader) {
                loader.style.transition = 'opacity 0.3s';
                loader.style.opacity = '0';
                setTimeout(function() { loader.style.display = 'none'; }, 350);
            }

            setTimeout(function() { showScreen('menu'); }, 400);
            console.log('[boot] ready');
        } catch (err) {
            console.error('[boot]', err);
            var loader = $('loading');
            if (loader) loader.style.display = 'none';
            showScreen('menu');
        }
    })();
})();
