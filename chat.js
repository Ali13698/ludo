// ============ CHAT MODULE ============
window.Chat = {
  messages: [],
  isOpen: false,

  init() {
    this.renderPanel();
    // گوش دادن به پیام‌های ورودی
    Online.on("chat_message", (data) => {
      this.addMessage(data.message);
    });
    Online.on("chat_history", (data) => {
      this.messages = data.messages || [];
      this.renderMessages();
    });
    Online.on("emoji", (data) => {
      this.showEmoji(data.from, data.emoji);
    });
  },

  renderPanel() {
    if (document.getElementById('chatPanel')) return;
    const html = `
    <div id="chatFab" onclick="Chat.toggle()">💬<span id="chatBadge" class="chat-badge hidden">0</span></div>
    <div id="chatPanel" class="chat-panel">
      <div class="chat-header">
        <span>💬 چت</span>
        <button onclick="Chat.toggle()" class="chat-close">✕</button>
      </div>
      <div id="chatMessages" class="chat-messages"></div>
      <div class="chat-emojis">
        <button onclick="Chat.quickEmoji('👍')">👍</button>
        <button onclick="Chat.quickEmoji('😂')">😂</button>
        <button onclick="Chat.quickEmoji('😮')">😮</button>
        <button onclick="Chat.quickEmoji('😡')">😡</button>
        <button onclick="Chat.quickEmoji('🎲')">🎲</button>
        <button onclick="Chat.quickEmoji('🔥')">🔥</button>
      </div>
      <div class="chat-input-row">
        <input id="chatInput" type="text" maxlength="300" placeholder="پیام..."
          onkeydown="if(event.key==='Enter')Chat.send()">
        <button onclick="Chat.send()">➤</button>
      </div>
    </div>
    <div id="emojiFloat" class="emoji-float"></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const p = document.getElementById('chatPanel');
    const f = document.getElementById('chatFab');
    if (!p) return;
    if (this.isOpen) {
      p.classList.add('open');
      f.classList.add('hidden');
      this.clearBadge();
      this.scrollBottom();
      setTimeout(() => document.getElementById('chatInput').focus(), 200);
    } else {
      p.classList.remove('open');
      f.classList.remove('hidden');
    }
  },

  send() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    Online.sendChat(text);
    input.value = '';
  },

  quickEmoji(e) {
    Online.sendEmoji(e);
    this.showEmoji(Online.userId, e);
  },

  addMessage(msg) {
    this.messages.push(msg);
    if (this.messages.length > 200) this.messages.shift();
    this.renderMessages();
    if (!this.isOpen) this.incBadge();
  },

  renderMessages() {
    const el = document.getElementById('chatMessages');
    if (!el) return;
    el.innerHTML = '';
    for (const m of this.messages) {
      const isMe = m.from === Online.userId;
      const div = document.createElement('div');
      div.className = 'chat-msg ' + (isMe ? 'me' : 'them');
      div.textContent = m.text;
      el.appendChild(div);
    }
    this.scrollBottom();
  },

  scrollBottom() {
    const el = document.getElementById('chatMessages');
    if (el) el.scrollTop = el.scrollHeight;
  },

  incBadge() {
    const b = document.getElementById('chatBadge');
    if (!b) return;
    const n = (parseInt(b.textContent) || 0) + 1;
    b.textContent = n;
    b.classList.remove('hidden');
  },

  clearBadge() {
    const b = document.getElementById('chatBadge');
    if (!b) return;
    b.textContent = '0';
    b.classList.add('hidden');
  },

  showEmoji(fromId, emoji) {
    const el = document.getElementById('emojiFloat');
    if (!el) return;
    const span = document.createElement('span');
    span.className = 'emoji-pop';
    span.textContent = emoji;
    el.appendChild(span);
    setTimeout(() => span.remove(), 2500);
  },

  reset() {
    this.messages = [];
    this.renderMessages();
    this.clearBadge();
  }
};
