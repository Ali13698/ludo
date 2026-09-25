// ============ Vite Entry Point ============

// CSS
import './theme.css';
import './style.css';
import './menu.css';

// Core (ریشه)
import './config.js';
import './state.js';
import './sfx.js';
import './dice.js';
import './rules.js';
import './movement.js';
import './bot-opponent.js';
import './turn.js';
import './bots.js';
import './timer.js';
import './board.js';
import './ui.js';
import './chat.js';
import './settings.js';
import './game.js';

// Shell
import './shell/util.js';
import './shell/platform.js';
import './shell/ui-layout.js';
import './shell/theme.js';
import './shell/online.js';
import './shell/lobby.js';
import './shell/menu.js';
import './shell/app.js';

// Boot
if (window.App && window.App.boot) {
  window.App.boot();
}
