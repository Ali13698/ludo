(async function boot(){
  initDOM();
  const optGroups = document.querySelectorAll('.opts');
  for (let gi = 0; gi < optGroups.length; gi++){
    (function(g){
      const key = g.getAttribute('data-k');
      const btns = g.querySelectorAll('button');
      for (let j = 0; j < btns.length; j++){
        btns[j].onclick = function(){
          for (let k = 0; k < btns.length; k++) btns[k].className = '';
          this.className = 'on';
          CFG[key] = this.getAttribute('data-v');
          SFX.click();
        };
      }
    })(optGroups[gi]);
  }

  setupOnlineEvents();
  setupLobby();
  setupInputHandlers();

  // ⭐ صفحه منو رو آماده کن ولی هنوز نشون نده
  const menuEl = document.getElementById('menu');
  if (menuEl) menuEl.classList.remove('hidden-preload');

  // ⭐ اتصال WebSocket رو در پس‌زمینه شروع کن (بدون await)
  // لودینگ فقط تا 3 ثانیه نمایش داده می‌شه، بعدش منو میاد
  let onlinePromise = initOnline().then(ok => {
    console.log('[boot] online:', ok);
    return ok;
  });

  // ⭐ حداکثر 3 ثانیه صبر، بعد برو به منو
  const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 3000));
  await Promise.race([onlinePromise, timeout]);

  // لودینگ رو ببند
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => { loading.style.display = 'none'; }, 300);
  }
  showScreen('menu');

  if (window.Chat) Chat.init();

  // ⭐ دکمه بازی: اگه onlineReady هنوز نه، صبر کن
  document.getElementById('playBtn').onclick = async function(){
    SFX.get();
    showScreen('lobby');
    if (!onlineReady){
      // نمایش وضعیت اتصال
      const st = document.getElementById('lobbyStatus');
      if (st) st.textContent = 'در حال اتصال...';
      const ok = await onlinePromise;
      if (!ok){
        const retry = await initOnline();
        if (!retry) {
          if (st) st.textContent = 'اتصال برقرار نشد. دوباره تلاش کن.';
          alert('اتصال به سرور برقرار نشد');
          return;
        }
      }
      if (st) st.textContent = '';
    }
    updateLobbyUser();
  };

  Board.initObserver();
  Game.initTokens();
  loop();
})();
