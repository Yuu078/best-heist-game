// render.js — the museum at night, drawn fresh every frame from game state
// and nothing else (the screenshot scenes are this same code, posed). Navy
// marble laid procedurally tile by tile, gold grout, soft radial light, and
// vision cones in translucent amber and red. No image is ever loaded: every
// shape below is a path on the canvas.

import { GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './guard.js';
import { CAMERA_VIEW_HALF_ANGLE } from './camera.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

const NAVY = '#131c42';
const NAVY_DARK = '#0c1230';
const GOLD = '#d9a83f';
const GOLD_BRIGHT = '#f4cd6a';
const CREAM = '#f2e7c9';

/** Deterministic per-tile hash, so the marble never shimmers between frames. */
function hash2(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/** The marble floor of one level, painted once onto its own canvas. */
function paintFloor(level) {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const g = c.getContext('2d');
  const TILE = 64;
  for (let ty = 0; ty < VIEW_H / TILE; ty++) {
    for (let tx = 0; tx < VIEW_W / TILE; tx++) {
      const v = hash2(tx, ty);
      const shade = 1.02 + v * 0.42;
      g.fillStyle = `rgb(${19 * shade | 0}, ${28 * shade | 0}, ${66 * shade | 0})`;
      g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      // A vein or two of pale marble, wandering by the tile's own hash.
      g.strokeStyle = 'rgba(214, 222, 248, 0.17)';
      g.lineWidth = 1.4;
      g.beginPath();
      const y0 = ty * TILE + v * TILE;
      g.moveTo(tx * TILE, y0);
      g.bezierCurveTo(
        tx * TILE + TILE * 0.35, y0 + (hash2(tx + 9, ty) - 0.5) * 26,
        tx * TILE + TILE * 0.65, y0 + (hash2(tx, ty + 7) - 0.5) * 26,
        tx * TILE + TILE, y0 + (hash2(tx + 3, ty + 3) - 0.5) * 18,
      );
      g.stroke();
    }
  }
  // Gold grout between the tiles.
  g.strokeStyle = 'rgba(217, 168, 63, 0.24)';
  g.lineWidth = 1;
  for (let x = 0; x <= VIEW_W; x += TILE) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, VIEW_H); g.stroke(); }
  for (let y = 0; y <= VIEW_H; y += TILE) { g.beginPath(); g.moveTo(0, y); g.lineTo(VIEW_W, y); g.stroke(); }
  // Carpets: deep red, gold-edged.
  for (const r of level.carpets ?? []) {
    g.fillStyle = '#4a1424';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let x = r.x + 12; x < r.x + r.w - 6; x += 24) g.fillRect(x, r.y + 4, 7, r.h - 8);
    g.strokeStyle = 'rgba(217, 168, 63, 0.55)';
    g.lineWidth = 3;
    g.strokeRect(r.x + 5, r.y + 5, r.w - 10, r.h - 10);
    g.strokeStyle = 'rgba(217, 168, 63, 0.22)';
    g.lineWidth = 1;
    g.strokeRect(r.x + 13, r.y + 13, r.w - 26, r.h - 26);
  }
  return c;
}

/** A translucent vision cone: a sector from (x, y) around `face`. */
function drawCone(g, x, y, face, half, range, fill, edge) {
  g.beginPath();
  g.moveTo(x, y);
  g.arc(x, y, range, face - half, face + half);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 1.2;
  g.stroke();
}

/** The getaway van, nose down in its corridor, lit if the way is open. */
function drawVan(g, exit, open, time) {
  const x = exit.x - 10;
  const w = exit.w + 20;
  g.save();
  if (open) {
    const glow = g.createRadialGradient(exit.x + exit.w / 2, 40, 6, exit.x + exit.w / 2, 40, 120);
    glow.addColorStop(0, 'rgba(120, 255, 170, 0.30)');
    glow.addColorStop(1, 'rgba(120, 255, 170, 0)');
    g.fillStyle = glow;
    g.fillRect(exit.x - 90, 0, exit.w + 180, 170);
  }
  // Body.
  g.fillStyle = '#11182e';
  g.strokeStyle = GOLD;
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(x, -36, w, 96, 10);
  g.fill();
  g.stroke();
  // Windshield and headlights.
  g.fillStyle = 'rgba(170, 205, 255, 0.75)';
  g.beginPath();
  g.roundRect(x + 10, 26, w - 20, 16, 5);
  g.fill();
  g.fillStyle = '#ffe9a8';
  g.beginPath();
  g.arc(x + 12, 54, 5, 0, Math.PI * 2);
  g.arc(x + w - 12, 54, 5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = CREAM;
  g.font = 'bold 13px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('GETAWAY', exit.x + exit.w / 2, 16);
  if (!open) {
    // A padlock over the doors: the scarab comes first.
    const cx = exit.x + exit.w / 2;
    g.strokeStyle = '#ff7a5c';
    g.lineWidth = 2.4;
    g.beginPath();
    g.arc(cx, 40, 7, Math.PI, 0);
    g.stroke();
    g.fillStyle = '#ff7a5c';
    g.beginPath();
    g.roundRect(cx - 9, 40, 18, 13, 3);
    g.fill();
  } else if (Math.sin(time * 5) > 0) {
    g.fillStyle = '#7dffab';
    g.font = 'bold 12px Georgia, serif';
    g.fillText('▼ RUN ▼', exit.x + exit.w / 2, 76);
  }
  g.restore();
}

/** The Gilded Scarab on its pedestal: gold, winged, and glowing. */
function drawScarab(g, x, y, time) {
  const pulse = 0.75 + Math.sin(time * 3.2) * 0.25;
  const glow = g.createRadialGradient(x, y, 2, x, y, 46);
  glow.addColorStop(0, `rgba(244, 205, 106, ${0.5 * pulse})`);
  glow.addColorStop(1, 'rgba(244, 205, 106, 0)');
  g.fillStyle = glow;
  g.fillRect(x - 46, y - 46, 92, 92);
  // Pedestal.
  g.fillStyle = '#1d2650';
  g.strokeStyle = GOLD;
  g.lineWidth = 1.4;
  g.beginPath();
  g.roundRect(x - 17, y - 6, 34, 22, 3);
  g.fill();
  g.stroke();
  // Legs.
  g.strokeStyle = GOLD_BRIGHT;
  g.lineWidth = 1.8;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(x + s * 7, y - 12 + i * 4);
      g.lineTo(x + s * 14, y - 16 + i * 6);
      g.stroke();
    }
  }
  // Winged body.
  g.fillStyle = GOLD;
  g.beginPath();
  g.ellipse(x, y - 12, 9, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#7a5410';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(x, y - 23);
  g.lineTo(x, y - 2);
  g.stroke();
  g.fillStyle = GOLD_BRIGHT;
  g.beginPath();
  g.arc(x, y - 25, 4.4, 0, Math.PI * 2);
  g.fill();
}

/** A side loot piece in its glass case; the glyph varies with its name. */
const LOOT_GLYPHS = ['gem', 'ring', 'cup', 'star', 'pearl'];
function drawLoot(g, loot, index, time) {
  const { x, y } = loot;
  g.fillStyle = 'rgba(160, 200, 255, 0.13)';
  g.strokeStyle = 'rgba(190, 215, 255, 0.55)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.roundRect(x - 16, y - 16, 32, 32, 4);
  g.fill();
  g.stroke();
  g.fillStyle = '#232c58';
  g.fillRect(x - 16, y + 10, 32, 6);
  const bob = Math.sin(time * 2.2 + index * 1.7) * 1.6;
  g.fillStyle = GOLD_BRIGHT;
  g.strokeStyle = '#8a5f14';
  g.lineWidth = 1.1;
  const kind = LOOT_GLYPHS[index % LOOT_GLYPHS.length];
  g.beginPath();
  if (kind === 'gem') {
    g.moveTo(x, y - 9 + bob); g.lineTo(x + 7, y - 2 + bob); g.lineTo(x, y + 7 + bob); g.lineTo(x - 7, y - 2 + bob); g.closePath();
  } else if (kind === 'ring') {
    g.arc(x, y - 1 + bob, 6.4, 0, Math.PI * 2);
  } else if (kind === 'cup') {
    g.moveTo(x - 7, y - 8 + bob); g.lineTo(x + 7, y - 8 + bob); g.lineTo(x + 3.4, y + 3 + bob); g.lineTo(x - 3.4, y + 3 + bob); g.closePath();
  } else if (kind === 'star') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const a2 = a + Math.PI / 5;
      g.lineTo(x + Math.cos(a) * 8.4, y - 1 + bob + Math.sin(a) * 8.4);
      g.lineTo(x + Math.cos(a2) * 3.6, y - 1 + bob + Math.sin(a2) * 3.6);
    }
    g.closePath();
  } else {
    g.arc(x, y - 1 + bob, 6, 0, Math.PI * 2);
  }
  g.fill();
  g.stroke();
}

/** Walls: tall ones as navy blocks with a lit top edge, cases as glass. */
function drawWalls(g, level) {
  for (const w of level.walls) {
    if (!w.vision) {
      g.fillStyle = 'rgba(150, 190, 240, 0.10)';
      g.fillRect(w.x, w.y, w.w, w.h);
      g.strokeStyle = 'rgba(217, 168, 63, 0.6)';
      g.lineWidth = 1.4;
      g.strokeRect(w.x, w.y, w.w, w.h);
      continue;
    }
    g.fillStyle = NAVY_DARK;
    g.fillRect(w.x, w.y, w.w, w.h);
    g.fillStyle = '#1c2760';
    g.fillRect(w.x, w.y, w.w, Math.min(7, w.h));
    g.fillRect(w.x, w.y, Math.min(7, w.w), w.h);
    g.strokeStyle = 'rgba(217, 168, 63, 0.75)';
    g.lineWidth = 1.6;
    g.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

/** A guard: navy uniform, a lit face and peaked cap toward his facing. */
function drawGuard(g, guard) {
  const { x, y } = guard;
  const fx = Math.cos(guard.face);
  const fy = Math.sin(guard.face);
  const px = -fy;
  const py = fx;
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(x, y + 12, 13, 5, 0, 0, Math.PI * 2);
  g.fill();
  // Uniform body.
  g.fillStyle = guard.state === 'patrol' ? '#2c4a8a' : '#8a5a2c';
  g.beginPath();
  g.arc(x, y, 13, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = GOLD;
  g.lineWidth = 1.6;
  g.stroke();
  // His face: a lit wedge on the side he looks toward.
  g.fillStyle = CREAM;
  g.beginPath();
  g.moveTo(x, y);
  g.arc(x, y, 9.2, guard.face - 0.95, guard.face + 0.95);
  g.closePath();
  g.fill();
  // Gold epaulettes on both shoulders.
  g.fillStyle = GOLD;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(x + px * s * 10.6, y + py * s * 10.6, 2.2, 0, Math.PI * 2);
    g.fill();
  }
  // Peaked cap, set back from the face, its brim reaching over it.
  const cx = x - fx * 1.6;
  const cy = y - fy * 1.6;
  g.fillStyle = '#16264f';
  g.beginPath();
  g.arc(cx, cy, 7, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(217, 168, 63, 0.8)';
  g.lineWidth = 1.1;
  g.stroke();
  g.fillStyle = '#0d1734';
  g.beginPath();
  g.ellipse(cx + fx * 6.6, cy + fy * 6.6, 5.4, 3.2, guard.face, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = GOLD_BRIGHT;
  g.beginPath();
  g.arc(cx, cy, 1.9, 0, Math.PI * 2);
  g.fill();
  // Eyes on the lit face, past the brim, looking where he faces.
  g.fillStyle = '#131c42';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(x + fx * 8.2 + px * s * 2.7, y + fy * 8.2 + py * s * 2.7, 1.5, 0, Math.PI * 2);
    g.fill();
  }
  // Baton.
  g.strokeStyle = '#0a0e22';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + fx * 10 - fy * 8, y + fy * 10 + fx * 8);
  g.lineTo(x + fx * 19 - fy * 8, y + fy * 19 + fx * 8);
  g.stroke();
  if (guard.seesPlayer) {
    g.fillStyle = '#ff5340';
    g.font = 'bold 19px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('!', x, y - 20);
  }
}

/** A camera: a pendant mount at its post, a boxy body whose lens leads. */
function drawCamera(g, camera, time) {
  const { x, y } = camera;
  const dead = camera.disabledT > 0;
  g.save();
  g.translate(x, y);
  g.rotate(camera.angle);
  // Mount plate at the post itself, and the drop rod the body hangs from:
  // the body rides out along its facing so it hangs clear in the room.
  g.fillStyle = '#171d38';
  g.strokeStyle = 'rgba(217, 168, 63, 0.45)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.roundRect(-5, -8, 8, 16, 2);
  g.fill();
  g.stroke();
  g.strokeStyle = '#39406b';
  g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(2, 0);
  g.lineTo(25, 0);
  g.stroke();
  g.fillStyle = '#39406b';
  g.beginPath();
  g.arc(25, 0, 3.6, 0, Math.PI * 2);
  g.fill();
  // Boxy body at the rod's end, nose toward the cone it watches.
  g.fillStyle = dead ? '#3a3f52' : '#232c58';
  g.strokeStyle = dead ? '#6a7086' : GOLD;
  g.lineWidth = 1.6;
  g.beginPath();
  g.roundRect(24, -8, 21, 16, 3);
  g.fill();
  g.stroke();
  // Lens barrel at the nose, with a glint of glass.
  g.fillStyle = dead ? '#22242f' : '#0d1330';
  g.beginPath();
  g.arc(42, 0, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = dead ? '#555a6e' : 'rgba(217, 168, 63, 0.7)';
  g.lineWidth = 1.1;
  g.stroke();
  if (!dead) {
    g.fillStyle = 'rgba(170, 205, 255, 0.9)';
    g.beginPath();
    g.arc(43.6, -2, 1.9, 0, Math.PI * 2);
    g.fill();
    // Recording eye, blinking on the body's shoulder.
    g.fillStyle = Math.sin(time * 4 + camera.phase) > 0 ? '#ff4040' : '#7a1610';
    g.beginPath();
    g.arc(28.5, -9.6, 2.3, 0, Math.PI * 2);
    g.fill();
  } else {
    // A dead camera sparks where its lens used to watch.
    g.strokeStyle = '#ffd76a';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(30, 10);
    g.lineTo(34, 15);
    g.lineTo(37, 10);
    g.stroke();
  }
  g.restore();
}

/** The thief: a hooded figure in a bell cloak, his face lit toward facing. */
function drawPlayer(g, player, time) {
  const { x, y } = player;
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.6 : Math.sin(time * 2) * 0.7;
  const fx = Math.cos(player.face);
  const fy = Math.sin(player.face);
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.ellipse(x, y + 13, 13, 5, 0, 0, Math.PI * 2);
  g.fill();
  if (player.sneaking) {
    g.strokeStyle = 'rgba(242, 231, 201, 0.4)';
    g.setLineDash([4, 5]);
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(x, y, 20, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }
  // The loot sack rides on his back, opposite the way he faces.
  if (player.carrying) {
    const sx = x - fx * 12.4;
    const sy = y - fy * 12.4 + bob * 0.4;
    g.fillStyle = GOLD_BRIGHT;
    g.beginPath();
    g.ellipse(sx, sy, 6.6, 5.8, player.face, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#7a5410';
    g.lineWidth = 1.1;
    g.stroke();
    g.beginPath();
    g.moveTo(sx - 2.6, sy - 3.4);
    g.lineTo(sx + 2.6, sy + 3.4);
    g.stroke();
  }
  // Bell cloak: gathered at the hood, flaring out to the hem at his feet.
  const topX = x + fx * 1.6;
  const topY = y - 12 + bob * 0.4 + fy * 1.6;
  const hemY = y + 12;
  g.fillStyle = '#20242e';
  g.beginPath();
  g.moveTo(topX - 4.4, topY);
  g.bezierCurveTo(x - 12, y + 1, x - 14, hemY - 5, x - 13.4, hemY);
  g.quadraticCurveTo(x, hemY + 3.6, x + 13.4, hemY);
  g.bezierCurveTo(x + 14, hemY - 5, x + 12, y + 1, topX + 4.4, topY);
  g.quadraticCurveTo(topX, topY - 3, topX - 4.4, topY);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(217, 168, 63, 0.85)';
  g.lineWidth = 1.5;
  g.stroke();
  // The hood: a dark ring leaning into his facing, face lit inside it.
  const hx = x + fx * 3;
  const hy = y - 4.4 + bob * 0.4 + fy * 3;
  g.fillStyle = '#101319';
  g.beginPath();
  g.arc(hx, hy, 8.4, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(217, 168, 63, 0.9)';
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = CREAM;
  g.beginPath();
  g.arc(hx + fx * 3.4, hy + fy * 3.4, 3, 0, Math.PI * 2);
  g.fill();
}

/**
 * Night itself: a dark sheet over the room with soft holes of light punched
 * around the thief, the scarab, the van and each unclaimed prize.
 */
function drawNight(g, state, lightCanvas) {
  const lg = lightCanvas.getContext('2d');
  lg.clearRect(0, 0, VIEW_W, VIEW_H);
  lg.fillStyle = 'rgba(3, 5, 16, 0.40)';
  lg.fillRect(0, 0, VIEW_W, VIEW_H);
  lg.globalCompositeOperation = 'destination-out';
  const punch = (x, y, r, strength) => {
    const grad = lg.createRadialGradient(x, y, 4, x, y, r);
    grad.addColorStop(0, `rgba(0,0,0,${strength})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = grad;
    lg.fillRect(x - r, y - r, r * 2, r * 2);
  };
  punch(state.player.x, state.player.y, 235, 0.92);
  if (!state.scarabTaken) punch(state.level.scarab.x, state.level.scarab.y, 120, 0.6);
  punch(state.level.exit.x + state.level.exit.w / 2, 44, 140, 0.55);
  state.loots.forEach((loot) => { if (!loot.taken) punch(loot.x, loot.y, 62, 0.4); });
  lg.globalCompositeOperation = 'source-over';
  g.drawImage(lightCanvas, 0, 0);
}

/** A thrown coin: its flight arc, then its ringing circles on the marble. */
function drawCoinFx(g, fx, time) {
  if (!fx) return;
  if (fx.mode === 'fly') {
    const t = fx.t;
    const x = fx.fromX + (fx.toX - fx.fromX) * t;
    const y = fx.fromY + (fx.toY - fx.fromY) * t - Math.sin(t * Math.PI) * 34;
    g.fillStyle = GOLD_BRIGHT;
    g.beginPath();
    g.arc(x, y, 4.6, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#8a5f14';
    g.lineWidth = 1;
    g.stroke();
  } else if (fx.mode === 'ring') {
    g.fillStyle = GOLD_BRIGHT;
    g.beginPath();
    g.arc(fx.toX, fx.toY, 4.2, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 3; i++) {
      const r = ((time * 90 + i * 26) % 78) + 6;
      g.strokeStyle = `rgba(244, 205, 106, ${0.55 * (1 - r / 84)})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(fx.toX, fx.toY, r, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

/** Create the renderer bound to a canvas; floors are cached per level. */
export function createRenderer(canvas) {
  const g = canvas.getContext('2d');
  const lightCanvas = document.createElement('canvas');
  lightCanvas.width = VIEW_W;
  lightCanvas.height = VIEW_H;
  const floors = new Map();
  const floorOf = (level) => {
    if (!floors.has(level)) floors.set(level, paintFloor(level));
    return floors.get(level);
  };

  /** Draw one whole frame of the game state, in the museum's own order. */
  function render(state) {
    const { level, time } = state;
    g.drawImage(floorOf(level), 0, 0);
    drawVan(g, level.exit, state.scarabTaken, time);
    if (!state.scarabTaken) drawScarab(g, level.scarab.x, level.scarab.y, time);
    state.loots.forEach((loot, i) => { if (!loot.taken) drawLoot(g, loot, i, time); });
    drawWalls(g, level);
    drawNight(g, state, lightCanvas);
    // Cones over the darkened floor, under the people they hunt.
    for (const cam of state.cameras) {
      if (cam.disabledT > 0) continue;
      drawCone(g, cam.x, cam.y, cam.angle, CAMERA_VIEW_HALF_ANGLE, cam.range,
        cam.seesPlayer ? 'rgba(255, 90, 70, 0.16)' : 'rgba(165, 200, 255, 0.12)',
        cam.seesPlayer ? 'rgba(255, 90, 70, 0.4)' : 'rgba(165, 200, 255, 0.30)');
    }
    for (const guard of state.guards) {
      drawCone(g, guard.x, guard.y, guard.face, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE,
        guard.seesPlayer ? 'rgba(255, 64, 40, 0.25)' : 'rgba(244, 180, 60, 0.19)',
        guard.seesPlayer ? 'rgba(255, 64, 40, 0.5)' : 'rgba(244, 180, 60, 0.38)');
    }
    drawCoinFx(g, state.coinFx, time);
    for (const cam of state.cameras) drawCamera(g, cam, time);
    for (const guard of state.guards) drawGuard(g, guard);
    drawPlayer(g, state.player, time);
    if (state.alarm.value > 1) {
      // The room itself reddens as the alarm climbs.
      g.fillStyle = `rgba(200, 30, 20, ${(state.alarm.value / 100) * 0.13})`;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  return { render };
}
