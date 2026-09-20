window.Move = {
  start: function(t, d, cb){
    S.busy = true;
    var from = t.pos;
    var to = from === 0 ? 1 : from + d;
    t.wps = [];
    if(from === 0){ t.wps.push(Rules.gridOf(t.player, 1, t.idx)); }
    else{ for(var p = from + 1; p <= to; p++) t.wps.push(Rules.gridOf(t.player, p, t.idx)); }
    t.moving = true;
    var speed = 0.06;

    function step(){
      if(t.wps.length === 0){
        t.moving = false;
        t.pos = to;
        var captured = false;
        if(t.pos >= 1 && t.pos <= 51){
          var abs = (P[t.player].start + t.pos - 1) % 52;
          if(!Rules.isSafe(abs)){
            for(var i = 0; i < S.tokens.length; i++){
              var o = S.tokens[i];
              if(o === t || o.player === t.player) continue;
              if(o.pos === 0 || o.pos > 51) continue;
              var oAbs = (P[o.player].start + o.pos - 1) % 52;
              if(oAbs === abs){
                o.pos = 0;
                var g = Rules.gridOf(o.player, 0, o.idx);
                o.vx = g[0]; o.vy = g[1];
                captured = true;
              }
            }
          }
        }
        if(captured) SFX.capture();
        if(t.pos === 57) SFX.home();
        setTimeout(function(){ S.busy = false; cb(); }, 200);
        return;
      }
      var tg = t.wps[0];
      var dx = tg[0] - t.vx, dy = tg[1] - t.vy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if(dist < speed){
        t.vx = tg[0]; t.vy = tg[1]; t.wps.shift();
        SFX.step();
        requestAnimationFrame(step);
      } else {
        t.vx += dx / dist * speed;
        t.vy += dy / dist * speed;
        requestAnimationFrame(step);
      }
    }
    step();
  }
};
