// ============ INIT ============
window.onerror = function(m, s, l){
  var d = document.getElementById('err');
  if(d){ d.style.display = 'block'; d.textContent = 'ERR: ' + m + ' @' + l; }
  return false;
};

(function(){
  'use strict';
  
  initDOM();
  
  // تنظیمات منو
  var optGroups = document.querySelectorAll('.opts');
  for(var gi = 0; gi < optGroups.length; gi++){
    (function(g){
      var key = g.getAttribute('data-k');
      var btns = g.querySelectorAll('button');
      for(var j = 0; j < btns.length; j++){
        btns[j].onclick = function(){
          for(var k = 0; k < btns.length; k++) btns[k].className = '';
          this.className = 'on';
          CFG[key] = this.getAttribute('data-v');
          SFX.click();
        };
      }
    })(optGroups[gi]);
  }
  
  // دکمه شروع
  DOM.playBtn.onclick = function(){
    SFX.get();
    DOM.menu.classList.add('hidden');
    DOM.game.classList.add('on');
    Game.newGame();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        Board.resize();
        Dice.init();
        UI.update();
        UI.renderProfiles();
        Board.draw();
        if(S.cur === S.active[S.myIdx]) Timer.start();
      });
    });
  };
  
  // دکمه تاس
  DOM.rollBtn.onclick = function(){
    if(S.cur !== S.active[S.myIdx]) return;
    if(S.rolled || S.busy || S.over || S.outMap[S.cur]) return;
    SFX.get();
    Game.doRoll();
  };
  
  // کلیک روی تخته
  DOM.canvas.onclick = function(e){
    if(S.over || S.busy) return;
    if(S.cur !== S.active[S.myIdx]) return;
    if(!S.rolled) return;
    if(S.outMap[S.cur]) return;
    var rect = DOM.canvas.getBoundingClientRect();
    var gx = (e.clientX - rect.left) / S.CELL;
    var gy = (e.clientY - rect.top) / S.CELL;
    var mv = Rules.getMovable();
    var best = null, bd = 0.8;
    for(var i = 0; i < mv.length; i++){
      var t = mv[i];
      var g = Rules.gridOf(t.player, t.pos, t.idx);
      var dx = g[0] - gx, dy = g[1] - gy;
      var dd = Math.sqrt(dx * dx + dy * dy);
      if(dd < bd){ bd = dd; best = t; }
    }
    if(best) Game.doMove(best);
  };
  
  // Observer
  Board.initObserver();
  
  // Loop
  function loop(){
    for(var i = 0; i < S.tokens.length; i++){
      if(S.tokens[i].moving){ Board.draw(); break; }
    }
    requestAnimationFrame(loop);
  }
  loop();
  
  // Game.initTokens برای شروع
  Game.initTokens();
  
})();
