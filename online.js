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

  SERVER_URL: 'wss://api.nomi98.com',

  getInitData() {
    try {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        return window.Telegram.WebApp.initData;
      }
    } catch (e) {}
    return '';
  },

  connect() {
    if (this.ws && this.ws.readyState === 1) return Promise.resolve();
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.SERVER_URL);
      } catch (e) { reject(e); return; }
      const timeout = setTimeout(() => {
        if (!this.connected) reject(new Error('اتصال ناموفق'));
      }, 30000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.connected = true;
        console.log('[online] connected');
        resolve();
      };
      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('خطای اتصال'));
      };
      this.ws.onclose = () => {
        this.connected = false;
        this.authed = false;
        console.log('[online] disconnected');
        this.emit('disconnected', {});
      };
      this.ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        if (msg.cbId && this.pendingCb[msg.cbId]) {
          const cb = this.pendingCb[msg.cbId];
          delete this.pendingCb[msg.cbId];
          cb(msg);
          return;
        }
        this.emit(msg.type, msg);
      };
    });
  },

  send(obj) {
    if (!this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(JSON.stringify(obj)); } catch (e) {}
  },

  request(obj) {
    return new Promise((resolve) => {
      const id = ++this.cbId;
      this.pendingCb[id] = resolve;
      obj.cbId = id;
      this.send(obj);
      setTimeout(() => {
        if (this.pendingCb[id]) {
          delete this.pendingCb[id];
          resolve({ ok: false, error: 'timeout' });
        }
      }, 15000);
    });
  },

  on(type, fn) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(fn);
  },
  emit(type, data) {
    const hs = this.handlers[type] || [];
    for (const h of hs) {
      try { h(data); } catch (e) { console.error(e); }
    }
  },

  async initUser(telegramUser) {
    await this.connect();
    const user = telegramUser || {};
    const initData = this.getInitData();
    console.log('[online] initUser initData length:', initData.length);

    const res = await this.request({
      type: 'init_user',
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

  async quickMatch(gameId) {
    return this.request({ type: 'quick_match', gameId: gameId || 'ludo' });
  },
  cancelMatch() {
    if (this.queueTimer) { clearInterval(this.queueTimer); this.queueTimer = null; }
    this.send({ type: 'cancel_match' });
  },

  async createRoom(gameId) {
    return this.request({ type: 'create_room', gameId: gameId || 'ludo' });
  },
  async joinRoom(code) {
    return this.request({ type: 'join_room', code });
  },

  async inviteFriend(friendId, gameId) {
    return this.request({ type: 'invite_friend', friendId, gameId: gameId || 'ludo' });
  },
  async respondInvite(inviteId, accept) {
    return this.request({ type: 'respond_invite', inviteId, accept });
  },

  sendGameAction(data) {
    this.send({ type: 'game_action', data });
  },
  notifyGameEnded(winnerId) {
    this.send({ type: 'game_ended', winnerId });
  },

  sendChat(text) {
    this.send({ type: 'chat_message', text });
  },
  sendEmoji(emoji) {
    this.send({ type: 'emoji', emoji });
  },

  async getFriends() {
    return this.request({ type: 'get_friends' });
  },
  async addFriend(username) {
    return this.request({ type: 'add_friend', username });
  },
  async acceptFriend(friendId) {
    return this.request({ type: 'accept_friend', friendId });
  },
  async removeFriend(friendId) {
    return this.request({ type: 'remove_friend', friendId });
  },
  async searchUsers(query) {
    return this.request({ type: 'search_users', query });
  },
  async getLeaderboard(opts) {
    opts = opts || {};
    return this.request({ type: 'get_leaderboard', type: opts.type || 'global', gameId: opts.gameId });
  },
  async getMe() {
    return this.request({ type: 'get_me' });
  },
  async getProfile(userId) {
    return this.request({ type: 'get_profile', userId });
  },
  async setAvatar(avatar) {
    return this.request({ type: 'set_avatar', avatar });
  },
  async setName(name) {
    return this.request({ type: 'set_name', name });
  },
  async getGames() {
    return this.request({ type: 'get_games' });
  },

  leave() {
    this.cancelMatch();
    if (this.ws) { try { this.ws.close(); } catch (e) {} }
    this.roomCode = null;
    this.opponent = null;
    this.playerIndex = 0;
  }
};
