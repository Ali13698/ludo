window.Game = {
  newGame: function(){
    S.active = [];
    S.botInfo = {};
    if(CFG.players === '1v1') S.active = [0, 1];
    else if(CFG.players === '2v2') S.active = [0, 1, 3, 2];
    else if(CFG.players === '3') S.active = [0, 1, 3];
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
    for(var j = 0; j < S.active.length; j++){
      S.strikeMap[S.active[j]] = 0;
      S.outMap[S.active[j]] = false;
    }
    UI.update();
  },
  
  initTokens: function(){
    S.tokens = [];
    for(var p = 0; p < 4; p++){
      for(var i = 0; i < 4; i++){
        S.tokens.push({
          player: p, idx: i, pos: 0,
          vx: P[p].base[i][0], vy: P[p].base[i][1],
          wps: [], moving: false
        });
      }
    }
  },
  
  doRoll: function(){
    if(S.over || S.rolled || S.busy) return;
    if(S.outMap[S.cur]) return;
    Timer.clear();
    SFX.dice();
    S.dice = Math.floor(Math.random() * 6) + 1;
    Dice.reset();
    setTimeout(function(){
      Dice.spin(S.dice, Game.settled);
    }, 50);
  },
  
  settled: function(){
    S.rolled = true;
    Board.draw();
    UI.renderProfiles();
    UI.update();
    var mv = Rules.getMovableFor(S.cur);
    if(mv.length === 0){
      DOM.statusText.textContent = 'حرکتی ممکن نیست...';
      setTimeout(function(){
        if(S.dice === 6){
          S.rolled = false;
          S.dice = 0;
          S.strikeMap[S.cur] = 0;
          UI.update();
          if(S.cur === S.active[S.myIdx]) Timer.start();
          else Turn.bot();
        } else {
          Turn.next();
        }
      }, 900);
      return;
    }
    if(S.cur !== S.active[S.myIdx]){
      setTimeout(function(){
        var pick = Bots.choose(mv);
        Game.doMove(pick);
      }, 600 + Math.random() * 800);
    } else if(mv.length === 1){
      setTimeout(function(){ Game.doMove(mv[0]); }, 500);
    }
  },
  
  doMove: function(t){
    if(S.over || S.busy) return;
    Timer.clear();
    var d = S.dice;
    Move.start(t, d, function(){
      S.firstRollDone = true;
      S.strikeMap[S.cur] = 0;
      var w = Rules.checkWin();
      if(w >= 0){
        S.over = true;
        SFX.win();
        var name = (w === S.active[S.myIdx]) ? 'شما' : (S.botInfo[w] ? S.botInfo[w].name : P[w].name);
        DOM.statusText.textContent = '🏆 برنده: ' + name;
        UI.update();
        Board.draw();
        UI.renderProfiles();
        return;
      }
      if(d === 6){
        S.rolled = false;
        S.dice = 0;
        UI.update();
        if(S.cur === S.active[S.myIdx]) Timer.start();
        else Turn.bot();
        return;
      }
      Turn.next();
    });
  }
};
