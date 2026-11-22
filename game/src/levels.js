// levels.js — the three museum floors of The Gilded Hour, as data, plus the
// world-geometry questions every other module asks about them: does a circle
// hit a wall here, can a body slide along walls, is the line between two
// points clear of the tall walls that block sight.
//
// A wall is { x, y, w, h, vision }: `vision: false` marks low display cases
// and plinths — they stop feet, never eyes. Every divider wall is built from
// segments so the gaps between them are the doors and vents: each room has
// more than one way in.

const tall = (x, y, w, h) => ({ x, y, w, h, vision: true });
const low = (x, y, w, h) => ({ x, y, w, h, vision: false });

export const LEVELS = [
  {
    name: 'The Scarab Hall',
    objective: 'Take the Gilded Scarab, then reach the van.',
    playerStart: { x: 90, y: 700 },
    exit: { x: 1040, y: 0, w: 76, h: 56 },
    scarab: { x: 1070, y: 560 },
    coins: 3,
    emps: 1,
    walls: [
      // Border, with a gap in the top wall for the getaway corridor.
      tall(0, 0, 1030, 20), tall(1130, 0, 150, 20),
      tall(0, 780, 1280, 20), tall(0, 0, 20, 800), tall(1260, 0, 20, 800),
      // Left gallery divider: two doors and a low vent gap.
      tall(420, 20, 20, 170), tall(420, 250, 20, 190), tall(420, 500, 20, 100),
      // Floor divider: a door and a vent between gallery, hall and stores.
      tall(20, 600, 240, 20), tall(330, 600, 300, 20), tall(690, 600, 190, 20),
      // The vault, bottom right: one door, one vent in its top wall.
      tall(880, 280, 20, 190), tall(880, 530, 20, 250),
      tall(880, 280, 140, 20), tall(1080, 280, 180, 20),
      // Marble pillars in the great hall — cover to break a guard's gaze.
      tall(566, 170, 34, 34), tall(716, 170, 34, 34),
      tall(566, 400, 34, 34), tall(716, 400, 34, 34),
      // Display cases: they block the thief, not a watching eye.
      low(140, 290, 110, 30), low(600, 290, 120, 30),
      low(180, 690, 110, 30), low(1010, 640, 120, 30),
    ],
    carpets: [
      { x: 452, y: 40, w: 396, h: 540 },
      { x: 902, y: 302, w: 336, h: 456 },
    ],
    loots: [
      { x: 195, y: 305, name: 'Jeweled Mask', value: 300 },
      { x: 660, y: 305, name: 'Golden Lyre', value: 250 },
      { x: 235, y: 705, name: 'Silver Chalice', value: 200 },
      { x: 1070, y: 655, name: 'Ivory Dice', value: 150 },
    ],
    guards: [
      { path: [[520, 110], [800, 110], [800, 520], [520, 520]], speed: 62 },
      { path: [[130, 110], [330, 110], [330, 500], [130, 500]], speed: 55 },
    ],
    cameras: [
      { x: 660, y: 30, base: Math.PI / 2, sweep: 0.85, range: 300, speed: 0.5 },
    ],
  },
  {
    name: 'The Vault Gallery',
    objective: 'The scarab sits deep in the south vault. Mind the crossfire.',
    playerStart: { x: 90, y: 720 },
    exit: { x: 196, y: 0, w: 64, h: 56 },
    scarab: { x: 1090, y: 600 },
    coins: 3,
    emps: 2,
    walls: [
      tall(0, 0, 190, 20), tall(270, 0, 1010, 20),
      tall(0, 780, 1280, 20), tall(0, 0, 20, 800), tall(1260, 0, 20, 800),
      // The long middle wall: two doors and a vent.
      tall(20, 390, 300, 20), tall(390, 390, 330, 20),
      tall(780, 390, 220, 20), tall(1070, 390, 190, 20),
      // North band divider.
      tall(640, 20, 20, 140), tall(640, 220, 20, 170),
      // South band dividers, their gaps staggered against the north ones.
      tall(420, 410, 20, 150), tall(420, 620, 20, 160),
      tall(900, 410, 20, 170), tall(900, 640, 20, 140),
      tall(300, 180, 34, 34), tall(950, 180, 34, 34),
      tall(250, 560, 34, 34), tall(700, 600, 34, 34),
      low(180, 200, 110, 30), low(820, 200, 110, 30),
      low(180, 690, 110, 30), low(620, 480, 120, 30), low(1050, 690, 110, 30),
    ],
    carpets: [
      { x: 40, y: 40, w: 580, h: 330 },
      { x: 940, y: 430, w: 300, h: 330 },
    ],
    loots: [
      { x: 235, y: 215, name: 'Moon Pearl', value: 350 },
      { x: 875, y: 215, name: 'Bronze Astrolabe', value: 250 },
      { x: 235, y: 705, name: 'Silk Tapestry', value: 200 },
      { x: 680, y: 495, name: 'Caged Songbird', value: 300 },
      { x: 1105, y: 705, name: 'Ruby Brooch', value: 220 },
    ],
    guards: [
      { path: [[120, 110], [560, 110], [560, 320], [120, 320]], speed: 70 },
      { path: [[740, 110], [1180, 110], [1180, 320], [740, 320]], speed: 64 },
      { path: [[110, 590], [1190, 590]], speed: 66 },
    ],
    cameras: [
      { x: 340, y: 416, base: Math.PI / 2, sweep: 0.8, range: 280, speed: 0.55 },
      { x: 1090, y: 30, base: Math.PI / 2, sweep: 0.9, range: 300, speed: 0.45 },
    ],
  },
  {
    name: 'The Crown Rotunda',
    objective: 'The scarab waits at the very centre. So does everyone else.',
    playerStart: { x: 640, y: 730 },
    exit: { x: 604, y: 0, w: 72, h: 56 },
    scarab: { x: 640, y: 400 },
    coins: 4,
    emps: 2,
    walls: [
      tall(0, 0, 590, 20), tall(690, 0, 590, 20),
      tall(0, 780, 1280, 20), tall(0, 0, 20, 800), tall(1260, 0, 20, 800),
      // The scarab chamber: a walled square with a door on every side.
      tall(520, 280, 90, 16), tall(670, 280, 90, 16),
      tall(520, 504, 90, 16), tall(670, 504, 90, 16),
      tall(520, 296, 16, 74), tall(520, 430, 16, 74),
      tall(744, 296, 16, 74), tall(744, 430, 16, 74),
      // The wings.
      tall(300, 20, 20, 360), tall(300, 440, 20, 340),
      tall(960, 20, 20, 360), tall(960, 440, 20, 340),
      tall(300, 640, 260, 20), tall(640, 640, 320, 20),
      // The pillar ring around the chamber.
      tall(430, 290, 34, 34), tall(816, 290, 34, 34),
      tall(430, 476, 34, 34), tall(816, 476, 34, 34),
      tall(300, 383, 34, 34), tall(946, 383, 34, 34),
      low(150, 385, 110, 30), low(1020, 385, 110, 30),
      low(420, 690, 110, 30), low(750, 690, 110, 30),
    ],
    carpets: [
      { x: 452, y: 232, w: 376, h: 336 },
      { x: 40, y: 40, w: 240, h: 720 },
      { x: 1000, y: 40, w: 240, h: 720 },
    ],
    loots: [
      { x: 205, y: 400, name: 'Sun Dial', value: 300 },
      { x: 1075, y: 400, name: 'Moon Dial', value: 300 },
      { x: 475, y: 705, name: 'Jeweled Astrolabe', value: 350 },
      { x: 805, y: 705, name: 'Onyx Panther', value: 350 },
      { x: 640, y: 120, name: 'Crown of Hours', value: 500 },
    ],
    guards: [
      { path: [[470, 240], [810, 240], [810, 560], [470, 560]], speed: 68 },
      { path: [[110, 120], [250, 120], [250, 700], [110, 700]], speed: 58 },
      { path: [[1010, 120], [1190, 120], [1190, 700], [1010, 700]], speed: 58 },
    ],
    cameras: [
      { x: 640, y: 150, base: Math.PI / 2, sweep: 1.0, range: 320, speed: 0.5 },
      { x: 30, y: 400, base: 0, sweep: 0.7, range: 280, speed: 0.6 },
      { x: 1250, y: 400, base: Math.PI, sweep: 0.7, range: 280, speed: 0.5 },
    ],
  },
];

/** Does a circle at (x, y) with radius r overlap any wall of the level? */
export function circleHitsWalls(level, x, y, r) {
  for (const w of level.walls) {
    const nearX = Math.max(w.x, Math.min(x, w.x + w.w));
    const nearY = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - nearX;
    const dy = y - nearY;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/**
 * Move a round body by (dx, dy), sliding along whatever it strikes: each axis
 * is tried on its own, so a body pressed against a wall still glides past a
 * doorway instead of sticking to the corner.
 */
export function slideMove(level, body, dx, dy) {
  if (!circleHitsWalls(level, body.x + dx, body.y, body.r)) body.x += dx;
  if (!circleHitsWalls(level, body.x, body.y + dy, body.r)) body.y += dy;
}

/** One segment against one rectangle: does the segment cross or touch it? */
function segmentCrossesRect(x1, y1, x2, y2, w) {
  if (x1 >= w.x && x1 <= w.x + w.w && y1 >= w.y && y1 <= w.y + w.h) return true;
  if (x2 >= w.x && x2 <= w.x + w.w && y2 >= w.y && y2 <= w.y + w.h) return true;
  const edges = [
    [w.x, w.y, w.x + w.w, w.y],
    [w.x + w.w, w.y, w.x + w.w, w.y + w.h],
    [w.x + w.w, w.y + w.h, w.x, w.y + w.h],
    [w.x, w.y + w.h, w.x, w.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
    if (d === 0) continue;
    const t = ((ax - x1) * (by - ay) - (ay - y1) * (bx - ax)) / d;
    const u = ((ax - x1) * (y2 - y1) - (ay - y1) * (x2 - x1)) / d;
    if (t > 0.001 && t < 0.999 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** Is the straight line between two points free of every sight-blocking wall? */
export function hasLineOfSight(level, x1, y1, x2, y2) {
  for (const w of level.walls) {
    if (w.vision && segmentCrossesRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

/** Shortest signed turn from angle a to angle b, in (-PI, PI]. */
export function angleDelta(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
