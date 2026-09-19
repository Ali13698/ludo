window.Rules = {
  isSafe: function(i){
    return CFG.safe === 'on' && SAFE.indexOf(i) >= 0;
  },
  gridOf: function(pl, pos, idx){
    if(pos === 0) return [P[pl].base[idx][0], P[pl].base[idx][1]];
    if(pos <= 51){
      var a = (P[pl].start + pos - 1) % 52;
      return [PATH[a][0] + 0.5, PATH[a][1] + 0.5];
    }
    if(pos <= 56){
      var h = P[pl].home[pos - 52];
      return [h[0] + 0.5, h[1] + 0.5];
    }
    return [7.5, 7.5];
  },
  canMove: function(t, d){
    if(t.pos === 57) return false;
    if(t.pos === 0){
      if(CFG.firstExit === 'on' && !S.firstRollDone) return true;
      return d === 6;
    }
    return t.pos + d <= 57;
  },
  getMovableFor: function(player){
    if(S.over || S.busy) return [];
    if(S.outMap[player]) return [];
    var arr = [];
    for(var i = 0; i < S.tokens.length; i++){
      if(S.tokens[i].player === player && this.canMove(S.tokens[i], S.dice)) arr.push(S.tokens[i]);
    }
    return arr;
  },
  getMovable: function(){
    if(!S.rolled) return [];
    if(S.cur !== S.active[S.myIdx]) return [];
    return this.getMovableFor(S.cur);
  },
  checkWin: function(){
    var need = parseInt(CFG.goals, 10);
    for(var a = 0; a < S.active.length; a++){
      var p = S.active[a], c = 0;
      for(var i = 0; i < S.tokens.length; i++){
        if(S.tokens[i].player === p && S.tokens[i].pos === 57) c++;
      }
      if(c >= need) return p;
    }
    return -1;
  }
};
