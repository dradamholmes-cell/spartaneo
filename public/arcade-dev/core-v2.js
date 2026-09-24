import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GAMES } from './games.js';

const frame = document.getElementById('game-frame');
const promptEl = document.getElementById('prompt');
const toastEl = document.getElementById('toast');
const introPanel = document.getElementById('intro-panel');
const cabinetPanel = document.getElementById('cabinet-panel');
const cabinetTitle = document.getElementById('cabinet-title');
const cabinetCopy = document.getElementById('cabinet-copy');
const fatalPanel = document.getElementById('fatal-panel');
const fatalCopy = document.getElementById('fatal-copy');
const inputStatus = document.getElementById('input-status');
const pauseBtn = document.getElementById('pause-btn');
const soundBtn = document.getElementById('sound-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

const INTERNAL_W = 640;
const INTERNAL_H = 360;
const MOVE_SPEED = 3.8;
const TURN_SPEED = 2.55;
const CAMERA_DISTANCE = 4.9;
const CAMERA_HEIGHT = 2.75;
const INTERACT_DISTANCE = 2.45;

let paused = true;
let soundEnabled = true;
let nearestCabinet = null;
let lastInputMode = matchMedia('(pointer: coarse)').matches ? 'TOUCH' : 'KEYBOARD';
let toastTimer = 0;
let walkPhase = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050506);
scene.fog = new THREE.Fog(0x050506, 8.5, 23);

const camera = new THREE.PerspectiveCamera(58, INTERNAL_W / INTERNAL_H, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(INTERNAL_W, INTERNAL_H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.setAttribute('aria-label', 'Spartaneo Arcade development room');
frame.prepend(renderer.domElement);

const COLORS = {
  green: 0x3cff80,
  magenta: 0xff3b78,
  cyan: 0x35d7ff,
  amber: 0xffc14a,
  carpet: 0x15101d,
};

function std(color, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.82, metalness: 0.08, flatShading: true });
}
function basic(color) { return new THREE.MeshBasicMaterial({ color, toneMapped: false }); }
function box(size, position, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
function cylinder(radiusTop, radiusBottom, height, radialSegments, position, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

scene.add(new THREE.HemisphereLight(0xa6d7b8, 0x09050d, 0.75));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(-4, 8, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(COLORS.green, 0.72);
rim.position.set(6, 4, -5);
scene.add(rim);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 22), std(COLORS.carpet));
floor.rotation.x = -Math.PI / 2;
floor.position.z = -0.2;
scene.add(floor);
box([24, 4.9, 0.42], [0, 2.45, -7.2], std(0x100f13));
box([0.42, 4.9, 14.4], [-11.8, 2.45, -0.2], std(0x0d0e10));
box([0.42, 4.9, 14.4], [11.8, 2.45, -0.2], std(0x0d0e10));
box([24, 0.28, 14.4], [0, 4.85, -0.2], std(0x070708));

const carpetGreen = basic(0x1d7b48), carpetPink = basic(0x762349), carpetBlue = basic(0x185873);
for (let z = -6.3; z <= 6.2; z += 1.45) {
  for (let x = -10.8; x <= 10.8; x += 1.65) {
    const pick = Math.abs(Math.floor((x * 7 + z * 5))) % 3;
    const tile = box([0.22, 0.018, 0.05], [x + ((Math.round(z) & 1) ? 0.45 : 0), 0.014, z], [carpetGreen, carpetPink, carpetBlue][pick]);
    tile.rotation.y = ((x + z) % 2) * 0.75;
  }
}

box([3.6, 0.025, 13.2], [0, 0.026, -0.15], std(0x191820));
for (let z = -5.8; z < 6; z += 1.35) box([2.95, 0.017, 0.028], [0, 0.045, z], basic(0x305d43));

for (const z of [-5.6, -2.2, 1.2, 4.6]) {
  box([22.6, 0.16, 0.18], [0, 4.62, z], std(0x191a1c));
  box([7.0, 0.035, 0.07], [-6.4, 4.48, z + 0.02], basic(z % 2 ? COLORS.magenta : COLORS.green));
  box([7.0, 0.035, 0.07], [6.4, 4.48, z + 0.02], basic(z % 2 ? COLORS.cyan : COLORS.green));
}
for (const x of [-10.2, -7.1, 7.1, 10.2]) {
  box([0.52, 4.3, 0.62], [x, 2.15, -6.82], std(0x19171d));
  box([0.18, 3.7, 0.67], [x, 2.25, -6.48], basic(0x173a25));
}

function canvasTexture(text, { width = 512, height = 128, fg = '#fff', bg = '#07100b', border = '#48ff87', font = '900 58px Courier New', sub = '', subColor = '#9dffba' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = border; ctx.lineWidth = Math.max(4, Math.floor(height * 0.045));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
  ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = sub ? 'alphabetic' : 'middle';
  ctx.fillText(text, width / 2, sub ? height * 0.58 : height * 0.52);
  if (sub) { ctx.fillStyle = subColor; ctx.font = '700 24px Courier New'; ctx.fillText(sub, width / 2, height * 0.84); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  return texture;
}
function signPlane(text, { position = [0, 3.5, -6.95], size = [7.2, 1.5], fg = '#dfffea', bg = '#041109', border = '#42ff80', sub = '' } = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ map: canvasTexture(text, { fg, bg, border, sub }), toneMapped: false }));
  mesh.position.set(...position); scene.add(mesh); return mesh;
}

signPlane('SPARTANEO', { position: [0, 3.92, -6.95], size: [7.8, 1.35], sub: 'ARCADE · AFTER HOURS' });
signPlane('OGB COMICS', { position: [-8.7, 3.35, -6.93], size: [2.35, 0.72], fg: '#fff2d5', border: '#ff3b78', bg: '#160712' });
signPlane('STREEPY', { position: [8.7, 3.35, -6.93], size: [2.35, 0.72], fg: '#dff7ff', border: '#35d7ff', bg: '#051018' });

function comicShelf(x) {
  const group = new THREE.Group(); group.position.set(x, 0, 2.3); scene.add(group);
  box([2.7, 0.18, 0.9], [0, 0.5, 0], std(0x262227), group); box([2.7, 0.18, 0.9], [0, 1.55, 0], std(0x262227), group);
  box([0.16, 2.2, 0.9], [-1.28, 1.05, 0], std(0x262227), group); box([0.16, 2.2, 0.9], [1.28, 1.05, 0], std(0x262227), group);
  const colors = [0x3cff80, 0xff3b78, 0x35d7ff, 0xffc14a, 0x895cff];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
    const book = box([0.26, 0.62, 0.12], [-0.9 + i * 0.3, 0.91 + row * 1.02, 0.39], std(colors[(i + row) % colors.length]), group);
    book.rotation.z = ((i % 3) - 1) * 0.035;
  }
}
comicShelf(-8.8); comicShelf(8.8);

const player = new THREE.Group(); player.name = 'TEST BOT'; player.userData.placeholder = true;
const botDark = std(0x101513), botGreen = std(0x173d26, COLORS.green, 0.55), botSkin = std(0xb58a62), botVisor = basic(COLORS.green);
const torso = box([0.66, 0.88, 0.38], [0, 1.28, 0], botDark, player);
box([0.42, 0.18, 0.025], [0, 1.38, -0.205], botGreen, player);
const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.48), botSkin); head.position.set(0, 1.98, 0); player.add(head);
box([0.38, 0.10, 0.025], [0, 2.00, -0.255], botVisor, player);
const leftArm = cylinder(0.10, 0.12, 0.72, 6, [-0.48, 1.28, 0], botDark, player); leftArm.rotation.z = -0.08;
const rightArm = cylinder(0.10, 0.12, 0.72, 6, [0.48, 1.28, 0], botDark, player); rightArm.rotation.z = 0.08;
const leftLeg = box([0.23, 0.72, 0.28], [-0.19, 0.49, 0], botDark, player);
const rightLeg = box([0.23, 0.72, 0.28], [0.19, 0.49, 0], botDark, player);
box([0.27, 0.14, 0.46], [-0.19, 0.08, -0.07], botGreen, player); box([0.27, 0.14, 0.46], [0.19, 0.08, -0.07], botGreen, player);
player.userData.rig = { torso, head, leftArm, rightArm, leftLeg, rightLeg }; player.position.set(0, 0, 3.35); scene.add(player);

function makeCabinet(game) {
  const group = new THREE.Group(); group.userData.game = game; group.position.set(...game.position);
  const shellMat = std(0x15161a), trimMat = std(0x25272b);
  const glowMat = new THREE.MeshStandardMaterial({ color: game.color, emissive: game.color, emissiveIntensity: 1.15, roughness: 0.45, metalness: 0.08, flatShading: true });
  box([1.75, 2.05, 1.55], [0, 1.03, 0], shellMat, group); box([1.82, 1.22, 1.36], [0, 2.46, -0.08], shellMat, group); box([1.88, 0.16, 1.46], [0, 3.1, -0.06], trimMat, group);
  box([1.34, 0.94, 0.12], [0, 2.46, 0.655], trimMat, group); box([1.15, 0.72, 0.035], [0, 2.47, 0.73], glowMat, group);
  const deck = box([1.72, 0.18, 0.62], [0, 1.72, 0.63], trimMat, group); deck.rotation.x = -0.13;
  cylinder(0.055, 0.075, 0.24, 6, [-0.39, 1.88, 0.74], glowMat, group); cylinder(0.10, 0.10, 0.055, 10, [0.34, 1.83, 0.82], std(0xd9d9d9), group); cylinder(0.10, 0.10, 0.055, 10, [0.60, 1.83, 0.82], glowMat, group);
  box([0.10, 2.65, 1.60], [-0.88, 1.54, 0], glowMat, group); box([0.10, 2.65, 1.60], [0.88, 1.54, 0], glowMat, group); box([1.28, 0.36, 0.06], [0, 0.45, 0.79], trimMat, group);
  const border = `#${game.color.toString(16).padStart(6, '0')}`;
  const marquee = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.50), new THREE.MeshBasicMaterial({ map: canvasTexture(game.title, { width: 512, height: 150, fg: '#fff', bg: '#09090b', border, font: '900 54px Courier New', sub: game.subtitle }), toneMapped: false }));
  marquee.position.set(0, 3.18, 0.52); marquee.rotation.x = -0.08; group.add(marquee);
  const led = new THREE.PointLight(game.color, 1.55, 4.5, 2); led.position.set(0, 2.45, 1.25); group.add(led);
  const isPlay = game.status === 'PLAYABLE DEV';
  const status = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.33), new THREE.MeshBasicMaterial({ map: canvasTexture(isPlay ? 'PLAY' : 'COMING SOON', { width: 320, height: 90, fg: isPlay ? '#dfffea' : '#ffe6a2', bg: '#060708', border: isPlay ? '#48ff87' : '#665a35', font: '900 40px Courier New' }), toneMapped: false }));
  status.position.set(0, 0.93, 0.79); group.add(status); scene.add(group); return group;
}
const cabinetPositions = [[-3.15, 0, -4.35], [3.15, 0, -4.35]];
const cabinets = GAMES.map((game, i) => makeCabinet({ ...game, position: cabinetPositions[i] || game.position }));

for (const x of [-5.8, 5.8]) { cylinder(0.34, 0.38, 0.12, 8, [x, 0.56, -0.3], std(0x252229)); cylinder(0.08, 0.08, 0.52, 6, [x, 0.28, -0.3], std(0x333438)); }
for (const [color, x, z] of [[COLORS.magenta, -8.6, -4.8], [COLORS.cyan, 8.6, -4.8], [COLORS.green, 0, 2.8]]) { const light = new THREE.PointLight(color, 0.75, 5.5, 2); light.position.set(x, 2.2, z); scene.add(light); }

const controls = { forward: false, back: false, left: false, right: false, interactQueued: false };
inputStatus.textContent = `INPUT: ${lastInputMode}`;
function setInputMode(mode) { if (lastInputMode === mode) return; lastInputMode = mode; inputStatus.textContent = `INPUT: ${mode}`; }
function keyToControl(key) { const k = key.toLowerCase(); if (k === 'w' || k === 'arrowup') return 'forward'; if (k === 's' || k === 'arrowdown') return 'back'; if (k === 'a' || k === 'arrowleft') return 'left'; if (k === 'd' || k === 'arrowright') return 'right'; return null; }
window.addEventListener('keydown', event => { const control = keyToControl(event.key); if (control) { controls[control] = true; setInputMode('KEYBOARD'); event.preventDefault(); } if ((event.key === 'e' || event.key === 'Enter') && !event.repeat) { controls.interactQueued = true; setInputMode('KEYBOARD'); } if (event.key === 'Escape') togglePause(); });
window.addEventListener('keyup', event => { const control = keyToControl(event.key); if (control) controls[control] = false; });
function bindTouch(id, control) { const el = document.getElementById(id); const down = event => { event.preventDefault(); controls[control] = true; setInputMode('TOUCH'); }; const up = event => { event.preventDefault(); controls[control] = false; }; el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up); }
bindTouch('t-up', 'forward'); bindTouch('t-down', 'back'); bindTouch('t-left', 'left'); bindTouch('t-right', 'right');
document.getElementById('t-action').addEventListener('pointerdown', event => { event.preventDefault(); controls.interactQueued = true; setInputMode('TOUCH'); });
function pollGamepad() { const pads = navigator.getGamepads?.() || []; const pad = [...pads].find(Boolean); if (!pad) return { move: 0, turn: 0, interact: false }; const dead = 0.18, x = Math.abs(pad.axes[0] || 0) > dead ? pad.axes[0] : 0, y = Math.abs(pad.axes[1] || 0) > dead ? pad.axes[1] : 0; if (Math.abs(x) || Math.abs(y) || pad.buttons.some(b => b.pressed)) setInputMode('GAMEPAD'); return { move: -y, turn: -x, interact: !!pad.buttons[0]?.pressed }; }
let gamepadInteractHeld = false;
function readInput() { const pad = pollGamepad(); const km = (controls.forward ? 1 : 0) - (controls.back ? 1 : 0), kt = (controls.left ? 1 : 0) - (controls.right ? 1 : 0); const move = Math.abs(pad.move) > Math.abs(km) ? pad.move : km, turn = Math.abs(pad.turn) > Math.abs(kt) ? pad.turn : kt; if (pad.interact && !gamepadInteractHeld) controls.interactQueued = true; gamepadInteractHeld = pad.interact; return { move, turn }; }
function showToast(message, seconds = 2.4) { toastEl.textContent = message; toastEl.hidden = false; toastTimer = seconds; }
function failAsset(url, error) { console.error('ASSET LOAD FAILED', url, error); fatalCopy.textContent = `Could not load required asset: ${url}`; fatalPanel.hidden = false; paused = true; pauseBtn.textContent = 'RESUME'; }
export function loadRequiredGLB(url, { parent = scene, position = [0, 0, 0], scale = 1 } = {}) { const loader = new GLTFLoader(); return new Promise((resolve, reject) => loader.load(url, gltf => { const root = gltf.scene; root.position.set(...position); root.scale.setScalar(scale); parent.add(root); resolve(root); }, undefined, error => { failAsset(url, error); reject(error); })); }
function updateNearestCabinet() { let best = null, bestDistance = Infinity; for (const cabinet of cabinets) { const distance = player.position.distanceTo(cabinet.position); if (distance < bestDistance) { best = cabinet; bestDistance = distance; } } nearestCabinet = bestDistance <= INTERACT_DISTANCE ? best : null; promptEl.hidden = !nearestCabinet; if (nearestCabinet) promptEl.textContent = `${lastInputMode === 'GAMEPAD' || lastInputMode === 'TOUCH' ? 'A' : 'E / ENTER'} · ${nearestCabinet.userData.game.title}`; }
function openCabinet(cabinet) { if (!cabinet) return; const game = cabinet.userData.game; cabinetTitle.textContent = game.title; cabinetCopy.textContent = game.copy; cabinetPanel.hidden = false; paused = true; pauseBtn.textContent = 'RESUME'; }
function handleInteraction() { if (!controls.interactQueued) return; controls.interactQueued = false; if (nearestCabinet) openCabinet(nearestCabinet); else showToast('Walk closer to a cabinet.'); }
function clampPlayer() { player.position.x = THREE.MathUtils.clamp(player.position.x, -10.2, 10.2); player.position.z = THREE.MathUtils.clamp(player.position.z, -6.25, 6.0); }
const cameraTarget = new THREE.Vector3(), desiredCamera = new THREE.Vector3(), followOffset = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
function updateCamera(delta) { followOffset.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE).applyAxisAngle(yAxis, player.rotation.y); desiredCamera.copy(player.position).add(followOffset); camera.position.lerp(desiredCamera, 1 - Math.pow(0.001, delta)); cameraTarget.set(player.position.x, player.position.y + 1.25, player.position.z); camera.lookAt(cameraTarget); }
function animateBot(input, delta) { const moving = Math.abs(input.move) > 0.08; if (moving) walkPhase += delta * 10; const swing = moving ? Math.sin(walkPhase) * 0.32 : 0, bob = moving ? Math.abs(Math.sin(walkPhase * 2)) * 0.035 : 0, rig = player.userData.rig; rig.leftArm.rotation.x = swing; rig.rightArm.rotation.x = -swing; rig.leftLeg.rotation.x = -swing * 0.7; rig.rightLeg.rotation.x = swing * 0.7; rig.torso.position.y = 1.28 + bob; rig.head.position.y = 1.98 + bob; }
function togglePause(force) { paused = typeof force === 'boolean' ? force : !paused; pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE'; showToast(paused ? 'PAUSED' : 'BACK IN THE ARCADE', 1.0); }
pauseBtn.addEventListener('click', () => togglePause());
soundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; soundBtn.textContent = soundEnabled ? 'SOUND' : 'MUTED'; showToast(soundEnabled ? 'SOUND ON' : 'SOUND MUTED', 1.2); });
fullscreenBtn.addEventListener('click', async () => { try { if (!document.fullscreenElement) await frame.requestFullscreen(); else await document.exitFullscreen(); } catch { showToast('Fullscreen was blocked by this browser.'); } });
document.getElementById('enter-btn').addEventListener('click', () => { introPanel.hidden = true; togglePause(false); if (matchMedia('(pointer: coarse)').matches) showToast('TIP: FULLSCREEN LOOKS WAY BETTER ON PHONE', 3.2); });
document.getElementById('cabinet-close').addEventListener('click', () => { cabinetPanel.hidden = true; togglePause(false); });
document.getElementById('fatal-close').addEventListener('click', () => { fatalPanel.hidden = true; });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  let input = { move: 0, turn: 0 };
  if (!paused) { input = readInput(); player.rotation.y += input.turn * TURN_SPEED * delta; if (Math.abs(input.move) > 0.001) player.translateZ(-input.move * MOVE_SPEED * delta); clampPlayer(); updateNearestCabinet(); handleInteraction(); }
  animateBot(input, delta); updateCamera(delta);
  if (toastTimer > 0) { toastTimer -= delta; if (toastTimer <= 0) toastEl.hidden = true; }
  renderer.render(scene, camera);
}
camera.position.set(0, CAMERA_HEIGHT, player.position.z + CAMERA_DISTANCE); updateCamera(1); animate();
window.SpartaneoArcade = { version: '0.2.0-dev', loadRequiredGLB, games: GAMES, pause: () => togglePause(true), resume: () => togglePause(false) };