(function(){
'use strict';

window.onerror = function(m,s,l){
  var d = document.getElementById('err');
  if(d){ d.style.display='block'; d.textContent='ERR: '+m+' @'+l; }
  return false;
};

// ============ CONFIG ============
var cfg = { players:'1v1', safe:'on', goals:'2', firstExit:'off' };
var optGroups = document.querySelectorAll('.opts');
for (var gi = 0; gi < optGroups.length; gi++) {
  (function(g){
    var key = g.getAttribute('data-k');
    var btns = g.querySelectorAll('button');
    for (var j = 0; j < btns.length; j++) {
      btns[j].onclick = function() {
        for (var k = 0; k < btns.length; k++) btns[k].className = '';
        this.className = 'on';
        cfg[key] = this.getAttribute('data-v');
      };
    }
  })(optGroups[gi]);
}

// ============ BOARD DATA ============
var GRID = 15;
var path = [[1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],[6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6]];
var SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
var P = [
  { name:'قرمز', color:'#ef4444', dark:'#991b1b', light:'#fca5a5', start:0,  home:[[1,7],[2,7],[3,7],[4,7],[5,7]],  base:[[1.7,1.7],[4.3,1.7],[1.7,4.3],[4.3,4.3]],  box:[0,0] },
  { name:'سبز',  color:'#10b981', dark:'#065f46', light:'#6ee7b7', start:13, home:[[7,1],[7,2],[7,3],[7,4],[7,5]],  base:[[10.7,1.7],[13.3,1.7],[10.7,4.3],[13.3,4.3]], box:[9,0] },
  { name:'زرد',  color:'#f59e0b', dark:'#b45309', light:'#fcd34d', start:26, home:[[13,7],[12,7],[11,7],[10,7],[9,7]], base:[[10.7,10.7],[13.3,10.7],[10.7,13.3],[13.3,13.3]], box:[9,9] },
  { name:'آبی',  color:'#3b82f6', dark:'#1e40af', light:'#93c5fd', start:39, home:[[7,13],[7,12],[7,11],[7,10],[7,9]], base:[[1.7,10.7],[4.3,10.7],[1.7,13.3],[4.3,13.3]], box:[0,9] }
];

// نام و آواتار ربات‌ها (انسانی‌تر)
var BOT_PROFILES = [
  { name:'آرش',   avatar:'🧑' },
  { name:'سارا',   avatar:'👩' },
  { name:'کیان',   avatar:'🧔' },
  { name:'نیلوفر', avatar:'👧' },
  { name:'پارسا',  avatar:'👨' },
  { name:'رها',    avatar:'👩‍🦰' }
];
function randomBotName(){
  var used = {};
  for(var i=0;i<active.length;i++) if(botInfo[active[i]]) used[botInfo[active[i]].name]=true;
  var avail = BOT_PROFILES.filter(function(b){ return !used[b.name]; });
  var pick = avail.length ? avail[Math.floor(Math.random()*avail.length)] : BOT_PROFILES[Math.floor(Math.random()*BOT_PROFILES.length)];
  return pick;
}

// ============ STATE ============
var CELL = 30;
var active = [];
var tokens = [];
var cur = 0;
var dice = 0;
var rolled = false;
var over = false;
var busy = false;
var myIdx = 0;
var outMap = {};
var strikeMap = {};
var botInfo = {}; // player -> {name, avatar}
var TURN_TIME = 15;
var timeLeft = 0;
var timerInterval = null;
var botTimeout = null;
var firstRollDone = false;

// ============ DOM ============
var canvas = document.getElementById('board');
var ctx = canvas.getContext('2d');
var rollBtn = document.getElementById('rollBtn');
var statusText = document.getElementById('statusText');
var timerFill = document.getElementById('timerFill');
var profilesEl = document.getElementById('profiles');
var boardArea = document.getElementById('boardArea');
var dice3d = document.getElementById('dice3d');

// ============ AUDIO ============
var audioCtx = null;
function getAudio(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){}
  return audioCtx;
}
function tone(f,d,t,v,dl){
  try{
    var a=getAudio(); if(!a) return;
    var o=a.createOscillator(),g=a.createGain();
    o.type=t||'sine'; o.frequency.value=f;
    o.connect(g); g.connect(a.destination);
    var s=a.currentTime+(dl||0);
    g.gain.setValueAtTime(0,s);
    g.gain.linearRampToValueAtTime(v||0.15,s+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,s+(d||0.1));
    o.start(s); o.stop(s+(d||0.1)+0.02);
  }catch(e){}
}
function sDice(){ for(var i=0;i<6;i++) tone(400+Math.random()*400,0.06,'square',0.08,i*0.06); }
function sStep(){ tone(800,0.05,'triangle',0.08); }
function sCapture(){ tone(500,0.1,'sawtooth',0.15); tone(280,0.15,'sawtooth',0.15,0.08); }
function sHome(){ tone(880,0.1,'sine',0.2); tone(1200,0.15,'sine',0.2,0.1); }
function sWin(){ [523,659,784,1047].forEach(function(f,i){ tone(f,0.28,'sine',0.22,i*0.13); }); }

// ============ DICE 3D RENDER ============
var FACE_DOTS = {
  1: [4],
  2: [0,8],
  3: [0,4,8],
  4: [0,2,6,8],
  5: [0,2,4,6,8],
  6: [0,2,3,5,6,8]
};
function fillFace(faceEl, num){
  faceEl.innerHTML = '';
  var on = FACE_DOTS[num] || [];
  for(var i=0;i<9;i++){
    var d = document.createElement('div');
    d.className = 'dot' + (on.indexOf(i)>=0 ? '' : ' off');
    faceEl.appendChild(d);
  }
}
function initDice(){
  var faces = dice3d.querySelectorAll('.face');
  var nums = [1,6,3,4,2,5]; // front, back, right, left, top, bottom
  for(var i=0;i<faces.length;i++) fillFace(faces[i], nums[i]);
}
function showDiceFace(num){
  // front=1, right=3, top=2, back=6, left=4, bottom=5
  var rot = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(-90deg) rotateY(0deg)',
    3: 'rotateX(0deg) rotateY(-90deg)',
    4: 'rotateX(0deg) rotateY(90deg)',
    5: 'rotateX(90deg) rotateY(0deg)',
    6: 'rotateX(0deg) rotateY(180deg)'
  };
  dice3d.style.transform = rot[num] || rot[1];
}
function spinDice(cb){
  // چرخش تصادفی چند دور، بعد نشون دادن عدد
  var spins = 3 + Math.floor(Math.random()*3);
  var rx = spins*360 + Math.floor(Math.random()*180);
  var ry = spins*360 + Math.floor(Math.random()*180);
  dice3d.style.transition = 'transform .15s linear';
  var i = 0;
  var int = setInterval(function(){
    dice3d.style.transform = 'rotateX('+(rx*(i+1)/8)+'deg) rotateY('+(ry*(i+1)/8)+'deg)';
    if(++i >= 8){
      clearInterval(int);
      dice3d.style.transition = 'transform .5s cubic-bezier(.2,.9,.3,1.3)';
      showDiceFace(dice);
      if(cb) setTimeout(cb, 500);
    }
  }, 80);
}

// ============ TOKENS ============
function initTokens(){
  tokens = [];
  for(var p=0;p<4;p++) for(var i=0;i<4;i++){
    tokens.push({
      player:p, idx:i, pos:0,
      vx:P[p].base[i][0], vy:P[p].base[i][1],
      wps:[], moving:false
    });
  }
}

function gridOf(pl, pos, idx){
  if(pos===0) return [P[pl].base[idx][0], P[pl].base[idx][1]];
  if(pos<=51){ var a=(P[pl].start+pos-1)%52; return [path[a][0]+0.5, path[a][1]+0.5]; }
  if(pos<=56){ var h=P[pl].home[pos-52]; return [h[0]+0.5, h[1]+0.5]; }
  return [7.5,7.5];
}

function canMove(t, d){
  if(t.pos===57) return false;
  if(t.pos===0){
    if(cfg.firstExit==='on' && !firstRollDone) return true;
    return d===6;
  }
  return t.pos+d<=57;
}

// ============ RESIZE ============
function resize(){
  var w = boardArea.clientWidth - 16;
  var h = boardArea.clientHeight - 16;
  if(w<=0 || h<=0) return;
  var sz = Math.min(w, h);
  var nc = Math.floor(sz/GRID);
  if(nc<5) return;
  CELL = nc;
  var s = CELL*GRID;
  var dpr = window.devicePixelRatio||1;
  canvas.width = s*dpr;
  canvas.height = s*dpr;
  canvas.style.width = s+'px';
  canvas.style.height = s+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}
if(window.ResizeObserver){
  var ro = new ResizeObserver(function(){ if(boardArea.clientWidth>0) resize(); });
  ro.observe(boardArea);
}
window.addEventListener('resize', function(){ if(boardArea.clientWidth>0) resize(); });

// ============ DRAW ============
function rr(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function isSafeSq(i){ return cfg.safe==='on' && SAFE.indexOf(i)>=0; }

function draw(){
  if(CELL<5 || !active.length) return;
  var s = CELL*GRID;
  ctx.clearRect(0,0,s,s);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0,0,s,s);

  // Bases
  for(var p=0;p<4;p++){
    var bx=P[p].box[0]*CELL, by=P[p].box[1]*CELL;
    ctx.fillStyle = P[p].light;
    rr(bx+3, by+3, 6*CELL-6, 6*CELL-6, 16); ctx.fill();
    ctx.strokeStyle = P[p].color; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    rr(bx+CELL*0.9, by+CELL*0.9, 6*CELL-CELL*1.8, 6*CELL-CELL*1.8, 12); ctx.fill();
  }

  // Path
  for(var i=0;i<52;i++){
    var c=path[i][0], r=path[i][1];
    var sp=-1;
    for(var pp=0;pp<4;pp++) if(P[pp].start===i) sp=pp;
    var fill='#ffffff', stroke='#e2e8f0';
    if(sp>=0){ fill=P[sp].color; stroke=P[sp].dark; }
    else if(SAFE.indexOf(i)>=0){ fill='#fef9e7'; stroke='#fbbf24'; }
    ctx.fillStyle = fill;
    rr(c*CELL+1.5, r*CELL+1.5, CELL-3, CELL-3, 4); ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
    if(SAFE.indexOf(i)>=0 && sp<0){
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold '+(CELL*0.55)+'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('★', (c+0.5)*CELL, (r+0.5)*CELL);
    }
  }

  // Home columns
  for(var a=0;a<active.length;a++){
    var pl = active[a], hc = P[pl].home;
    for(var j=0;j<hc.length;j++){
      ctx.fillStyle = P[pl].color;
      rr(hc[j][0]*CELL+1.5, hc[j][1]*CELL+1.5, CELL-3, CELL-3, 4); ctx.fill();
    }
  }

  // Center triangles
  var cx=7.5*CELL, cy=7.5*CELL;
  var x0=6*CELL, y0=6*CELL, x1=9*CELL, y1=9*CELL;
  ctx.fillStyle = P[0].color; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x0,y0); ctx.lineTo(x0,y1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P[1].color; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x0,y0); ctx.lineTo(x1,y0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P[2].color; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x1,y0); ctx.lineTo(x1,y1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P[3].color; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x0,y1); ctx.lineTo(x1,y1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
  ctx.strokeRect(x0,y0,x1-x0,y1-y0);

  // Tokens
  var r2 = CELL*0.42;
  var mv = getMovable();
  for(var i2=0;i2<tokens.length;i2++){
    var t = tokens[i2];
    if(active.indexOf(t.player)<0) continue;
    var px = t.vx*CELL, py = t.vy*CELL;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.arc(px, py+2, r2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, r2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = P[t.player].color;
    ctx.beginPath(); ctx.arc(px, py, r2*0.78, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, r2*0.36, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = P[t.player].dark;
    ctx.beginPath(); ctx.arc(px, py, r2*0.18, 0, Math.PI*2); ctx.fill();
    if(mv.indexOf(t)>=0){
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, r2+3, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = P[t.player].dark; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, r2+5, 0, Math.PI*2); ctx.stroke();
    }
  }
}

function getMovableFor(player){
  if(over || busy) return [];
  if(outMap[player]) return [];
  var arr = [];
  for(var i=0;i<tokens.length;i++){
    if(tokens[i].player===player && canMove(tokens[i], dice)) arr.push(tokens[i]);
  }
  return arr;
}
function getMovable(){
  if(!rolled) return [];
  if(cur !== active[myIdx]) return [];
  return getMovableFor(cur);
}

// ============ MOVEMENT ============
function startMove(t, d, cb){
  busy = true;
  var from = t.pos;
  var to = from===0 ? 1 : from+d;
  t.wps = [];
  if(from===0){ t.wps.push(gridOf(t.player, 1, t.idx)); }
  else{ for(var p=from+1;p<=to;p++) t.wps.push(gridOf(t.player, p, t.idx)); }
  t.moving = true;
  var speed = 0.15;
  function step(){
    if(t.wps.length===0){
      t.moving = false;
      t.pos = to;
      var captured = false;
      if(t.pos>=1 && t.pos<=51){
        var abs = (P[t.player].start + t.pos - 1) % 52;
        if(!isSafeSq(abs)){
          for(var i=0;i<tokens.length;i++){
            var o = tokens[i];
            if(o===t || o.player===t.player) continue;
            if(o.pos===0 || o.pos>51) continue;
            var oAbs = (P[o.player].start + o.pos - 1) % 52;
            if(oAbs===abs){
              o.pos=0;
              var g = gridOf(o.player, 0, o.idx);
              o.vx=g[0]; o.vy=g[1];
              captured=true;
            }
          }
        }
      }
      if(captured) sCapture();
      if(t.pos===57) sHome();
      setTimeout(function(){ busy=false; cb(); }, 200);
      return;
    }
    var tg = t.wps[0];
    var dx = tg[0]-t.vx, dy = tg[1]-t.vy;
    var dist = Math.sqrt(dx*dx+dy*dy);
    if(dist<speed){
      t.vx=tg[0]; t.vy=tg[1]; t.wps.shift();
      sStep();
      requestAnimationFrame(step);
    } else {
      t.vx += dx/dist*speed;
      t.vy += dy/dist*speed;
      requestAnimationFrame(step);
    }
  }
  step();
}

function checkWin(){
  var need = parseInt(cfg.goals,10);
  for(var a=0;a<active.length;a++){
    var p = active[a], c=0;
    for(var i=0;i<tokens.length;i++) if(tokens[i].player===p && tokens[i].pos===57) c++;
    if(c>=need) return p;
  }
  return -1;
}

// ============ TIMER ============
function startTimer(){
  clearTimer();
  timeLeft = TURN_TIME;
  timerFill.style.width = '100%';
  timerFill.className = 'timerFill';
  timerInterval = setInterval(function(){
    timeLeft -= 0.1;
    var pct = Math.max(0, (timeLeft/TURN_TIME)*100);
    timerFill.style.width = pct+'%';
    if(timeLeft<=3) timerFill.className = 'timerFill danger';
    if(timeLeft<=0){
      clearTimer();
      if(cur===active[myIdx] && !outMap[cur]){
        strikeMap[cur] = (strikeMap[cur]||0)+1;
        if(strikeMap[cur]>=2){
          outMap[cur] = true;
          statusText.textContent = 'شما اوت شدید!';
          renderProfiles();
          setTimeout(nextTurn, 1200);
          return;
        }
        statusText.textContent = 'زمان تموم شد! خودکار می‌ریزیم...';
        setTimeout(doRoll, 300);
      }
    }
  }, 100);
}
function clearTimer(){
  if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
  if(botTimeout){ clearTimeout(botTimeout); botTimeout = null; }
}

// ============ ROLL ============
function doRoll(){
  if(over || rolled || busy) return;
  if(outMap[cur]) return;
  clearTimer();
  sDice();
  dice = Math.floor(Math.random()*6)+1;
  // انیمیشن واقعی تاس
  dice3d.style.transform = 'rotateX(0deg) rotateY(0deg)';
  setTimeout(function(){ spinDice(settled); }, 50);
}

function settled(){
  rolled = true;
  draw(); renderProfiles(); updateUI();
  var mv = getMovableFor(cur);
  if(mv.length===0){
    statusText.textContent = 'حرکتی ممکن نیست...';
    setTimeout(function(){
      if(dice===6){
        rolled=false; dice=0; strikeMap[cur]=0;
        updateUI();
        if(cur===active[myIdx]) startTimer();
        else botTurn();
      } else {
        nextTurn();
      }
    }, 900);
    return;
  }
  if(cur!==active[myIdx]){
    // ربات - فکر کردن
    var delay = 800 + Math.random()*1500;
    setTimeout(function(){ botChoose(mv); }, delay);
  } else if(mv.length===1){
    setTimeout(function(){ doMove(mv[0]); }, 500);
  }
}

function doMove(t){
  if(over || busy) return;
  clearTimer();
  var d = dice;
  startMove(t, d, function(){
    firstRollDone = true;
    strikeMap[cur] = 0;
    var w = checkWin();
    if(w>=0){
      over = true;
      sWin();
      var name = (w===active[myIdx]) ? 'شما' : (botInfo[w] ? botInfo[w].name : P[w].name);
      statusText.textContent = '🏆 برنده: '+name;
      updateUI(); draw(); renderProfiles();
      return;
    }
    if(d===6){
      rolled=false; dice=0;
      updateUI();
      if(cur===active[myIdx]) startTimer();
      else botTurn();
      return;
    }
    nextTurn();
  });
}

// ============ BOT (انسانی) ============
function botChoose(mv){
  // ۷۵٪ بهترین حرکت، ۲۵٪ تصادفی
  if(Math.random() < 0.75){
    mv.sort(function(a,b){
      var sa = (a.pos===0?100:a.pos) + (a.pos+dice===57?500:0);
      var sb = (b.pos===0?100:b.pos) + (b.pos+dice===57?500:0);
      return sb-sa;
    });
    doMove(mv[0]);
  } else {
    var pick = mv[Math.floor(Math.random()*mv.length)];
    doMove(pick);
  }
}

function botTurn(){
  if(over || busy || outMap[cur]) return;
  if(cur===active[myIdx]) return;
  // تاخیر انسانی قبل از رول
  var thinkDelay = 1200 + Math.random()*2000;
  statusText.textContent = (botInfo[cur]?botInfo[cur].name:P[cur].name)+' در حال فکر...';
  botTimeout = setTimeout(function(){
    if(over || busy || cur===active[myIdx]) return;
    doRoll();
  }, thinkDelay);
}

// ============ TURN ============
function nextTurn(){
  clearTimer();
  var idx = active.indexOf(cur);
  var tries = 0;
  while(tries < 20){
    idx = (idx+1) % active.length;
    cur = active[idx];
    tries++;
    if(cur===active[myIdx] || !outMap[cur]) break;
  }
  rolled = false; dice = 0;
  updateUI(); draw(); renderProfiles();
  if(cur===active[myIdx]){
    if(!outMap[cur]) startTimer();
  } else {
    botTurn();
  }
}

// ============ UI ============
function updateUI(){
  if(over){ rollBtn.classList.add('hide'); return; }
  if(cur===active[myIdx] && !outMap[cur]){
    rollBtn.classList.remove('hide');
    rollBtn.disabled = rolled || busy;
    if(!rolled && !busy) statusText.textContent = 'You can roll';
    else if(busy) statusText.textContent = 'در حال حرکت...';
    else statusText.textContent = 'یک مهره انتخاب کن';
  } else {
    rollBtn.classList.add('hide');
    if(outMap[cur]) statusText.textContent = 'اوت شده';
    else if(busy) statusText.textContent = 'در حال حرکت...';
  }
}

function renderProfiles(){
  profilesEl.innerHTML = '';
  for(var i=0;i<active.length;i++){
    var p = active[i];
    var d = document.createElement('div');
    d.className = 'profile';
    if(i===cur && !over) d.className += ' active';
    if(outMap[p]) d.className += ' out';
    var av = document.createElement('div');
    av.className = 'avatar';
    if(p===active[myIdx]){
      av.textContent = '🙂';
    } else {
      av.textContent = botInfo[p] ? botInfo[p].avatar : '🤖';
    }
    var nm = document.createElement('div');
    nm.className = 'profile-name';
    if(p===active[myIdx]) nm.textContent = 'شما';
    else nm.textContent = botInfo[p] ? botInfo[p].name : P[p].name;
    d.appendChild(av);
    d.appendChild(nm);
    profilesEl.appendChild(d);
  }
}

// ============ EVENTS ============
document.getElementById('playBtn').onclick = function(){
  getAudio();
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('game').classList.add('on');
  newGame();
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      resize();
      initDice();
      updateUI();
      renderProfiles();
      draw();
      if(cur===active[myIdx]) startTimer();
    });
  });
};

rollBtn.onclick = function(){
  if(cur!==active[myIdx]) return;
  if(rolled || busy || over || outMap[cur]) return;
  getAudio();
  doRoll();
};

canvas.onclick = function(e){
  if(over || busy) return;
  if(cur!==active[myIdx]) return;
  if(!rolled) return;
  if(outMap[cur]) return;
  var rect = canvas.getBoundingClientRect();
  var gx = (e.clientX-rect.left)/CELL;
  var gy = (e.clientY-rect.top)/CELL;
  var mv = getMovable();
  var best = null, bd = 0.8;
  for(var i=0;i<mv.length;i++){
    var t = mv[i];
    var g = gridOf(t.player, t.pos, t.idx);
    var dx = g[0]-gx, dy = g[1]-gy;
    var dd = Math.sqrt(dx*dx+dy*dy);
    if(dd<bd){ bd=dd; best=t; }
  }
  if(best) doMove(best);
};

// ============ LOOP ============
function loop(){
  for(var i=0;i<tokens.length;i++){
    if(tokens[i].moving){ draw(); break; }
  }
  requestAnimationFrame(loop);
}

// ============ NEW GAME ============
function newGame(){
  active = [];
  botInfo = {};
  if(cfg.players==='1v1'){
    active = [0, 1];
  } else if(cfg.players==='2v2'){
    active = [0, 1, 3, 2];
  } else if(cfg.players==='3'){
    active = [0, 1, 3];
  } else {
    active = [0, 1
