// shell/ui-layout.js
window.Layout = {
  screens: ['loading', 'menu', 'lobby', 'game'],
  current: null,

  show: function(name) {
    this.screens.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (id === name) {
        el.classList.remove('hidden-preload', 'screen-hidden');
        el.style.display = (id === 'game' || id === 'lobby' || id === 'menu') ? 'flex' : 'block';
      } else {
        el.style.display = 'none';
      }
    });
    this.current = name;
  },

  setupOptions: function() {
    document.querySelectorAll('.opts').forEach(function(o) {
      o.addEventListener('click', function(e) {
        var b = e.target.closest('button');
        if (!b) return;
        o.querySelectorAll('button').forEach(function(x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
  },

  getSelected: function() {
    document.querySelectorAll('.opts').forEach(function(o) {
      var k = o.dataset.k, a = o.querySelector('.on');
      if (k && a && typeof CFG !== 'undefined') CFG[k] = a.dataset.v;
    });
  }
};
