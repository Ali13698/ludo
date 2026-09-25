// shell/online.js
window.Online = {
  ws: null,
  connected: false,
  authed: false,
  userId: null,
  userInfo: null,
  roomCode: null,
  playerIndex: 0,
  opponent: null,
  handlers: {},
  pendingCb: {},
  cbId: 0,
  queueTimer: null,
  invites: {},

  SERVER_URL: null,

  initServerUrl: function() {
    var isBale = window.Platform && window.Platform.isBale;
    var host = window.location.hostname;
    if (isBale || host.endsWith('.ir')) {
      this.SERVER_URL = 'wss://api.nomi98.ir';
    } else {
      this.SERVER_URL = 'wss://api.nomi98.com';
    }
    console.log('[online] server:', this.SERVER_URL);
  },

  connect: function() {
    if (!this.SERVER_URL) this.initServerUrl();
    if (this.ws && this.ws.readyState === 1) return Promise.resolve();
    var self = this;
    return new Promise(function(resolve, reject) {
      try {
        self.ws = new WebSocket(self.SERVER_URL);
      } catch (e) { reject(e); return; }
      var timeout = setTimeout(function() {
        if (!self.connected) reject(new Error('اتصال ناموفق'));
      }, 8000);

      self.ws.onopen = function() {
        clearTimeout(timeout);
        self.connected = true;
        console.log('[online] connected');
        resolve();
      };
      self.ws.onerror = function() {
        clearTimeout(timeout);
        reject(new Error('خطای اتصال'));
      };
      self.ws.onclose = function() {
        self.connected = false;
        self.authed = false;
        console.log('[online] disconnected');
        self.emit('disconnected', {});
      };
      self.ws.onmessage = function(e) {
        var msg;
        try { msg = JSON.parse(e.data); } catch (err) { return; }
        if (msg.cbId && self.pendingCb[msg.cbId]) {
          var cb = self.pendingCb[msg.cbId];
          delete self.pendingCb[msg.cbId];
          cb(msg);
          return;
        }
        self.emit(msg.type, msg);
      };
    });
  },

  send: function(obj) {
    if (!this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(JSON.stringify(obj)); } catch (e) {}
  },

  request: function(obj) {
    var self = this;
    return new Promise(function(resolve) {
      var id = ++self.cbId;
      self.pendingCb[id] = resolve;
      obj.cbId = id;
      self.send(obj);
      setTimeout(function() {
        if (self.pendingCb[id]) {
          delete self.pendingCb[id];
          resolve({ ok: false, error: 'timeout' });
        }
      }, 15000);
    });
  },

  on: function(type, fn) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(fn);
  },
  emit: function(type, data) {
    var hs = this.handlers[type] || [];
    for (var i = 0; i < hs.length; i++) {
      try { hs[i](data); } catch (e) { console.error(e); }
    }
  },

  initUser: async function(telegramUser) {
    await this.connect();
    var user = telegramUser || {};
    var initData = (window.Platform && window.Platform.getInitData) ? window.Platform.getInitData() : '';
    var platform = (window.Platform && window.Platform.type) ? window.Platform.type : 'telegram';
    console.log('[online] initUser platform:', platform, 'initDataLen:', initData.length);

    var res = await this.request({
      type: 'init_user',
      platform: platform,
      initData: initData,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url
      }
    });

    if (res.ok) {
      this.authed = true;
      this.userId = res.user.id;
      this.userInfo = res.user;
      console.log('[online] user init:', res.user);
    } else {
      console.warn('[online] init_user failed:', res.error);
    }
    return res;
  },

  quickMatch: function(gameId) {
    return this.request({ type: 'quick_match', gameId: gameId || 'ludo' });
  },
  cancelMatch: function() {
    if (this.queueTimer) { clearInterval(this.queueTimer); this.queueTimer = null; }
    this.send({ type: 'cancel_match' });
  },

  createRoom: function(gameId) {
    return this.request({ type: 'create_room', gameId: gameId || 'ludo' });
  },
  joinRoom: function(code) {
    return this.request({ type: 'join_room', code: code });
  },

  inviteFriend: function(friendId, gameId) {
    return this.request({ type: 'invite_friend', friendId: friendId, gameId: gameId || 'ludo' });
  },
  respondInvite: function(inviteId, accept) {
    return this.request({ type: 'respond_invite', inviteId: inviteId, accept: accept });
  },

  sendGameAction: function(data) { this.send({ type: 'game_action', data: data }); },
  notifyGameEnded: function(winnerId) { this.send({ type: 'game_ended', winnerId: winnerId }); },
  sendChat: function(text) { this.send({ type: 'chat_message', text: text }); },
  sendEmoji: function(emoji) { this.send({ type: 'emoji', emoji: emoji }); },

  getFriends: function() { return this.request({ type: 'get_friends' }); },
  addFriend: function(username) { return this.request({ type: 'add_friend', username: username }); },
  acceptFriend: function(friendId) { return this.request({ type: 'accept_friend', friendId: friendId }); },
  removeFriend: function(friendId) { return this.request({ type: 'remove_friend', friendId: friendId }); },
  searchUsers: function(query) { return this.request({ type: 'search_users', query: query }); },
  getLeaderboard: function(opts) {
    opts = opts || {};
    return this.request({ type: 'get_leaderboard', type: opts.type || 'global', gameId: opts.gameId });
  },
  getMe: function() { return this.request({ type: 'get_me' }); },
  getProfile: function(userId) { return this.request({ type: 'get_profile', userId: userId }); },
  setAvatar: function(avatar) { return this.request({ type: 'set_avatar', avatar: avatar }); },
  setName: function(name) { return this.request({ type: 'set_name', name: name }); },
  getGames: function() { return this.request({ type: 'get_games' }); },

  leave: function() {
    this.cancelMatch();
    if (this.ws) { try { this.ws.close(); } catch (e) {} }
    this.roomCode = null;
    this.opponent = null;
    this.playerIndex = 0;
  }
};
