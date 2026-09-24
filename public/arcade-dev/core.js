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

const INTERNAL_W = 480;
const INTERNAL_H = 270;
const MOVE_SPEED = 3.4;
const TURN_SPEED = 2.35;
const CAMERA_DISTANCE = 5.8;
const CAMERA_HEIGHT = 3.1;
const INTERACT_DISTANCE = 2.2;

let paused = true;
let soundEnabled = true;
let nearestCabinet = null;
let lastInputMode = 'KEYBOARD';
let toastTimer = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07100b);
scene.fog = new THREE.FogExp2(0x07100b, 0.055);

const camera = new THREE.PerspectiveCamera(60, INTERNAL_W / INTERNAL_H, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(INTERNAL_W, INTERNAL_H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', 'Spartaneo Arcade development room');
frame.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9dffc2, 0x07100b, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(5, 9, 4);
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0x14241a, flatShading: true })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(24, 24, 0x2d6f43, 0x173421);
grid.position.y = 0.01;
scene.add(grid);

function wall(size, position, color = 0x0b160f) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  mesh.position.set(...position);
  scene.add(mesh);
  return mesh;
}

wall([24, 4, 0.45], [0, 2, -10.8]);
wall([0.45, 4, 22], [-11.8, 2, 0]);
wall([0.45, 4, 22], [11.8, 2, 0]);

const player = new THREE.Group();
player.name = 'DEV AVATAR';
const bodyMat = new THREE.MeshLambertMaterial({ color: 0x26c96c, flatShading: true });
const skinMat = new THREE.MeshLambertMaterial({ color: 0xe7aa67, flatShading: true });
const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.15, 0.48), bodyMat);
body.position.y = 0.95;
const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.58), skinMat);
head.position.y = 1.82;
player.add(body, head);
player.position.set(0, 0, 3.7);
scene.add(player);

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#001807';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#48ff87';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(2.6, 0.65, 1);
  return sprite;
}

const devLabel = makeLabel('DEV AVATAR');
devLabel.position.set(0, 2.55, 0);
player.add(devLabel);

function makeCabinet(game) {
  const group = new THREE.Group();
  group.userData.game = game;
  group.position.set(...game.position);

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 2.5, 1.25),
    new THREE.MeshLambertMaterial({ color: 0x151515, flatShading: true })
  );
  shell.position.y = 1.25;
  group.add(shell);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 0.72),
    new THREE.MeshBasicMaterial({ color: game.color })
  );
  screen.position.set(0, 1.65, 0.631);
  group.add(screen);

  const marquee = makeLabel(game.title);
  marquee.scale.set(1.55, 0.4, 1);
  marquee.position.set(0, 2.77, 0.02);
  group.add(marquee);

  const led = new THREE.PointLight(game.color, 1.3, 4, 2);
  led.position.set(0, 1.7, 1.1);
  group.add(led);

  scene.add(group);
  return group;
}

const cabinets = GAMES.map(makeCabinet);

const controls = {
  forward: false,
  back: false,
  left: false,
  right: false,
  interactQueued: false
};

function setInputMode(mode) {
  if (lastInputMode === mode) return;
  lastInputMode = mode;
  inputStatus.textContent = `INPUT: ${mode}`;
}

function keyToControl(key) {
  const k = key.toLowerCase();
  if (k === 'w' || k === 'arrowup') return 'forward';
  if (k === 's' || k === 'arrowdown') return 'back';
  if (k === 'a' || k === 'arrowleft') return 'left';
  if (k === 'd' || k === 'arrowright') return 'right';
  return null;
}

window.addEventListener('keydown', (event) => {
  const control = keyToControl(event.key);
  if (control) {
    controls[control] = true;
    setInputMode('KEYBOARD');
    event.preventDefault();
  }
  if ((event.key === 'e' || event.key === 'Enter') && !event.repeat) {
    controls.interactQueued = true;
    setInputMode('KEYBOARD');
  }
  if (event.key === 'Escape') togglePause();
});

window.addEventListener('keyup', (event) => {
  const control = keyToControl(event.key);
  if (control) controls[control] = false;
});

function bindTouch(id, control) {
  const el = document.getElementById(id);
  const down = (event) => {
    event.preventDefault();
    controls[control] = true;
    setInputMode('TOUCH');
  };
  const up = (event) => {
    event.preventDefault();
    controls[control] = false;
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}

bindTouch('t-up', 'forward');
bindTouch('t-down', 'back');
bindTouch('t-left', 'left');
bindTouch('t-right', 'right');
document.getElementById('t-action').addEventListener('pointerdown', (event) => {
  event.preventDefault();
  controls.interactQueued = true;
  setInputMode('TOUCH');
});

function pollGamepad() {
  const pads = navigator.getGamepads?.() || [];
  const pad = [...pads].find(Boolean);
  if (!pad) return { move: 0, turn: 0, interact: false };

  const dead = 0.18;
  const x = Math.abs(pad.axes[0] || 0) > dead ? pad.axes[0] : 0;
  const y = Math.abs(pad.axes[1] || 0) > dead ? pad.axes[1] : 0;
  const active = Math.abs(x) > 0 || Math.abs(y) > 0 || pad.buttons.some((b) => b.pressed);
  if (active) setInputMode('GAMEPAD');

  return {
    move: -y,
    turn: -x,
    interact: !!pad.buttons[0]?.pressed
  };
}

let gamepadInteractHeld = false;
function readInput() {
  const pad = pollGamepad();
  const keyboardMove = (controls.forward ? 1 : 0) - (controls.back ? 1 : 0);
  const keyboardTurn = (controls.left ? 1 : 0) - (controls.right ? 1 : 0);
  const move = Math.abs(pad.move) > Math.abs(keyboardMove) ? pad.move : keyboardMove;
  const turn = Math.abs(pad.turn) > Math.abs(keyboardTurn) ? pad.turn : keyboardTurn;

  if (pad.interact && !gamepadInteractHeld) controls.interactQueued = true;
  gamepadInteractHeld = pad.interact;
  return { move, turn };
}

function showToast(message, seconds = 2.4) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastTimer = seconds;
}

function failAsset(url, error) {
  console.error('ASSET LOAD FAILED', url, error);
  fatalCopy.textContent = `Could not load required asset: ${url}`;
  fatalPanel.hidden = false;
  paused = true;
  pauseBtn.textContent = 'RESUME';
}

export function loadRequiredGLB(url, { parent = scene, position = [0, 0, 0], scale = 1 } = {}) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        root.position.set(...position);
        root.scale.setScalar(scale);
        parent.add(root);
        resolve(root);
      },
      undefined,
      (error) => {
        failAsset(url, error);
        reject(error);
      }
    );
  });
}

function updateNearestCabinet() {
  let best = null;
  let bestDistance = Infinity;
  for (const cabinet of cabinets) {
    const distance = player.position.distanceTo(cabinet.position);
    if (distance < bestDistance) {
      best = cabinet;
      bestDistance = distance;
    }
  }
  nearestCabinet = bestDistance <= INTERACT_DISTANCE ? best : null;
  promptEl.hidden = !nearestCabinet;
  if (nearestCabinet) {
    const verb = lastInputMode === 'GAMEPAD' || lastInputMode === 'TOUCH' ? 'A' : 'E / ENTER';
    promptEl.textContent = `${verb} — ${nearestCabinet.userData.game.title}`;
  }
}

function openCabinet(cabinet) {
  if (!cabinet) return;
  const game = cabinet.userData.game;
  cabinetTitle.textContent = `${game.title} · ${game.status}`;
  cabinetCopy.textContent = game.copy;
  cabinetPanel.hidden = false;
  paused = true;
  pauseBtn.textContent = 'RESUME';
}

function handleInteraction() {
  if (!controls.interactQueued) return;
  controls.interactQueued = false;
  if (nearestCabinet) openCabinet(nearestCabinet);
  else showToast('Nothing to interact with here.');
}

function clampPlayer() {
  player.position.x = THREE.MathUtils.clamp(player.position.x, -10.4, 10.4);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -9.6, 9.6);
}

const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const followOffset = new THREE.Vector3();
function updateCamera(delta) {
  followOffset.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  desiredCamera.copy(player.position).add(followOffset);
  const smoothing = 1 - Math.pow(0.001, delta);
  camera.position.lerp(desiredCamera, smoothing);
  cameraTarget.set(player.position.x, player.position.y + 1.15, player.position.z);
  camera.lookAt(cameraTarget);
}

function togglePause(force) {
  paused = typeof force === 'boolean' ? force : !paused;
  pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
  showToast(paused ? 'PAUSED' : 'RESUMED', 1.0);
}

pauseBtn.addEventListener('click', () => togglePause());
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  showToast(soundEnabled ? 'SOUND ENABLED' : 'SOUND MUTED', 1.2);
});
fullscreenBtn.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await frame.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    showToast('Fullscreen is not available in this browser.');
  }
});

document.getElementById('enter-btn').addEventListener('click', () => {
  introPanel.hidden = true;
  togglePause(false);
});
document.getElementById('cabinet-close').addEventListener('click', () => {
  cabinetPanel.hidden = true;
  togglePause(false);
});
document.getElementById('fatal-close').addEventListener('click', () => {
  fatalPanel.hidden = true;
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (!paused) {
    const input = readInput();
    player.rotation.y += input.turn * TURN_SPEED * delta;
    if (Math.abs(input.move) > 0.001) player.translateZ(-input.move * MOVE_SPEED * delta);
    clampPlayer();
    updateNearestCabinet();
    handleInteraction();
  }

  updateCamera(delta);
  if (toastTimer > 0) {
    toastTimer -= delta;
    if (toastTimer <= 0) toastEl.hidden = true;
  }

  renderer.render(scene, camera);
}

camera.position.set(0, CAMERA_HEIGHT, player.position.z + CAMERA_DISTANCE);
updateCamera(1);
animate();

window.SpartaneoArcade = {
  version: '0.1.0-dev',
  loadRequiredGLB,
  games: GAMES,
  pause: () => togglePause(true),
  resume: () => togglePause(false)
};
