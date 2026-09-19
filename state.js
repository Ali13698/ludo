// ============ STATE ============
window.S = {
  CELL: 30,
  active: [],
  tokens: [],
  cur: 0,
  dice: 0,
  rolled: false,
  over: false,
  busy: false,
  myIdx: 0,
  outMap: {},
  strikeMap: {},
  botInfo: {},
  timeLeft: 0,
  timerInterval: null,
  botTimeout: null,
  firstRollDone: false
};

// ============ DOM REFERENCES ============
window.DOM = {};

window.initDOM = function() {
  DOM.canvas = document.getElementById('board');
  DOM.ctx = DOM.canvas.getContext('2d');
  DOM.rollBtn = document.getElementById('rollBtn');
  DOM.statusText = document.getElementById('statusText');
  DOM.timerFill = document.getElementById('timerFill');
  DOM.profilesEl = document.getElementById('profiles');
  DOM.boardArea = document.getElementById('boardArea');
  DOM.dice3d = document.getElementById('dice3d');
  DOM.menu = document.getElementById('menu');
  DOM.game = document.getElementById('game');
  DOM.playBtn = document.getElementById('playBtn');
};
