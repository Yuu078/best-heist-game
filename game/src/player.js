// player.js — the thief: a round body that walks, sneaks, and carries the
// scarab. Sneaking is slower but quieter — the alarm module charges less for
// a sneaking thief in plain sight, which is the trade the whole game turns on.

import { slideMove } from './levels.js';

export const WALK_SPEED = 178;
export const SNEAK_SPEED = 86;

export function createPlayer(level) {
  return {
    x: level.playerStart.x,
    y: level.playerStart.y,
    r: 13,
    face: -Math.PI / 2,
    sneaking: false,
    moving: false,
    stepPhase: 0,
    carrying: false,
  };
}

/**
 * Advance the thief one step. `wish` is the input module's unit direction
 * ({ x, y }, either possibly 0); facing follows the last real movement.
 */
export function updatePlayer(player, level, wish, sneaking, dt) {
  player.sneaking = sneaking;
  const speed = sneaking ? SNEAK_SPEED : WALK_SPEED;
  player.moving = wish.x !== 0 || wish.y !== 0;
  if (player.moving) {
    slideMove(level, player, wish.x * speed * dt, wish.y * speed * dt);
    player.face = Math.atan2(wish.y, wish.x);
    player.stepPhase += dt * (sneaking ? 7 : 11);
  }
}
