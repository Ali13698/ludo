window.Turn = {
  next: function(){
    Timer.clear();
    var idx = S.active.indexOf(S.cur);
    var tries = 0;
    while(tries < 20){
      idx = (idx + 1) % S.active.length;
      S.cur = S.active[idx];
      tries++;
      if(S.cur === S.active[S.myIdx] || !S.outMap[S.cur]) break;
    }
    S.rolled = false;
    S.dice = 0;
    UI.update();
    Board.draw();
    UI.renderProfiles();
    
    if(S.cur === S.active[S.myIdx]){
      if(!S.outMap[S.cur]) Timer.start();
    } else {
      Turn.bot();
    }
  },
  
  bot: function(){
    if(S.over || S.busy || S.outMap[S.cur]) return;
    if(S.cur === S.active[S.myIdx]) return;
    var nm = S.botInfo[S.cur] ? S.botInfo[S.cur].name : P[S.cur].name;
    DOM.statusText.textContent = nm + ' در حال فکر...';
    S.botTimeout = setTimeout(function(){
      if(S.over || S.busy || S.cur === S.active[S.myIdx]) return;
      Game.doRoll();
    }, Bots.thinkTime());
  }
};
