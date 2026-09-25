// shell/util.js
window.$ = function(id) { return document.getElementById(id); };

window.escapeHtml = function(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

window.safeAlert = function(msg) {
  if (window.Platform && Platform.showAlert) Platform.showAlert(msg);
  else alert(msg);
};

window.formatNum = function(n) {
  n = Number(n) || 0;
  return n.toLocaleString('fa-IR');
};

window.now = function() { return Date.now(); };
