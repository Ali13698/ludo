// ============ BOT OPPONENT (Client-side AI) ============
window.BotOpponent = {
  active: false,
  botInfo: null,
  botPlayerIdx: 1,

  start(botData) {
    this.active = true;
    this.botInfo = botData;
    this.botPlayerIdx = 1 - S.myIdx;
    console.log('[bot] started', botData);
  },

  stop() {
    this.active = false;
    this.botInfo = null;
  },

  playTurn() {
    if (!this.active) return;
    if (S.over || S.busy) return;
    if (S.cur === S.active[S.myIdx]) return;

    const self = this;
    const thinkTime = 1200 + Math.random() * 2000;

    DOM.statusText.textContent = (this.botInfo?.name || 'حریف') + ' در حال فکر...';

    setTimeout(() => {
      if (S.over || S.busy) return;
      if (S.cur === S.active[S.myIdx]) return;
      self.rollDice();
    }, thinkTime);
  },

  rollDice() {
    if (S.over || S.busy) return;
    if (S.cur === S.active[S.myIdx]) return;

    const value = Math.floor(Math.random() * 6) + 1;
    S.dice = value;
    Dice.reset();
    setTimeout(() => {
      Dice.spin(value, () => {
        S.rolled = true;
        Board.draw();
        UI.update();
        DOM.statusText.textContent = (this.botInfo?.name || 'حریف') + ' تاس ریخت: ' + value;
        setTimeout(() => this.afterRoll(value), 400);
      });
    }, 50);
  },

  afterRoll(value) {
    const self = this;
    const mv = Rules.getMovableFor(S.cur);

    if (mv.length === 0) {
      setTimeout(() => {
        if (value === 6) {
          S.rolled = false;
          S.dice = 0;
          UI.update();
          self.rollDice();
        } else {
          self.endTurn();
        }
      }, 700);
      return;
    }

    let pick;
    if (Math.random() < 0.75) {
      const sorted = mv.slice().sort((a, b) => {
        const sa = (a.pos === 0 ? 100 : a.pos) + (a.pos + value === 57 ? 500 : 0);
        const sb = (b.pos === 0 ? 100 : b.pos) + (b.pos + value === 57 ? 500 : 0);
        return sb - sa;
      });
      pick = sorted[0];
    } else {
      pick = mv[Math.floor(Math.random() * mv.length)];
    }

    setTimeout(() => self.doMove(pick, value), 500 + Math.random() * 500);
  },

  doMove(t, d) {
    if (S.over || S.busy) return;

    Move.start(t, d, () => {
      const w = Rules.checkWin();
      if (w >= 0) {
        S.over = true;
        SFX.win();
        const name = (w === S.active[S.myIdx]) ? 'شما' : (this.botInfo?.name || 'حریف');
        DOM.statusText.textContent = '🏆 برنده: ' + name;
        UI.update();
        Board.draw();
        UI.renderProfiles();
        if (window.Online && Online.ws) {
          Online.notifyGameEnded(w === S.active[S.myIdx] ? S.active[S.myIdx] : this.botInfo.id);
        }
        return;
      }

      if (d === 6) {
        S.rolled = false;
        S.dice = 0;
        UI.update();
        setTimeout(() => this.rollDice(), 500);
      } else {
        this.endTurn();
      }
    });
  },

  endTurn() {
    S.cur = S.active[S.myIdx];
    S.rolled = false;
    S.dice = 0;
    UI.update();
    Board.draw();
    UI.renderProfiles();
    Timer.start();
  }
};
