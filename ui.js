window.UI = {
  renderProfiles: function(){
    DOM.profilesEl.innerHTML = '';
    for (let i = 0; i < S.active.length; i++){
      const p = S.active[i];
      const d = document.createElement('div');
      d.className = 'profile';
      if (p === S.cur && !S.over) d.className += ' active';
      if (S.outMap[p]) d.className += ' out';

      const av = document.createElement('div');
      av.className = 'avatar';

      const nm = document.createElement('div');
      nm.className = 'profile-name';

      if (p === S.active[S.myIdx]){
        av.textContent = '🙂';
        nm.textContent = 'شما';
      } else if (S.isOnline && S.opponent){
        av.textContent = '🎮';
        nm.textContent = S.opponent.name || S.opponent.game_username || 'حریف';
      } else if (S.botInfo[p]){
        av.textContent = S.botInfo[p].avatar || '🤖';
        nm.textContent = S.botInfo[p].name || 'ربات';
      } else {
        av.textContent = '🤖';
        nm.textContent = P[p].name;
      }

      d.appendChild(av);
      d.appendChild(nm);
      DOM.profilesEl.appendChild(d);
    }
  },

  update: function(){
    if (S.over){ DOM.rollBtn.classList.add('hide'); return; }

    const isMyTurn = S.cur === S.active[S.myIdx];

    if (isMyTurn && !S.outMap[S.cur]){
      DOM.rollBtn.classList.remove('hide');
      DOM.rollBtn.disabled = S.rolled || S.busy;
      if (!S.rolled && !S.busy) DOM.statusText.textContent = 'You can roll';
      else if (S.busy) DOM.statusText.textContent = 'در حال حرکت...';
      else DOM.statusText.textContent = 'یک مهره انتخاب کن';
    } else {
      DOM.rollBtn.classList.add('hide');
      if (S.outMap[S.cur]) DOM.statusText.textContent = 'اوت شده';
      else if (S.busy) DOM.statusText.textContent = 'در حال حرکت...';
      else if (S.isOnline) DOM.statusText.textContent = 'نوبت حریف...';
    }
  }
};
