// shell/lobby.js — Lobby UI handlers
// Uses Platform.showPrompt/ShowConfirm to work inside WebView

(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  function notify(msg){
    if (window.Platform && Platform.showAlert) Platform.showAlert(msg);
    else alert(msg);
  }

  function askCode(cb){
    if (window.Platform && Platform.showPrompt) {
      Platform.showPrompt('کد اتاق:', cb);
    } else {
      cb(window.prompt('کد اتاق:'));
    }
  }

  function confirmBox(msg, cb){
    if (window.Platform && Platform.showConfirm) {
      Platform.showConfirm(msg, cb);
    } else {
      cb(window.confirm(msg));
    }
  }

  function getUser(){
    if (window.Platform && Platform.getUser) return Platform.getUser();
    var t = window.Telegram && window.Telegram.WebApp;
    var u = t && t.initDataUnsafe && t.initDataUnsafe.user;
    if (u && u.id) return u;
    return null;
  }

  function ensureUser(){
    if (!window.Online || !Online.initUser) return Promise.resolve(null);
    return Online.initUser(getUser());
  }

  function setStatus(st, msg){
    if (st) st.textContent = msg || '';
  }

  function setupQuickMatch(){
    var q = $('quickMatchBtn');
    if (!q) return;
    if (q._angelBound) return;
    q._angelBound = true;

    var st = $('lobbyStatus');

    q.addEventListener('click', async function(){
      q.disabled = true;
      setStatus(st, 'در حال اتصال...');
      try {
        var r = await ensureUser();
        if (!r || !r.ok) {
          setStatus(st, 'خطا: ' + ((r && r.error) || 'نامشخص'));
          q.disabled = false;
          return;
        }
        setStatus(st, 'در حال یافتن حریف...');
        var m = await Online.quickMatch('ludo');
        if (!m || !m.ok) {
          setStatus(st, 'خطا: ' + ((m && m.error) || 'نامشخص'));
          q.disabled = false;
        }
      } catch (e) {
        setStatus(st, 'خطا: ' + (e && e.message ? e.message : 'نامشخص'));
        q.disabled = false;
      }
    });
  }

  function setupCreateRoom(){
    var c = $('createRoomBtn');
    if (!c) return;
    if (c._angelBound) return;
    c._angelBound = true;

    var st = $('lobbyStatus');

    c.addEventListener('click', async function(){
      c.disabled = true;
      setStatus(st, 'در حال ساخت اتاق...');
      try {
        var r = await ensureUser();
        if (!r || !r.ok) {
          setStatus(st, 'خطا: ' + ((r && r.error) || 'نامشخص'));
          c.disabled = false;
          return;
        }
        var room = await Online.createRoom('ludo');
        if (room && room.ok && room.code) {
          notify('کد اتاق: ' + room.code);
          setStatus(st, 'کد اتاق: ' + room.code);
        } else {
          setStatus(st, 'خطا: ' + ((room && room.error) || 'نامشخص'));
        }
      } catch (e) {
        setStatus(st, 'خطا: ' + (e && e.message ? e.message : 'نامشخص'));
      }
      c.disabled = false;
    });
  }

  function setupJoinRoom(){
    var j = $('joinRoomBtn2');
    if (!j) return;
    if (j._angelBound) return;
    j._angelBound = true;

    var st = $('lobbyStatus');

    j.addEventListener('click', function(){
      askCode(async function(code){
        if (!code) return;
        j.disabled = true;
        setStatus(st, 'در حال اتصال...');
        try {
          var r = await ensureUser();
          if (!r || !r.ok) {
            setStatus(st, 'خطا: ' + ((r && r.error) || 'نامشخص'));
            j.disabled = false;
            return;
          }
          var room = await Online.joinRoom(String(code).toUpperCase().trim());
          if (!room || !room.ok) {
            setStatus(st, 'خطا: ' + ((room && room.error) || 'نامشخص'));
            j.disabled = false;
          } else {
            setStatus(st, '');
          }
        } catch (e) {
          setStatus(st, 'خطا: ' + (e && e.message ? e.message : 'نامشخص'));
          j.disabled = false;
        }
      });
    });
  }

  function setupBack(){
    var b = $('backToMenu');
    if (!b) return;
    if (b._angelBound) return;
    b._angelBound = true;
    b.addEventListener('click', function(){
      var menu = $('menu');
      var lobby = $('lobby');
      var game = $('game');
      if (game) game.style.display = 'none';
      if (lobby) lobby.style.display = 'none';
      if (menu) {
        menu.classList.remove('hidden-preload', 'screen-hidden');
        menu.style.display = 'flex';
      }
    });
  }

  function setupLeaveGame(){
    var m = $('gameMenuBtn');
    if (!m) return;
    if (m._angelBound) return;
    m._angelBound = true;
    m.addEventListener('click', function(){
      confirmBox('خروج از بازی؟', function(yes){
        if (!yes) return;
        if (window.Online && Online.leave) Online.leave();
        var game = $('game');
        var lobby = $('lobby');
        if (game) game.style.display = 'none';
        if (lobby) lobby.style.display = 'flex';
      });
    });
  }

  function boot(){
    setupQuickMatch();
    setupCreateRoom();
    setupJoinRoom();
    setupBack();
    setupLeaveGame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // API
  window.Lobby = {
    setup: boot,
    refresh: boot,
    notify: notify,
    askCode: askCode,
    confirm: confirmBox
  };
})();
