'use strict';
/* =========================================================
   Constantes del mundo y utilidades generales
   ========================================================= */
const TAU = Math.PI * 2;
const TILE = 40, COLS = 13, ROWS = 7;
const X0 = 40, Y0 = 40, X1 = X0 + COLS * TILE, Y1 = Y0 + ROWS * TILE;
const RW = X1 + 40, RH = Y1 + 40;           // 600 x 360 (sala con muros)
const CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
const DT = 1 / 60;

// Tipos de casilla
const T = { EMPTY: 0, ROCK: 1, POOP: 2, PIT: 3, SPIKE: 4, FIRE: 5, METAL: 6, TINTED: 7, TNT: 8 };

const DIRS = {
  up:    { dx: 0,  dy: -1, c: 6,  r: 0, x: CX, y: Y0, rot: 0 },
  down:  { dx: 0,  dy: 1,  c: 6,  r: 6, x: CX, y: Y1, rot: Math.PI },
  left:  { dx: -1, dy: 0,  c: 0,  r: 3, x: X0, y: CY, rot: -Math.PI / 2 },
  right: { dx: 1,  dy: 0,  c: 12, r: 3, x: X1, y: CY, rot: Math.PI / 2 },
};
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const DIRNAMES = ['up', 'down', 'left', 'right'];
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
function solidWalk(t) { return t === T.ROCK || t === T.POOP || t === T.PIT || t === T.FIRE || t === T.METAL || t === T.TINTED || t === T.TNT; }
function solidTear(t) { return t === T.ROCK || t === T.POOP || t === T.FIRE || t === T.METAL || t === T.TINTED || t === T.TNT; }
function solidFlyer(t) { return t === T.METAL || t === T.FIRE; }

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
  data: { runs: 0, wins: 0, best: 0, muted: false, music: true, char: 0 },
  load() { try { const s = localStorage.getItem(this.key); if (s) Object.assign(this.data, JSON.parse(s)); } catch (e) { /* sin almacenamiento */ } },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* sin almacenamiento */ } },
};
