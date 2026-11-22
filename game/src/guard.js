// guard.js — museum guards: waypoint patrols with pauses to scan, a vision
// cone each, and ears. A decoy coin's ring pulls a patrolling guard off his
// loop to investigate; a guard who can see the thief tells the alarm module
// so by returning true from guardSeesPlayer.

import { slideMove, hasLineOfSight, angleDelta } from './levels.js';

export const GUARD_VIEW_RANGE = 218;
export const GUARD_VIEW_HALF_ANGLE = 0.56;
const NOISE_HEARING_RADIUS = 205;
const WAYPOINT_PAUSE_SECONDS = 0.8;
const INVESTIGATE_LOOK_SECONDS = 2.2;

export function createGuard(def) {
  const [sx, sy] = def.path[0];
  const [nx, ny] = def.path[1] ?? def.path[0];
  return {
    x: sx,
    y: sy,
    r: 14,
    path: def.path,
    speed: def.speed,
    waypoint: 1,
    face: Math.atan2(ny - sy, nx - sx),
    state: 'patrol', // 'patrol' | 'investigate' | 'return'
    pauseT: 0,
    lookT: 0,
    scanBase: 0,
    target: null,
    seesPlayer: false,
  };
}

/** Walk toward a point; returns true on arrival. Facing follows the walk. */
function walkToward(guard, level, tx, ty, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(dist, guard.speed * dt);
  slideMove(level, guard, (dx / dist) * step, (dy / dist) * step);
  const want = Math.atan2(dy, dx);
  guard.face += angleDelta(guard.face, want) * Math.min(1, dt * 8);
  return dist <= step + 4;
}

/** The nearest patrol waypoint, where a finished investigation rejoins. */
function nearestWaypoint(guard) {
  let best = 0;
  let bestDist = Infinity;
  guard.path.forEach(([x, y], i) => {
    const d = (x - guard.x) ** 2 + (y - guard.y) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

export function updateGuard(guard, level, dt, noise) {
  // A ringing coin is the loudest thing in the building: drop the patrol.
  if (noise && guard.state === 'patrol' && guard.pauseT <= 0) {
    const d = Math.hypot(noise.x - guard.x, noise.y - guard.y);
    if (d < NOISE_HEARING_RADIUS) {
      guard.state = 'investigate';
      guard.target = { x: noise.x, y: noise.y };
      guard.lookT = INVESTIGATE_LOOK_SECONDS;
    }
  }

  if (guard.state === 'investigate') {
    if (walkToward(guard, level, guard.target.x, guard.target.y, dt)) {
      guard.lookT -= dt;
      guard.face += dt * 1.7; // turning on the spot, looking for the source
      if (guard.lookT <= 0) {
        guard.state = 'return';
        guard.waypoint = nearestWaypoint(guard);
      }
    }
    return;
  }

  if (guard.state === 'return') {
    const [tx, ty] = guard.path[guard.waypoint];
    if (walkToward(guard, level, tx, ty, dt)) guard.state = 'patrol';
    return;
  }

  // Patrol: pause and scan at each waypoint, then walk the loop.
  if (guard.pauseT > 0) {
    guard.pauseT -= dt;
    guard.face = guard.scanBase + Math.sin(guard.pauseT * 2.4) * 0.6;
    return;
  }
  const [tx, ty] = guard.path[guard.waypoint];
  if (walkToward(guard, level, tx, ty, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pauseT = WAYPOINT_PAUSE_SECONDS;
    guard.scanBase = guard.face;
  }
}

/** Can this guard see the thief right now: in range, in cone, line clear? */
export function guardSeesPlayer(guard, level, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VIEW_RANGE) return false;
  const toward = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(guard.face, toward)) > GUARD_VIEW_HALF_ANGLE) return false;
  return hasLineOfSight(level, guard.x, guard.y, player.x, player.y);
}
