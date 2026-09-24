// Shared parent/child contract for Spartaneo games.
// Games can call window.SpartaneoBridge.send(...) when embedded by the arcade shell.

const CHANNEL = 'spartaneo-arcade';

function post(type, payload = {}) {
  const message = { channel: CHANNEL, type, payload, sentAt: Date.now() };
  if (window.parent && window.parent !== window) window.parent.postMessage(message, window.location.origin);
  window.dispatchEvent(new CustomEvent(`spartaneo:${type}`, { detail: payload }));
}

export const SpartaneoBridge = {
  ready(meta = {}) { post('game-ready', meta); },
  pause() { post('game-paused'); },
  resume() { post('game-resumed'); },
  score(payload) { post('score', payload); },
  gameOver(payload) { post('game-over', payload); },
  requestExit() { post('request-exit'); },
  requestFullscreen() { post('request-fullscreen'); },
  setSound(enabled) { post('sound-state', { enabled: !!enabled }); }
};

window.SpartaneoBridge = SpartaneoBridge;

export function listenForShellControls(handlers = {}) {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.channel !== CHANNEL) return;
    const fn = handlers[data.type];
    if (typeof fn === 'function') fn(data.payload || {});
  });
}
