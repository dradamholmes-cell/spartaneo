import { GAMES } from './games.js';

const panel = document.getElementById('cabinet-panel');
const title = document.getElementById('cabinet-title');
const copy = document.getElementById('cabinet-copy');
const close = document.getElementById('cabinet-close');
const actions = panel?.querySelector('.actions');

if (!panel || !title || !close || !actions) {
  console.error('Arcade V2 cabinet controls missing');
} else {
  const play = document.createElement('button');
  play.id = 'cabinet-play';
  play.type = 'button';
  play.hidden = true;
  actions.prepend(play);

  const escape = document.createElement('button');
  escape.id = 'cabinet-x';
  escape.type = 'button';
  escape.textContent = '×';
  escape.setAttribute('aria-label', 'Close cabinet');
  panel.append(escape);

  let selected = null;

  function detectGame() {
    const heading = (title.textContent || '').toUpperCase();
    selected = GAMES.find(game => heading.includes(game.title.toUpperCase())) || null;
    const playable = selected?.id === 'ring-riot';
    play.hidden = !playable;
    play.textContent = playable ? 'PLAY RING RIOT ↗' : 'COMING SOON';
    play.disabled = !playable;
    if (playable && copy) {
      copy.textContent = 'Launch the real Ring Riot game in its own tab. Your arcade room stays open here so you can return instantly.';
    }
  }

  function backToRoom(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    panel.hidden = true;
    selected = null;
    play.hidden = true;
    window.SpartaneoArcade?.resume?.();
  }

  function launch(event) {
    event.preventDefault();
    event.stopPropagation();
    if (selected?.id !== 'ring-riot') return;
    const url = 'https://game.spartaneo.com/games/ogb-wrestling/';
    const opened = window.open(url, '_blank');
    if (opened) {
      try { opened.opener = null; } catch {}
      backToRoom();
      return;
    }
    // Popup blockers should not win: fall back to a normal navigation.
    window.location.href = url;
  }

  new MutationObserver(() => {
    if (!panel.hidden) detectGame();
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });

  // Android browsers can be inconsistent about synthesized click events after
  // fullscreen/touch interaction. Listen to pointer-up as well as click.
  for (const eventName of ['pointerup', 'click']) {
    close.addEventListener(eventName, backToRoom);
    escape.addEventListener(eventName, backToRoom);
  }
  play.addEventListener('click', launch);
  play.addEventListener('pointerup', event => {
    // Let click do the launch, but keep the touch from leaking into the room.
    event.preventDefault();
    event.stopPropagation();
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) backToRoom(event);
  });
}
