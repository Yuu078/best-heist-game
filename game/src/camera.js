// camera.js — the security cameras: a fixed mount, a sweeping cone, and a
// red eye. An EMP charge kills every camera on the floor for eight seconds,
// which is long enough to cross one room and no more.

import { hasLineOfSight, angleDelta } from './levels.js';

export const CAMERA_VIEW_HALF_ANGLE = 0.42;
export const EMP_DISABLE_SECONDS = 8;

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    range: def.range,
    speed: def.speed,
    phase: def.x * 0.37 + def.y * 0.11, // desynchronised sweeps, no randomness
    angle: def.base,
    disabledT: 0,
    seesPlayer: false,
  };
}

/** Sweep with the floor clock; count down any EMP blackout. */
export function updateCamera(camera, time, dt) {
  camera.angle = camera.base + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
  if (camera.disabledT > 0) camera.disabledT = Math.max(0, camera.disabledT - dt);
}

/** Pin a camera to one angle — the screenshot scenes use this. */
export function aimCamera(camera, angle) {
  camera.base = angle;
  camera.sweep = 0;
  camera.angle = angle;
}

/** The EMP goes off: this camera goes dark. */
export function disableCamera(camera) {
  camera.disabledT = EMP_DISABLE_SECONDS;
  camera.seesPlayer = false;
}

/** Can this camera see the thief: alive, in range, in cone, line clear? */
export function cameraSeesPlayer(camera, level, player) {
  if (camera.disabledT > 0) return false;
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  if (Math.hypot(dx, dy) > camera.range) return false;
  const toward = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(camera.angle, toward)) > CAMERA_VIEW_HALF_ANGLE) return false;
  return hasLineOfSight(level, camera.x, camera.y, player.x, player.y);
}
