// shell/lobby.js
window.Lobby = {
  setup: function() {
    var b = document.getElementById('backToMenu');
    if (b) b.addEventListener('click', function() { Layout.show('menu'); });

    var st = document.getElementById('lobbyStatus');

    var q = document.getElementById('quickMatchBtn');
    if (q) q.addEventListener('click', async function() {
      q.disabled = true;
      if (st) st.textContent = 'در حال اتصال...';
      try {
        var u = Platform.getUser();
        var r = await Online.initUser(u);
        if (!r || !r.ok) {
          if (st) st.textContent = 'خطا: ' + ((r && r.error) || 'نامشخص');
          q.disabled = false;
          return;
        }
        if (st) st.textContent = 'در حال یافتن حریف...';
        var m = await Online.quickMatch('ludo');
        if (!m || !m.ok) {
          if (st) st.textContent = 'خطا: ' + ((m && m.error) || 'نامشخص');
          q.disabled = false;
        }
      } catch (e) {
        if (st) st.textContent = 'خطا: ' + e.message;
        q.disabled = false;
      }
    });

    var c = document.getElementById('createRoomBtn');
    if (c) c.addEventListener('click', async function() {
      try {
        await Online.initUser(Platform.getUser());
        var r = await Online.createRoom('ludo');
        if (r && r.ok) Platform.showAlert('کد اتاق: ' + r.code);
        else if (st) st.textContent = 'خطا: ' + ((r && r.error) || 'نامشخص');
      } catch (e) {}
    });

    var j = document.getElementById('joinRoomBtn2');
    if (j) j.addEventListener('click', async function() {
      var code = prompt('کد اتاق:');
      if (!code) return;
      try {
        await Online.initUser(Platform.getUser());
        var r = await Online.joinRoom(code.toUpperCase());
        if (!r || !r.ok) Platform.showAlert('خطا: ' + ((r && r.error) || 'نامشخص'));
      } catch (e) {}
    });
  }
};
