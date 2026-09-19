window.Board = {
  resize: function(){
    var w = DOM.boardArea.clientWidth - 16;
    var h = DOM.boardArea.clientHeight - 16;
    if(w <= 0 || h <= 0) return;
    var sz = Math.min(w, h);
    var nc = Math.floor(sz / CFG.GRID);
    if(nc < 5) return;
    S.CELL = nc;
    var s = S.CELL * CFG.GRID;
    var dpr = window.devicePixelRatio || 1;
    DOM.canvas.width = s * dpr;
    DOM.canvas.height = s * dpr;
    DOM.canvas.style.width = s + 'px';
    DOM.canvas.style.height = s + 'px';
    DOM.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  },
  
  rr: function(x, y, w, h, r){
    var c = DOM.ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  },
  
  draw: function(){
    if(S.CELL < 5 || !S.active.length) return;
    var c = DOM.ctx;
    var CELL = S.CELL;
    var s = CELL * CFG.GRID;
    c.clearRect(0, 0, s, s);
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, s, s);
    
    // Bases
    for(var p = 0; p < 4; p++){
      var bx = P[p].box[0] * CELL, by = P[p].box[1] * CELL;
      c.fillStyle = P[p].light;
      this.rr(bx + 3, by + 3, 6 * CELL - 6, 6 * CELL - 6, 16); c.fill();
      c.strokeStyle = P[p].color; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#ffffff';
      this.rr(bx + CELL * 0.9, by + CELL * 0.9, 6 * CELL - CELL * 1.8, 6 * CELL - CELL * 1.8, 12); c.fill();
    }
    
    // Path cells
    for(var i = 0; i < 52; i++){
      var cc = PATH[i][0], rr2 = PATH[i][1];
      var sp = -1;
      for(var pp = 0; pp < 4; pp++) if(P[pp].start === i) sp = pp;
      var fill = '#ffffff', stroke = '#e2e8f0';
      if(sp >= 0){ fill = P[sp].color; stroke = P[sp].dark; }
      else if(SAFE.indexOf(i) >= 0){ fill = '#fef9e7'; stroke = '#fbbf24'; }
      c.fillStyle = fill;
      this.rr(cc * CELL + 1.5, rr2 * CELL + 1.5, CELL - 3, CELL - 3, 4); c.fill();
      c.strokeStyle = stroke; c.lineWidth = 1; c.stroke();
      if(SAFE.indexOf(i) >= 0 && sp < 0){
        c.fillStyle = '#fbbf24';
        c.font = 'bold ' + (CELL * 0.55) + 'px serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('★', (cc + 0.5) * CELL, (rr2 + 0.5) * CELL);
      }
    }
    
    // Home columns
    for(var a = 0; a < S.active.length; a++){
      var pl = S.active[a], hc = P[pl].home;
      for(var j = 0; j < hc.length; j++){
        c.fillStyle = P[pl].color;
        this.rr(hc[j][0] * CELL + 1.5, hc[j][1] * CELL + 1.5, CELL - 3, CELL - 3, 4); c.fill();
      }
    }
    
    // Center triangles
    var cx = 7.5 * CELL, cy = 7.5 * CELL;
    var x0 = 6 * CELL, y0 = 6 * CELL, x1 = 9 * CELL, y1 = 9 * CELL;
    c.fillStyle = P[0].color; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x0, y0); c.lineTo(x0, y1); c.closePath(); c.fill();
    c.fillStyle = P[1].color; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x0, y0); c.lineTo(x1, y0); c.closePath(); c.fill();
    c.fillStyle = P[2].color; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x1, y0); c.lineTo(x1, y1); c.closePath(); c.fill();
    c.fillStyle = P[3].color; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x0, y1); c.lineTo(x1, y1); c.closePath(); c.fill();
    c.strokeStyle = '#cbd5e1'; c.lineWidth = 2;
    c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    
    // Tokens
    var r2 = CELL * 0.42;
    var mv = Rules.getMovable();
    for(var i2 = 0; i2 < S.tokens.length; i2++){
      var t = S.tokens[i2];
      if(S.active.indexOf(t.player) < 0) continue;
      var px = t.vx * CELL, py = t.vy * CELL;
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.beginPath(); c.arc(px, py + 2, r2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(px, py, r2, 0, Math.PI * 2); c.fill();
      c.fillStyle = P[t.player].color;
      c.beginPath(); c.arc(px, py, r2 * 0.78, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(px, py, r2 * 0.36, 0, Math.PI * 2); c.fill();
      c.fillStyle = P[t.player].dark;
      c.beginPath(); c.arc(px, py, r2 * 0.18, 0, Math.PI * 2); c.fill();
      if(mv.indexOf(t) >= 0){
        c.strokeStyle = '#ffffff'; c.lineWidth = 3;
        c.beginPath(); c.arc(px, py, r2 + 3, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = P[t.player].dark; c.lineWidth = 1.5;
        c.beginPath(); c.arc(px, py, r2 + 5, 0, Math.PI * 2); c.stroke();
      }
    }
  },
  
  initObserver: function(){
    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){
        if(DOM.boardArea.clientWidth > 0) Board.resize();
      });
      ro.observe(DOM.boardArea);
    }
    window.addEventListener('resize', function(){
      if(DOM.boardArea.clientWidth > 0) Board.resize();
    });
  }
};
