(function(){
'use strict';

window.onerror = function(m, s, l){
  const d = document.getElementById('err');
  if (d) { d.style.display = 'block'; d.textContent = 'ERR: ' + m + ' @' + l; }
  return false;
};

let tgUser = null;
let onlineReady = false;

// ============ TELEGRAM SDK ============
function loadTelegramSDK(){
  return new Promise((resolve) => {
    if (window.Telegram && window.Telegram.WebApp) return resolve(window.Telegram.WebApp);
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = () => resolve(window.Telegram ? window.Telegram.WebApp : null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
    setTimeout(() => resolve(window.Telegram ? window.Telegram.WebApp : null), 3000);
  });
}

function escapeHtml(s){
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ============ SCREENS ============
function showScreen(name){
  document.getElementById('menu').className = name === 'menu' ? '' : 'hidden';
  const lobby = document.getElementById('lobby');
  if (lobby) lobby.className = name === 'lobby' ? '' : 'screen-hidden';
  document.getElementById('game').className = name === 'game' ? 'on' : '';
  if (name !== 'game' && window.Chat){
    const p = document.getElementById('chatPanel'); if (p) p.classList.remove('open');
    const f = document.getElementById('chatFab'); if (f) f.classList.add('hidden');
  }
}

function updateLobbyUser(){
  if (!Online.userInfo) return;
  const name = Online.userInfo.name || 'کاربر';
  const av = document.getElementById('lobbyAvatar');
  const nm = document.getElementById('lobbyName');
  const st = document.getElementById('lobbyStats');
  if (av) av.textContent = '🙂';
  if (nm) nm.textContent = name;
  if (st) st.textContent = `🏆 ${Online.userInfo.wins || 0} برد | 💔 ${Online.userInfo.losses || 0} باخت`;
}

// ============ MODAL ============
function openModal(html){
  const m = document.getElementById('modal');
  const b = document.getElementById('modalBox');
  if (!m || !b) return;
  b.innerHTML = html;
  m.classList.add('open');
}
function closeModal(){
  const m = document.getElementById('modal');
  if (m) m.classList.remove('open');
}
window.closeModal = closeModal;

// ============ ONLINE INIT ============
async function initOnline(){
  try {
    const tg = await loadTelegramSDK();
    let user = null;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user){
      user = tg.initDataUnsafe.user;
      try { tg.ready(); tg.expand(); } catch(e){}
    }
    if (!user){
      user = { id: Date.now() % 1000000000, first_name: 'Test', username: 'test_' + Date.now() };
    }
    tgUser = user;
    const res = await Online.initUser(user);
    if (res && res.ok){
      onlineReady = true;
      console.log('[init] online ready', res.user);
      return true;
    }
    return false;
  } catch(e){
    console.error('[init] online failed', e);
    return false;
  }
}

// ============ LOBBY ============
function setupLobby(){
  const qm = document.getElementById('quickMatchBtn');
  if (qm) qm.onclick = async function(){
    if (!onlineReady){ alert('اتصال به سرور برقرار نیست'); return; }
    qm.disabled = true;
    openModal(`
      <div class="modal-spinner"></div>
      <h3>در جستجوی حریف...</h3>
      <p>لطفاً صبر کن، داریم دنبال یه حریف مناسب می‌گردیم</p>
      <div class="modal-buttons">
        <button class="modal-btn-secondary" onclick="Online.cancelMatch(); closeModal(); document.getElementById('quickMatchBtn').disabled=false;">لغو</button>
      </div>
    `);
    const res = await Online.quickMatch();
    if (!res || !res.ok){
      closeModal();
      qm.disabled = false;
      if (res && res.error) alert(res.error);
    }
  };

  const cr = document.getElementById('createRoomBtn');
  if (cr) cr.onclick = async function(){
    if (!onlineReady){ alert('اتصال به سرور برقرار نیست'); return; }
    const res = await Online.createRoom();
    if (!res || !res.ok){ alert((res && res.error) || 'خطا'); return; }
    Online.roomCode = res.code;
    Online.playerIndex = res.playerIndex || 0;
    openModal(`
      <h3>اتاق خصوصی ساخته شد</h3>
      <p>این کد رو به دوستت بده</p>
      <div class="modal-code" onclick="navigator.clipboard.writeText('${res.code}');">${res.code}</div>
      <div class="modal-spinner"></div>
      <p>در انتظار ورود حریف...</p>
      <div class="modal-buttons">
        <button class="modal-btn-secondary" onclick="closeModal()">بستن</button>
      </div>
    `);
  };

  const jr = document.getElementById('joinRoomBtn2');
  if (jr) jr.onclick = function(){
    if (!onlineReady){ alert('اتصال به سرور برقرار نیست'); return; }
    openModal(`
      <h3>ورود به اتاق</h3>
      <p>کد ۵ حرفی دوستت رو وارد کن</p>
      <input id="joinCodeInput" class="modal-input" maxlength="5" placeholder="-----" autocomplete="off">
      <div class="modal-buttons">
        <button class="modal-btn-secondary" onclick="closeModal()">لغو</button>
        <button class="modal-btn-primary" onclick="joinRoomAction()">ورود</button>
      </div>
    `);
    setTimeout(() => { const i = document.getElementById('joinCodeInput'); if (i) i.focus(); }, 200);
  };

  const fb = document.getElementById('friendsBtn');
  if (fb) fb.onclick = function(){ openFriendsModal(); };

  const lb = document.getElementById('leaderboardBtn');
  if (lb) lb.onclick = async function(){
    openModal(`<div class="modal-spinner"></div><h3>در حال بارگذاری...</h3>`);
    const res = await Online.getLeaderboard();
    if (!res || !res.ok){
      openModal(`<h3>خطا</h3><div class="modal-buttons"><button class="modal-btn-secondary" onclick="closeModal()">بستن</button></div>`);
      return;
    }
    const list = res.leaderboard || [];
    let html = `<h3>🏆 لیدربورد</h3><div class="modal-list">`;
    if (list.length === 0){
      html += `<div style="padding:20px;text-align:center;color:#94a3b8;">هنوز کسی بازی نکرده</div>`;
    } else {
      list.forEach((u, i) => {
        const r = i + 1;
        const rc = r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '';
        const name = u.display_name || u.first_name || u.username || ('کاربر' + u.id);
        html += `<div class="lb-row">
          <div class="lb-rank ${rc}">${r}</div>
          <div class="friend-info">
            <div class="friend-avatar">🙂</div>
            <div>
              <div class="friend-name">${escapeHtml(name)}</div>
              <div class="friend-status">🏆 ${u.wins} برد</div>
            </div>
          </div>
        </div>`;
      });
    }
    html += `</div><div class="modal-buttons" style="margin-top:12px;"><button class="modal-btn-secondary" onclick="closeModal()">بستن</button></div>`;
    openModal(html);
  };

  const pb = document.getElementById('profileBtn');
  if (pb) pb.onclick = async function(){
    const res = await Online.getMe();
    if (!res || !res.ok){ alert('خطا'); return; }
    const u = res.user;
    openModal(`
      <h3>👤 پروفایل</h3>
      <p>🏆 برد: ${u.wins} | 💔 باخت: ${u.losses} | ⭐ سطح: ${u.level}</p>
      <input id="profileNameInput" class="modal-input" maxlength="20" value="${escapeHtml(u.name)}" placeholder="نام جدید" style="letter-spacing:0;text-align:right;font-weight:500;">
      <div class="modal-buttons">
        <button class="modal-btn-secondary" onclick="closeModal()">بستن</button>
        <button class="modal-btn-primary" onclick="saveProfileName()">ذخیره</button>
      </div>
    `);
  };

  const bm = document.getElementById('backToMenu');
  if (bm) bm.onclick = function(){ showScreen('menu'); };
}

window.joinRoomAction = async function(){
  const input = document.getElementById('joinCodeInput');
  if (!input) return;
  const code = (input.value || '').toUpperCase().trim();
  if (code.length < 5){ alert('کد ۵ حرفی وارد کن'); return; }
  const res = await Online.joinRoom(code);
  if (!res || !res.ok){ alert((res && res.error) || 'خطا'); return; }
  Online.roomCode = res.code;
  Online.playerIndex = res.playerIndex || 1;
};

window.saveProfileName = async function(){
  const input = document.getElementById('profileNameInput');
  if (!input) return;
  const name = (input.value || '').trim();
  if (!name){ alert('نام خالی نمیشه'); return; }
  const res = await Online.setName(name);
  if (res && res.ok){
    const me = await Online.getMe();
    if (me && me.ok){ Online.userInfo = me.user; updateLobbyUser(); }
    closeModal();
  } else {
    alert('خطا در ذخیره');
  }
};

async function openFriendsModal(){
  openModal(`<div class="modal-spinner"></div><h3>در حال بارگذاری...</h3>`);
  const res = await Online.getFriends();
  if (!res || !res.ok){
    openModal(`<h3>خطا</h3><div class="modal-buttons"><button class="modal-btn-secondary" onclick="closeModal()">بستن</button></div>`);
    return;
  }
  const friends = res.friends || [];
  const requests = res.requests || [];
  let html = `<h3>👥 دوستان</h3>`;
  if (requests.length > 0){
    html += `<p style="font-size:12px;">درخواست‌ها (${requests.length})</p><div class="modal-list" style="margin-bottom:12px;">`;
    requests.forEach(r => {
      const n = r.display_name || r.first_name || r.username || ('کاربر' + r.id);
      html += `<div class="friend-row">
        <div class="friend-info"><div class="friend-avatar">🙂</div><div class="friend-name">${escapeHtml(n)}</div></div>
        <div class="friend-actions"><button class="btn-accept" onclick="acceptFriend(${r.id})">قبول</button></div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `<p style="font-size:12px;margin-top:8px;">لیست دوستان (${friends.length})</p><div class="modal-list">`;
  if (friends.length === 0){
    html += `<div style="padding:20px;text-align:center;color:#94a3b8;">هنوز دوستی نداری</div>`;
  } else {
    friends.forEach(f => {
      const n = f.display_name || f.first_name || f.username || ('کاربر' + f.id);
      html += `<div class="friend-row">
        <div class="friend-info">
          <div class="friend-avatar">🙂</div>
          <div><div class="friend-name">${escapeHtml(n)}</div><div class="friend-status">🏆 ${f.wins||0} برد</div></div>
        </div>
        <div class="friend-actions">
          <button class="btn-invite" onclick="inviteFriend(${f.id})">دعوت</button>
          <button class="btn-remove" onclick="removeFriend(${f.id})">✕</button>
        </div>
      </div>`;
    });
  }
  html += `</div>
    <div style="margin-top:12px;width:100%;">
      <input id="addFriendInput" class="modal-input" placeholder="یوزرنیم (بدون @)" style="letter-spacing:0;text-align:right;font-weight:500;">
      <div class="modal-buttons" style="margin-top:10px;">
        <button class="modal-btn-secondary" onclick="closeModal()">بستن</button>
        <button class="modal-btn-primary" onclick="addFriendAction()">افزودن</button>
      </div>
    </div>`;
  openModal(html);
}

window.acceptFriend = async function(id){ const r = await Online.acceptFriend(id); if (r && r.ok) openFriendsModal(); };
window.removeFriend = async function(id){ if (!confirm('حذف دوست؟')) return; const r = await Online.removeFriend(id); if (r && r.ok) openFriendsModal(); };
window.inviteFriend = async function(id){
  const r = await Online.inviteFriend(id);
  if (r && r.ok){
    openModal(`<div class="modal-spinner"></div><h3>درخواست فرستاده شد</h3><p>منتظر جواب دوستت باش</p><div class="modal-buttons"><button class="modal-btn-secondary" onclick="closeModal()">بستن</button></div>`);
  } else {
    alert((r && r.error) || 'خطا');
  }
};
window.addFriendAction = async function(){
  const input = document.getElementById('addFriendInput');
  if (!input) return;
  const username = (input.value || '').trim().replace('@','');
  if (!username){ alert('یوزرنیم وارد کن'); return; }
  const r = await Online.addFriend(username);
  if (r && r.ok){
    alert(r.autoAccepted ? 'الان دوستید!' : 'درخواست فرستاده شد');
    openFriendsModal();
  } else {
    alert((r && r.error) || 'خطا');
  }
};

// ============ ONLINE EVENTS ============
function setupOnlineEvents(){
  Online.on('match_found', (data) => {
    console.log('[match] found', data);
    closeModal();
    Online.roomCode = data.code;
    Online.playerIndex = data.playerIndex || 0;
    Online.opponent = data.opponent;
    const qm = document.getElementById('quickMatchBtn'); if (qm) qm.disabled = false;
    startOnlineGame();
  });

  Online.on('opponent_left', () => {
    if (S.over) return;
    alert('حریف از بازی خارج شد');
    endOnlineGame();
  });

  Online.on('disconnected', () => { onlineReady = false; });

  Online.on('friend_request', (d) => { alert(d.from.name + ' درخواست دوستی فرستاد'); });
  Online.on('friend_accepted', (d) => { alert(d.by.name + ' درخواست تو رو قبول کرد'); });

  Online.on('friend_invite', (d) => {
    window._pendingInviteId = d.inviteId;
    openModal(`
      <h3>🎮 دعوت به بازی</h3>
      <p><b>${escapeHtml(d.from.name)}</b> تو رو به بازی دعوت کرده</p>
      <div class="modal-buttons">
        <button class="modal-btn-secondary" onclick="declineInvite()">رد کردن</button>
        <button class="modal-btn-primary" onclick="acceptInvite()">قبول</button>
      </div>
    `);
  });

  Online.on('invite_declined', (d) => { alert(d.by.name + ' دعوتت رو رد کرد'); });

  Online.on('emoji', (d) => { if (window.Chat) Chat.showEmoji(d.from, d.emoji); });

  // ⭐ مهم‌ترین قسمت: دریافت حرکت/تاس حریف
  Online.on('game_action', (msg) => {
    const d = msg.data;
    if (!d) return;
    console.log('[online] received:', d);
    if (d.type === 'dice'){
      Game.applyOpponentDice(d.value);
    } else if (d.type === 'move'){
      Game.applyOpponentMove(d);
    }
  });
}

window.acceptInvite = async function(){
  const id = window._pendingInviteId; if (!id) return;
  const r = await Online.respondInvite(id, true);
  if (!r || !r.ok){ alert('خطا'); return; }
  window._pendingInviteId = null; closeModal();
};
window.declineInvite = async function(){
  const id = window._pendingInviteId; if (!id) return;
  await Online.respondInvite(id, false);
  window._pendingInviteId = null; closeModal();
};

// ============ START ONLINE GAME ============
function startOnlineGame(){
  showScreen('game');
  S.isOnline = true;
  S.active = [0, 1];
  S.myIdx = Online.playerIndex === 0 ? 0 : 1;
  S.botInfo = {};
  const oppIdx = 1 - S.myIdx;
  if (Online.opponent){
    S.botInfo[oppIdx] = { name: Online.opponent.name || 'حریف', avatar: '🎮' };
  }
  S.tokens = [];
  for (let p = 0; p < 2; p++){
    for (let i = 0; i < 4; i++){
      S.tokens.push({
        player: p, idx: i, pos: 0,
        vx: P[p].base[i][0], vy: P[p].base[i][1],
        wps: [], moving: false
      });
    }
  }
  S.cur = 0;
  S.dice = 0;
  S.rolled = false;
  S.over = false;
  S.busy = false;
  S.firstRollDone = false;
  S.outMap = {0: false, 1: false};
  S.strikeMap = {0: 0, 1: 0};

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      Board.resize();
      Dice.init();
      UI.update();
      UI.renderProfiles();
      Board.draw();
      if (S.cur === S.myIdx) Timer.start();
      else DOM.statusText.textContent = 'نوبت حریف...';
    });
  });
  if (window.Chat){
    Chat.reset();
    const f = document.getElementById('chatFab');
    if (f) f.classList.remove('hidden');
  }
}

function endOnlineGame(){
  S.isOnline = false;
  if (window.Chat){
    const p = document.getElementById('chatPanel'); if (p) p.classList.remove('open');
    const f = document.getElementById('chatFab'); if (f) f.classList.add('hidden');
  }
  Online.leave();
  showScreen('lobby');
}

// ============ LOOP ============
function loop(){
  for (let i = 0; i < S.tokens.length; i++){
    if (S.tokens[i].moving){ Board.draw(); break; }
  }
  requestAnimationFrame(loop);
}

// ============ BOOT ============
(async function boot(){
  initDOM();
  const optGroups = document.querySelectorAll('.opts');
  for (let gi = 0; gi < optGroups.length; gi++){
    (function(g){
      const key = g.getAttribute('data-k');
      const btns = g.querySelectorAll('button');
      for (let j = 0; j < btns.length; j++){
        btns[j].onclick = function(){
          for (let k = 0; k < btns.length; k++) btns[k].className = '';
          this.className = 'on';
          CFG[key] = this.getAttribute('data-v');
          SFX.click();
        };
      }
    })(optGroups[gi]);
  }

  setupOnlineEvents();
  setupLobby();
  showScreen('menu');

  if (window.Chat) Chat.init();

  // اتصال WebSocket در پس‌زمینه
  const ok = await initOnline();
  console.log('[boot] online:', ok);

  document.getElementById('playBtn').onclick = async function(){
    SFX.get();
    showScreen('lobby');
    if (!onlineReady){
      const ok2 = await initOnline();
      if (!ok2) alert('اتصال به سرور برقرار نشد');
    }
    updateLobbyUser();
  };

  Board.initObserver();
  Game.initTokens();
  loop();
})();

})();
