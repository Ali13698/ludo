// shell/platform.js
// تشخیص پلتفرم — Telegram یا Bale
// همه‌ی کدهای دیگه باید از این استفاده کنن، نه مستقیم از window.Telegram

window.Platform = (function() {
  'use strict';

  function detect() {
    if (window.Bale && window.Bale.WebApp) return 'bale';
    if (window.Telegram && window.Telegram.WebApp) return 'telegram';
    var host = (window.location && window.location.hostname) || '';
    if (host.endsWith('.ir')) return 'bale';
    return 'telegram';
  }

  var current = detect();

  function getWebApp() {
    if (current === 'bale') return window.Bale && window.Bale.WebApp;
    return window.Telegram && window.Telegram.WebApp;
  }

  function getInitData() {
    try {
      var w = getWebApp();
      return (w && w.initData) || '';
    } catch (e) { return ''; }
  }

  function getUser() {
    try {
      var w = getWebApp();
      var u = w && w.initDataUnsafe && w.initDataUnsafe.user;
      return (u && u.id) ? u : null;
    } catch (e) { return null; }
  }

  function ready() {
    try { var w = getWebApp(); if (w && w.ready) w.ready(); } catch(e){}
  }

  function expand() {
    try { var w = getWebApp(); if (w && w.expand) w.expand(); } catch(e){}
  }

  function showAlert(msg) {
    try {
      var w = getWebApp();
      if (w && w.showAlert) { w.showAlert(msg); return; }
    } catch(e){}
    alert(msg);
  }

  function getColorScheme() {
    try {
      var w = getWebApp();
      return (w && w.colorScheme) || 'dark';
    } catch(e) { return 'dark'; }
  }

  return {
    type: current,
    isTelegram: current === 'telegram',
    isBale: current === 'bale',
    getWebApp: getWebApp,
    getInitData: getInitData,
    getUser: getUser,
    ready: ready,
    expand: expand,
    showAlert: showAlert,
    getColorScheme: getColorScheme
  };
})();
