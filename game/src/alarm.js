// alarm.js — the museum's temper, one number from 0 to 100. Being seen fills
// it: a guard's gaze fills it in about eight tenths of a second, a camera's
// a little slower, and a sneaking thief is charged at under half rate —
// breaking line of sight is always the better bargain. Unseen, it drains.
// Full means caught, and caught is final: no grace period at the top.

export const ALARM_MAX = 100;
const GUARD_EXPOSURE_PER_SECOND = 128;
const CAMERA_EXPOSURE_PER_SECOND = 92;
const SNEAK_EXPOSURE_FACTOR = 0.45;
const DRAIN_PER_SECOND = 24;

export function createAlarm() {
  return { value: 0, caught: false, exposed: false };
}

/**
 * Advance the alarm. `seen` says who is looking at the thief this frame:
 * { byGuard, byCamera }. A sneaking thief still fills the meter, just
 * slowly enough to cross the edge of a cone and live.
 */
export function updateAlarm(alarm, dt, seen, sneaking) {
  alarm.exposed = seen.byGuard || seen.byCamera;
  if (alarm.exposed) {
    let rate = 0;
    if (seen.byGuard) rate += GUARD_EXPOSURE_PER_SECOND;
    if (seen.byCamera) rate += CAMERA_EXPOSURE_PER_SECOND;
    if (sneaking) rate *= SNEAK_EXPOSURE_FACTOR;
    alarm.value += rate * dt;
  } else {
    alarm.value -= DRAIN_PER_SECOND * dt;
  }
  alarm.value = Math.max(0, Math.min(ALARM_MAX, alarm.value));
  if (alarm.value >= ALARM_MAX) alarm.caught = true;
  return alarm.caught;
}
