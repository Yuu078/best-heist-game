// main.js — boot and the game loop: it owns the state of one run of
// The Gilded Hour (three floors, one scarab each, a haul that carries
// over), wires the modules together once per frame, and poses the three
// deterministic screenshot scenes (?shot=1|2|3) out of the same state the
// renderer always draws.

import { LEVELS } from './levels.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuard, updateGuard, guardSeesPlayer } from './guard.js';
import { createCamera, updateCamera, cameraSeesPlayer, disableCamera, aimCamera } from './camera.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';

const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

const hud = {
  levelName: document.getElementById('levelName'),
  objective: document.getElementById('objective'),
  score: document.getElementById('score'),
  timer: document.getElementById('timer'),
  coins: document.getElementById('coins'),
  emps: document.getElementById('emps'),
  alarmFill: document.getElementById('alarmFill'),
  banner: document.getElementById('banner'),
  bannerTitle: document.getElementById('bannerTitle'),
  bannerText: document.getElementById('bannerText'),
  bannerKey: document.getElementById('bannerKey'),
};

const EMP_SCORE_COST = 150;
const COIN_FLY_SECONDS = 0.35;
const COIN_RING_SECONDS = 2.4;
const PICKUP_DISTANCE = 27;

/** Everything one floor needs, fresh: people, loot, alarm, tools. */
function setupLevel(index, carriedScore) {
  const level = LEVELS[index];
  return {
    levelIndex: index,
    level,
    player: createPlayer(level),
    guards: level.guards.map(createGuard),
    cameras: level.cameras.map(createCamera),
    alarm: createAlarm(),
    loots: level.loots.map((l) => ({ ...l, taken: false })),
    scarabTaken: false,
    coinsLeft: level.coins,
    empsLeft: level.emps,
    coinFx: null,
    score: carriedScore,
    levelStartScore: carriedScore,
  };
}

let state = setupLevel(0, 0);
let phase = 'ready'; // 'ready' | 'play' | 'caught' | 'clear' | 'win' | 'shot'
let runTime = 0;
let animTime = 0;
let empsUsed = 0;
let chirpT = 0;

function showBanner(title, text, key, caught = false) {
  hud.bannerTitle.textContent = title;
  hud.bannerText.textContent = text;
  hud.bannerKey.textContent = key;
  hud.banner.classList.toggle('caught', caught);
  hud.banner.classList.add('show');
}
function hideBanner() {
  hud.banner.classList.remove('show');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function refreshHud() {
  hud.levelName.textContent = state.level.name;
  hud.objective.textContent = state.scarabTaken
    ? 'The scarab is yours. Get to the van!'
    : state.level.objective;
  hud.score.textContent = String(state.score);
  hud.timer.textContent = formatTime(runTime);
  hud.coins.textContent = String(state.coinsLeft);
  hud.emps.textContent = String(state.empsLeft);
  hud.alarmFill.style.width = `${state.alarm.value}%`;
}

/** Throw a decoy coin toward a clicked point, if the pouch has one. */
function throwCoin(x, y) {
  if (state.coinsLeft <= 0 || state.coinFx) return;
  state.coinsLeft -= 1;
  state.coinFx = {
    mode: 'fly',
    t: 0,
    fromX: state.player.x,
    fromY: state.player.y,
    toX: Math.max(24, Math.min(1256, x)),
    toY: Math.max(24, Math.min(776, y)),
  };
}

function updateCoinFx(dt) {
  const fx = state.coinFx;
  if (!fx) return null;
  if (fx.mode === 'fly') {
    fx.t += dt / COIN_FLY_SECONDS;
    if (fx.t >= 1) {
      fx.mode = 'ring';
      fx.t = COIN_RING_SECONDS;
      audio.coinLand();
    }
    return null;
  }
  fx.t -= dt;
  if (fx.t <= 0) {
    state.coinFx = null;
    return null;
  }
  return { x: fx.toX, y: fx.toY }; // the noise the guards can hear
}

function restartLevel() {
  state = setupLevel(state.levelIndex, state.levelStartScore);
  phase = 'play';
  hideBanner();
}

function fullRestart() {
  state = setupLevel(0, 0);
  runTime = 0;
  empsUsed = 0;
  phase = 'play';
  hideBanner();
}

function advanceLevel() {
  const next = state.levelIndex + 1;
  state = setupLevel(next, state.score);
  phase = 'play';
  hideBanner();
}

function onCaught() {
  phase = 'caught';
  audio.caught();
  showBanner(
    'CAUGHT',
    `The alarm filled in ${state.level.name} and the doors slammed. ` +
      'Your haul resets to what you carried onto this floor.',
    'Press R to try the floor again',
    true,
  );
}

function onReachVan() {
  audio.clear();
  if (state.levelIndex === LEVELS.length - 1) {
    phase = 'win';
    showBanner(
      'THE GILDED HOUR IS YOURS',
      `Three floors, three scarabs, one van. Final haul: ${state.score} in loot, ` +
        `${formatTime(runTime)} on the clock, ${empsUsed} EMP charge${empsUsed === 1 ? '' : 's'} burned.`,
      'Press Enter to play it again',
    );
  } else {
    phase = 'clear';
    showBanner(
      'CLEAN GETAWAY',
      `${state.level.name} is behind you and the scarab is in the van. ` +
        `Haul so far: ${state.score}. The next floor is darker.`,
      'Press Enter or click for the next floor',
    );
  }
}

/** One frame of play: people move, eyes sweep, the alarm keeps score. */
function updatePlay(dt) {
  runTime += dt;
  const wish = input.wish();
  updatePlayer(state.player, state.level, wish, input.sneaking(), dt);

  for (const click of input.takeClicks()) throwCoin(click.x, click.y);
  const noise = updateCoinFx(dt);

  if (input.takeEmp() && state.empsLeft > 0) {
    state.empsLeft -= 1;
    empsUsed += 1;
    state.score = Math.max(0, state.score - EMP_SCORE_COST);
    for (const cam of state.cameras) disableCamera(cam);
    audio.emp();
  }

  for (const guard of state.guards) updateGuard(guard, state.level, dt, noise);
  for (const cam of state.cameras) updateCamera(cam, animTime, dt);

  let byGuard = false;
  let byCamera = false;
  for (const guard of state.guards) {
    guard.seesPlayer = guardSeesPlayer(guard, state.level, state.player);
    byGuard = byGuard || guard.seesPlayer;
  }
  for (const cam of state.cameras) {
    cam.seesPlayer = cameraSeesPlayer(cam, state.level, state.player);
    byCamera = byCamera || cam.seesPlayer;
  }

  if ((byGuard || byCamera) && chirpT <= 0) {
    audio.alarmChirp();
    chirpT = 0.28;
  }
  chirpT = Math.max(0, chirpT - dt);

  if (updateAlarm(state.alarm, dt, { byGuard, byCamera }, state.player.sneaking)) {
    onCaught();
    return;
  }

  // Hands on the prizes.
  for (const loot of state.loots) {
    if (!loot.taken && Math.hypot(loot.x - state.player.x, loot.y - state.player.y) < PICKUP_DISTANCE) {
      loot.taken = true;
      state.score += loot.value;
      audio.pickup();
    }
  }
  if (!state.scarabTaken) {
    const s = state.level.scarab;
    if (Math.hypot(s.x - state.player.x, s.y - state.player.y) < PICKUP_DISTANCE + 2) {
      state.scarabTaken = true;
      state.player.carrying = true;
      audio.scarab();
    }
  }

  // The van only leaves with the scarab aboard.
  const exit = state.level.exit;
  const p = state.player;
  if (state.scarabTaken && p.x > exit.x - 4 && p.x < exit.x + exit.w + 4 && p.y < exit.y + exit.h + 10) {
    onReachVan();
  }
}

/* ------------------------- screenshot scenes ------------------------- */

/** Pose a real game state for a screenshot: same objects, same renderer. */
function poseShot(n) {
  state = setupLevel(0, 0);
  const [g0, g1] = state.guards;
  const cam = state.cameras[0];
  const p = state.player;
  if (n === 1) {
    // Mid-hall, mid-heist: one guard has the thief in his cone, alarm at 55.
    p.x = 640; p.y = 380; p.face = -2.2;
    g0.x = 810; g0.y = 300; g0.face = Math.atan2(380 - 300, 640 - 810); g0.seesPlayer = true;
    g1.x = 215; g1.y = 170; g1.face = 0.5;
    aimCamera(cam, Math.PI / 2 + 0.25);
    state.alarm.value = 55;
  } else if (n === 2) {
    // On the very edge of a cone, sneaking, while the camera sweeps past.
    p.x = 706; p.y = 358; p.face = 0.2; p.sneaking = true;
    g0.x = 520; g0.y = 300; g0.face = 0.05;
    g1.x = 300; g1.y = 470; g1.face = -1.2;
    aimCamera(cam, Math.atan2(358 - 30, 706 - 660));
    state.alarm.value = 30;
  } else {
    // The scarab is on his back, the van is steps away, the alarm at 85.
    p.x = 1078; p.y = 92; p.face = -Math.PI / 2; p.carrying = true;
    state.scarabTaken = true;
    state.loots[0].taken = true;
    state.score = 300;
    g0.x = 770; g0.y = 540; g0.face = 2.9;
    g1.x = 250; g1.y = 300; g1.face = 1.2;
    state.alarm.value = 85;
  }
  phase = 'shot';
  refreshHud();
}

/* ------------------------------ the loop ------------------------------ */

const shotParam = new URLSearchParams(location.search).get('shot');
if (shotParam === '1' || shotParam === '2' || shotParam === '3') {
  poseShot(Number(shotParam));
} else {
  showBanner(
    'THE GILDED HOUR',
    'One thief, three museum floors, one Gilded Scarab on each. Read the patrols, ' +
      'mind the cones, throw coins to pull guards away, and burn an EMP when a camera ' +
      'will not look elsewhere — it costs 150 off your haul. Fill the alarm and it is over.',
    'Press Enter or click to begin',
  );
  refreshHud();
}

let lastNow = performance.now();
let framesRendered = 0;
function frame(now) {
  const dt = Math.min(0.033, (now - lastNow) / 1000);
  lastNow = now;
  animTime += dt;

  if (phase === 'play') {
    if (input.takeRestart()) restartLevel();
    else updatePlay(dt);
  } else if (phase === 'ready' || phase === 'clear' || phase === 'win' || phase === 'caught') {
    input.takeClicks(); // clicks here mean "advance", never a coin
    if (input.takeAdvance() || (phase === 'caught' && input.takeRestart())) {
      if (phase === 'ready') { phase = 'play'; hideBanner(); }
      else if (phase === 'clear') advanceLevel();
      else if (phase === 'win') fullRestart();
      else if (phase === 'caught') restartLevel();
    }
  }

  renderer.render({
    level: state.level,
    player: state.player,
    guards: state.guards,
    cameras: state.cameras,
    alarm: state.alarm,
    loots: state.loots,
    scarabTaken: state.scarabTaken,
    coinFx: state.coinFx,
    time: animTime,
  });
  if (phase !== 'shot') refreshHud();

  framesRendered += 1;
  if (framesRendered === 20) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
