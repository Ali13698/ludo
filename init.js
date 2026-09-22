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
function tgUser(){
  var t=window.Telegram&&window.Telegram.WebApp;
  var u=t&&t.initDataUnsafe&&t.initDataUnsafe.user;
  if(u&&u.id) return u;
  var s=localStorage.getItem('angel_uid');
  if(!s){s=String(100000000+Math.floor(Math.random()*9e8));localStorage.setItem('angel_uid',s);}
  return {id:parseInt(s,10),first_name:'مهمان',username:'guest_'+s};
}
function tgAlert(m){
  var t=window.Telegram&&window.Telegram.WebApp;
  if(t&&t.showAlert) t.showAlert(m); else alert(m);
}
function initTelegram(){
  if(window.Telegram&&window.Telegram.WebApp){
    try{Telegram.WebApp.ready();}catch(e){}
    try{Telegram.WebApp.expand();}catch(e){}
  }
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
  if(b) b.addEventListener('click',function(){getSelected();show('lobby');});
  setupOptions();
}
function setupLobby(){
  var b=$('backToMenu'); if(b) b.addEventListener('click',function(){show('menu');});
  var st=$('lobbyStatus');
  var q=$('quickMatchBtn');
  if(q) q.addEventListener('click',async function(){
    q.disabled=true; if(st) st.textContent='در حال اتصال...';
    try{
      var r=await Online.initUser(tgUser());
      if(!r||!r.ok){if(st) st.textContent='خطا: '+((r&&r.error)||'نامشخص');q.disabled=false;return;}
      if(st) st.textContent='در حال یافتن حریف...';
      var m=await Online.quickMatch();
      if(!m||!m.ok){if(st) st.textContent='خطا: '+((m&&m.error)||'نامشخص');q.disabled=false;}
    }catch(e){if(st) st.textContent='خطا: '+e.message;q.disabled=false;}
  });
  var c=$('createRoomBtn');
  if(c) c.addEventListener('click',async function(){
    try{await Online.initUser(tgUser());var r=await Online.createRoom();
      if(r&&r.ok) tgAlert('کد اتاق: '+r.code);
      else if(st) st.textContent='خطا: '+((r&&r.error)||'نامشخص');
    }catch(e){}
  });
  var j=$('joinRoomBtn2');
  if(j) j.addEventListener('click',async function(){
    var code=prompt('کد اتاق:'); if(!code) return;
    try{await Online.initUser(tgUser());var r=await Online.joinRoom(code.toUpperCase());
      if(!r||!r.ok) tgAlert('خطا: '+((r&&r.error)||'نامشخص'));
    }catch(e){}
  });
}
function setupGame(){
  var r=$('rollBtn');
  if(r) r.addEventListener('click',function(){if(typeof Game!=='undefined') Game.doRoll();});
  var m=$('gameMenuBtn');
  if(m) m.addEventListener('click',function(){
    if(confirm('خروج از بازی؟')){Online.leave();show('menu');}
  });
}
function setupOnlineEvents(){
  Online.on('match_found',function(d){
    S.myIdx=d.playerIndex||0;
    S.roomCode=d.code;
    S.opponent=d.opponent;
    if(typeof Game!=='undefined') Game.newGame();
    // اگه حریف رباته، AI کلاینت روشن کن
    if(d.opponent&&d.opponent.isBot&&typeof BotOpponent!=='undefined'){
      S.isOnline=true;
      S.botInfo[1-S.myIdx]={name:d.opponent.name,avatar:d.opponent.avatar};
      BotOpponent.start(d.opponent);
    } else {
      S.isOnline=true;
    }
    show('game');
    setTimeout(function(){
      if(typeof Board!=='undefined'&&Board.resize) Board.resize();
      if(typeof Dice!=='undefined'&&Dice.init) Dice.init();
    },100);
  });
  Online.on('opponent_left',function(){tgAlert('حریف خارج شد');show('lobby');});
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
    setupMenu();setupLobby();setupGame();setupOnlineEvents();
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
