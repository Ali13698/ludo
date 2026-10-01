window.Game = {
  newGame: function(){
    S.active = [];
    S.botInfo = {};
    if (CFG.players === '1v1') S.active = [0, 1];
    else if (CFG.players === '2v2') S.active = [0, 1, 3, 2];
    else if (CFG.players === '3') S.active = [0, 1, 3];
    else S.active = [0, 1, 3, 2];

    S.botInfo = Bots.makeProfiles(S.active, S.myIdx);
    this.initTokens();
    S.cur = S.active[0];
    S.dice = 0;
    S.rolled = false;
    S.over = false;
    S.busy = false;
    S.firstRollDone = false;
    S.outMap = {};
    S.strikeMap = {};
    for (let j = 0; j < S.active.length; j++){
      S.strikeMap[S.active[j]] = 0;
      S.outMap[S.active[j]] = false;
    }
    UI.update();
  },

  initTokens: function(){
    S.tokens = [];
    for (let p = 0; p < 4; p++){
      for (let i = 0; i < 4; i++){
        S.tokens.push({
          player: p, idx: i, pos: 0,
          vx: P[p].base[i][0], vy: P[p].base[i][1],
          wps: [], moving: false
        });
      }
    }
  },

  doRoll: function(){
    if (window.DBG) window.DBG('ROLL_CHECK', {
      isOnline: S.isOnline,
      myIdx: S.myIdx,
      cur: S.cur,
      active: S.active,
      dice: S.dice,
      room: S.roomCode || null
    });
    if (S.over || S.rolled || S.busy) {
      if (window.DBG) window.DBG('ROLL_BLOCKED', {
        reason: 'over_rolled_or_busy',
        over: S.over, rolled: S.rolled, busy: S.busy
      });
      return;
    }
    if (S.outMap[S.cur]) {
      if (window.DBG) window.DBG('ROLL_BLOCKED', { reason: 'outMap' });
      return;
    }
    if (S.isOnline && S.cur !== S.myIdx) {
      if (window.DBG) window.DBG('ROLL_BLOCKED', {
        reason: 'not_my_turn',
        myIdx: S.myIdx, cur: S.cur
      });
      return;
    }
    SFX.dice();

    S.dice = Math.floor(Math.random() * 6) + 1;

    if (S.isOnline && window.Online && Online.ws){
      Online.sendGameAction({ type: 'dice', value: S.dice });
    }

    Dice.reset();
    setTimeout(() => { Dice.spin(S.dice, Game.settled); }, 50);
  },

  settled: function(){
    S.rolled = true;
    Board.draw();
    UI.renderProfiles();
    UI.update();

    const mv = Rules.getMovableFor(S.cur);
    if (mv.length === 0){
      DOM.statusText.textContent = 'حرکتی ممکن نیست...';

      if (S.isOnline && window.Online && Online.ws){
        Online.sendGameAction({ type: 'pass', dice: S.dice, player: S.cur });
      }

      setTimeout(() => {
        if (S.dice === 6){
          S.rolled = false;
          S.dice = 0;
          S.strikeMap[S.cur] = 0;
          UI.update();
          if (S.cur === S.active[S.myIdx] || !S.isOnline) Timer.start();
          else if (S.isOnline && window.BotOpponent && BotOpponent.active){
            BotOpponent.playTurn();
          }
        } else {
          Turn.next();
        }
      }, 900);
      return;
    }

    if (S.cur === S.active[S.myIdx] || !S.isOnline){
      if (!S.isOnline && S.cur !== S.active[S.myIdx]){
        setTimeout(() => {
          const pick = Bots.choose(mv);
          Game.doMove(pick);
        }, 600 + Math.random() * 800);
      } else if (!S.isOnline && mv.length === 1){
        setTimeout(() => Game.doMove(mv[0]), 500);
      }
    }
  },

  doMove: function(t){
    if (S.over || S.busy) return;
    Timer.clear();

    if (S.isOnline && S.cur !== S.myIdx) return;

    const d = S.dice;
    const fromPos = t.pos;
    const player = t.player;
    const idx = t.idx;

    if (S.isOnline && window.Online && Online.ws){
      Online.sendGameAction({
        type: 'move',
        player: player,
        idx: idx,
        dice: d,
        from: fromPos,
        to: fromPos === 0 ? 1 : fromPos + d
      });
    }

    Move.start(t, d, function(){
      S.firstRollDone = true;
      S.strikeMap[S.cur] = 0;
      const w = Rules.checkWin();
      if (w >= 0){
        S.over = true;
        SFX.win();
        if (S.isOnline && window.Online && Online.ws){
          Online.notifyGameEnded(w);
        }
        const name = (w === S.active[S.myIdx]) ? 'شما' :
                     (S.botInfo[w] ? S.botInfo[w].name : P[w].name);
        DOM.statusText.textContent = '🏆 برنده: ' + name;
        UI.update();
        Board.draw();
        UI.renderProfiles();
        return;
      }
      if (d === 6){
        S.rolled = false;
        S.dice = 0;
        UI.update();
        if (S.cur === S.active[S.myIdx] || !S.isOnline) Timer.start();
        else if (!S.isOnline) Turn.bot();
        else if (S.isOnline && window.BotOpponent && BotOpponent.active){
          BotOpponent.playTurn();
        }
      } else {
        Turn.next();
      }
    });
  },

  applyOpponentMove: function(data){
    if (window.DBG) window.DBG('OPP_MOVE', {
      from: data.from, to: data.to, dice: data.dice,
      player: data.player, idx: data.idx,
      myIdx: S.myIdx, cur: S.cur
    });
    const t = S.tokens.find(x => x.player === data.player && x.idx === data.idx);
    if (!t) return;

    const dataDice = Number(data.dice);
    const stateDice = Number(S.dice);
    const oppDice = (dataDice >= 1 && dataDice <= 6) ? dataDice :
                    ((stateDice >= 1 && stateDice <= 6) ? stateDice : null);

    t.pos = data.from;
    const g = Rules.gridOf(t.player, data.from, t.idx);
    t.vx = g[0]; t.vy = g[1];
    Board.draw();

    Move.start(t, data.to - data.from, function(){
      const w = Rules.checkWin();
      if (w >= 0){
        S.over = true;
        SFX.win();
        const name = (w === S.active[S.myIdx]) ? 'شما' :
                     (S.botInfo[w] ? S.botInfo[w].name : 'حریف');
        DOM.statusText.textContent = '🏆 برنده: ' + name;
        UI.update();
        Board.draw();
        UI.renderProfiles();
        return;
      }

      if (oppDice === 6){
        S.rolled = false;
        S.dice = 0;
        DOM.statusText.textContent = 'نوبت حریف (تاس ۶)...';
      } else {
        S.cur = S.active[S.myIdx];
        S.rolled = false;
        S.dice = 0;
        Timer.start();
      }

      if (window.DBG) window.DBG('TURN_CHANGE', {
        source: 'applyOpponentMove',
        myIdx: S.myIdx, cur: S.cur, oppDice: oppDice
      });

      UI.update();
      Board.draw();
      UI.renderProfiles();
    });
  },

  applyOpponentPass: function(data){
    data = data || {};
    const dice = Number(data.dice);
    if (dice < 1 || dice > 6) return;

    if (window.DBG) window.DBG('OPP_PASS', {
      dice: dice, player: data.player, nextPlayer: data.nextPlayer,
      myIdx: S.myIdx, cur: S.cur
    });

    const localPlayer = S.active[S.myIdx];
    const fallbackPlayer = S.active.filter(p => p !== localPlayer)[0];
    const hasPlayer = S.active.indexOf(data.player) >= 0;
    const player = hasPlayer ? data.player : fallbackPlayer;
    const hasNextPlayer = S.active.indexOf(data.nextPlayer) >= 0;
    const nextPlayer = hasNextPlayer ? data.nextPlayer :
                       (dice === 6 ? player : localPlayer);

    Timer.clear();
    S.cur = nextPlayer;
    S.rolled = false;
    S.dice = 0;

    if (window.DBG) window.DBG('TURN_CHANGE', {
      source: 'applyOpponentPass',
      myIdx: S.myIdx, cur: S.cur, dice: dice
    });

    UI.update();
    Board.draw();
    UI.renderProfiles();

    if (S.cur === localPlayer){
      DOM.statusText.textContent = 'نوبت شما';
      Timer.start();
    } else if (dice === 6){
      DOM.statusText.textContent = 'نوبت حریف (تاس ۶)...';
      if (window.BotOpponent && BotOpponent.active) BotOpponent.playTurn();
    } else {
      DOM.statusText.textContent = 'نوبت حریف...';
    }
  },

  applyOpponentDice: function(value){
    S.dice = value;
    Dice.reset();
    setTimeout(() => {
      Dice.spin(value, function(){
        S.rolled = true;
        Board.draw();
        UI.update();
        DOM.statusText.textContent = 'حریف تاس ریخت: ' + value;
      });
    }, 50);
  }
};
