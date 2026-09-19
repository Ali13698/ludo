// ============ DICE 3D ============
window.Dice = {
  
  fillFace: function(faceEl, num) {
    faceEl.innerHTML = '';
    var on = CFG_PATTERNS[num] || [];
    for (var i = 0; i < 9; i++) {
      var d = document.createElement('div');
      d.className = 'dot' + (on.indexOf(i) >= 0 ? '' : ' off');
      faceEl.appendChild(d);
    }
  },
  
  init: function() {
    var faces = DOM.dice3d.querySelectorAll('.face');
    var nums = [1, 6, 3, 4, 2, 5];
    for (var i = 0; i < faces.length; i++) {
      this.fillFace(faces[i], nums[i]);
    }
  },
  
  spin: function(finalNum, cb) {
    var rx = 1080 + Math.floor(Math.random() * 360);
    var ry = 1080 + Math.floor(Math.random() * 360);
    DOM.dice3d.style.transition = 'transform .12s linear';
    var i = 0;
    var self = this;
    var int = setInterval(function() {
      DOM.dice3d.style.transform = 'rotateX(' + (rx * (i + 1) / 10) + 'deg) rotateY(' + (ry * (i + 1) / 10) + 'deg)';
      if (++i >= 10) {
        clearInterval(int);
        DOM.dice3d.style.transition = 'transform .4s cubic-bezier(.2,.9,.3,1.3)';
        DOM.dice3d.style.transform = CFG_DICE_ROT[finalNum] || CFG_DICE_ROT[1];
        if (cb) setTimeout(cb, 400);
      }
    }, 80);
  },
  
  reset: function() {
    DOM.dice3d.style.transition = 'none';
    DOM.dice3d.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }
};

// Alias for convenience
var CFG_PATTERNS = window.DICE_FACES;
var CFG_DICE_ROT = window.DICE_ROT;
