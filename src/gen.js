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

// kind: 'p' (solo pasivos) o 'a' (solo activos); si no queda ninguno de ese tipo se elige entre todos
function pickItem(pool, rng = Math.random, kind = null) {
  const list = [];
  const orb = G.player && G.player.passive && G.player.passive.has('sacredorb');
  for (const id of G.run.pool) { const w = ITEMS[id].pools[pool]; if (w && (!orb || ITEMS[id].q >= 2) && (!kind || ITEMS[id].kind === kind)) list.push([id, w]); }
  if (!list.length) return kind ? pickItem(pool, rng) : '25';
  const id = weighted(list, rng);
  G.run.pool.delete(id);
  return id;
}

// Una sala ocupa una o varias celdas del mapa ([[x, y], ...]); su tamaño en casillas sale de la caja que las contiene.
// gx, gy es la esquina de esa caja y cw x ch su tamaño en celdas; las celdas que sobran en una L son muro.
function makeRoom(cells, type) {
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
  const gx = Math.min(...xs), gy = Math.min(...ys), cw = Math.max(...xs) - gx + 1, ch = Math.max(...ys) - gy + 1;
  const cols = CELL_C * cw, rows = CELL_R * ch;
  return {
    gx, gy, cw, ch, cells, cols, rows, slotNames: roomSlotNames(cells.map(c => [c[0] - gx, c[1] - gy]), cw, ch),
    type, tiles: new Uint8Array(cols * rows), thp: new Uint8Array(cols * rows),
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

  // salas especiales en los callejones que sobran: [tipo, piso mínimo, probabilidad]
  const special = new Map();
  if (fi < FLOORS.length - 1) {
    const cand = shuffle([['challenge', 1, 0.35], ['sacrifice', 1, 0.25], ['library', 1, 0.25], ['miniboss', 2, 0.3]].filter(c => fi >= c[1]), grng);
    for (const [x, y] of rest.slice(shopC ? 2 : 1)) {
      const i = cand.findIndex(c => grng() < c[2]);
      if (i < 0) break;
      special.set(y * MAPW + x, cand.splice(i, 1)[0][0]);
    }
  }

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
  const add = (cs, type) => { const r = makeRoom(cs, type); rooms.push(r); for (const [x, y] of cs) byKey.set(y * MAPW + x, r); return r; };
  const typeOf = new Map();
  for (const [x, y] of cells) {
    let type = 'normal';
    if (x === sx && y === sy) type = 'start';
    else if (x === bossC[0] && y === bossC[1]) type = 'boss';
    else if (x === treasC[0] && y === treasC[1]) type = 'treasure';
    else if (shopC && x === shopC[0] && y === shopC[1]) type = 'shop';
    else if (special.has(y * MAPW + x)) type = special.get(y * MAPW + x);
    typeOf.set(y * MAPW + x, type);
  }
  const groups = bigRoomGroups(fi, cells, typeOf, grid, secretC);
  const grouped = new Set(groups.flat().map(([x, y]) => y * MAPW + x));
  for (const g of groups) add(g, 'normal');
  for (const [x, y] of cells) if (!grouped.has(y * MAPW + x)) add([[x, y]], typeOf.get(y * MAPW + x));
  if (secretC) add([secretC], 'secret');

  // puertas: una por cada lado de celda que toca otra sala, en la ranura que le corresponde a esa celda
  for (const r of rooms) {
    for (const [x, y] of r.cells) {
      for (const base of BASE4) {
        const D = DIRS[base], o = byKey.get((y + D.dy) * MAPW + (x + D.dx));
        if (!o || o === r) continue;
        const name = slotName(base, D.dy ? x - r.gx : y - r.gy);
        if (r.doors[name] || !r.slotNames.includes(name)) continue;
        const oname = slotName(OPP[base], D.dy ? x - o.gx : y - o.gy);
        if (!o.slotNames.includes(oname)) continue;
        const door = makeDoor(r, o, fi);
        door.slots = [name, oname];
        r.doors[name] = door; o.doors[oname] = door;
      }
    }
  }

  const theme = FLOORS[fi].theme;
  for (const r of rooms) fillRoom(r, fi, theme);
  const start = byKey.get(sy * MAPW + sx);
  return { rooms, byKey, start, fi };
}

// Une celdas normales vecinas en salas grandes: 2x1, 1x2, L (3 celdas) y 2x2. Solo desde el piso 2.
// Una L deja un hueco que es muro (nunca la celda de la sala secreta) y una 2x2 lo rellena si está aislado.
function bigRoomGroups(fi, cells, typeOf, grid, secretC) {
  const groups = [];
  if (fi < 1) return groups;
  const key = (x, y) => y * MAPW + x, used = new Set();
  const occupied = (x, y) => x >= 0 && y >= 0 && x < MAPW && y < MAPH && grid[key(x, y)] === 1;
  const free = (x, y) => occupied(x, y) && typeOf.get(key(x, y)) === 'normal' && !used.has(key(x, y));
  const has = (g, x, y) => g.some(c => c[0] === x && c[1] === y);
  for (const [x, y] of shuffle(cells.slice(), grng)) {
    if (!free(x, y) || grng() > 0.22) continue;
    const partner = shuffle(N4.map(d => [x + d[0], y + d[1]]), grng).find(([a, b]) => free(a, b));
    if (!partner) continue;
    const g = [[x, y], partner];
    if (grng() < 0.5) {
      const next = [];
      for (const [px, py] of g) for (const d of N4) { const a = px + d[0], b = py + d[1]; if (free(a, b) && !has(g, a, b)) next.push([a, b]); }
      for (const [a, b] of shuffle(next, grng)) {
        const three = [...g, [a, b]], xs = three.map(c => c[0]), ys = three.map(c => c[1]);
        const minx = Math.min(...xs), miny = Math.min(...ys);
        if (Math.max(...xs) - minx > 1 || Math.max(...ys) - miny > 1) continue;
        const hole = [[minx, miny], [minx + 1, miny], [minx, miny + 1], [minx + 1, miny + 1]].find(c => !has(three, c[0], c[1]));
        if (occupied(hole[0], hole[1]) || (secretC && secretC[0] === hole[0] && secretC[1] === hole[1])) continue;
        g.push([a, b]);
        const alone = N4.every(d => { const hx = hole[0] + d[0], hy = hole[1] + d[1]; return has(g, hx, hy) || !occupied(hx, hy); });
        if (alone && grng() < 0.4) g.push(hole);
        break;
      }
    }
    groups.push(g);
    for (const [a, b] of g) used.add(key(a, b));
  }
  return groups;
}

// Reglas de aparición de los tratos (ver docs/TRATOS.md). Todas las cifras son probabilidades de 0 a 1.
const DEAL_RULES = {
  base: 0.55,        // piso sin recibir daño
  hit: 0.2,          // piso en el que te han hecho daño (no se suma la racha)
  streak: 0.05,      // por cada jefe seguido derrotado sin daño en su piso...
  streakMax: 3,      // ...hasta este número de jefes
  special: 0.03,     // por cada sala especial visitada en el piso...
  specialMax: 5,     // ...hasta este número de salas
  taken: 0.08,       // por cada trato ya aceptado en la partida...
  takenMax: 3,       // ...hasta este número de tratos
  item: 0.15,        // por cada pasivo que favorece los tratos (devil, angel)
  min: 0.05, max: 0.95,
  // reparto entre sala del ángel y del diablo (parte de las veces que sale el ángel)
  angelBase: 0.5,    // sin tratos aceptados
  angelItem: 0.25,   // con el pasivo angel
  perDevil: 0.25,    // por cada trato del diablo aceptado, menos ángel...
  perAngel: 0.25,    // ...y por cada trato del ángel aceptado, más ángel (menos diablo)
};
// Salas que cuentan como "especiales vistas": las que no son del recorrido normal del piso
const DEAL_SPECIAL_TYPES = ['shop', 'treasure', 'secret', 'library', 'sacrifice', 'challenge', 'miniboss'];

// Ofertas de las salas del diablo y del ángel (ver docs/TRATOS.md). Cada una es una lista de objetos
// [tipo, pago]: tipo 'p' pasivo o 'a' activo; pago 'hearts' (corazones rojos), 'soul' (corazones de alma),
// 'coins' (monedas), 'key' (llaves) o 'free'. Con choice el jugador solo puede quedarse con uno.
const DEAL_OFFERS = {
  devil: [
    { w: 4, items: [['p', 'hearts'], ['p', 'hearts']] },
    { w: 3, items: [['p', 'hearts'], ['p', 'hearts'], ['p', 'hearts']] },
    { w: 3, items: [['p', 'hearts'], ['a', 'coins']] },
    { w: 2, items: [['p', 'soul'], ['p', 'hearts'], ['a', 'coins']] },
    { w: 2, items: [['p', 'coins'], ['p', 'coins']] },
    { w: 1.5, items: [['p', 'soul'], ['p', 'soul']] },
  ],
  angel: [
    { w: 4, choice: true, items: [['p', 'free'], ['p', 'free']] },
    { w: 3, choice: true, items: [['p', 'free'], ['p', 'free'], ['p', 'free']] },
    { w: 3, choice: true, items: [['p', 'free'], ['a', 'free']] },
    { w: 2, items: [['p', 'free']] },
    { w: 2, items: [['p', 'key'], ['p', 'key']] },
  ],
};

// Sortea la oferta de una sala del diablo o del ángel: lista de { item, hprice | sprice | price | kprice, choice }
// (los precios en monedas dependen de la calidad del objeto; los activos cuestan 10 más)
function dealOffer(angel, rng = Math.random) {
  const pool = angel ? 'angel' : 'devil';
  const offer = weighted(DEAL_OFFERS[pool].map(o => [o, o.w]), rng);
  return offer.items.map(([kind, pay]) => {
    const item = pickItem(pool, rng, kind), q = (ITEMS[item] && ITEMS[item].q) || 0, o = { item };
    if (offer.choice) o.choice = 'angel';
    if (pay === 'hearts') o.hprice = rng() < 0.4 ? 1 : 2;
    else if (pay === 'soul') o.sprice = q >= 3 ? 3 : 2;
    else if (pay === 'coins') o.price = 10 + 5 * q + (kind === 'a' ? 10 : 0);
    else if (pay === 'key') o.kprice = q >= 3 ? 2 : 1;
    return o;
  });
}

// Tras un jefe: probabilidad de que se abra un trato (chance), qué parte de las veces es sala del ángel
// (angelShare) y si salen las dos puertas a la vez (both). run: { floorHit, noHitStreak, specialsSeen, dealsTaken,
// devilDeals, angelDeals } (los que falten valen 0); has(id): ¿tiene el jugador ese pasivo?
function dealChance(run, has) {
  const R = DEAL_RULES;
  let chance = run.floorHit ? R.hit : R.base + R.streak * Math.min(run.noHitStreak || 0, R.streakMax);
  chance -= R.special * Math.min(run.specialsSeen || 0, R.specialMax) + R.taken * Math.min(run.dealsTaken || 0, R.takenMax);
  if (has('devil')) chance += R.item;
  if (has('angel')) chance += R.item;
  chance = clamp(chance, R.min, R.max);
  let angelShare = clamp(R.angelBase + (has('angel') ? R.angelItem : 0) - R.perDevil * (run.devilDeals || 0) + R.perAngel * (run.angelDeals || 0), 0, 1);
  if (has('devil100') || has('eucharist')) chance = 1;
  if (has('eucharist')) angelShare = 1;
  if (has('devil100')) angelShare = 0;
  return { chance, angelShare, both: has('duality') };
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
  setRoomShape(room);
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
      const layout = bossRoomTiles(room.boss, grng);
      if (layout) room.tiles = layout;
      else if (room.boss !== 'mama' && room.boss !== 'corazon' && room.boss !== 'gusano' && grng() < 0.35) {
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
    case 'sacrifice':
      room.tiles = specialRoomTiles('sacrifice', grng);
      room.cleared = true; room.sacs = 0;
      break;
    case 'library':
      room.tiles = specialRoomTiles('library', grng);
      room.cleared = true;
      room.pickups.push(mkPickup('item', tcx(3), tcy(2), { item: pickItem('treasure', grng), price: 12, shop: true }));
      for (let i = 0; i < 3; i++) room.pickups.push(mkPickup('card', tcx(5 + i * 2), tcy(2), { price: 4, shop: true }));
      break;
    case 'challenge': genChallenge(room, fi, theme); break;
    case 'miniboss': genMiniboss(room, fi, theme); break;
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
// Obstáculos y estilos de sala más frecuentes en cada tema: sótano con mierda, cuevas con fosos y barriles,
// profundidades con pinchos, fuego y metal, útero con fuego, mierda y fosos
const THEME_OBSTACLES = {
  basement: [[T.ROCK, 10], [T.POOP, 3], [T.PIT, 0.4], [T.METAL, 0.3], [T.TNT, 0.2], [T.SPIKE, 0.3], [T.FIRE, 0.3]],
  caves: [[T.ROCK, 10], [T.POOP, 1], [T.PIT, 3.5], [T.METAL, 0.8], [T.TNT, 1], [T.SPIKE, 0.6], [T.FIRE, 0.3]],
  depths: [[T.ROCK, 8], [T.POOP, 1], [T.PIT, 3], [T.METAL, 1.5], [T.TNT, 0.8], [T.SPIKE, 2], [T.FIRE, 1.5]],
  womb: [[T.ROCK, 7], [T.POOP, 2.5], [T.PIT, 2.5], [T.METAL, 0.5], [T.TNT, 0.5], [T.SPIKE, 1.2], [T.FIRE, 2]],
};
const THEME_STYLES = {
  basement: [['empty', 1.5], ['scatter', 5], ['center', 3], ['pillars', 3], ['corners', 2], ['lines', 2], ['ring', 1.5], ['poops', 3.5], ['spikes', 0.3], ['fires', 0.6], ['maze', 0.5]],
  caves: [['empty', 1], ['scatter', 5], ['center', 2.5], ['pillars', 3], ['corners', 2.5], ['lines', 2.5], ['ring', 2], ['poops', 1], ['spikes', 1], ['fires', 1], ['maze', 1.5]],
  depths: [['empty', 1], ['scatter', 4], ['center', 2.5], ['pillars', 3], ['corners', 2], ['lines', 2.5], ['ring', 2], ['poops', 1], ['spikes', 2.5], ['fires', 2], ['maze', 2]],
  womb: [['empty', 1], ['scatter', 4], ['center', 2.5], ['pillars', 2.5], ['corners', 2], ['lines', 2], ['ring', 2.5], ['poops', 2.5], ['spikes', 1.5], ['fires', 2.5], ['maze', 2.5]],
};
function obstacle(fi) {
  return weighted(THEME_OBSTACLES[FLOORS[fi].theme], grng);
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
  const D0 = DIRS[DIRNAMES[0]], s = D0.r * COLS + D0.c;
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
    const style = weighted(THEME_STYLES[FLOORS[fi].theme], grng);
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

// casillas alcanzables a 3 o más casillas de toda puerta (donde pueden nacer enemigos)
function farTiles(tiles) {
  return reachable(tiles).filter(([c, r]) => DIRNAMES.every(k => Math.abs(c - DIRS[k].c) + Math.abs(r - DIRS[k].r) >= 3));
}

// Reto: tres oleadas cada vez más duras; room.spawns es la primera y room.waves las siguientes (ver clearRoom)
function genChallenge(room, fi, theme) {
  room.tiles = specialRoomTiles('challenge', grng);
  const far = farTiles(room.tiles), pool = ENEMY_POOLS[theme], waves = [];
  for (let w = 0; w < 3; w++) {
    const types = [weighted(pool, grng), weighted(pool, grng)];
    const spots = shuffle(far.slice(), grng), wave = [];
    let budget = 2 + fi * 0.6 + w * 1.1;
    while (budget > 0 && wave.length < 8 && spots.length) {
      const type = pick(types, grng), [c, r] = spots.pop();
      wave.push({ type, c, r, champ: w === 2 && grng() < 0.25 });
      budget -= EN[type].cost;
    }
    waves.push(wave);
  }
  room.spawns = waves[0]; room.waves = waves.slice(1); room.waveTotal = waves.length;
  room.cleared = false;
}

// Minijefe: un jefe pequeño propio del tema (MINIBOSS_POOLS), solo, en el centro de la sala
function genMiniboss(room, fi, theme) {
  room.tiles = specialRoomTiles('miniboss', grng);
  room.spawns = [{ type: pick(MINIBOSS_POOLS[theme], grng), c: 6, r: 3 }];
  room.cleared = false;
}

// Sala grande: un diseño de 13x7 por celda ocupada, huecos de 3 casillas entre celdas vecinas y muro en el hueco de una L
function genBigLayout(room, fi) {
  const t = new Uint8Array(room.cols * room.rows).fill(T.WALL);
  const cells = room.cells.map(c => [c[0] - room.gx, c[1] - room.gy]);
  setRoomShape(UNIT_SHAPE);
  const pieces = cells.map(() => {
    const tpl = grng() < ROOM_TEMPLATE_CHANCE ? pickRoomTemplate(fi, grng) : null;
    const placed = tpl && templateRoom(tpl, grng);
    return placed ? placed.tiles : genLayout(fi);
  });
  setRoomShape(room);
  cells.forEach(([i, j], n) => {
    for (let r = 0; r < CELL_R; r++) for (let c = 0; c < CELL_C; c++) t[(j * CELL_R + r) * COLS + i * CELL_C + c] = pieces[n][r * CELL_C + c];
  });
  const has = (i, j) => cells.some(c => c[0] === i && c[1] === j);
  for (const [i, j] of cells) {
    if (has(i + 1, j)) for (let r = j * CELL_R + 2; r <= j * CELL_R + 4; r++) t[r * COLS + (i + 1) * CELL_C - 1] = t[r * COLS + (i + 1) * CELL_C] = T.EMPTY;
    if (has(i, j + 1)) for (let c = i * CELL_C + 5; c <= i * CELL_C + 7; c++) t[((j + 1) * CELL_R - 1) * COLS + c] = t[(j + 1) * CELL_R * COLS + c] = T.EMPTY;
  }
  clearDoors(t);
  return t;
}

function genNormal(room, fi, theme) {
  const area = room.cells.length;
  let placed = null;
  if (area > 1) room.tiles = genBigLayout(room, fi);
  else {
    const tpl = grng() < ROOM_TEMPLATE_CHANCE ? pickRoomTemplate(fi, grng) : null;
    placed = tpl && templateRoom(tpl, grng);
    room.tiles = placed ? placed.tiles : genLayout(fi);
  }
  const fixed = placed && placed.spawns.length > 0;
  const reach = reachable(room.tiles);
  const far = farTiles(room.tiles);
  if (grng() < 0.08 || (!fixed && far.length < 3)) {
    room.cleared = true;
    const [c, r] = reach.length ? pick(reach, grng) : [6, 3];
    room.pickups.push(mkPickup(weighted([['chest', 3], ['coin', 3], ['heart', 2], ['key', 2], ['bomb', 2], ['gchest', 1]], grng), tcx(c), tcy(r)));
    return;
  }
  const pool = ENEMY_POOLS[theme];
  if (fixed) {
    for (const s of placed.spawns) room.spawns.push({ type: s.type === 'pool' ? weighted(pool, grng) : s.type, c: s.c, r: s.r, champ: grng() < 0.04 + fi * 0.01 });
  } else {
    const types = [weighted(pool, grng)];
    if (grng() < 0.45) types.push(weighted(pool, grng));
    const D = DIFFICULTY;
    let budget = (D.budgetBase + fi * D.budgetPerFloor + grng() * D.budgetSpread) * D.budgetFloorMul[fi] * area;
    shuffle(far, grng);
    while (budget > 0 && room.spawns.length < 10 * area && far.length) {
      const type = pick(types, grng);
      const n = (type === 'fly' || type === 'afly') ? gri(2, 4) : type === 'spider' ? gri(1, 3) : type === 'merger' ? 2 : 1;
      for (let k = 0; k < n && far.length; k++) {
        const [c, r] = far.pop();
        room.spawns.push({ type, c, r, champ: grng() < 0.04 + fi * 0.01 });
      }
      budget -= EN[type].cost * n;
    }
  }
  room.cleared = room.spawns.length === 0;
  if (grng() < 0.07 && reach.length) {
    const [c, r] = pick(reach, grng);
    room.pickups.push(mkPickup(weighted([['coin', 4], ['bomb', 2], ['key', 2], ['heart', 1], ['pill', 1]], grng), tcx(c), tcy(r)));
  }
}
