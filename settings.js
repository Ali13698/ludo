window.GameSettings = {
  open: function(){
    const m = document.getElementById('modal');
    const b = document.getElementById('modalBox');
    if (!m || !b) return;

    const isMuted = SFX.muted;
    b.innerHTML = `
      <h3>⚙️ تنظیمات بازی</h3>
      <div class="settings-list">
        <button type="button" class="settings-item" onclick="GameSettings.toggleSound()">
          <span class="settings-icon">${isMuted ? '🔇' : '🔊'}</span>
          <span class="settings-text">${isMuted ? 'صدا خاموش' : 'صدا روشن'}</span>
          <span class="settings-arrow">›</span>
        </button>
        <button type="button" class="settings-item" onclick="GameSettings.exitGame()">
          <span class="settings-icon">🚪</span>
          <span class="settings-text">خروج از بازی</span>
          <span class="settings-arrow">›</span>
        </button>
        <button type="button" class="settings-item" onclick="GameSettings.showStats()">
          <span class="settings-icon">📊</span>
          <span class="settings-text">آمار بازی</span>
          <span class="settings-arrow">›</span>
        </button>
      </div>
      <div class="modal-buttons" style="margin-top:14px;">
        <button class="modal-btn-secondary" onclick="closeModal()">بستن</button>
      </div>
    `;
    m.classList.add('open');
  },

  toggleSound: function(){
    SFX.muted = !SFX.muted;
    GameSettings.open();
  },

  exitGame: function(){
    closeModal();
    setTimeout(function(){
      if (!confirm('از بازی خارج می‌شوی؟')) return;
      if (typeof endOnlineGame === 'function'){
        endOnlineGame();
      } else {
        location.reload();
      }
    }, 200);
  },

  showStats: function(){
    const meTokens = S.tokens.filter(t => t.player === S.active[S.myIdx]);
    const homeMe = meTokens.filter(t => t.pos === 57).length;
    const onBoard = meTokens.filter(t => t.pos > 0 && t.pos < 57).length;

    const m = document.getElementById('modal');
    const b = document.getElementById('modalBox');
    b.innerHTML = `
      <h3>📊 آمار بازی</h3>
      <div class="stats-list">
        <div class="stat-row"><span>🎯 نوبت</span><span>${P[S.cur].name}</span></div>
        <div class="stat-row"><span>🎲 آخرین تاس</span><span>${S.dice || '—'}</span></div>
        <div class="stat-row"><span>🏠 مهره‌های خانه شما</span><span>${homeMe}</span></div>
        <div class="stat-row"><span>🚶 مهره‌های در زمین شما</span><span>${onBoard}</span></div>
      </div>
      <div class="modal-buttons" style="margin-top:14px;">
        <button class="modal-btn-secondary" onclick="GameSettings.open()">بازگشت</button>
      </div>
    `;
  }
};
