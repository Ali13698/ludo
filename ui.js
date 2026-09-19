window.UI = {
  renderProfiles: function(){
    DOM.profilesEl.innerHTML = '';
    for(var i = 0; i < S.active.length; i++){
      var p = S.active[i];
      var d = document.createElement('div');
      d.className = 'profile';
      if(i === S.cur && !S.over) d.className += ' active';
      if(S.outMap[p]) d.className += ' out';
      var av = document.createElement('div');
      av.className = 'avatar';
      if(p === S.active[S.myIdx]) av.textContent = '🙂';
      else av.textContent = S.botInfo[p] ? S.botInfo[p].avatar : '🤖';
      var nm = document.createElement('div');
      nm.className = 'profile-name';
      if(p === S.active[S.myIdx]) nm.textContent = 'شما';
      else nm.textContent = S.botInfo[p] ? S.botInfo[p].name : P[p].name;
      d.appendChild(av); d.appendChild(nm);
      DOM.profilesEl.appendChild(d);
    }
  },
  
  update: function(){
    if(S.over){ DOM.rollBtn.classList.add('hide'); return; }
    if(S.cur === S.active[S.myIdx] && !S.outMap[S.cur]){
      DOM.rollBtn.classList.remove('hide');
      DOM.rollBtn.disabled = S.rolled || S.busy;
      if(!S.rolled && !S.busy) DOM.statusText.textContent = 'You can roll';
      else if(S.busy) DOM.statusText.textContent = 'در حال حرکت...';
      else DOM.statusText.textContent = 'یک مهره انتخاب کن';
    } else {
      DOM.rollBtn.classList.add('hide');
      if(S.outMap[S.cur]) DOM.statusText.textContent = 'اوت شده';
      else if(S.busy) DOM.statusText.textContent = 'در حال حرکت...';
    }
  }
};
