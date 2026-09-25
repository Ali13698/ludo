// shell/menu.js
window.GamesMenu = {
  games: [
    { id: 'ludo',       name: 'منچ',       icon: '🎲', cat: 'board',  bg: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', active: true },
    { id: 'backgammon', name: 'تخته نرد',  icon: '🎯', cat: 'board',  bg: 'linear-gradient(135deg,#0ea5e9,#1e40af)', active: false, soon: true },
    { id: 'chess',      name: 'شطرنج',     icon: '♟️', cat: 'board',  bg: 'linear-gradient(135deg,#475569,#1e293b)', active: false, soon: true },
    { id: 'hearts',     name: 'قلب‌ها',     icon: '♥️', cat: 'cards',  bg: 'linear-gradient(135deg,#dc2626,#7c2d12)', active: false, soon: true },
    { id: 'uno',        name: 'اوچو',      icon: '🃏', cat: 'cards',  bg: 'linear-gradient(135deg,#eab308,#ea580c)', active: false, soon: true },
    { id: 'billiard',   name: 'بیلیارد',   icon: '🎱', cat: 'sport',  bg: 'linear-gradient(135deg,#16a34a,#065f46)', active: false, soon: true },
    { id: 'soccer',     name: 'فوتبال',    icon: '⚽', cat: 'sport',  bg: 'linear-gradient(135deg,#059669,#064e3b)', active: false, soon: true },
    { id: 'bowling',    name: 'بولینگ',    icon: '🎳', cat: 'sport',  bg: 'linear-gradient(135deg,#7c3aed,#be185d)', active: false, soon: true },
    { id: 'dots',       name: 'نقطه و خط', icon: '📐', cat: 'board',  bg: 'linear-gradient(135deg,#10b981,#047857)', active: false, soon: true },
    { id: 'match_it',   name: 'Match It',  icon: '🦊', cat: 'new',    bg: 'linear-gradient(135deg,#ec4899,#7c3aed)', active: false, soon: true }
  ],

  currentCategory: 'all',

  init: function() {
    this.renderTabs();
    this.renderGrid();
    this.bindTabs();
    this.bindBottomNav();
  },

  renderTabs: function() {
    var tabs = [
      { id: 'all',   name: 'همه',   icon: '🎮' },
      { id: 'new',   name: 'جدید',  icon: '✨' },
      { id: 'cards', name: 'کارت',  icon: '♠️' },
      { id: 'board', name: 'تخته',  icon: '🎲' },
      { id: 'sport', name: 'ورزشی', icon: '🏆' }
    ];
    var el = document.getElementById('catTabs');
    if (!el) return;
    var self = this;
    el.innerHTML = tabs.map(function(t) {
      return '<button class="cat-tab ' + (t.id === self.currentCategory ? 'active' : '') + '" data-cat="' + t.id + '">' +
        '<span>' + t.icon + '</span><span>' + t.name + '</span></button>';
    }).join('');
  },

  renderGrid: function() {
    var el = document.getElementById('gamesGrid');
    if (!el) return;
    var self = this;
    var list = this.currentCategory === 'all'
      ? this.games
      : this.games.filter(function(g) { return g.cat === self.currentCategory; });

    el.innerHTML = list.map(function(g) {
      return '<div class="game-card ' + (g.active ? 'playable' : '') + ' ' + (g.soon ? 'soon' : '') + '" data-game="' + g.id + '" style="background:' + g.bg + '">' +
        '<div class="game-card-bg"></div>' +
        '<div class="game-card-icon">' + g.icon + '</div>' +
        (g.soon ? '<span class="game-card-badge">بزودی</span>' : '') +
        '<div class="game-card-name">' + g.name + '</div></div>';
    }).join('');

    el.querySelectorAll('.game-card').forEach(function(card) {
      card.addEventListener('click', function() { self.onGameClick(card.dataset.game); });
    });
  },

  bindTabs: function() {
    var self = this;
    document.addEventListener('click', function(e) {
      var tab = e.target.closest('.cat-tab');
      if (!tab) return;
      self.currentCategory = tab.dataset.cat;
      self.renderTabs();
      self.renderGrid();
    });
  },

  bindBottomNav: function() {
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        document.querySelectorAll('.bottom-nav .nav-btn').forEach(function(x) { x.classList.remove('active'); });
        b.classList.add('active');
        var nav = b.dataset.nav;
        if (nav === 'profile') {
          var u = window.Online && Online.userInfo;
          safeAlert(u ? ('👤 ' + (u.game_username || '—') + '\n💰 ' + u.coins + ' سکه\n🏆 ' + u.wins + ' برد') : 'اول وارد بازی شو');
        } else if (nav === 'friends' || nav === 'shop') {
          safeAlert('به زودی ✨');
        }
      });
    });
  },

  onGameClick: function(gameId) {
    var g = this.games.filter(function(x) { return x.id === gameId; })[0];
    if (!g) return;
    if (g.soon) { safeAlert('به زودی در دسترس قرار می‌گیره! 🚧'); return; }
    if (g.active) Layout.show('lobby');
  }
};
