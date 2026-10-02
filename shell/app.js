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
      if (Lobby && typeof Lobby.setup === 'function') Lobby.setup();
      else if (Lobby && typeof Lobby.refresh === 'function') Lobby.refresh();
      this.setupGame();
      this.setupOnlineEvents();

      if (typeof Board !== 'undefined' && Board.initObserver) {
        try { Board.initObserver(); } catch (e) { console.error('[Board.initObserver]', e); }
      }
      if (typeof Game !== 'undefined' && Game.initTokens) {
        if (window.DBG) window.DBG('P_CHECK_BOOT', {
          hasP: typeof window.P !== 'undefined',
          plen: window.P && window.P.length,
          pType: typeof window.P
        });
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
      if (confirm('می‌خوای از بازی خارج شی؟')) {
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
      var sx = S.CELL * (CFG.GRID / rect.width);
      var x = (e.clientX - rect.left) * sx / S.CELL;
      var y = (e.clientY - rect.top) * sx / S.CELL;
      var best = null; var bd = 1e9;
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
    if (!window.BotOpponent) {
      if (window.DBG) window.DBG('START_BOT_NO_OPPONENT');
      return false;
    }
    window.BotOpponent.active = true;
    window.BotOpponent.botInfo = data;
    window.BotOpponent.botPlayerIdx = 1 - S.myIdx;
    if (window.DBG) window.DBG('START_BOT_OK', {
      botName: data && data.name,
      botPlayerIdx: window.BotOpponent.botPlayerIdx,
      myIdx: S.myIdx,
      cur: S.cur
    });
    return true;
  },

  setupOnlineEvents: function() {
    if (this._onlineEventsBound) return;
    this._onlineEventsBound = true;

    Online.on('match_found', function(d) {
      if (window.DBG) window.DBG('MATCH_FOUND_START', {
        playerIndex: d && d.playerIndex,
        code: d && d.code,
        opponentId: d && d.opponent && d.opponent.id,
        opponentIsBot: !!(d && d.opponent && d.opponent.isBot)
      });

      try {
        S.myIdx = d.playerIndex || 0;
        S.roomCode = d.code;
        S.opponent = d.opponent;

        if (window.DBG) window.DBG('MATCH_BEFORE_NEWGAME', {
          myIdx: S.myIdx,
          roomCode: S.roomCode,
          hasOpponent: !!S.opponent,
          hasP: typeof window.P !== 'undefined',
          plen: window.P && window.P.length,
          pType: typeof window.P,
          p0base: window.P && window.P[0] && window.P[0].base,
          p1base: window.P && window.P[1] && window.P[1].base
        });

        try {
          if (typeof Game !== 'undefined') Game.newGame();
          if (window.DBG) window.DBG('MATCH_AFTER_NEWGAME_OK', {
            cur: S.cur,
            active: S.active,
            tokens: S.tokens && S.tokens.length
          });
        } catch (e) {
          if (window.DBG) window.DBG('MATCH_NEWGAME_ERR', {
            msg: e && e.message,
            stack: e && e.stack
          });
          throw e;
        }

        S.isOnline = true;

        if (window.DBG) window.DBG('STATE_AFTER_MATCH', {
          myIdx: S.myIdx,
          cur: S.cur,
          active: S.active,
          isOnline: S.isOnline
        });

        if (d.opponent && d.opponent.isBot) {
          S.botInfo[1 - S.myIdx] = { name: d.opponent.name, avatar: d.opponent.avatar };
          var started = App.startBot(d.opponent);
          if (window.DBG) window.DBG('START_BOT_RESULT', {
            started: started,
            botActive: window.BotOpponent && BotOpponent.active
          });
        }

        try {
          Layout.show('game');
          if (window.DBG) window.DBG('MATCH_AFTER_LAYOUT_OK');
        } catch (e) {
          if (window.DBG) window.DBG('MATCH_LAYOUT_ERR', {
            msg: e && e.message,
            stack: e && e.stack
          });
          throw e;
        }

        setTimeout(function() {
          try {
            if (typeof Board !== 'undefined' && Board.resize) Board.resize();
            if (typeof Dice !== 'undefined' && Dice.init) Dice.init();
            App.setupBoardClick();
            var botWillPlay = S.cur !== S.active[S.myIdx] && window.BotOpponent && BotOpponent.active;
            if (window.DBG) window.DBG('BOT_TURN_CHECK', {
              cur: S.cur,
              myActive: S.active[S.myIdx],
              botActive: window.BotOpponent && BotOpponent.active,
              botWillPlay: botWillPlay
            });
            if (botWillPlay) {
              BotOpponent.playTurn();
            }
            if (window.DBG) window.DBG('MATCH_TIMEOUT_OK');
          } catch (e) {
            if (window.DBG) window.DBG('MATCH_TIMEOUT_ERR', {
              msg: e && e.message,
              stack: e && e.stack
            });
          }
        }, 200);
      } catch (outer) {
        if (window.DBG) window.DBG('MATCH_FOUND_FATAL', {
          msg: outer && outer.message,
          stack: outer && outer.stack
        });
      }
    });

    Online.on('room_waiting', function(d) {
      var st = document.getElementById('lobbyStatus');
      if (st && d.code) st.textContent = 'کد: ' + d.code + ' — منتظر حریف...';
    });

    Online.on('opponent_left', function() {
      safeAlert('حریف خارج شد');
      S.isOnline = false; S.roomCode = null; S.opponent = null; S.botInfo = {};
      if (window.BotOpponent) BotOpponent.stop();
      Layout.show('lobby');
    });

    Online.on('disconnected', function() {
      S.isOnline = false; S.roomCode = null; S.opponent = null; S.botInfo = {};
      if (window.BotOpponent) BotOpponent.stop();
      Layout.show('menu');
    });

    Online.on('game_action', function(m) {
      var d = m.data || {};

      if (window.DBG) window.DBG('GAME_ACTION_RECEIVED', {
        data: d,
        type: d.type,
        from: d.from,
        to: d.to,
        dice: d.dice,
        player: d.player,
        myIdx: S.myIdx,
        cur: S.cur
      });

      if (typeof Game === 'undefined') return;
      if (d.type === 'dice') Game.applyOpponentDice(d.value);
      else if (d.type === 'move') Game.applyOpponentMove(d);
      else if (d.type === 'pass') Game.applyOpponentPass(d);
    });
  }
};
