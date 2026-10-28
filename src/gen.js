'use strict';
/* =========================================================
   Generación procedural de pisos y salas
   ========================================================= */
const MAPW = 9, MAPH = 9;

const PK_R = { coin: 7, nickel: 8, dime: 8, heart: 9, half: 8, soul: 9, black: 9, bomb: 9, bomb2: 11, key: 8, pill: 7, card: 8, battery: 9, chest: 13, gchest: 13, item: 14, trophy: 18 };
function mkPickup(kind, x, y, o = {}) {
  const pk = Object.assign({ kind, x, y, vx: 0, vy: 0, r: PK_R[kind] || 9, t: Math.random() * 10, cd: 0 }, o);
  if (o.pop) { const a = Math.random() * TAU, s = rr(50, 130); pk.vx = Math.cos(a) * s; pk.vy = Math.sin(a) * s; }
  if (kind === 'pill' && pk.pill == null) pk.pill = ri(0, PILL_COLORS.length - 1);
  if (kind === 'card' && pk.card == null) pk.card = ri(0, CARDS.length - 1);
  return pk;
}

function pickItem(pool, rng = Math.random) {
  const list = [];
  const orb = G.player && G.player.passive && G.player.passive.has('sacredorb');
  for (const id of G.run.pool) { const w = ITEMS[id].pools[pool]; if (w && (!orb || ITEMS[id].q >= 2)) list.push([id, w]); }
  if (!list.length) return '25';
  const id = weighted(list, rng);
  G.run.pool.delete(id);
  return id;
}

function makeRoom(gx, gy, type) {
  return {
    gx, gy, type, tiles: new Uint8Array(COLS * ROWS), thp: new Uint8Array(COLS * ROWS),
    doors: {}, visited: false, seen: false, cleared: true, spawns: [], pickups: [], decals: [],
    trapdoor: null, boss: null, seed: (grng() * 1e9) | 0, cracks: {},
  };
}

function generateFloor(fi, seed) {
  seedGen(seed);
  for (let i = 0; i < 500; i++) { const f = tryFloor(fi); if (f) return f; }
  throw new Error('No se pudo generar el piso');
}

function tryFloor(fi) {
  const target = Math.min(16, Math.floor(grng() * 2 + 5 + (fi + 1) * 1.8));
  const grid = new Uint8Array(MAPW * MAPH);
  const sx = 4, sy = 4;
  const at = (x, y) => x >= 0 && y >= 0 && x < MAPW && y < MAPH && grid[y * MAPW + x];
  const nb = (x, y) => N4.reduce((n, d) => n + (at(x + d[0], y + d[1]) ? 1 : 0), 0);
  grid[sy * MAPW + sx] = 1;
  const cells = [[sx, sy]], queue = [[sx, sy]];
  let count = 1;
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const d of shuffle(N4.slice(), grng)) {
      const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= MAPW || ny >= MAPH) continue;
      if (grid[ny * MAPW + nx] || count >= target || nb(nx, ny) > 1 || grng() < 0.5) continue;
      grid[ny * MAPW + nx] = 1; count++;
      queue.push([nx, ny]); cells.push([nx, ny]);
    }
  }
  if (count < target) return null;

  // distancias desde el inicio
  const dist = new Int16Array(MAPW * MAPH).fill(-1);
  dist[sy * MAPW + sx] = 0;
  const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    for (const d of N4) {
      const nx = x + d[0], ny = y + d[1];
      if (!at(nx, ny) || dist[ny * MAPW + nx] >= 0) continue;
      dist[ny * MAPW + nx] = dist[y * MAPW + x] + 1; q.push([nx, ny]);
    }
  }
  const dead = cells.filter(([x, y]) => !(x === sx && y === sy) && nb(x, y) === 1);
  if (dead.length < 3) return null;
  dead.sort((a, b) => dist[b[1] * MAPW + b[0]] - dist[a[1] * MAPW + a[0]]);
  const bossC = dead[0];
  if (dist[bossC[1] * MAPW + bossC[0]] < 2) return null;
  const rest = shuffle(dead.slice(1), grng);
  const treasC = rest[0], shopC = fi < FLOORS.length - 1 ? rest[1] : null;

  // sala secreta: hueco vacío con muchos vecinos y lejos del jefe
  let secretC = null, bestN = 0;
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
    if (grid[y * MAPW + x]) continue;
    const n = nb(x, y);
    const nearBoss = N4.some(d => x + d[0] === bossC[0] && y + d[1] === bossC[1]);
    if (nearBoss || n < 1) continue;
    const score = n + grng() * 0.5;
    if (score > bestN) { bestN = score; secretC = [x, y]; }
  }

  const rooms = [], byKey = new Map();
  const add = (x, y, type) => { const r = makeRoom(x, y, type); rooms.push(r); byKey.set(y * MAPW + x, r); return r; };
  for (const [x, y] of cells) {
    let type = 'normal';
    if (x === sx && y === sy) type = 'start';
    else if (x === bossC[0] && y === bossC[1]) type = 'boss';
    else if (x === treasC[0] && y === treasC[1]) type = 'treasure';
    else if (shopC && x === shopC[0] && y === shopC[1]) type = 'shop';
    add(x, y, type);
  }
  if (secretC) add(secretC[0], secretC[1], 'secret');

  // puertas
  for (const r of rooms) {
    for (const k of DIRNAMES) {
      if (r.doors[k]) continue;
      const D = DIRS[k];
      const o = byKey.get((r.gy + D.dy) * MAPW + (r.gx + D.dx));
      if (!o) continue;
      const door = makeDoor(r, o, fi);
      r.doors[k] = door; o.doors[OPP[k]] = door;
    }
  }

  const theme = FLOORS[fi].theme;
  for (const r of rooms) fillRoom(r, fi, theme);
  const start = byKey.get(sy * MAPW + sx);
  return { rooms, byKey, start, fi };
}

function makeDoor(a, b, fi) {
  const ts = [a.type, b.type];
  const d = { type: 'normal', locked: false, hidden: false, rooms: [a, b] };
  if (ts.includes('secret')) { d.type = 'secret'; d.hidden = true; }
  else if (ts.includes('boss')) d.type = 'boss';
  else if (ts.includes('treasure')) { d.type = 'treasure'; d.locked = fi >= 2 && grng() < 0.35; }
  else if (ts.includes('shop')) { d.type = 'shop'; d.locked = fi >= 1; }
  return d;
}

function fillRoom(room, fi, theme) {
  switch (room.type) {
    case 'start': room.cleared = true; break;
    case 'normal': genNormal(room, fi, theme); break;
    case 'boss': {
      const opts = FLOORS[fi].bosses;
      let cand = opts.filter(b => !G.run.bossesUsed.includes(b));
      if (!cand.length) cand = opts;
      room.boss = pick(cand, grng);
      G.run.bossesUsed.push(room.boss);
      room.cleared = false;
      if (room.boss !== 'mama' && room.boss !== 'corazon' && room.boss !== 'gusano' && grng() < 0.35) {
        const v = grng() < 0.5 ? T.ROCK : T.PIT;
        put(room.tiles, 0, 0, v); put(room.tiles, 1, 0, v); put(room.tiles, 0, 1, v);
      }
      break;
    }
    case 'treasure':
      room.cleared = true;
      if (grng() < 0.4) { put(room.tiles, 4, 2, T.ROCK); }
      room.pickups.push(mkPickup('item', CX, CY, { item: pickItem('treasure', grng) }));
      break;
    case 'shop': {
      room.cleared = true;
      room.pickups.push(mkPickup('item', tcx(3), tcy(3), { item: pickItem('shop', grng), price: 15, shop: true }));
      const goods = [['heart', 3], ['bomb', 5], ['key', 5], ['soul', 5], ['pill', 4], ['bomb2', 7], ['card', 5], ['battery', 6]];
      const chosen = shuffle(goods.slice(), grng).slice(0, 3);
      chosen.forEach((g, i) => room.pickups.push(mkPickup(g[0], tcx(5 + i * 2), tcy(3), { price: g[1], shop: true })));
      break;
    }
    case 'secret': {
      room.cleared = true;
      const r = grng();
      if (r < 0.4) room.pickups.push(mkPickup('item', CX, CY, { item: pickItem('secret', grng) }));
      else if (r < 0.7) {
        const n = gri(4, 8);
        for (let i = 0; i < n; i++) room.pickups.push(mkPickup(grng() < 0.2 ? 'nickel' : 'coin', CX + gri(-80, 80), CY + gri(-40, 40)));
        room.pickups.push(mkPickup('bomb2', CX, CY + 50));
      } else {
        room.pickups.push(mkPickup('gchest', CX, CY));
        room.pickups.push(mkPickup('key', CX - 60, CY + 40));
        room.pickups.push(mkPickup('soul', CX + 60, CY + 40));
      }
      break;
    }
  }
  // grietas visibles junto a puertas secretas (pista sutil)
  for (const k of DIRNAMES) if (room.doors[k] && room.doors[k].hidden) room.cracks[k] = grng() < 0.7;
}

// ---------- Diseños de sala ----------
function put(t, c, r, v, sym = 'both') {
  const cs = [c], rs = [r];
  if (sym === 'h' || sym === 'both') cs.push(COLS - 1 - c);
  if (sym === 'v' || sym === 'both') rs.push(ROWS - 1 - r);
  for (const cc of cs) for (const r2 of rs) if (inGrid(cc, r2)) t[r2 * COLS + cc] = v;
}
function obstacle(fi) {
  return weighted([[T.ROCK, 10], [T.POOP, 1.5], [T.PIT, fi >= 1 ? 3 : 0.4], [T.METAL, 0.7], [T.TNT, fi >= 1 ? 0.5 : 0.2], [T.SPIKE, 0.8], [T.FIRE, 0.4]], grng);
}
const STYLES = {
  empty() {},
  scatter(t, fi) { const n = gri(2, 5); for (let i = 0; i < n; i++) put(t, gri(0, 5), gri(0, 2), obstacle(fi), grng() < 0.7 ? 'both' : 'h'); },
  center(t, fi) {
    const w = gri(1, 3), h = gri(0, 1);
    const v = fi >= 1 && grng() < 0.4 ? T.PIT : grng() < 0.15 ? T.METAL : T.ROCK;
    for (let c = 6 - w; c <= 6 + w; c++) for (let r = 3 - h; r <= 3 + h; r++) t[r * COLS + c] = v;
  },
  pillars(t, fi) {
    const c = gri(1, 3), v = grng() < 0.8 ? T.ROCK : obstacle(fi);
    for (let dc = 0; dc < 2; dc++) for (let dr = 0; dr < 2; dr++) put(t, c + dc, 1 + dr, v);
  },
  corners(t, fi) {
    const v = grng() < 0.7 ? T.ROCK : obstacle(fi);
    put(t, 0, 0, v); put(t, 1, 0, v); put(t, 0, 1, v);
    if (grng() < 0.5) { put(t, 2, 0, v); put(t, 1, 1, v); }
  },
  lines(t, fi) {
    const v = grng() < 0.75 ? T.ROCK : (fi >= 1 ? T.PIT : T.POOP);
    if (grng() < 0.5) { for (let c = 2; c <= 10; c++) if (c !== 6) put(t, c, 1, v, 'v'); }
    else { for (let r = 0; r < ROWS; r++) if (r !== 3) put(t, 3, r, v, 'h'); }
  },
  ring(t, fi) {
    const v = fi >= 1 && grng() < 0.6 ? T.PIT : T.ROCK;
    for (let c = 3; c <= 9; c++) for (let r = 1; r <= 5; r++) {
      const border = c === 3 || c === 9 || r === 1 || r === 5;
      const gap = (c === 6 && (r === 1 || r === 5)) || (r === 3 && (c === 3 || c === 9));
      if (border && !gap) t[r * COLS + c] = v;
    }
  },
  poops(t) { const n = gri(3, 6); for (let i = 0; i < n; i++) t[gri(0, ROWS - 1) * COLS + gri(0, COLS - 1)] = T.POOP; },
  spikes(t, fi) {
    const n = gri(2, 4); for (let i = 0; i < n; i++) put(t, gri(1, 5), gri(0, 2), T.SPIKE);
    if (grng() < 0.6) put(t, gri(0, 5), gri(0, 2), T.ROCK);
  },
  fires(t, fi) {
    const n = gri(1, 2); for (let i = 0; i < n; i++) put(t, gri(1, 4), gri(0, 2), T.FIRE);
    if (grng() < 0.7) put(t, gri(0, 5), gri(0, 2), T.ROCK);
  },
  maze(t) { const n = gri(6, 12); for (let i = 0; i < n; i++) put(t, gri(1, 5), gri(0, 2), T.ROCK); },
};

function clearDoors(t) {
  for (const k of DIRNAMES) {
    const D = DIRS[k];
    t[D.r * COLS + D.c] = T.EMPTY;
    t[(D.r - D.dy) * COLS + (D.c - D.dx)] = T.EMPTY;
  }
}

function passable(v) { return !solidWalk(v) && v !== T.SPIKE; }

function reachable(t) {
  const seen = new Uint8Array(COLS * ROWS), out = [];
  const s = DIRS.up.r * COLS + DIRS.up.c;
  if (!passable(t[s])) return out;
  const q = [s]; seen[s] = 1;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], c = i % COLS, r = (i / COLS) | 0;
    out.push([c, r]);
    for (const n of N4) {
      const nc = c + n[0], nr = r + n[1];
      if (!inGrid(nc, nr)) continue;
      const j = nr * COLS + nc;
      if (seen[j] || !passable(t[j])) continue;
      seen[j] = 1; q.push(j);
    }
  }
  return out;
}

function connectedDoors(t) {
  const reach = reachable(t);
  const set = new Set(reach.map(([c, r]) => r * COLS + c));
  return DIRNAMES.every(k => set.has(DIRS[k].r * COLS + DIRS[k].c));
}

function genLayout(fi) {
  for (let a = 0; a < 40; a++) {
    const t = new Uint8Array(COLS * ROWS);
    const style = weighted([['empty', 1.5], ['scatter', 5], ['center', 3], ['pillars', 3], ['corners', 2], ['lines', 2], ['ring', 1.5],
      ['poops', 2], ['spikes', fi >= 1 ? 1.5 : 0.5], ['fires', 1], ['maze', fi >= 2 ? 1.5 : 0.5]], grng);
    STYLES[style](t, fi);
    if (grng() < 0.45) { const n = gri(1, 2); for (let i = 0; i < n; i++) t[gri(0, ROWS - 1) * COLS + gri(0, COLS - 1)] = grng() < 0.5 ? T.POOP : T.ROCK; }
    clearDoors(t);
    if (grng() < 0.15) {
      const rocks = [];
      for (let i = 0; i < t.length; i++) if (t[i] === T.ROCK) rocks.push(i);
      if (rocks.length) t[pick(rocks, grng)] = T.TINTED;
    }
    if (connectedDoors(t)) return t;
  }
  return new Uint8Array(COLS * ROWS);
}

function genNormal(room, fi, theme) {
  room.tiles = genLayout(fi);
  const reach = reachable(room.tiles);
  const far = reach.filter(([c, r]) => DIRNAMES.every(k => Math.abs(c - DIRS[k].c) + Math.abs(r - DIRS[k].r) >= 3));
  if (grng() < 0.08 || far.length < 3) {
    room.cleared = true;
    const [c, r] = reach.length ? pick(reach, grng) : [6, 3];
    room.pickups.push(mkPickup(weighted([['chest', 3], ['coin', 3], ['heart', 2], ['key', 2], ['bomb', 2], ['gchest', 1]], grng), tcx(c), tcy(r)));
    return;
  }
  const pool = ENEMY_POOLS[theme];
  const types = [weighted(pool, grng)];
  if (grng() < 0.45) types.push(weighted(pool, grng));
  let budget = 2.2 + fi * 0.75 + grng() * 1.8;
  shuffle(far, grng);
  while (budget > 0 && room.spawns.length < 10 && far.length) {
    const type = pick(types, grng);
    const n = (type === 'fly' || type === 'afly') ? gri(2, 4) : type === 'spider' ? gri(1, 3) : 1;
    for (let k = 0; k < n && far.length; k++) {
      const [c, r] = far.pop();
      room.spawns.push({ type, c, r, champ: grng() < 0.04 + fi * 0.01 });
    }
    budget -= EN[type].cost * n;
  }
  room.cleared = room.spawns.length === 0;
  if (grng() < 0.07 && reach.length) {
    const [c, r] = pick(reach, grng);
    room.pickups.push(mkPickup(weighted([['coin', 4], ['bomb', 2], ['key', 2], ['heart', 1], ['pill', 1]], grng), tcx(c), tcy(r)));
  }
}
