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
    if (!this.SERVER_URL) {
      this.initServerUrl();
    }

    if (this.ws && this.ws.readyState === 1) {
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

      try {
        self.ws = new WebSocket(self.SERVER_URL);
      } catch (e) {
        rejectOnce(e);
        return;
      }

      self.ws.onopen = function() {
        self.connected = true;
        console.log('[online] connected');
        resolveOnce();
      };

      self.ws.onerror = function() {
        self.connected = false;
        rejectOnce(new Error('خطای اتصال'));
      };

      self.ws.onclose = function() {
        self.connected = false;
        self.authed = false;
        console.log('[online] disconnected');
        self.emit('disconnected', {});
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
          msg.cbId !== undefined &&
          msg.cbId !== null &&
          self.pendingCb[msg.cbId]
        ) {
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
      var id = ++self.cbId;
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

      obj.cbId = id;

      var sent = self.send(obj);

      if (!sent) {
        finish({
          ok: false,
          error: 'اتصال WebSocket آماده نیست'
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

  quickMatch: async function(gameId) {
    await this.connect();

    if (!this.authed) {
      return {
        ok: false,
        error: 'ابتدا init کنید'
      };
    }

    return this.request({
      type: 'quick_match',
      gameId: gameId || 'ludo'
    });
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

  createRoom: function(gameId) {
    return this.request({
      type: 'create_room',
      gameId: gameId || 'ludo'
    });
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

  respondInvite: function(inviteId, accept) {
    return this.request({
      type: 'respond_invite',
      inviteId: inviteId,
      accept: accept
    });
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
