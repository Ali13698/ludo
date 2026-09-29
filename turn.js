window.Turn = {
  next: function(){
    Timer.clear();

    var remaining = S.active.filter(function(p){ return !S.outMap[p]; });

    if (remaining.length === 1 && S.active.length > 1){
      S.over = true;
      SFX.win();
      var w = remaining[0];
      var name = (w === S.active[S.myIdx]) ? 'شما' :
                 (S.botInfo[w] ? S.botInfo[w].name : P[w].name);
      DOM.statusText.textContent = '🏆 برنده: ' + name + ' (بقیه اوت شدند)';
      UI.update();
      Board.draw();
      UI.renderProfiles();
      if (S.isOnline && window.Online && Online.ws){
        Online.notifyGameEnded(w);
      }
      return;
    }

    if (remaining.length === 0){
      S.over = true;
      DOM.statusText.textContent = 'همه اوت شدند';
      UI.update();
      return;
    }

    var idx = S.active.indexOf(S.cur);
    var tries = 0;
    var nextCur = S.cur;
    while (tries < 20){
      var ni = (S.active.indexOf(nextCur) + 1) % S.active.length;
      nextCur = S.active[ni];
      tries++;
      if (nextCur === S.active[S.myIdx] || !S.outMap[nextCur]) break;
    }
    S.cur = nextCur;
    S.rolled = false;
    S.dice = 0;
    UI.update();
    Board.draw();
    UI.renderProfiles();

    if (S.isOnline){
      if (S.cur === S.active[S.myIdx]){
        Timer.start();
      } else {
        if (window.BotOpponent && BotOpponent.active){
          BotOpponent.playTurn();
        } else {
          DOM.statusText.textContent = 'نوبت ' + (S.botInfo[S.cur] ? S.botInfo[S.cur].name : 'حریف') + '...';
        }
      }
      return;
    }

    if (S.cur === S.active[S.myIdx]){
      if (!S.outMap[S.cur]) Timer.start();
    } else {
      Turn.bot();
    }
  },

  bot: function(){
    if (S.over || S.busy || S.outMap[S.cur]) return;
    if (S.cur === S.active[S.myIdx]) return;
    if (S.isOnline) return;

    var nm = S.botInfo[S.cur] ? S.botInfo[S.cur].name : P[S.cur].name;
    DOM.statusText.textContent = nm + ' در حال فکر...';
    S.botTimeout = setTimeout(function(){
      if (S.over || S.busy || S.cur === S.active[S.myIdx]) return;
      Game.doRoll();
    }, Bots.thinkTime());
  }
};
