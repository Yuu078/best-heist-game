// input.js — keyboard and mouse, translated into the game's vocabulary:
// a wish direction, a sneak flag, and three little queues (coin clicks, EMP
// presses, restarts) that the main loop empties once per frame.

const KEYMAP = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
};

export function createInput(canvas) {
  const keys = new Set();
  const clicks = [];
  let empQueued = false;
  let restartQueued = false;
  let advanceQueued = false;

  addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.code === 'KeyE') empQueued = true;
    if (e.code === 'KeyR') restartQueued = true;
    if (e.code === 'Enter' || e.code === 'Space') advanceQueued = true;
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    clicks.push({
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    });
    advanceQueued = true;
  });

  const held = (codes) => codes.some((c) => keys.has(c));

  return {
    /** The direction the player is asking for, normalised (or still). */
    wish() {
      const x = (held(KEYMAP.right) ? 1 : 0) - (held(KEYMAP.left) ? 1 : 0);
      const y = (held(KEYMAP.down) ? 1 : 0) - (held(KEYMAP.up) ? 1 : 0);
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    /** Every canvas click since the last call, in canvas coordinates. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    takeEmp() { const v = empQueued; empQueued = false; return v; },
    takeRestart() { const v = restartQueued; restartQueued = false; return v; },
    takeAdvance() { const v = advanceQueued; advanceQueued = false; return v; },
  };
}
