(function(){
'use strict';
function $(id){return document.getElementById(id);}
function show(name){
  ['loading','menu','lobby','game'].forEach(function(id){
    var el=$(id); if(!el) return;
    if(id===name){el.classList.remove('hidden-preload','screen-hidden');el.style.display=(id==='game'||id==='lobby'||id==='menu')?'flex':'block';}
    else el.style.display='none';
  });
}
function initTelegram(){
  if(window.Platform && Platform.ready) Platform.ready();
  if(window.Platform && Platform.expand) Platform.expand();
}
function setupOptions(){
  document.querySelectorAll('.opts').forEach(function(o){
    o.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b) return;
      o.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');
    });
  });
}
function getSelected(){
  document.querySelectorAll('.opts').forEach(function(o){
    var k=o.dataset.k, a=o.querySelector('.on');
    if(k&&a&&typeof CFG!=='undefined') CFG[k]=a.dataset.v;
  });
}
function setupMenu(){
  var b=$('playBtn');
  if(b && !b._angelBound){
    b._angelBound = true;
    b.addEventListener('click',function(){getSelected();show('lobby');});
  }
  setupOptions();
}
function setupBoardClick(){
  var canvas=$('board');
  if(!canvas){return;}
  if(canvas._angelClick){return;}
  canvas._angelClick=true;
  canvas.addEventListener('click',function(e){
    if(S.over||S.busy||!S.rolled) return;
    if(S.cur!==S.active[S.myIdx]) return;
    var mv=Rules.getMovableFor(S.cur);
    if(!mv||mv.length===0) return;
    if(mv.length===1){Game.doMove(mv[0]);return;}
    var rect=canvas.getBoundingClientRect();
    var sx=S.CELL*CFG.GRID/rect.width;
    var x=(e.clientX-rect.left)*sx/S.CELL;
    var y=(e.clientY-rect.top)*sx/S.CELL;
    var best=null,bd=1.8;
    for(var i=0;i<mv.length;i++){
      var t=mv[i];
      var dx=t.vx-x,dy=t.vy-y;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(d<bd){bd=d;best=t;}
    }
    if(best) Game.doMove(best);
  });
}
function setupGame(){
  var r=$('rollBtn');
  if(r && !r._angelBound){
    r._angelBound = true;
    r.addEventListener('click',function(){
      if(typeof Game!=='undefined') Game.doRoll();
    });
  }
  setupBoardClick();
}
function startBot(data){
  if(!window.BotOpponent){return false;}
  window.BotOpponent.active=true;
  window.BotOpponent.botInfo=data;
  window.BotOpponent.botPlayerIdx=1-S.myIdx;
  return true;
}
function setupOnlineEvents(){
  if(!window.Online || !Online.on) return;
  if(window._angelOnlineBound) return;
  window._angelOnlineBound = true;

  Online.on('match_found',function(d){
    S.myIdx = (typeof d.playerIndex === 'number') ? d.playerIndex : 0;
    S.roomCode = d.code;
    S.opponent = d.opponent || null;
    S.isOnline = true;
    if(typeof Game!=='undefined') Game.newGame();
    S.isOnline = true;
    S.botInfo = {};
    if(d.opponent && d.opponent.isBot){
      S.botInfo[1-S.myIdx] = {name: d.opponent.name, avatar: d.opponent.avatar};
      startBot(d.opponent);
    }
    show('game');
    setTimeout(function(){
      if(typeof Board!=='undefined'&&Board.resize) Board.resize();
      if(typeof Dice!=='undefined'&&Dice.init) Dice.init();
      setupBoardClick();
      if(typeof UI!=='undefined') UI.renderProfiles();
      if(S.cur!==S.active[S.myIdx]&&window.BotOpponent&&BotOpponent.active){
        BotOpponent.playTurn();
      }
    },200);
  });

  Online.on('opponent_left',function(){
    if(window.Platform && Platform.showAlert) Platform.showAlert('حریف خارج شد');
    S.isOnline = false;
    S.roomCode = null;
    S.opponent = null;
    S.botInfo = {};
    show('lobby');
  });

  Online.on('disconnected',function(){
    if(window.Platform && Platform.showAlert) Platform.showAlert('ارتباط قطع شد');
    S.isOnline = false;
    S.roomCode = null;
    S.opponent = null;
    S.botInfo = {};
    show('menu');
  });

  Online.on('game_action',function(m){
    var d=m.data||{}; if(typeof Game==='undefined') return;
    if(d.type==='dice') Game.applyOpponentDice(d.value);
    else if(d.type==='move') Game.applyOpponentMove(d);
  });
}
(async function boot(){
  try{
    initTelegram();
    if(typeof window.initDOM==='function'){try{window.initDOM();}catch(e){}}
    setupMenu();
    setupGame();
    setupOnlineEvents();
    if(typeof Board!=='undefined'&&Board.initObserver){try{Board.initObserver();}catch(e){}}
    if(typeof Game!=='undefined'&&Game.initTokens){try{Game.initTokens();}catch(e){}}
    if(typeof Dice!=='undefined'&&Dice.init){try{Dice.init();}catch(e){}}
    var l=$('loading');
    if(l){l.style.transition='opacity .3s';l.style.opacity='0';setTimeout(function(){l.style.display='none';},350);}
    setTimeout(function(){show('menu');},400);
  }catch(err){
    var l=$('loading'); if(l) l.style.display='none';
    show('menu');
  }
})();
})();
