window.Bots = {
  // ۷۵٪ بهترین حرکت، ۲۵٪ تصادفی (انسانی‌تر)
  choose: function(mv){
    if(Math.random() < 0.75){
      mv.sort(function(a, b){
        var sa = (a.pos === 0 ? 100 : a.pos) + (a.pos + S.dice === 57 ? 500 : 0);
        var sb = (b.pos === 0 ? 100 : b.pos) + (b.pos + S.dice === 57 ? 500 : 0);
        return sb - sa;
      });
      return mv[0];
    }
    return mv[Math.floor(Math.random() * mv.length)];
  },
  
  // زمان فکر کردن انسانی (۱.۲ تا ۳.۲ ثانیه)
  thinkTime: function(){
    return 1200 + Math.random() * 2000;
  },
  
  // ساخت پروفایل ربات برای بازیکن‌های غیرانسانی
  makeProfiles: function(active, myIdx){
    var info = {};
    var pool = BOT_NAMES.slice();
    // shuffle
    for(var k = pool.length - 1; k > 0; k--){
      var jj = Math.floor(Math.random() * (k + 1));
      var tmp = pool[k]; pool[k] = pool[jj]; pool[jj] = tmp;
    }
    var pn = 0;
    for(var i = 0; i < active.length; i++){
      var p = active[i];
      if(p === active[myIdx]) continue;
      info[p] = pool[pn % pool.length];
      pn++;
    }
    return info;
  }
};
