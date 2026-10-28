'use strict';
/* =========================================================
   Constantes del mundo y utilidades generales
   ========================================================= */
const TAU = Math.PI * 2;
const TILE = 40, CELL_C = 13, CELL_R = 7;    // una celda del mapa = 13 x 7 casillas
const X0 = 40, Y0 = 40;
const RW = 600, RH = 360;                    // pantalla: una sala de una celda ocupa justo esto
// Tamaño de la sala actual (cambia con setRoomShape): las salas grandes miden varias celdas
let COLS = CELL_C, ROWS = CELL_R;
let X1 = X0 + COLS * TILE, Y1 = Y0 + ROWS * TILE;
let WW = X1 + 40, WH = Y1 + 40;              // mundo de la sala con muros
let CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
const DT = 1 / 60;

// Tipos de casilla (WALL es el hueco de una sala en L: muro macizo)
const T = { EMPTY: 0, ROCK: 1, POOP: 2, PIT: 3, SPIKE: 4, FIRE: 5, METAL: 6, TINTED: 7, TNT: 8, WALL: 9 };

// Puertas: cada lado tiene una ranura por celda de la sala ('up', 'up1', 'down', 'down1', 'left', ...).
// Sus posiciones (c, r, x, y) dependen de la sala actual y las rellena setRoomShape.
const DIRS = {
  up:    { dx: 0,  dy: -1, c: 6,  r: 0, x: 300, y: Y0, rot: 0 },
  down:  { dx: 0,  dy: 1,  c: 6,  r: 6, x: 300, y: 320, rot: Math.PI },
  left:  { dx: -1, dy: 0,  c: 0,  r: 3, x: X0, y: 180, rot: -Math.PI / 2 },
  right: { dx: 1,  dy: 0,  c: 12, r: 3, x: 560, y: 180, rot: Math.PI / 2 },
};
const SLOT_NAMES = ['up', 'down', 'left', 'right', 'up1', 'down1', 'left1', 'right1'];
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const BASE4 = ['up', 'down', 'left', 'right'];
let DIRNAMES = BASE4;                         // ranuras de la sala actual
const N4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const N8 = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
const DIAG = [[0.707, 0.707], [-0.707, 0.707], [0.707, -0.707], [-0.707, -0.707]];

// ---------- Aleatoriedad ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let grng = Math.random;                      // RNG de generación (con semilla)
function seedGen(s) { grng = mulberry32(s); }
function rr(a, b) { return a + Math.random() * (b - a); }
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function gri(a, b) { return a + Math.floor(grng() * (b - a + 1)); }
function pick(a, r = Math.random) { return a[Math.floor(r() * a.length)]; }
function shuffle(a, r = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function weighted(list, r = Math.random) {
  let tot = 0; for (const it of list) tot += it[1];
  let x = r() * tot;
  for (const it of list) { if ((x -= it[1]) < 0) return it[0]; }
  return list[list.length - 1][0];
}

// ---------- Matemáticas ----------
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function angTo(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
function segDist2(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  const qx = x0 + dx * t - px, qy = y0 + dy * t - py;
  return qx * qx + qy * qy;
}

// ---------- Casillas ----------
function inGrid(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS; }
function tcx(c) { return X0 + c * TILE + TILE / 2; }
function tcy(r) { return Y0 + r * TILE + TILE / 2; }
function txOf(x) { return Math.floor((x - X0) / TILE); }
function tyOf(y) { return Math.floor((y - Y0) / TILE); }
function solidWalk(t) { return t === T.ROCK || t === T.POOP || t === T.PIT || t === T.FIRE || t === T.METAL || t === T.TINTED || t === T.TNT || t === T.WALL; }
function solidTear(t) { return t === T.ROCK || t === T.POOP || t === T.FIRE || t === T.METAL || t === T.TINTED || t === T.TNT || t === T.WALL; }
function solidFlyer(t) { return t === T.METAL || t === T.FIRE || t === T.WALL; }

// ---------- Forma de la sala ----------
function slotBase(name) { return name.replace(/\d+$/, ''); }
function slotName(base, i) { return i ? base + i : base; }
function slotIndex(name) { const b = slotBase(name); return name.length > b.length ? +name.slice(b.length) : 0; }
// Ranuras de puerta posibles de una sala con celdas relativas [[i, j], ...] en una caja de cw x ch celdas
function roomSlotNames(cells, cw, ch) {
  const out = [];
  for (const [i, j] of cells) {
    if (j === 0) out.push(slotName('up', i));
    if (j === ch - 1) out.push(slotName('down', i));
    if (i === 0) out.push(slotName('left', j));
    if (i === cw - 1) out.push(slotName('right', j));
  }
  return out;
}
// Pone las constantes del mundo (COLS, ROWS, X1, CX, DIRS, DIRNAMES...) al tamaño de la sala
function setRoomShape(room) {
  COLS = room.cols; ROWS = room.rows;
  X1 = X0 + COLS * TILE; Y1 = Y0 + ROWS * TILE; WW = X1 + 40; WH = Y1 + 40;
  CX = (X0 + X1) / 2; CY = (Y0 + Y1) / 2;
  for (const name of SLOT_NAMES) {
    const base = slotBase(name), i = slotIndex(name), b = DIRS[base];
    let c, r;
    if (base === 'up' || base === 'down') { c = Math.min(CELL_C * i + 6, COLS - 1); r = base === 'up' ? 0 : ROWS - 1; }
    else { r = Math.min(CELL_R * i + 3, ROWS - 1); c = base === 'left' ? 0 : COLS - 1; }
    DIRS[name] = { dx: b.dx, dy: b.dy, c, r, rot: b.rot,
      x: base === 'left' ? X0 : base === 'right' ? X1 : tcx(c), y: base === 'up' ? Y0 : base === 'down' ? Y1 : tcy(r) };
  }
  DIRNAMES = room.slotNames;
}
const UNIT_SHAPE = { cols: CELL_C, rows: CELL_R, slotNames: BASE4 };
setRoomShape(UNIT_SHAPE);

// Empuja un círculo fuera de las casillas sólidas. Devuelve {hx, hy} si chocó.
function collideTiles(e, tiles, solidFn) {
  let hx = false, hy = false;
  const c0 = Math.floor((e.x - e.r - X0) / TILE), c1 = Math.floor((e.x + e.r - X0) / TILE);
  const r0 = Math.floor((e.y - e.r - Y0) / TILE), r1 = Math.floor((e.y + e.r - Y0) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!inGrid(c, r) || !solidFn(tiles[r * COLS + c])) continue;
    const bx = X0 + c * TILE, by = Y0 + r * TILE;
    const nx = clamp(e.x, bx, bx + TILE), ny = clamp(e.y, by, by + TILE);
    const dx = e.x - nx, dy = e.y - ny, d2 = dx * dx + dy * dy;
    if (d2 >= e.r * e.r) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2), push = e.r - d;
      e.x += dx / d * push; e.y += dy / d * push;
      if (Math.abs(dx) > Math.abs(dy)) hx = true; else hy = true;
    } else {
      const l = e.x - bx, rg = bx + TILE - e.x, t = e.y - by, b = by + TILE - e.y;
      const m = Math.min(l, rg, t, b);
      if (m === l) { e.x = bx - e.r; hx = true; }
      else if (m === rg) { e.x = bx + TILE + e.r; hx = true; }
      else if (m === t) { e.y = by - e.r; hy = true; }
      else { e.y = by + TILE + e.r; hy = true; }
    }
  }
  return (hx || hy) ? { hx, hy } : null;
}

function lineClear(tiles, x0, y0, x1, y1, solidFn = solidWalk, w = 0) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / 9));
  const px = d ? -(y1 - y0) / d * w : 0, py = d ? (x1 - x0) / d * w : 0;
  for (let i = 1; i < n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    for (let k = -1; k <= 1; k++) {
      if (k && !w) continue;
      const c = txOf(x + px * k), r = tyOf(y + py * k);
      if (inGrid(c, r) && solidFn(tiles[r * COLS + c])) return false;
    }
  }
  return true;
}

// Campo de distancias (BFS) hacia una casilla destino
function computeFlow(tiles, tc, tr) {
  const d = new Int16Array(COLS * ROWS).fill(-1);
  if (!inGrid(tc, tr)) return d;
  const q = [tr * COLS + tc]; d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], c = i % COLS, r = (i / COLS) | 0;
    for (const n of N4) {
      const nc = c + n[0], nr = r + n[1];
      if (!inGrid(nc, nr)) continue;
      const j = nr * COLS + nc;
      if (d[j] >= 0 || solidWalk(tiles[j])) continue;
      d[j] = d[i] + 1; q.push(j);
    }
  }
  return d;
}

// ---------- Guardado ----------
const Store = {
  key: 'lagrimas_sotano_v1',
  // bestiary: id de enemigo o jefe -> veces derrotado (que exista la clave significa "visto")
  data: { runs: 0, wins: 0, best: 0, muted: false, music: true, char: 0, bestiary: {} },
  load() { try { const s = localStorage.getItem(this.key); if (s) Object.assign(this.data, JSON.parse(s)); } catch (e) { /* sin almacenamiento */ } },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* sin almacenamiento */ } },
};
