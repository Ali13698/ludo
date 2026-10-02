// ============ GAME LOGIC ============
window.Game = {

  initTokens: function() {
    if (typeof P === 'undefined' || !P || !P.length) {
      console.error('[Game] window.P missing');
      return;
    }
    if (!S.active || !S.active.length) S.active = this._defaultActive();
    S.tokens = [];
    for (var a = 0; a < S.active.length; a++) {
      var pl = S.active[a];
      for (var i = 0; i < 4; i++) {
        var g = Rules.gridOf(pl, 0, i);
        S.tokens.push({ player: pl, idx: i, pos: 0, vx: g[0], vy: g[1], wps: [], moving: false });
      }
    }
  },

  _defaultActive: function() {
    var mode = (window.CFG && CFG.players) || '1v1';
    if (mode === '1v1') return [0, 2];
    if (mode === '1v1b') return [1, 3];
    if (mode === '1v3') return [0, 1, 2, 3];
    return [0, 2];
  },

  newGame: function() {
    S.over = false; S.busy = false; S.rolled = false; S.dice = 0;
    S.outMap = {}; S.strikeMap = {}; S.firstRollDone = false;
    if (!S.active || !S.active.length) S.active = this._defaultActive();
    this.initTokens();
    S.cur = S.active[0];
    if (typeof Board !== 'undefined' && Board.draw) Board.draw();
    if (typeof UI !== 'undefined') { UI.update(); UI.renderProfiles(); }
    if (S.cur === S.active[S.myIdx]) {
      if (typeof Timer !== 'undefined' && Timer.start) Timer.start();
    } else if (typeof DOM !== 'undefined' && DOM.statusText) {
      DOM.statusText.textContent = 'نوبت حریف...';
    }
  },

  doRoll: function() {
    if (S.over || S.busy || S.rolled) return;
    if (S.cur !== S.active[S.myIdx]) return;
    if (S.outMap[S.cur]) return;
    var value = Math.floor(Math.random() * 6) + 1;
    this._performRoll(value, true);
  },

  _performRoll: function(value, isMine) {
    S.dice = value; S.rolled = true;
    if (typeof SFX !== 'undefined' && SFX.dice) SFX.dice();
    if (isMine && S.isOnline && window.Online) Online.sendGameAction({ type: 'dice', value: value });
    var self = this;
    if (typeof Dice !== 'undefined' && Dice.spin) {
      Dice.spin(value, function() {
        if (typeof Board !== 'undefined' && Board.draw) Board.draw();
        if (typeof UI !== 'undefined' && UI.update) UI.update();
        self._afterRoll(value, isMine);
      });
    } else {
      this._afterRoll(value, isMine);
    }
  },

  _afterRoll: function(value, isMine) {
    if (!S.rolled) return;
    var mv = Rules.getMovableFor(S.cur);
    if (mv.length === 0) {
      if (value === 6) {
        setTimeout(function() {
          if (S.over) return;
          S.rolled = false; S.dice = 0;
          if (isMine) {
            if (typeof Timer !== 'undefined' && Timer.start) Timer.start();
            if (typeof UI !== 'undefined' && UI.update) UI.update();
          } else if (typeof DOM !== 'undefined' && DOM.statusText) {
            DOM.statusText.textContent = 'حریف دوباره می‌ریزه...';
          }
        }, 600);
        return;
      }
      if (isMine && S.isOnline && window.Online) Online.sendGameAction({ type: 'pass' });
      setTimeout(function() { if (typeof Turn !== 'undefined') Turn.next(); }, 700);
      return;
    }
    if (mv.length === 1) { if (isMine) this.doMove(mv[0]); return; }
    if (typeof DOM !== 'undefined' && DOM.statusText) {
      DOM.statusText.textContent = isMine ? 'یک مهره انتخاب کن' : 'حریف در حال حرکته...';
    }
  },

  doMove: function(t) {
    if (S.over || S.busy || !S.rolled) return;
    if (S.cur !== S.active[S.myIdx]) return;
    var d = S.dice; var from = t.pos;
    if (S.isOnline && window.Online) {
      Online.sendGameAction({ type: 'move', player: t.player, idx: t.idx, from: from, dice: d });
    }
    S.rolled = false;
    this._resolveMove(t, d, from, true);
  },

  _resolveMove: function(t, d, from, isMine) {
    if (typeof Timer !== 'undefined' && Timer.clear) Timer.clear();
    Move.start(t, d, function() {
      if (from === 0) S.firstRollDone = true;
      if (typeof Board !== 'undefined' && Board.draw) Board.draw();
      var w = Rules.checkWin();
      if (w >= 0) {
        S.over = true;
        if (typeof SFX !== 'undefined' && SFX.win) SFX.win();
        var wName = (w === S.active[S.myIdx]) ? 'شما' : (S.botInfo && S.botInfo[w] ? S.botInfo[w].name : P[w].name);
        if (typeof DOM !== 'undefined' && DOM.statusText) DOM.statusText.textContent = '🏆 برنده: ' + wName;
        if (typeof UI !== 'undefined') { UI.update(); UI.renderProfiles(); }
        if (typeof Board !== 'undefined' && Board.draw) Board.draw();
        if (isMine && S.isOnline && window.Online && Online.ws) Online.notifyGameEnded(w);
        return;
      }
      if (d === 6) {
        S.dice = 0; S.rolled = false;
        if (typeof UI !== 'undefined' && UI.update) UI.update();
        if (typeof Board !== 'undefined' && Board.draw) Board.draw();
        setTimeout(function() {
          if (S.over) return;
          if (isMine) {
            if (typeof Timer !== 'undefined' && Timer.start) Timer.start();
          } else if (typeof DOM !== 'undefined' && DOM.statusText) {
            DOM.statusText.textContent = 'حریف دوباره می‌ریزه...';
          }
        }, 400);
        return;
      }
      if (typeof Turn !== 'undefined') Turn.next();
    });
  },

  applyOpponentDice: function(value) {
    if (S.over) return;
    this._performRoll(value, false);
  },

  applyOpponentMove: function(data) {
    if (S.over || S.busy) return;
    var t = null;
    for (var i = 0; i < S.tokens.length; i++) {
      var tk = S.tokens[i];
      if (tk.player === data.player && tk.idx === data.idx) { t = tk; break; }
    }
    if (!t) return;
    var d = data.dice || ((data.to - data.from) | 0) || S.dice;
    var from = (data.from != null) ? data.from : t.pos;
    S.rolled = false;
    this._resolveMove(t, d, from, false);
  },

  applyOpponentPass: function() {
    if (S.over) return;
    S.rolled = false; S.dice = 0;
    if (typeof UI !== 'undefined' && UI.update) UI.update();
    setTimeout(function() { if (typeof Turn !== 'undefined') Turn.next(); }, 500);
  }
};
