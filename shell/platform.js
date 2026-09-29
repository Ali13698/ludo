window.Platform = (function() {
  'use strict';

  function detect() {
    var host = (window.location && window.location.hostname) || '';
    var injected = (window._ANGEL_PLATFORM || '').toLowerCase();
    if (injected === 'bale' || injected === 'telegram') return injected;
    if (window.Bale && window.Bale.WebApp) return 'bale';
    if (/\.ir$/i.test(host)) return 'bale';
    if (window.Telegram && window.Telegram.WebApp) return 'telegram';
    return 'telegram';
  }

  var current = detect();

  function refresh() {
    var now = detect();
    if (now && now !== current) current = now;
    api.type = current;
    api.isBale = current === 'bale';
    api.isTelegram = current === 'telegram';
    return current;
  }

  function getWebApp() {
    if (current === 'bale') return (window.Bale && window.Bale.WebApp) || null;
    return (window.Telegram && window.Telegram.WebApp) || null;
  }

  function getInitData() {
    var app = getWebApp();
    return (app && app.initData) ? app.initData : '';
  }

  function getUser() {
    var app = getWebApp();
    var u = app && app.initDataUnsafe && app.initDataUnsafe.user;
    if (u && u.id) return u;
    var s = localStorage.getItem('angel_uid');
    if (!s) {
      s = String(100000000 + Math.floor(Math.random() * 9e8));
      localStorage.setItem('angel_uid', s);
    }
    return { id: parseInt(s, 10), first_name: 'مهمان', username: 'guest_' + s };
  }

  function ready() {
    var app = getWebApp();
    if (app && typeof app.ready === 'function') {
      try { app.ready(); } catch (e) {}
    }
  }

  function expand() {
    var app = getWebApp();
    if (app && typeof app.expand === 'function') {
      try { app.expand(); } catch (e) {}
    }
  }

  function showAlert(msg) {
    var app = getWebApp();
    if (app && typeof app.showAlert === 'function') {
      try { app.showAlert(msg); return; } catch (e) {}
    }
    alert(msg);
  }

  function showConfirm(msg, cb) {
    var app = getWebApp();
    if (app && typeof app.showConfirm === 'function') {
      try { app.showConfirm(msg, cb); return; } catch (e) {}
    }
    cb(window.confirm(msg));
  }

  function showPrompt(msg, cb) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box';
    var box = document.createElement('div');
    box.style.cssText = 'background:#222;padding:20px;border-radius:12px;width:100%;max-width:320px';
    var title = document.createElement('div');
    title.style.cssText = 'color:#fff;margin-bottom:12px;font-size:14px;text-align:right;direction:rtl';
    title.textContent = msg;
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.style.cssText = 'width:100%;padding:10px;border-radius:8px;border:1px solid #444;background:#111;color:#fff;font-size:16px;box-sizing:border-box;text-align:center;letter-spacing:2px;text-transform:uppercase';
    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:10px;margin-top:14px';
    var okBtn = document.createElement('button');
    okBtn.textContent = 'تأیید';
    okBtn.style.cssText = 'flex:1;padding:10px;background:#3b82f6;color:#fff;border:0;border-radius:8px;font-size:14px;cursor:pointer';
    var noBtn = document.createElement('button');
    noBtn.textContent = 'لغو';
    noBtn.style.cssText = 'flex:1;padding:10px;background:#444;color:#fff;border:0;border-radius:8px;font-size:14px;cursor:pointer';
    btns.appendChild(okBtn);
    btns.appendChild(noBtn);
    box.appendChild(title);
    box.appendChild(inp);
    box.appendChild(btns);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    setTimeout(function() { inp.focus(); }, 50);

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    function submit() {
      var v = inp.value.trim();
      close();
      cb(v || null);
    }
    okBtn.onclick = submit;
    noBtn.onclick = function() { close(); cb(null); };
    inp.onkeydown = function(e) {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      if (e.key === 'Escape') { e.preventDefault(); close(); cb(null); }
    };
    overlay.onclick = function(e) {
      if (e.target === overlay) { close(); cb(null); }
    };
  }

  function getColorScheme() {
    var app = getWebApp();
    if (app && app.colorScheme) return app.colorScheme;
    return 'dark';
  }

  var api = {
    type: current,
    isTelegram: current === 'telegram',
    isBale: current === 'bale',
    refresh: refresh,
    getWebApp: getWebApp,
    getInitData: getInitData,
    getUser: getUser,
    ready: ready,
    expand: expand,
    showAlert: showAlert,
    showConfirm: showConfirm,
    showPrompt: showPrompt,
    getColorScheme: getColorScheme
  };

  return api;
})();
