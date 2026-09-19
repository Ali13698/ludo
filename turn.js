window.Turn = {
  next: function(){
    Timer.clear();
    const idx = S.active.indexOf(S.cur);
    let tries = 0;
    let nextCur = S.cur;
    while (tries < 20){
      const ni = (S.active.indexOf(nextCur) + 1) % S.active.length;
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

    // ---- حالت آنلاین ----
    if (S.isOnline){
      if (S.cur === S.active[S.myIdx]){
        // نوبت ما
        Timer.start();
      } else {
        // نوبت حریف - منتظر بمون
        DOM.statusText.textContent = 'نوبت ' + (S.botInfo[S.cur] ? S.botInfo[S.cur].name : 'حریف') + '...';
      }
      return;
    }

    // ---- حالت آفلاین ----
    if (S.cur === S.active[S.myIdx]){
      if (!S.outMap[S.cur]) Timer.start();
    } else {
      Turn.bot();
    }
  },

  bot: function(){
    if (S.over || S.busy || S.outMap[S.cur]) return;
    if (S.cur === S.active[S.myIdx]) return;
    if (S.isOnline) return; // در آنلاین ربات نداریم

    const nm = S.botInfo[S.cur] ? S.botInfo[S.cur].name : P[S.cur].name;
    DOM.statusText.textContent = nm + ' در حال فکر...';
    S.botTimeout = setTimeout(function(){
      if (S.over || S.busy || S.cur === S.active[S.myIdx]) return;
      Game.doRoll();
    }, Bots.thinkTime());
  }
};
