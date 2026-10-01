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
  cbid: 0,
  queueTimer: null,
  invites: [],
  _manualClose: false,
  _lastUser: null,
  _lastInitData: '',
  _lastPlatform: 'telegram',

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
    if (!this.SERVER_URL) {
      this.initServerUrl();
    }

    console.log('[ws create]', this.ws ? this.ws.readyState : 'null');

    if (this.ws &&
        (this.ws.readyState === WebSocket.CONNECTING ||
         this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    var self = this;

    return new Promise(function(resolve, reject) {
      var settled = false;

      function rejectOnce(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      }

      function resolveOnce() {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve();
      }

      var timeout = setTimeout(function() {
        if (self.connected) return;
        self.connected = false;
        rejectOnce(new Error('اتصال ناموفق'));
      }, 8000);

      console.log('[ws] connecting', self.SERVER_URL);

      try {
        self.ws = new WebSocket(self.SERVER_URL);
      } catch (e) {
        rejectOnce(e);
        return;
      }

      self.ws.onopen = function() {
        self.connected = true;
        console.log('[ws] opened');
        resolveOnce();
      };

      self.ws.onerror = function() {
        self.connected = false;
        rejectOnce(new Error('اتصال ناموفق'));
      };

      self.ws.onclose = function(event) {
        console.log('[ws close]', event.code, event.reason);
        self.connected = false;
        self.authed = false;

        var ids = Object.keys(self.pendingCb);
        for (var i = 0; i < ids.length; i++) {
          var cb = self.pendingCb[ids[i]];
          delete self.pendingCb[ids[i]];
          try { cb({ ok: false, error: 'socket_closed' }); } catch (err) {}
        }

        console.log('[online] disconnected');
        self.emit('disconnected', {});

        if (!self._manualClose && self._lastUser) {
          setTimeout(function() {
            self._reconnectAndInit();
          }, 1500);
        }
        self._manualClose = false;
      };

      self.ws.onmessage = function(e) {
        var msg;

        try {
          msg = JSON.parse(e.data);
        } catch (err) {
          console.warn('[online] invalid message');
          return;
        }

        var eventTypes = {
          match_found: true,
          opponent_left: true,
          game_action: true,
          game_state: true,
          room_closed: true,
          chat_message: true,
          emoji: true,
          notification: true,
          disconnected: true
        };

        if (msg.type && eventTypes[msg.type]) {
          self.emit(msg.type, msg);
          return;
        }

        if (
          msg.cbid !== undefined &&
          msg.cbid !== null &&
          self.pendingCb[msg.cbid]
        ) {
          var cb = self.pendingCb[msg.cbid];
          delete self.pendingCb[msg.cbid];
          cb(msg);
          return;
        }

        self.emit(msg.type, msg);
      };
    });
  },

  _reconnectAndInit: async function() {
    if (this.connected) return;
    try {
      await this.connect();
      var res = await this.request({
        type: 'init_user',
        platform: this._lastPlatform,
        initData: this._lastInitData,
        user: this._lastUser
      });
      if (res.ok) {
        this.authed = true;
        this.userId = res.user_id;
        this.userInfo = res.user;
      }
    } catch (err) {
    }
  },

  send: function(obj) {
    if (!this.ws || this.ws.readyState !== 1) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      console.error('[online] send failed', e);
      return false;
    }
  },

  request: function(obj) {
    var self = this;

    return new Promise(function(resolve) {
      var id = ++self.cbid;
      var settled = false;

      function finish(result) {
        if (settled) return;
        settled = true;
        delete self.pendingCb[id];
        clearTimeout(timeout);
        resolve(result);
      }

      var timeout = setTimeout(function() {
        finish({
          ok: false,
          error: 'timeout'
        });
      }, 15000);

      self.pendingCb[id] = function(response) {
        finish(response);
      };

      obj.cbid = id;

      var sent = self.send(obj);

      if (!sent) {
        finish({
          ok: false,
          error: 'ارتباط WebSocket بسته است'
        });
      }
    });
  },

  on: function(type, fn) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(fn);
  },

  emit: function(type, data) {
    var hs = this.handlers[type] || [];
    for (var i = 0; i < hs.length; i++) {
      try {
        hs[i](data);
      } catch (e) {
        console.error(e);
      }
    }
  },

  initUser: async function(telegramUser) {
    await this.connect();

    var user = telegramUser || {};
    var initData = window.Platform && window.Platform.getInitData
      ? window.Platform.getInitData()
      : '';
    var platform = window.Platform && window.Platform.type
      ? window.Platform.type
      : 'telegram';

    this._lastInitData = initData;
    this._lastPlatform = platform;
    this._lastUser = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url
    };

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
      this.userId = res.user_id;
      this.userInfo = res.user;
      console.log('[online] user init:', res.user);
    } else {
      console.warn('[online] init_user failed:', res.error);
    }

    return res;
  },

  quickMatch: async function(gameId) {
    await this.connect();

    if (!this.authed) {
      return {
        ok: false,
        error: 'ابتدا init کنید'
      };
    }

    var res = await this.request({
      type: 'quick_match',
      gameId: gameId || 'ludo'
    });

    return res;
  },

  cancelMatch: function() {
    if (this.queueTimer) {
      clearInterval(this.queueTimer);
      this.queueTimer = null;
    }
    return this.send({
      type: 'cancel_match'
    });
  },

  createRoom: async function(gameId) {
    await this.connect();

    if (!this.authed) {
      return {
        ok: false,
        error: 'ابتدا init کنید'
      };
    }

    var res = await this.request({
      type: 'create_room',
      gameId: gameId || 'ludo'
    });

    return res;
  },

  joinRoom: async function(code) {
    await this.connect();

    if (!this.authed) {
      return {
        ok: false,
        error: 'ابتدا init کنید'
      };
    }

    return this.request({
      type: 'join_room',
      code: String(code || '').toUpperCase().trim()
    });
  },

  inviteFriend: function(friendId, gameId) {
    return this.request({
      type: 'invite_friend',
      friendId: friendId,
      gameId: gameId || 'ludo'
    });
  },

  respondInvite: async function(invitedId, accept) {
    await this.connect();

    if (!this.authed) {
      return {
        ok: false,
        error: 'ابتدا init کنید'
      };
    }

    var res = await this.request({
      type: 'respond_invite',
      invitedId: invitedId,
      accept: accept
    });

    return res;
  },

  sendGameAction: function(data) {
    return this.send({
      type: 'game_action',
      data: data
    });
  },

  notifyGameEnded: function(winnerId) {
    return this.send({
      type: 'game_ended',
      winnerId: winnerId
    });
  },

  sendChat: function(text) {
    return this.send({
      type: 'chat_message',
      text: text
    });
  },

  sendEmoji: function(emoji) {
    return this.send({
      type: 'emoji',
      emoji: emoji
    });
  },

  getFriends: function() {
    return this.request({
      type: 'get_friends'
    });
  },

  addFriend: function(username) {
    return this.request({
      type: 'add_friend',
      username: username
    });
  },

  acceptFriend: function(friendId) {
    return this.request({
      type: 'accept_friend',
      friendId: friendId
    });
  },

  removeFriend: function(friendId) {
    return this.request({
      type: 'remove_friend',
      friendId: friendId
    });
  },

  searchUsers: function(query) {
    return this.request({
      type: 'search_users',
      query: query
    });
  },

  getLeaderboard: function(opts) {
    opts = opts || {};
    return this.request({
      type: 'get_leaderboard',
      leaderboardType: opts.type || 'global',
      gameId: opts.gameId
    });
  },

  getMe: function() {
    return this.request({
      type: 'get_me'
    });
  },

  getProfile: function(userId) {
    return this.request({
      type: 'get_profile',
      userId: userId
    });
  },

  setAvatar: function(avatar) {
    return this.request({
      type: 'set_avatar',
      avatar: avatar
    });
  },

  setName: function(name) {
    return this.request({
      type: 'set_name',
      name: name
    });
  },

  getGames: function() {
    return this.request({
      type: 'get_games'
    });
  },

  leave: function() {
    this._manualClose = true;
    this.cancelMatch();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    this.ws = null;
    this.connected = false;
    this.authed = false;
    this.roomCode = null;
    this.opponent = null;
    this.playerIndex = 0;
  }
};
