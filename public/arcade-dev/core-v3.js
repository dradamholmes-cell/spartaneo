import * as THREE from 'three';

const BUILD = '20260923.02';
const frame = document.getElementById('game-frame');
const intro = document.getElementById('intro');
const enterBtn = document.getElementById('enter-btn');
const homeBtn = document.getElementById('home-btn');
const fullBtn = document.getElementById('full-btn');
const prompt = document.getElementById('interact-prompt');
const promptKey = document.getElementById('interact-key');
const promptTitle = document.getElementById('interact-title');
const toast = document.getElementById('toast');
const sheet = document.getElementById('cabinet-sheet');
const sheetKicker = document.getElementById('sheet-kicker');
const sheetTitle = document.getElementById('sheet-title');
const sheetCopy = document.getElementById('sheet-copy');
const playBtn = document.getElementById('play-btn');
const roomBtn = document.getElementById('room-btn');
const sheetX = document.getElementById('sheet-x');
const stick = document.getElementById('stick');
const stickKnob = document.getElementById('stick-knob');
const actionBtn = document.getElementById('action-btn');

const coarse = matchMedia('(pointer:coarse)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
scene.fog = new THREE.Fog(0x050608, 7.5, 24);

const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.08, 60);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(768, 432, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
frame.prepend(renderer.domElement);

const C = {
  green: 0x49ff87,
  greenDark: 0x153d25,
  pink: 0xff456f,
  cyan: 0x47dfff,
  amber: 0xffc45a,
  purple: 0x8a65ff,
  wall: 0x121318,
  wall2: 0x1c1c22,
  floor: 0x17131e,
  black: 0x090a0c,
};

function mat(color, { emissive = 0x000000, intensity = 0, roughness = .82, metalness = .06 } = {}) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness, metalness, flatShading: true });
}
function basic(color) { return new THREE.MeshBasicMaterial({ color, toneMapped: false }); }
function box(size, pos, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function plane(size, pos, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
  mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function cyl(rt, rb, h, segments, pos, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  mesh.position.set(...pos); parent.add(mesh); return mesh;
}

function textTexture(title, subtitle = '', opts = {}) {
  const w = opts.w || 640, h = opts.h || 220;
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = opts.bg || '#08090b'; ctx.fillRect(0, 0, w, h);
  if (opts.grid) {
    ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }
  ctx.strokeStyle = opts.border || '#49ff87'; ctx.lineWidth = opts.line || 8;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.textAlign = 'center'; ctx.fillStyle = opts.fg || '#f5f5ef';
  ctx.font = opts.font || '900 70px Courier New';
  ctx.textBaseline = subtitle ? 'alphabetic' : 'middle';
  ctx.fillText(title, w / 2, subtitle ? h * .59 : h * .53);
  if (subtitle) { ctx.fillStyle = opts.sub || '#9ecbaa'; ctx.font = opts.subfont || '800 28px Courier New'; ctx.fillText(subtitle, w / 2, h * .82); }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter;
  return tex;
}
function textPlane(title, subtitle, size, pos, opts = {}, parent = scene) {
  const mesh = plane(size, pos, new THREE.MeshBasicMaterial({ map: textTexture(title, subtitle, opts), toneMapped: false }), parent);
  return mesh;
}

function carpetTexture() {
  const s = 256, canvas = document.createElement('canvas'); canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#15111d'; ctx.fillRect(0, 0, s, s);
  const colors = ['#253f36', '#6e244c', '#1f6076', '#6b5423', '#40306e'];
  for (let i = 0; i < 46; i++) {
    const x = (i * 83) % s, y = (i * 47 + 29) % s;
    ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo((x + 8 + i % 13) % s, (y + (i % 3 - 1) * 6 + s) % s); ctx.stroke();
    if (i % 4 === 0) { ctx.fillStyle = colors[(i + 2) % colors.length]; ctx.fillRect((x + 29) % s, (y + 17) % s, 4, 4); }
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(7, 6); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  return tex;
}

scene.add(new THREE.HemisphereLight(0x8fa99a, 0x070609, .62));
scene.add(new THREE.AmbientLight(0xffffff, .10));
const warmKey = new THREE.DirectionalLight(0xffe9c6, .78); warmKey.position.set(-4, 7, 5); scene.add(warmKey);

const floor = plane([20, 16], [0, 0, 0], new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: .92, metalness: 0 })); floor.rotation.x = -Math.PI / 2;
box([20, 5, .32], [0, 2.5, -8], mat(C.wall));
box([.32, 5, 16], [-10, 2.5, 0], mat(0x101116));
box([.32, 5, 16], [10, 2.5, 0], mat(0x101116));
box([20, .24, 16], [0, 5.05, 0], mat(0x08090b));
box([20, .18, .22], [0, 2.35, -7.78], mat(0x26282d));
box([.22, 2.1, 16], [-9.79, 1.1, 0], mat(0x202229));
box([.22, 2.1, 16], [9.79, 1.1, 0], mat(0x202229));

for (const z of [-6.2, -2.2, 1.8, 5.8]) {
  box([18.8, .08, .14], [0, 4.73, z], mat(0x202127));
  box([5.3, .035, .07], [-6.0, 4.62, z], basic(z === -2.2 ? C.pink : C.green));
  box([5.3, .035, .07], [6.0, 4.62, z], basic(z === 1.8 ? C.cyan : C.green));
}

const aisleGlow = new THREE.MeshBasicMaterial({ color: C.green, transparent: true, opacity: .25, toneMapped: false });
for (let z = -6.5; z <= 6.2; z += 1.25) box([2.5, .015, .025], [0, .018, z], aisleGlow);

textPlane('SPARTANEO', 'ARCADE · OPEN LATE', [7.4, 1.55], [0, 4.02, -7.80], { bg: '#07100b', border: '#49ff87', sub: '#a3d7b0' });
textPlane('OGB COMICS', 'ORIGINALS LIVE HERE', [3.1, .85], [-7.3, 3.45, -7.79], { bg: '#13080e', border: '#ff456f', font: '900 52px Courier New', subfont: '800 22px Courier New' });
textPlane('STREEPY', 'PRODUCTIONS', [3.1, .85], [7.3, 3.45, -7.79], { bg: '#061017', border: '#47dfff', font: '900 52px Courier New', subfont: '800 22px Courier New' });

const GAMES = [
  { id: 'ring-riot', title: 'RING RIOT', subtitle: 'KO ONLY', color: C.pink, position: [-3.15, 0, -5.35], playable: true, url: 'https://game.spartaneo.com/games/ogb-wrestling/', copy: 'OGB wrestling. Pick your fighter, empty their health, and knock them out.' },
  { id: 'cart-league', title: 'CART LEAGUE', subtitle: 'GOLF CART CHAOS', color: C.green, position: [3.15, 0, -5.35], playable: false, url: '', copy: 'The working Godot golf-cart game is being connected to this cabinet next.' },
];

const cabinetScreens = [];
function makeCabinet(game, { decorative = false, rotationY = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(...game.position); g.rotation.y = rotationY; g.userData.game = game; g.userData.decorative = decorative;
  const shell = mat(0x141519, { roughness: .72, metalness: .1 });
  const trim = mat(0x2a2c31, { roughness: .55, metalness: .22 });
  const edge = mat(game.color, { emissive: game.color, intensity: .72, roughness: .45 });
  box([1.62, 2.05, 1.44], [0, 1.02, 0], shell, g);
  const top = box([1.68, 1.05, 1.26], [0, 2.49, -.10], shell, g); top.rotation.x = .055;
  box([1.75, .13, 1.35], [0, 3.05, -.06], trim, g);
  box([.065, 2.6, 1.5], [-.84, 1.52, 0], edge, g); box([.065, 2.6, 1.5], [.84, 1.52, 0], edge, g);
  box([1.34, .86, .09], [0, 2.48, .61], trim, g);
  const screenMat = mat(game.color, { emissive: game.color, intensity: 1.45, roughness: .35 });
  const screen = box([1.13, .66, .035], [0, 2.48, .665], screenMat, g); cabinetScreens.push({ screen, mat: screenMat, base: 1.25 + Math.random() * .4 });
  const deck = box([1.58, .16, .64], [0, 1.69, .55], trim, g); deck.rotation.x = -.12;
  const stickBase = cyl(.085, .085, .055, 10, [-.36, 1.80, .75], mat(0x101114), g); stickBase.rotation.x = Math.PI / 2;
  const stickStem = cyl(.035, .045, .24, 6, [-.36, 1.94, .72], edge, g); stickStem.rotation.x = .15;
  cyl(.10, .10, .055, 10, [.30, 1.82, .77], mat(0xe6e1d8), g); cyl(.10, .10, .055, 10, [.56, 1.82, .77], edge, g);
  const marquee = new THREE.Mesh(new THREE.PlaneGeometry(1.48, .48), new THREE.MeshBasicMaterial({ map: textTexture(game.title, game.subtitle, { w: 600, h: 180, bg: '#08090b', border: `#${game.color.toString(16).padStart(6, '0')}`, font: '900 52px Courier New', subfont: '800 22px Courier New' }), toneMapped: false }));
  marquee.position.set(0, 3.15, .48); marquee.rotation.x = -.07; g.add(marquee);
  const coin = textPlane(game.playable ? 'PLAY' : 'SOON', '', [1.0, .30], [0, .74, .73], { w: 320, h: 92, bg: '#08090b', border: game.playable ? '#49ff87' : '#706744', fg: game.playable ? '#eaffe9' : '#d8cca3', font: '900 42px Courier New' }, g);
  coin.rotation.x = 0;
  const light = new THREE.PointLight(game.color, decorative ? .75 : 1.35, 4.2, 2); light.position.set(0, 2.4, 1.15); g.add(light);
  scene.add(g); return g;
}

const cabinets = GAMES.map(game => makeCabinet(game));
const decor = [
  { title: 'CRYPTID HUNT', subtitle: 'COMING SOON', color: C.cyan, position: [-8.95, 0, -2.2] },
  { title: 'OGB 1999', subtitle: 'COMING SOON', color: C.amber, position: [-8.95, 0, 1.2] },
  { title: 'BUBBA', subtitle: 'LICENSE TO PURR', color: C.purple, position: [8.95, 0, -2.2] },
  { title: 'BEAT LAB', subtitle: 'LEOLABS', color: C.green, position: [8.95, 0, 1.2] },
];
decor.forEach((game, i) => makeCabinet({ ...game, playable: false, copy: '' }, { decorative: true, rotationY: i < 2 ? Math.PI / 2 : -Math.PI / 2 }));

function poster(title, sub, color, x, y, z, rotY = 0) {
  const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = rotY;
  box([2.2, 1.55, .09], [0, 0, 0], mat(0x2b2b30), group);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.02, 1.37), new THREE.MeshBasicMaterial({ map: textTexture(title, sub, { w: 500, h: 340, bg: '#0b0b0e', border: color, fg: '#f4f2e9', sub: color, font: '900 54px Courier New', subfont: '800 24px Courier New', grid: true }), toneMapped: false }));
  p.position.z = .051; group.add(p); scene.add(group);
}
poster('RING RIOT', 'KO ONLY', '#ff456f', -6.6, 3.3, -7.76);
poster('CART LEAGUE', 'GOLF CART CHAOS', '#49ff87', 6.6, 3.3, -7.76);
poster('OGB', 'COMICS', '#47dfff', -9.78, 3.15, 4.3, Math.PI / 2);
poster('ARCADE', 'AFTER HOURS', '#8a65ff', 9.78, 3.15, 4.3, -Math.PI / 2);

function shelf(x, z, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY;
  const wood = mat(0x30251d); box([2.8, .15, .75], [0, .45, 0], wood, g); box([2.8, .15, .75], [0, 1.35, 0], wood, g); box([2.8, .15, .75], [0, 2.25, 0], wood, g);
  box([.14, 2.55, .78], [-1.33, 1.22, 0], wood, g); box([.14, 2.55, .78], [1.33, 1.22, 0], wood, g);
  const colors = [C.pink, C.green, C.cyan, C.amber, C.purple];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) {
    const b = box([.22, .58, .08], [-1.0 + i * .28, .80 + row * .90, .39], mat(colors[(i + row * 2) % colors.length]), g); b.rotation.z = ((i % 3) - 1) * .045;
  }
  scene.add(g);
}
shelf(7.8, 5.1, 0); shelf(-7.8, 5.1, 0);

function vending(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  box([1.45, 2.75, .85], [0, 1.38, 0], mat(0x13171a, { metalness: .18 }), g);
  box([1.12, 1.48, .04], [0, 1.80, .45], mat(0x153d2b, { emissive: C.green, intensity: .35 }), g);
  textPlane('DRINKS', '25¢', [.90, .35], [0, 2.61, .47], { w: 360, h: 110, bg: '#08100b', border: '#49ff87', font: '900 38px Courier New', subfont: '800 18px Courier New' }, g);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) cyl(.07, .07, .28, 8, [-.32 + col * .32, 1.35 + row * .40, .50], mat([C.pink, C.cyan, C.green][col], { emissive: [C.pink, C.cyan, C.green][col], intensity: .35 }), g);
  const l = new THREE.PointLight(C.green, .8, 3.5, 2); l.position.set(0, 1.8, 1); g.add(l); scene.add(g);
}
vending(-7.6, 2.4);

for (const x of [-4.9, 4.9]) {
  cyl(.33, .38, .12, 8, [x, .52, 3.0], mat(0x2e2930)); cyl(.075, .075, .50, 7, [x, .27, 3.0], mat(0x3b3d42));
}
const table = cyl(.85, .92, .10, 12, [0, .67, 3.0], mat(0x36272a, { metalness: .12 }));
cyl(.11, .11, .62, 8, [0, .34, 3.0], mat(0x34363a));

const door = new THREE.Group(); door.position.set(0, 0, 7.75);
box([3.3, 3.4, .18], [0, 1.7, 0], mat(0x0b0d0f), door); box([2.75, 2.85, .05], [0, 1.48, -.11], mat(0x171b1f, { metalness: .25 }), door);
textPlane('EXIT', 'SPARTANEO.COM', [1.8, .55], [0, 3.45, -.12], { w: 460, h: 140, bg: '#09110c', border: '#49ff87', font: '900 54px Courier New', subfont: '800 20px Courier New' }, door); scene.add(door);

const glowPoints = [[-7, 2.2, -4.8, C.pink], [7, 2.2, -4.8, C.green], [-7, 2.0, 2.2, C.cyan], [7, 2.0, 2.2, C.purple]];
glowPoints.forEach(([x, y, z, color]) => { const p = new THREE.PointLight(color, .65, 5.5, 2); p.position.set(x, y, z); scene.add(p); });

const player = { x: 0, z: 5.9, yaw: 0, bob: 0 };
const keys = { forward: false, back: false, left: false, right: false };
let stickX = 0, stickY = 0, stickPointer = null;
let entered = false, sheetOpen = false, selectedGame = null, nearest = null, toastTimer = 0, actionQueued = false;

function keyControl(key) {
  const k = key.toLowerCase();
  if (k === 'w' || k === 'arrowup') return 'forward';
  if (k === 's' || k === 'arrowdown') return 'back';
  if (k === 'a' || k === 'arrowleft') return 'left';
  if (k === 'd' || k === 'arrowright') return 'right';
  return null;
}
window.addEventListener('keydown', e => {
  const c = keyControl(e.key); if (c) { keys[c] = true; e.preventDefault(); }
  if ((e.key === 'e' || e.key === 'Enter') && !e.repeat && entered && !sheetOpen) actionQueued = true;
  if (e.key === 'Escape' && sheetOpen) closeSheet(e);
});
window.addEventListener('keyup', e => { const c = keyControl(e.key); if (c) keys[c] = false; });

function stickUpdate(e) {
  const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const max = r.width * .33, len = Math.hypot(dx, dy) || 1, scale = len > max ? max / len : 1;
  dx *= scale; dy *= scale; stickX = dx / max; stickY = dy / max; stickKnob.style.transform = `translate(${dx}px,${dy}px)`;
}
stick.addEventListener('pointerdown', e => { e.preventDefault(); stickPointer = e.pointerId; stick.setPointerCapture(e.pointerId); stickUpdate(e); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickPointer) stickUpdate(e); });
function stickRelease(e) { if (e.pointerId !== stickPointer) return; stickPointer = null; stickX = stickY = 0; stickKnob.style.transform = 'translate(0,0)'; try { stick.releasePointerCapture(e.pointerId); } catch {} }
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(ev, stickRelease);

actionBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (entered && !sheetOpen) actionQueued = true; });
actionBtn.addEventListener('click', e => { e.preventDefault(); if (entered && !sheetOpen) actionQueued = true; });

function gamepadInput() {
  const pads = navigator.getGamepads?.() || []; const pad = [...pads].find(Boolean); if (!pad) return { move: 0, turn: 0, action: false };
  const dead = .17, x = Math.abs(pad.axes[0] || 0) > dead ? pad.axes[0] : 0, y = Math.abs(pad.axes[1] || 0) > dead ? pad.axes[1] : 0;
  return { move: -y, turn: x, action: !!pad.buttons[0]?.pressed };
}
let gamepadActionHeld = false;
function readInput() {
  const pad = gamepadInput();
  const km = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0), kt = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const touchMove = -stickY, touchTurn = stickX;
  const move = Math.abs(pad.move) > Math.abs(touchMove) && Math.abs(pad.move) > Math.abs(km) ? pad.move : Math.abs(touchMove) > Math.abs(km) ? touchMove : km;
  const turn = Math.abs(pad.turn) > Math.abs(touchTurn) && Math.abs(pad.turn) > Math.abs(kt) ? pad.turn : Math.abs(touchTurn) > Math.abs(kt) ? touchTurn : kt;
  if (pad.action && !gamepadActionHeld) actionQueued = true; gamepadActionHeld = pad.action;
  return { move, turn };
}

function showToast(message, seconds = 1.8) { toast.textContent = message; toast.hidden = false; toastTimer = seconds; }
function openSheet(game) {
  selectedGame = game; sheetOpen = true; sheet.hidden = false; prompt.hidden = true;
  sheetKicker.textContent = game.playable ? 'PLAYABLE CABINET' : 'CABINET PREVIEW'; sheetTitle.textContent = game.title; sheetCopy.textContent = game.copy;
  playBtn.hidden = false; playBtn.disabled = !game.playable; playBtn.textContent = game.playable ? `PLAY ${game.title}` : 'COMING SOON';
}
function closeSheet(event) { event?.preventDefault?.(); event?.stopPropagation?.(); sheetOpen = false; selectedGame = null; sheet.hidden = true; }

let activationAt = 0;
function activate(el, fn) {
  el.addEventListener('pointerup', e => { activationAt = performance.now(); fn(e); });
  el.addEventListener('click', e => { if (performance.now() - activationAt < 450) return; fn(e); });
}
activate(roomBtn, closeSheet); activate(sheetX, closeSheet);
activate(playBtn, e => {
  e.preventDefault(); e.stopPropagation(); if (!selectedGame?.playable || !selectedGame.url) return;
  const url = selectedGame.url; const opened = window.open(url, '_blank', 'noopener');
  if (opened) { closeSheet(); showToast('RING RIOT OPENED IN A NEW TAB'); }
  else window.location.href = url;
});
activate(enterBtn, e => { e.preventDefault(); intro.hidden = true; entered = true; showToast('WELCOME TO THE ARCADE', 1.2); });
activate(homeBtn, e => { e.preventDefault(); window.location.href = 'https://www.spartaneo.com/'; });
activate(fullBtn, async e => {
  e.preventDefault();
  try { if (!document.fullscreenElement) await frame.requestFullscreen(); else await document.exitFullscreen(); }
  catch { showToast('FULLSCREEN BLOCKED BY THIS BROWSER'); }
});

function nearestCabinet() {
  let best = null, bestD = Infinity;
  for (const cab of cabinets) {
    const dx = player.x - cab.position.x, dz = player.z - cab.position.z, d = Math.hypot(dx, dz);
    if (d < bestD) { bestD = d; best = cab; }
  }
  nearest = bestD < 2.35 ? best : null;
  if (!entered || sheetOpen || !nearest) { prompt.hidden = true; return; }
  prompt.hidden = false; promptKey.textContent = coarse ? 'A' : 'E'; promptTitle.textContent = nearest.userData.game.playable ? `PLAY ${nearest.userData.game.title}` : nearest.userData.game.title;
}

function handleAction() {
  if (!actionQueued) return; actionQueued = false;
  if (nearest) openSheet(nearest.userData.game); else showToast('WALK CLOSER TO A CABINET');
}

function updateCamera(dt, input) {
  if (entered && !sheetOpen) {
    player.yaw -= input.turn * 2.15 * dt;
    const speed = 3.65 * input.move;
    player.x += -Math.sin(player.yaw) * speed * dt; player.z += -Math.cos(player.yaw) * speed * dt;
    player.x = THREE.MathUtils.clamp(player.x, -8.8, 8.8); player.z = THREE.MathUtils.clamp(player.z, -6.7, 6.7);
    if (Math.abs(input.move) > .05) player.bob += dt * 9;
  }
  const bob = entered && !sheetOpen && Math.abs(input.move) > .05 ? Math.sin(player.bob) * .025 : 0;
  camera.position.set(player.x, 1.66 + bob, player.z); camera.rotation.set(0, player.yaw, 0, 'YXZ');
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05), input = readInput();
  updateCamera(dt, input); nearestCabinet(); if (entered && !sheetOpen) handleAction();
  const t = performance.now() * .001; cabinetScreens.forEach((s, i) => { s.mat.emissiveIntensity = s.base + Math.sin(t * 3.2 + i * 1.7) * .12; });
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) toast.hidden = true; }
  renderer.render(scene, camera);
}
updateCamera(0, { move: 0, turn: 0 }); animate();

window.SpartaneoArcade = { build: BUILD, games: GAMES };
