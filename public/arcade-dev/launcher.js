const CHANNEL = 'spartaneo-arcade';

const cabinetPanel = document.getElementById('cabinet-panel');
const cabinetTitle = document.getElementById('cabinet-title');
const cabinetClose = document.getElementById('cabinet-close');
const frame = document.getElementById('game-frame');

const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = './launcher.css?v=1';
document.head.append(style);

const launchButton = document.createElement('button');
launchButton.id = 'cabinet-launch';
launchButton.textContent = 'PLAY GAME';
launchButton.hidden = true;
cabinetClose.parentElement?.prepend(launchButton);

const host = document.createElement('section');
host.id = 'game-host';
host.hidden = true;
host.innerHTML = `
  <div class="game-shell-bar">
    <strong id="game-shell-title">SPARTANEO ARCADE</strong>
    <div class="game-shell-actions">
      <button id="game-back">← BACK TO ARCADE</button>
      <button id="game-pause">PAUSE</button>
      <button id="game-sound">SOUND ON</button>
      <button id="game-fullscreen">FULLSCREEN</button>
    </div>
  </div>
  <div id="game-loading">LOADING GAME…</div>
  <iframe id="game-iframe" title="Spartaneo Arcade game" allow="fullscreen; autoplay; gamepad" referrerpolicy="same-origin"></iframe>
`;
frame.append(host);

const iframe = host.querySelector('#game-iframe');
const shellTitle = host.querySelector('#game-shell-title');
const loading = host.querySelector('#game-loading');
const backButton = host.querySelector('#game-back');
const pauseButton = host.querySelector('#game-pause');
const soundButton = host.querySelector('#game-sound');
const fullscreenButton = host.querySelector('#game-fullscreen');

let selectedGame = null;
let activeGame = null;
let gamePaused = false;
let soundEnabled = true;

function games() {
  return window.SpartaneoArcade?.games || [];
}

function selectFromPanel() {
  if (cabinetPanel.hidden) return;
  const title = cabinetTitle.textContent || '';
  selectedGame = games().find((game) => title.startsWith(game.title)) || null;
  launchButton.hidden = !selectedGame?.launch;
  launchButton.textContent = selectedGame?.launch ? `PLAY ${selectedGame.title}` : 'NOT PLAYABLE YET';
}

new MutationObserver(selectFromPanel).observe(cabinetPanel, {
  attributes: true,
  attributeFilter: ['hidden'],
});

function send(type, payload = {}) {
  if (!iframe.contentWindow || !activeGame) return;
  iframe.contentWindow.postMessage({ channel: CHANNEL, type, payload, sentAt: Date.now() }, window.location.origin);
}

function launch(game) {
  if (!game?.launch) return;
  selectedGame = game;
  activeGame = game;
  gamePaused = false;
  soundEnabled = true;
  pauseButton.textContent = 'PAUSE';
  soundButton.textContent = 'SOUND ON';
  shellTitle.textContent = `${game.title} · SPARTANEO ARCADE`;
  loading.textContent = `LOADING ${game.title}…`;
  loading.hidden = false;
  cabinetPanel.hidden = true;
  host.hidden = false;
  window.SpartaneoArcade?.pause?.();
  iframe.src = game.launch;
}

function exitToArcade() {
  if (!activeGame) return;
  send('shell-pause');
  iframe.src = 'about:blank';
  host.hidden = true;
  activeGame = null;
  selectedGame = null;
  loading.hidden = true;
  window.SpartaneoArcade?.resume?.();
}

launchButton.addEventListener('click', () => launch(selectedGame));
backButton.addEventListener('click', exitToArcade);

pauseButton.addEventListener('click', () => {
  gamePaused = !gamePaused;
  pauseButton.textContent = gamePaused ? 'RESUME' : 'PAUSE';
  send(gamePaused ? 'shell-pause' : 'shell-resume');
});

soundButton.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  send('shell-sound', { enabled: soundEnabled });
});

fullscreenButton.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await frame.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    fullscreenButton.textContent = 'FULLSCREEN UNAVAILABLE';
  }
});

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== iframe.contentWindow) return;
  const data = event.data;
  if (!data || data.channel !== CHANNEL) return;
  if (data.type === 'game-ready') {
    loading.hidden = true;
    shellTitle.textContent = `${data.payload?.title || activeGame?.title || 'GAME'} · SPARTANEO ARCADE`;
  }
  if (data.type === 'game-over') {
    shellTitle.textContent = `${activeGame?.title || 'GAME'} · ${data.payload?.result || 'MATCH OVER'}`;
  }
  if (data.type === 'request-exit') exitToArcade();
  if (data.type === 'request-fullscreen') fullscreenButton.click();
});

window.addEventListener('beforeunload', () => {
  if (activeGame) iframe.src = 'about:blank';
});
