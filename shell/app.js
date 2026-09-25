// shell/app.js — Boot + Wiring
window.App = {
  boot: async function() {
    try {
      Platform.ready();
      Platform.expand();

      if (typeof window.initDOM === 'function') {
        try { window.initDOM(); } catch (e) { console.error('[initDOM]', e); }
      }

      GamesMenu.init();
      Lobby.setup();
      this.setupGame();
      this.setupOnlineEvents();

      if (typeof Board !== 'undefined' && Board.initObserver) {
        try { Board.initObserver(); } catch (e) { console.error('[Board.initObserver]', e); }
      }
      if (typeof Game !== 'undefined' && Game.initTokens) {
        try { Game.initTokens(); } catch (e) { console.error('[Game.initTokens]', e); }
      }
      if (typeof Dice !== 'undefined' && Dice.init) {
        try { Dice.init(); } catch (e) { console.error('[Dice.init]', e); }
      }

      var l = document.getElementById('loading');
      if (l) {
        l.style.transition = 'opacity .3s';
        l.style.opacity = '0';
        setTimeout(function() { l.style.display = 'none'; }, 350);
      }

      setTimeout(function() { Layout.show('menu'); }, 400);
      console.log('[app] booted on', Platform.type);
    } catch (err) {
      console.error('[boot]', err);
      var l = document.getElementById('loading');
      if (l) l.style.display = 'none';
      Layout.show('menu');
    }
  },

  setupGame: function() {
    var r = document.getElementById('rollBtn');
    if (r) r.addEventListener('click', function() {
      if (typeof Game !== 'undefined') Game.doRoll();
    });

    var m = document.getElementById('gameMenuBtn');
    if (m) m.addEventListener('click', function() {
      if (confirm('از بازی خارج شوی؟')) {
        Online.leave();
        Layout.show('menu');
      }
    });

    this.setupBoardClick();
  },

  setupBoardClick: function() {
    var canvas = document.getElementById('board');
    if (!canvas) return;
    if (canvas._angelClick) return;
    canvas._angelClick = true;
    canvas.addEventListener('click', function(e) {
      if (S.over || S.busy || !S.rolled) return;
      if (S.cur !== S.active[S.myIdx]) return;
      var mv = Rules.getMovableFor(S.cur);
      if (!mv || mv.length === 0) return;
      if (mv.length === 1) { Game.doMove(mv[0]); return; }
      var rect = canvas.getBoundingClientRect();
      var sx = S.CELL * CFG.GRID / rect.width;
      var x = (e.clientX - rect.left) * sx / S.CELL;
      var y = (e.clientY - rect.top) * sx / S.CELL;
      var best = null, bd = 1.8;
      for (var i = 0; i < mv.length; i++) {
        var t = mv[i];
        var dx = t.vx - x, dy = t.vy - y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) { bd = d; best = t; }
      }
      if (best) Game.doMove(best);
    });
  },

  startBot: function(data) {
    if (!window.BotOpponent) return false;
    window.BotOpponent.active = true;
    window.BotOpponent.botInfo = data;
    window.BotOpponent.botPlayerIdx = 1 - S.myIdx;
    return true;
  },

  setupOnlineEvents: function() {
    Online.on('match_found', function(d) {
      S.myIdx = d.playerIndex || 0;
      S.roomCode = d.code;
      S.opponent = d.opponent;
      if (typeof Game !== 'undefined') Game.newGame();
      S.isOnline = true;
      if (d.opponent && d.opponent.isBot) {
        S.botInfo[1 - S.myIdx] = { name: d.opponent.name, avatar: d.opponent.avatar };
        App.startBot(d.opponent);
      }
      Layout.show('game');
      setTimeout(function() {
        if (typeof Board !== 'undefined' && Board.resize) Board.resize();
        if (typeof Dice !== 'undefined' && Dice.init) Dice.init();
        App.setupBoardClick();
        if (S.cur !== S.active[S.myIdx] && window.BotOpponent && BotOpponent.active) {
          BotOpponent.playTurn();
        }
      }, 200);
    });

    Online.on('opponent_left', function() {
      safeAlert('حریف خارج شد');
      Layout.show('menu');
    });

    Online.on('game_action', function(m) {
      var d = m.data || {};
      if (typeof Game === 'undefined') return;
      if (d.type === 'dice') Game.applyOpponentDice(d.value);
      else if (d.type === 'move') Game.applyOpponentMove(d);
    });
  }
};
