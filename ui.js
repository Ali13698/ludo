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
      if (p === S.active[S.myIdx]) av.textContent = '🙂';
      else if (S.isOnline) av.textContent = '🎮';
      else av.textContent = S.botInfo[p] ? S.botInfo[p].avatar : '🤖';

      const nm = document.createElement('div');
      nm.className = 'profile-name';
      if (p === S.active[S.myIdx]) nm.textContent = 'شما';
      else if (S.isOnline) nm.textContent = S.botInfo[p] ? S.botInfo[p].name : 'حریف';
      else nm.textContent = S.botInfo[p] ? S.botInfo[p].name : P[p].name;

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
