window.Timer = {
  start: function(){
    this.clear();
    S.timeLeft = CFG.TURN_TIME;
    DOM.timerFill.style.width = '100%';
    DOM.timerFill.className = 'timerFill';

    S.timerInterval = setInterval(function(){
      S.timeLeft -= 0.1;
      var pct = Math.max(0, (S.timeLeft / CFG.TURN_TIME) * 100);
      DOM.timerFill.style.width = pct + '%';
      if(S.timeLeft <= 3) DOM.timerFill.className = 'timerFill danger';
      if(S.timeLeft <= 0){
        Timer.clear();
        if(S.cur === S.active[S.myIdx] && !S.outMap[S.cur]){
          S.strikeMap[S.cur] = (S.strikeMap[S.cur] || 0) + 1;
          if(S.strikeMap[S.cur] >= 2){
            S.outMap[S.cur] = true;
            DOM.statusText.textContent = 'شما اوت شدید!';
            UI.renderProfiles();
            setTimeout(Turn.next, 1200);
          } else {
            if (S.rolled) {
              DOM.statusText.textContent = 'زمان تموم شد بدون حرکت!';
              S.rolled = false;
              S.dice = 0;
              setTimeout(Turn.next, 900);
            } else {
              DOM.statusText.textContent = 'زمان تموم شد! خودکار می‌ریزیم...';
              setTimeout(function(){ Game.doRoll(); }, 300);
            }
          }
        } else if (S.isOnline && S.cur !== S.active[S.myIdx] && window.BotOpponent && BotOpponent.active){
          BotOpponent.playTurn();
        }
      }
    }, 100);
  },

  clear: function(){
    if(S.timerInterval){ clearInterval(S.timerInterval); S.timerInterval = null; }
    if(S.botTimeout){ clearTimeout(S.botTimeout); S.botTimeout = null; }
  }
};
