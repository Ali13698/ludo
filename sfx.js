window.SFX = {
  ctx: null,
  muted: false,
  get: function() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {}
    return this.ctx;
  },
  tone: function(f, d, t, v, dl) {
    if (this.muted) return;
    try {
      var a = this.get();
      if (!a) return;
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = t || 'sine';
      o.frequency.value = f;
      o.connect(g);
      g.connect(a.destination);
      var s = a.currentTime + (dl || 0);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(v || 0.15, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, s + (d || 0.1));
      o.start(s);
      o.stop(s + (d || 0.1) + 0.02);
    } catch (e) {}
  },
  dice: function() {
    for (var i = 0; i < 6; i++) this.tone(400 + Math.random() * 400, 0.06, 'square', 0.08, i * 0.06);
  },
  step: function() {
    this.tone(180, 0.07, 'triangle', 0.14);
    this.tone(100, 0.04, 'sine', 0.10, 0.02);
  },
  capture: function() {
    this.tone(700, 0.10, 'square', 0.20);
    this.tone(450, 0.12, 'square', 0.20, 0.11);
    this.tone(300, 0.18, 'sawtooth', 0.18, 0.24);
  },
  home: function() {
    this.tone(880, 0.10, 'sine', 0.20);
    this.tone(1200, 0.15, 'sine', 0.20, 0.10);
  },
  win: function() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'sine', 0.22, i * 0.13));
  },
  click: function() {
    this.tone(900, 0.04, 'square', 0.06);
  }
};
