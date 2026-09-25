// shell/theme.js — مدیریت تم روشن/تاریک بر اساس پلتفرم
window.Theme = {
  current: 'dark',

  init: function() {
    try {
      var scheme = Platform.getColorScheme();
      this.apply(scheme);
    } catch (e) {
      this.apply('dark');
    }
  },

  apply: function(mode) {
    this.current = mode || 'dark';
    document.documentElement.setAttribute('data-theme', this.current);
    console.log('[theme]', this.current);
  },

  toggle: function() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  },

  onSystemChange: function() {
    var self = this;
    try {
      var w = Platform.getWebApp();
      if (w && w.onEvent) {
        w.onEvent('themeChanged', function() {
          self.apply(Platform.getColorScheme());
        });
      }
    } catch (e) {}
  }
};

// auto init
if (window.Platform) Theme.init();
