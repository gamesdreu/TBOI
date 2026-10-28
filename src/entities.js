'use strict';
/* =========================================================
   Entidades: jugador, disparos, enemigos, familiares, recogibles
   ========================================================= */
const MAX_HEARTS = 12;
const STAT_KEYS = ['speed', 'tps', 'dmg', 'range', 'shot', 'luck'];

// ---------- Jugador ----------
function makePlayer(ch) {
  const p = {
    x: CX, y: CY, vx: 0, vy: 0, r: 11, char: ch, size: 1,
    maxRed: 0, red: 0, soul: 0, black: 0, coins: 0, bombs: 0, keys: 0,
    items: [], active: null, active2: null, pocket: null, revives: [], voidActs: [], box: null,
    fireCd: 0, eye: 0, faceDir: 'down', shootAnim: 0, iframes: 0, shield: 0, invuln: 0, bombCd: 0, actCd: 0, unicorn: 0, jump: 0, doomT: 0, dash: null,
    charge: 0, beamT: 0, walkT: 0, holdItem: null, holdT: 0, dead: false,
    lastDir: { x: 0, y: 1 }, shots: 0, firingT: 0, dirT: 0, lastFireKey: '', stillT: 0, trailT: 0,
    hurtInRoom: false, mantleUp: false, statFx: {}, roomMods: {}, roomItems: [], kills: 0, hits: 0,
  };
  resetPlayerMods(p);
  applyCharTraits(p, ch, false);
  clampHearts(p);
  recalc(p);
  return p;
}

function resetPlayerMods(p) {
  p.mods = { spdAdd: 0, tpsAdd: 0, tpsMult: 1, dmgAdd: 0, dmgMult: 1, rangeAdd: 0, shotAdd: 0, luckAdd: 0 };
  p.flags = {}; p.fx = {}; p.fxc = {}; p.modes = new Set(); p.multishot = 1;
  p.passive = new Set(); p.events = { hurt: [], kill: [], enter: [], clear: [], floor: [], shoot: [] };
  p.bombFx = new Set(); p.auras = new Set(); p.trails = new Set(); p.contactDmg = 0;
}

function applyCharTraits(p, ch, rebuild) {
  p.base = { spd: ch.spd ?? 1, tps: ch.tpsAbs ?? (2.73 + (ch.tps || 0)), dmg: ch.dmgBase ?? 3.5, dmgMult: ch.dmgMult ?? 1, range: (ch.rng ?? 6.5) * 40, shot: ch.sht ?? 1, luck: ch.lck ?? 0 };
  if (p.edenMods) for (const k in p.edenMods) p.base[k] += p.edenMods[k];
  if (ch.tpsMult) p.mods.tpsMult *= ch.tpsMult;
  p.noRed = !!ch.noRed; p.keeper = !!ch.keeper; p.lost = !!ch.lost; p.blind = !!ch.blind; p.brimShort = !!ch.brimShort;
  if (ch.flight) p.flags.flight = true;
  if (ch.spectral) p.fx.spectral = true;
  if (ch.mantle) p.passive.add('mantle');
  if (ch.x3) p.multishot = Math.max(p.multishot, 3);
  if (ch.x4) p.multishot = 4;
  if (ch.mode) p.modes.add(ch.mode);
  if (ch.contact) p.contactDmg = ch.contact;
  if (ch.cycle2) p.passive.add('cycle2');
  if (ch.coinKills) p.passive.add('coinkills');
  if (ch.rerollOnHurt) p.passive.add('edenhurt');
  if (ch.esau) addFamiliar('esau');
  if (rebuild) return;
  for (const c of ch.hp) {
    if (c === 'r' || c === 'h' || c === 'm') { p.maxRed++; p.red += 2; }
    else if (c === 'e') p.maxRed++;
    else if (c === 'a') p.soul += 2;
    else if (c === 'n') p.black += 2;
  }
  p.coins = ch.coins || 0; p.bombs = ch.bombs || 0; p.keys = ch.keys || 0;
  if (ch.random) edenize(p);
  for (const id of ch.items || []) giveItemTo(p, id, true);
  if (ch.active) p.active = { id: ch.active, charge: ITEMS[ch.active].charge };
  if (ch.card != null) p.pocket = { k: 'card', v: ch.card };
  if (ch.pill) p.pocket = { k: 'pill', v: ri(0, PILL_COLORS.length - 1) };
  if (ch.reviveAs) p.revives.push(ch.reviveAs);
}

function edenize(p) {
  p.edenMods = { spd: rr(-0.15, 0.15), tps: rr(-0.4, 0.4), dmg: rr(-0.75, 0.75), range: rr(-40, 40), shot: rr(-0.15, 0.15), luck: ri(-1, 1) };
  for (const k in p.edenMods) p.base[k] += p.edenMods[k];
  p.bombs = ri(0, 2); p.keys = ri(0, 1); p.coins = ri(0, 5);
  const pas = ITEM_IDS.filter(k => ITEMS[k].kind === 'p' && ITEMS[k].pools.treasure);
  const act = ITEM_IDS.filter(k => ITEMS[k].kind === 'a' && ITEMS[k].pools.treasure);
  giveItemTo(p, pick(pas), true);
  const a = pick(act); p.active = { id: a, charge: ITEMS[a].charge };
  p.char = Object.assign({}, p.char, { look: Object.assign({}, p.char.look, { hair: { c: `hsl(${ri(0, 360)},45%,${ri(20, 70)}%)`, s: pick(['short', 'long', 'spiky']) } }) });
}

function edenReroll(p) {
  rerollPassives(p);
  if (p.active) { const act = ITEM_IDS.filter(k => ITEMS[k].kind === 'a' && ITEMS[k].pools.treasure); const a = pick(act); p.active = { id: a, charge: ITEMS[a].charge }; }
}

function luckChance(p) { return clamp(0.2 + p.luck * 0.05, 0.05, 0.9); }
function chanceFx(p, k) { return p.fx[k] || (p.fxc[k] && Math.random() < luckChance(p)); }
function isFlying(p) { return !!(p.flags.flight || p.roomMods.flight || (p.passive.has('emptyvessel') && p.red === 0)); }
function coinCap(p) { return p.passive.has('deeppockets') ? 999 : 99; }

function recalc(p) {
  const m = p.mods, b = p.base, r = p.roomMods, P = p.passive;
  const old = STAT_KEYS.map(k => p[k]);
  let spd = b.spd + m.spdAdd + (r.spd || 0);
  let tps = (b.tps + m.tpsAdd + (r.tps || 0)) * m.tpsMult;
  let dmgAdd = m.dmgAdd + (r.dmg || 0);
  let range = b.range + m.rangeAdd, shot = b.shot + m.shotAdd, luck = b.luck + m.luckAdd;
  let dmgMult = m.dmgMult * b.dmgMult;
  const low = p.red <= 2 && p.maxRed > 0 || (p.maxRed === 0 && !p.lost);
  if (P.has('whore') && low) { dmgAdd += 1.5; spd += 0.3; }
  if (p.char.eve && low) dmgMult /= 0.75;
  if (P.has('moneypower')) dmgAdd += 0.04 * p.coins;
  if (p.bloodyLust) dmgAdd += [0, 0.5, 1, 2, 3, 4.2, 5.4][Math.min(6, p.bloodyLust)];
  if (p.lusty) dmgAdd += 0.5 * p.lusty;
  if (P.has('darkcrown') && p.red === 2) { tps += 0.75; range += 40; shot += 0.2; }
  if (P.has('crown') && p.red === p.maxRed * 2 && !p.hurtInRoom) { dmgMult *= 2; range += 56; shot -= 0.3; }
  if (P.has('adrenaline')) dmgAdd += 0.35 * Math.max(0, p.maxRed - Math.ceil(p.red / 2));
  if (p.paschal) tps += 0.4 * p.paschal;
  if (p.redstew > 0) dmgAdd += p.redstew;
  if (p.solFloor) dmgAdd += 3;
  if (p.purity && p.purity.on) { const k = p.purity.stat; if (k === 'dmg') dmgAdd += 2; else if (k === 'tps') tps += 1; else if (k === 'spd') spd += 0.4; else range += 120; }
  if (p.bloodoath) { dmgAdd += p.bloodoath * 0.5; spd += 0.1 * p.bloodoath; }
  if (p.gust) { spd += 0.05 * p.gust; tps += 0.25 * p.gust; }
  if (p.brittleHits) tps += 0.2 * p.brittleHits;
  if (p.taurus) spd += p.taurus * 0.9;
  if (p.starBuff) { dmgMult *= 1.5; tps *= 1.5; }
  if (p.unicorn > 0) spd += 0.3;
  if (G.run && G.run.dmgx) dmgMult *= 5;
  p.speed = clamp(spd, 0.45, 2);
  if (P.has('pony')) p.speed = Math.max(p.speed, 1.5);
  p.tps = clamp(tps, 0.4, 16);
  p.dmg = Math.max(0.5, (b.dmg + dmgAdd) * dmgMult);
  p.range = clamp(range, 100, 800);
  p.shot = clamp(shot, 0.5, 2.5);
  p.luck = luck;
  if (P.has('libra')) {
    const avg = (p.speed / 1 + p.tps / 2.73 + p.dmg / 3.5 + p.range / 260) / 4;
    p.speed = clamp(avg, 0.45, 2); p.tps = avg * 2.73; p.dmg = avg * 3.5; p.range = clamp(avg * 260, 100, 800);
  }
  if (P.has('rockbottom')) {
    if (!p.rb) p.rb = {};
    for (const k of STAT_KEYS) { if (p.rb[k] != null && p[k] < p.rb[k]) p[k] = p.rb[k]; p.rb[k] = p[k]; }
  }
  STAT_KEYS.forEach((k, i) => {
    if (old[i] == null) return;
    const d = p[k] - old[i];
    if (Math.abs(d) < 0.005) return;
    const prev = p.statFx[k];
    p.statFx[k] = { d: d + (prev && prev.t > 0 ? prev.d : 0), t: 2.5 };
  });
}

// ---------- Corazones ----------
function clampHearts(p) {
  if (p.lost) { p.maxRed = 0; p.red = 0; p.soul = 0; p.black = 0; return; }
  if (p.noRed && p.maxRed) { p.soul += p.maxRed * 2; p.maxRed = 0; }
  if (p.noRed) p.red = 0;
  p.maxRed = clamp(p.maxRed, 0, p.keeper ? 4 : MAX_HEARTS);
  if (p.keeper) { p.soul = 0; p.black = 0; }
  const cap = (MAX_HEARTS - p.maxRed) * 2;
  if (p.soul + p.black > cap) {
    const over = p.soul + p.black - cap, fromSoul = Math.min(p.soul, over);
    p.soul -= fromSoul; p.black = Math.max(0, p.black - (over - fromSoul));
  }
  p.red = clamp(p.red, 0, p.maxRed * 2);
}
function canHealRed(p) { return !p.lost && !p.noRed && p.red < p.maxRed * 2; }
function healRed(p, h) {
  if (!canHealRed(p)) return false;
  const before = p.red;
  p.red = Math.min(p.maxRed * 2, p.red + h * (p.passive.has('maggybow') ? 2 : 1));
  if (p.red > before && p.passive.has('candyheart')) p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd', 'rangeAdd'])] += 0.05 * (p.red - before);
  return true;
}
function canAddSoul(p) { return !p.lost && !p.keeper && p.maxRed * 2 + p.soul + p.black < MAX_HEARTS * 2; }
function addContainers(p, n) { addHp(p, 'hp', n); }

// Daño en medios corazones según el piso
function dmgUnit(boss) { const f = G.floorIdx; return boss ? (f >= 2 ? 2 : 1) : (f >= 4 ? 2 : 1); }

function hurtPlayer(halves, source, opts = {}) {
  const p = G.player;
  if (!p || p.dead || G.state !== 'playing') return false;
  if (G.run && G.run.god) return false;
  if (p.iframes > 0 || p.shield > 0 || p.invuln > 0 || p.leafOn) return false;
  if (p.passive.has('isaacheart') && !opts.heart) return false;
  if (p.passive.has('cone') && Math.random() < 0.2) { p.iframes = 0.6; Sfx.play('tink'); return false; }
  if (p.mantleUp) {
    p.mantleUp = false; p.iframes = 1; Sfx.play('tink');
    G.effects.push({ type: 'poof', x: p.x, y: p.y - 10, t: 0, max: 0.5, r: 24 });
    return true;
  }
  let h = p.passive.has('wafer') ? 1 : halves;
  if (p.lost) h = 99;
  const blackBefore = Math.ceil(p.black / 2);
  if (p.soul > 0) { const s = Math.min(p.soul, h); p.soul -= s; h -= s; }
  if (h > 0 && p.black > 0) { const s = Math.min(p.black, h); p.black -= s; h -= s; }
  if (Math.ceil(p.black / 2) < blackBefore) G.damageAll(40);
  if (h > 0) p.red = Math.max(0, p.red - h);
  p.iframes = 1.0; p.hurtInRoom = true; p.hits++;
  G.run.floorHit = true;
  G.shake = Math.max(G.shake, 0.25);
  Sfx.play('hurt');
  bloodBurst(p.x, p.y - 10, 7);
  if (p.red <= 0 && p.soul <= 0 && p.black <= 0) {
    if (tryRevive(p)) return true;
    G.killPlayer(source);
    return true;
  }
  const P = p.passive;
  if (P.has('bloodylust')) p.bloodyLust = Math.min(6, (p.bloodyLust || 0) + 1);
  if (P.has('brittle')) p.brittleHits = Math.min(10, (p.brittleHits || 0) + 1);
  if (P.has('cambion') && p.hits % 10 === 0) addFamiliar(pick(['demonbaby', 'lilbrim', 'lilhaunt', 'shade', 'succubus']));
  if (P.has('scapular') && !p.scapularUsed && p.red + p.soul + p.black <= 1) { p.scapularUsed = true; p.soul += 2; }
  if (P.has('edenhurt')) edenReroll(p);
  if (p.purity) p.purity.on = false;
  for (const f of G.familiars) {
    if (f.name === 'holywater') G.pcreeps.push({ x: f.x, y: f.y, r: 45, t: 4, max: 4, dmg: 8, kind: 'dmg', col: 'holy' });
    if (f.name === 'egg') { EFX.flies(p, [2]); }
  }
  fireEvent('hurt', {});
  return true;
}

function tryRevive(p) {
  while (p.revives.length) {
    const k = p.revives.shift();
    if (k === '50' && Math.random() < 0.5) continue;
    reviveAs(p, k);
    return true;
  }
  return false;
}
function changeChar(p, ch) {
  p.char = Object.assign({}, ch);
  rebuildPlayer(p);
  for (const id of ch.items || []) if (!p.items.includes(id)) giveItemTo(p, id, true);
}
function reviveAs(p, k) {
  switch (k) {
    case 'bluebaby': changeChar(p, SPECIAL_CHARS.bluebaby); p.maxRed = 0; p.red = 0; p.soul = 6; break;
    case 'darkjudas': changeChar(p, SPECIAL_CHARS.darkjudas); p.maxRed = 0; p.red = 0; p.black = 4; break;
    case 'lazrisen': case 'laz': changeChar(p, SPECIAL_CHARS.lazrisen); p.maxRed = Math.max(1, p.maxRed); p.red = 2; break;
    case 'cat': p.maxRed = 1; p.red = 2; if (p.noRed) p.soul = 2; break;
    case 'heartbreak': p.maxRed = Math.max(1, p.maxRed - 1); p.red = 2; break;
    case '50': case 'child':
      p.maxRed = Math.max(1, p.maxRed); p.red = 1; if (p.noRed) p.soul = 1;
      if (k === 'child') { p.size = Math.max(0.6, (p.size || 1) * 0.75); p.mods.spdAdd += 0.2; }
      break;
    default:
      if (p.noRed) p.soul = 6; else { p.maxRed = Math.max(p.maxRed, 1); p.red = p.maxRed * 2; }
  }
  if (p.lost) { p.mantleUp = true; }
  p.iframes = 2; p.shield = 1.5;
  clampHearts(p); recalc(p);
  Sfx.play('item');
  G.showBanner('¡Has resucitado!', '', 1.6);
}

// ---------- Actualización del jugador ----------
function updatePlayer(p, dt) {
  const P = p.passive;
  for (const k of ['iframes', 'shield', 'invuln', 'holdT', 'shootAnim', 'bombCd', 'actCd', 'unicorn', 'jump']) if (p[k] > 0) p[k] -= dt;
  for (const k in p.statFx) p.statFx[k].t -= dt;
  if (p.redstew > 0) p.redstew = Math.max(0, p.redstew - dt * 0.3);
  recalc(p);

  // movimiento
  const mv = Input.move;
  const moving = Math.abs(mv.x) + Math.abs(mv.y) > 0.1;
  if (p.dash) {
    p.vx = p.dash.x * 480; p.vy = p.dash.y * 480;
    p.dash.t -= dt;
    for (const e of G.enemies) if (!e.dead && !e.invisible && !e.untargetable && dist(e, p) < e.r + p.r + 4) { if (!e.dashHit) { e.dashHit = true; damageEnemy(e, 25 + p.dmg * 2, { vx: p.vx, vy: p.vy }); } }
    if (p.dash.t <= 0) { p.dash = null; for (const e of G.enemies) e.dashHit = false; }
  } else {
    const sp = 165 * p.speed;
    const k = Math.min(1, dt * 11);
    p.vx += (mv.x * sp - p.vx) * k;
    p.vy += (mv.y * sp - p.vy) * k;
  }
  p.x += p.vx * dt; p.y += p.vy * dt;
  if (moving) p.walkT += dt * (7 + p.speed * 4);
  const fly = isFlying(p) || p.jump > 0 || !!p.dash;
  const hit = collideTiles(p, G.room.tiles, fly ? solidFlyer : P.has('ladder') ? (t => solidWalk(t) && t !== T.PIT) : solidWalk);
  if (hit && P.has('leo')) breakNear(p);
  G.playerBounds(p);
  if (G.state !== 'playing') return;

  // peligros del suelo
  const pc = txOf(p.x), pr = tyOf(p.y), tiles = G.room.tiles;
  if (!fly && !P.has('socks') && inGrid(pc, pr) && tiles[pr * COLS + pc] === T.SPIKE && hurtPlayer(2, 'Unos pinchos') && G.room.type === 'sacrifice') G.sacrifice();
  if (!P.has('fireimmune')) for (let r = pr - 1; r <= pr + 1; r++) for (let c = pc - 1; c <= pc + 1; c++) {
    if (!inGrid(c, r) || tiles[r * COLS + c] !== T.FIRE) continue;
    const bx = X0 + c * TILE, by = Y0 + r * TILE;
    const nx = clamp(p.x, bx + 4, bx + TILE - 4), ny = clamp(p.y, by + 4, by + TILE - 4);
    if (Math.hypot(p.x - nx, p.y - ny) < p.r + 6) hurtPlayer(1, 'El fuego');
  }

  // efectos pasivos con el tiempo
  const fireNow = !!(Input.fire.x || Input.fire.y);
  p.stillT = moving || fireNow ? 0 : p.stillT + dt;
  p.leafOn = P.has('leaf') && p.stillT > 1;
  if (P.has('toothnail')) { p.tnT = (p.tnT || 0) + dt; if (p.tnT > 6) { p.tnT = 0; p.invuln = Math.max(p.invuln, 1); } }
  if (P.has('taurus') && !G.room.cleared) { p.taurus = Math.min(1, (p.taurus || 0) + dt / 12); if (p.taurus >= 1) { p.taurus = 0; p.unicorn = 5; p.invuln = 5; } } else p.taurus = 0;
  if (P.has('regen')) { p.regenT = (p.regenT || 0) + dt; if (p.regenT >= 40) { p.regenT = 0; healRed(p, 1); } }
  if (P.has('emptyvessel') && p.red === 0) { p.evT = (p.evT || 0) + dt; if (p.evT > 40) { p.evT = 0; p.shield = Math.max(p.shield, 3); } }
  if (P.has('jupiter') && p.stillT > 0.6) { p.jupT = (p.jupT || 0) + dt; if (p.jupT > 1.2) { p.jupT = 0; G.pcreeps.push({ x: p.x, y: p.y, r: 40, t: 2.5, max: 2.5, dmg: 0, kind: 'gas' }); } }
  if (p.doomT > 0) { p.doomT -= dt; if (p.doomT <= 0) { p.iframes = 0; p.shield = 0; p.invuln = 0; p.mantleUp = false; const god = G.run.god; G.run.god = false; hurtPlayer(99, 'Plan C'); G.run.god = god; } }
  const trail = p.roomTrail || (p.trails.size ? [...p.trails][0] : null);
  if (trail && moving) { p.trailT -= dt; if (p.trailT <= 0) { p.trailT = 0.2; G.pcreeps.push({ x: p.x, y: p.y + 6, r: 16, t: 3, max: 3, dmg: trail === 'tar' ? 0 : trail === 'black' ? 2 : 4, kind: trail === 'tar' ? 'slow' : 'dmg', col: trail }); } }
  if (p.unicorn > 0 || p.dash) for (const e of G.enemies) if (!e.dead && !e.invisible && !e.untargetable && dist(e, p) < e.r + p.r) { e.uniT = (e.uniT || 0) - dt; if (e.uniT <= 0) { e.uniT = 0.3; damageEnemy(e, 20 + p.dmg, { vx: e.x - p.x, vy: e.y - p.y }); } }

  // orientación
  const f = Input.fire;
  if (fireNow) p.faceDir = Math.abs(f.y) >= Math.abs(f.x) ? (f.y < 0 ? 'up' : 'down') : (f.x < 0 ? 'left' : 'right');
  else if (moving) p.faceDir = Math.abs(mv.x) > Math.abs(mv.y) ? (mv.x < 0 ? 'left' : 'right') : (mv.y < 0 ? 'up' : 'down');
  else p.faceDir = 'down';

  if (!p.blind && !(p.unicorn > 0)) handleFiring(p, dt);
  else if (p.blind && fireNow) { const v = fireVec(p); p.lastDir = v; Input.lastDir = v; }

  if (Input.take('bomb')) placeBomb(p);
  if (Input.take('active')) useActive(p);
  if (Input.take('pill')) usePocket(p);
  if (Input.take('swap') && p.active2) { const a = p.active; p.active = p.active2; p.active2 = a; Sfx.play('select'); }
}

function breakNear(p) {
  const pc = txOf(p.x), pr = tyOf(p.y), t = G.room.tiles;
  for (let r = pr - 1; r <= pr + 1; r++) for (let c = pc - 1; c <= pc + 1; c++) {
    if (!inGrid(c, r)) continue;
    const v = t[r * COLS + c];
    if (v !== T.ROCK && v !== T.TINTED && v !== T.POOP) continue;
    const bx = X0 + c * TILE, by = Y0 + r * TILE;
    if (Math.hypot(p.x - clamp(p.x, bx, bx + TILE), p.y - clamp(p.y, by, by + TILE)) < p.r + 2) destroyTile(c, r);
  }
}

// ---------- Disparo ----------
function fireVec(p) {
  const f = Input.fire;
  if (p.fx.analog && Input.fireVec && (Input.fireVec.x || Input.fireVec.y)) {
    const v = Input.fireVec, l = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / l, y: v.y / l };
  }
  return { x: f.x, y: f.y };
}

const MODE_ORDER = ['brim', 'techx', 'knife', 'epic', 'ludo', 'sword', 'club', 'laser', 'lung', 'cursed', 'choco', 'haemo', 'fetus', 'ipecac'];
function activeMode(p) {
  if (p.roomMods.brim) return 'brim';
  for (const m of MODE_ORDER) if (p.modes.has(m)) return m;
  return 'tears';
}
function effTps(p) {
  let t = p.tps;
  if (p.passive.has('epiphora')) t *= 1 + Math.min(1, p.dirT / 3);
  return t;
}
function chargeTime(p, mode) {
  const base = { techx: 2.2, choco: 2.5, lung: 3.2, cursed: 1.8, maw: 0, brim: 2.3 }[mode] || 2.3;
  return clamp(base / p.tps, 0.3, 3);
}

function handleFiring(p, dt) {
  const firing = !!(Input.fire.x || Input.fire.y);
  const dir = firing ? fireVec(p) : null;
  if (firing) {
    const key = dir.x.toFixed(2) + dir.y.toFixed(2);
    if (key === p.lastFireKey) p.dirT += dt; else { p.dirT = 0; p.lastFireKey = key; }
    p.lastDir = dir; Input.lastDir = dir;
    p.firingT += dt;
  } else { p.dirT = 0; }
  p.fireCd -= dt;
  const mode = activeMode(p);
  switch (mode) {
    case 'brim': {
      if (p.beamT > 0) { p.beamT -= dt; p.charge = 0; break; }
      if (firing) { p.chargeDir = dir; p.charge += dt; }
      else { if (p.charge >= chargeTime(p, 'brim')) fireBrim(p, p.chargeDir); p.charge = 0; }
      break;
    }
    case 'knife': updateKnife(p, dt, firing, dir); break;
    case 'epic': updateEpic(p, dt, firing, dir); break;
    case 'ludo': updateLudo(p, dt, firing, dir); break;
    case 'techx': case 'choco': case 'lung': case 'cursed':
      if (firing) { p.chargeDir = dir; p.charge = Math.min(1, p.charge + dt / chargeTime(p, mode)); }
      else if (p.charge > 0) { releaseCharge(p, mode, p.chargeDir, p.charge); p.charge = 0; }
      break;
    case 'sword': case 'club':
      if (firing && p.fireCd <= 0) { meleeSwing(p, dir, mode); p.fireCd += 1 / p.tps * (mode === 'club' ? 1.5 : 1.25); }
      break;
    default:
      if (firing && p.fireCd <= 0) { fireShot(p, dir, mode); p.fireCd += 1 / effTps(p); }
  }
  if (p.fireCd < 0) p.fireCd = 0;
  // efectos que se suman a cualquier modo
  if (firing && p.modes.has('tech2') && mode !== 'brim') {
    p.t2T = (p.t2T || 0) - dt;
    if (p.t2T <= 0) { p.t2T = 0.05; const len = rayLen(p.x, p.y, dir.x, dir.y); laserHit(p.x, p.y, p.x + dir.x * len, p.y + dir.y * len, 4, p.dmg * 0.13, { vx: dir.x, vy: dir.y }, p.fx); }
    G.effects.push({ type: 'laser', x0: p.x, y0: p.y - 14, x1: p.x + dir.x * rayLen(p.x, p.y, dir.x, dir.y), y1: p.y - 14 + dir.y * rayLen(p.x, p.y, dir.x, dir.y), t: 0, max: DT * 1.5, color: '#ff5050', w: 1.5 });
  }
  if (p.modes.has('maw') || p.passive.has('revelation') || p.passive.has('numbertwo')) {
    if (firing) p.extraCharge = (p.extraCharge || 0) + dt;
    else if (p.extraCharge > 0) {
      if (p.extraCharge >= 2.5) {
        if (p.modes.has('maw')) G.rings.push({ x: p.x, y: p.y, t: 1, r: 70, dmg: p.dmg * 1.2, follow: true, dark: true });
        if (p.passive.has('revelation')) { G.beams.push({ dx: p.lastDir.x, dy: p.lastDir.y, t: 0.5, tick: 0, dmg: p.dmg * 1.1, w: 15, color: 'holy' }); Sfx.play('brim'); }
      }
      if (p.passive.has('numbertwo') && p.extraCharge >= 3) G.bombs.push({ x: p.x, y: p.y + 2, r: 10, t: 1.2, free: false, fx: new Set(['confuse']) });
      p.extraCharge = 0;
    }
  }
  if (firing && p.passive.has('deadtooth')) { p.dtT = (p.dtT || 0) - dt; if (p.dtT <= 0) { p.dtT = 0.3; for (const e of G.enemies) if (!e.dead && dist(e, p) < 60) applyStatus(e, 'poison', 2, p.dmg * 0.3); } }
  if (!firing) p.firingT = 0;
}

function shotAngles(p, dir) {
  const base = Math.atan2(dir.y, dir.x);
  const n = p.multishot;
  let spread = n === 1 ? [0] : n === 2 ? [0, 0] : n === 3 ? [-0.1, 0, 0.1] : [-0.18, -0.06, 0.06, 0.18];
  if (p.fx.wiz) spread = [-0.6, 0.6];
  const out = spread.map((s, i) => ({ a: base + s, off: n === 2 && !p.fx.wiz ? (i ? 6 : -6) : 0 }));
  if (chanceFx(p, 'loki')) for (const k of [Math.PI / 2, Math.PI, -Math.PI / 2]) out.push({ a: base + k, off: 0 });
  if (chanceFx(p, 'back')) out.push({ a: base + Math.PI, off: 0 });
  if (chanceFx(p, 'sore')) for (let i = 0; i < ri(1, 2); i++) out.push({ a: Math.random() * TAU, off: 0 });
  return out;
}

function tearColor(fx, p) {
  if (fx.teeth || fx.apple) return '#f4f0e6';
  if (fx.needle) return '#d8dce4';
  if (fx.holy) return '#fff2b0';
  if (fx.burn) return '#ff9a40';
  if (fx.poison) return '#5fcf5f';
  if (fx.freeze) return '#9aa6b4';
  if (fx.charm) return '#ff86c8';
  if (fx.fear) return '#6a4a7a';
  if (fx.electric) return '#ffe060';
  if (fx.slow) return '#e8f4ff';
  if (fx.bleed) return '#b01818';
  if (p && (p.fx.blood || p.modes.has('brim') || p.char.id === 'samson')) return '#d8343a';
  if (fx.homing) return '#c48cff';
  if (p && p.fx.yellow) return '#e8d24a';
  return '#a8cdf5';
}

function makeTear(x, y, vx, vy, p, dmg, o = {}) {
  const fx = {};
  if (!o.plain) {
    Object.assign(fx, p.fx);
    if (p.roomMods.homing) fx.homing = true;
    for (const k in p.fxc) if (Math.random() < luckChance(p)) fx[k] = true;
    if (fx.randtear) { for (let i = 0; i < ri(1, 2); i++) fx[pick(RAND_TEAR)] = true; }
  }
  if (o.fx) Object.assign(fx, o.fx);
  let d = dmg;
  if (fx.teeth || fx.apple) d *= 3.2;
  const r = clamp(3.2 + Math.sqrt(Math.max(0.5, d)) * 1.35, 3.5, 13) * (fx.big ? 1.4 : 1) * (o.plain ? 1 : (p.size || 1));
  const sp = Math.max(60, Math.hypot(vx, vy));
  const life = (o.range || p.range) / sp;
  return {
    x, y, vx, vy, z: 18, life, max: life, dmg: d, r, fx, color: o.color || tearColor(fx, o.plain ? null : p),
    hit: null, dist: 0, kind: o.kind || 'tear', flame: !!o.flame, arc: !!o.arc,
  };
}

function fireShot(p, dir, mode) {
  p.shootAnim = 0.12; p.shots++;
  p.eye ^= 1;
  fireEvent('shoot', {});
  const P = p.passive;
  if (mode === 'laser') {
    for (const s of shotAngles(p, dir)) fireLaser(p, s.a);
    Sfx.play('laser');
    return;
  }
  let gold = false;
  if (P.has('greed') && p.shots % 20 === 0 && p.coins > 0) { p.coins--; gold = true; }
  const spd = 360 * p.shot;
  for (const s of shotAngles(p, dir)) {
    const a = s.a;
    const off = s.off || (p.multishot === 1 ? (p.eye ? 5 : -5) : 0);
    const px = -Math.sin(a) * off, py = Math.cos(a) * off;
    const vx = Math.cos(a) * spd + p.vx * 0.3, vy = Math.sin(a) * spd + p.vy * 0.3;
    const t = makeTear(p.x + px + Math.cos(a) * 6, p.y + py + Math.sin(a) * 4, vx, vy, p, p.dmg);
    if (mode === 'fetus') { t.kind = 'fetus'; t.vx *= 0.75; t.vy *= 0.75; t.life *= 1.2; t.r = 8; t.color = '#2b2b30'; }
    if (mode === 'ipecac') { t.kind = 'ipecac'; t.arc = true; t.fx.spectral = true; t.color = '#9fd65a'; }
    if (mode === 'haemo') { t.kind = 'haemo'; t.arc = true; t.dmg *= 1.3; t.color = '#c01818'; }
    if (gold) { t.fx.freeze = true; t.dmg *= 1.5; t.color = '#f2c43a'; t.gold = true; }
    if (p.fx.orbitear || chanceFx(p, 'orbitear') && p.fxc.orbitear) t.orbit = { a: Math.atan2(t.y - p.y, t.x - p.x), r: 26, grow: 30 };
    G.tears.push(t);
  }
  if (P.has('pencil') && p.shots % 15 === 0) for (let i = 0; i < 8; i++) { const a = Math.atan2(dir.y, dir.x) + rr(-0.35, 0.35); G.tears.push(makeTear(p.x, p.y, Math.cos(a) * spd * rr(0.8, 1.1), Math.sin(a) * spd * rr(0.8, 1.1), p, p.dmg)); }
  if (chanceFx(p, 'tech5') && p.fxc.tech5) fireLaser(p, Math.atan2(dir.y, dir.x));
  if (chanceFx(p, 'kidney') && p.fxc.kidney && Math.random() < 0.15) { for (let i = 0; i < 12; i++) { const a = Math.atan2(dir.y, dir.x) + rr(-0.5, 0.5); G.tears.push(makeTear(p.x, p.y, Math.cos(a) * spd * rr(0.7, 1.2), Math.sin(a) * spd * rr(0.7, 1.2), p, p.dmg)); } p.fireCd += 0.6; }
  if (chanceFx(p, 'firepepper') && p.fxc.firepepper && Math.random() < 0.3) G.tears.push(makeTear(p.x, p.y, dir.x * spd * 0.7, dir.y * spd * 0.7, p, p.dmg * 2, { plain: true, flame: true, color: '#ff8a2a', range: 220 }));
  if (chanceFx(p, 'evileye') && p.fxc.evileye && Math.random() < 0.25) G.eyes.push({ x: p.x, y: p.y - 6, vx: dir.x * 60, vy: dir.y * 60, dx: dir.x, dy: dir.y, cd: 0, life: 6 });
  Sfx.play(mode === 'fetus' ? 'bombput' : 'tear');
}

function rayLen(ox, oy, dx, dy) {
  let t = 3000;
  if (dx > 1e-4) t = Math.min(t, (X1 - ox) / dx);
  if (dx < -1e-4) t = Math.min(t, (X0 - ox) / dx);
  if (dy > 1e-4) t = Math.min(t, (Y1 - oy) / dy);
  if (dy < -1e-4) t = Math.min(t, (Y0 - 4 - oy) / dy);
  return Math.max(0, t);
}

function laserHit(x0, y0, x1, y1, w, dmg, src, fx) {
  for (const e of G.enemies) {
    if (e.dead || e.untargetable || e.invisible) continue;
    const rr2 = e.r + w;
    if (segDist2(e.x, e.y, x0, y0, x1, y1) < rr2 * rr2) hitEnemy(e, dmg, src, fx || {}, true);
  }
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 20);
  for (let i = 0; i <= steps; i++) {
    const c = txOf(lerp(x0, x1, i / steps)), r = tyOf(lerp(y0, y1, i / steps));
    if (inGrid(c, r)) { const t = G.room.tiles[r * COLS + c]; if (t === T.POOP || t === T.FIRE || t === T.TNT) hitTile(c, r); }
  }
}

function fireLaser(p, a) {
  const dx = Math.cos(a), dy = Math.sin(a);
  const len = rayLen(p.x, p.y, dx, dy);
  const x1 = p.x + dx * len, y1 = p.y + dy * len;
  const fx = Object.assign({}, p.fx); for (const k in p.fxc) if (Math.random() < luckChance(p)) fx[k] = true;
  laserHit(p.x, p.y, x1, y1, 5, p.dmg, { vx: dx, vy: dy }, fx);
  G.effects.push({ type: 'laser', x0: p.x, y0: p.y - 14, x1, y1: y1 - 14, t: 0, max: 0.12, color: '#ff4a4a', w: 3 });
}

function fireBrim(p, d) {
  G.beams.push({ dx: d.x, dy: d.y, t: 0.42, tick: 0, dmg: p.dmg * 0.95, w: 13, max: p.brimShort ? 150 + (p.range - 180) * 0.5 : 0 });
  p.beamT = 0.42;
  G.shake = Math.max(G.shake, 0.15);
  Sfx.play('brim');
}

function updateBeams(dt) {
  const p = G.player;
  for (const b of G.beams) {
    b.t -= dt; b.tick -= dt;
    const ox = b.fixed ? b.fixed.x : p.x, oy = b.fixed ? b.fixed.y : p.y;
    if (b.follow && (Input.fire.x || Input.fire.y)) { b.dx = p.lastDir.x; b.dy = p.lastDir.y; }
    let len = rayLen(ox, oy, b.dx, b.dy);
    if (b.max) len = Math.min(len, b.max);
    b.x0 = ox; b.y0 = oy; b.x1 = ox + b.dx * len; b.y1 = oy + b.dy * len;
    if (b.tick <= 0) { b.tick = 0.07; laserHit(b.x0, b.y0, b.x1, b.y1, b.w, b.dmg, { vx: b.dx, vy: b.dy }, b.color ? {} : p.fx); }
  }
  G.beams = G.beams.filter(b => b.t > 0);
}

// Disparos cargados: Tech X, Batido de chocolate, Pulmón de Monstro, Ojo maldito
function releaseCharge(p, mode, dir, k) {
  p.shootAnim = 0.15;
  const spd = 360 * p.shot;
  if (mode === 'techx') {
    const t = makeTear(p.x, p.y, dir.x * spd * 0.8, dir.y * spd * 0.8, p, p.dmg * (0.3 + 0.9 * k));
    t.ring = 10 + 32 * k; t.r = t.ring; t.fx.pierce = true; t.fx.spectral = true; t.kind = 'techx'; t.color = '#ff5050';
    G.tears.push(t); Sfx.play('laser');
  } else if (mode === 'choco') {
    const t = makeTear(p.x, p.y, dir.x * spd, dir.y * spd, p, p.dmg * (0.3 + 2.7 * k));
    t.color = '#8a5a3a'; G.tears.push(t); Sfx.play('tear');
  } else if (mode === 'lung') {
    if (k < 0.85) { G.tears.push(makeTear(p.x, p.y, dir.x * spd, dir.y * spd, p, p.dmg)); return; }
    const base = Math.atan2(dir.y, dir.x);
    for (let i = 0; i < 14; i++) { const a = base + rr(-0.4, 0.4), s = spd * rr(0.65, 1.15); G.tears.push(makeTear(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, p, p.dmg)); }
    Sfx.play('spit');
  } else if (mode === 'cursed') {
    const n = 1 + Math.floor(k * 4.99);
    for (let i = 0; i < n; i++) { const t = makeTear(p.x - dir.x * i * 12, p.y - dir.y * i * 12, dir.x * spd, dir.y * spd, p, p.dmg); G.tears.push(t); }
    Sfx.play('tear');
  }
}

// Ataque cuerpo a cuerpo (Espada espiritual / The Forgotten)
function meleeSwing(p, dir, mode) {
  const a = Math.atan2(dir.y, dir.x), R = mode === 'club' ? 50 : 56;
  const dmg = p.dmg * (mode === 'club' ? 3 : 2.5);
  p.shootAnim = 0.2;
  G.effects.push({ type: 'swing', x: p.x, y: p.y - 8, a, t: 0, max: 0.18, r: R, color: mode === 'club' ? '#ece4d2' : '#bfe6ff' });
  for (const e of G.enemies) {
    if (e.dead || e.untargetable || e.invisible) continue;
    const d = dist(e, p), da = Math.abs(((Math.atan2(e.y - p.y, e.x - p.x) - a + Math.PI * 3) % TAU) - Math.PI);
    if (d < R + e.r && (da < 1.2 || d < e.r + 14)) hitEnemy(e, dmg, { vx: dir.x * 3, vy: dir.y * 3 }, p.fx);
  }
  for (const t of G.etears) if (!t.dead && dist(t, p) < R && Math.abs(((Math.atan2(t.y - p.y, t.x - p.x) - a + Math.PI * 3) % TAU) - Math.PI) < 1.2) endETear(t);
  const c = txOf(p.x + dir.x * 36), r = tyOf(p.y + dir.y * 36);
  if (inGrid(c, r)) hitTile(c, r);
  if (mode === 'sword' && p.red === p.maxRed * 2) { const t = makeTear(p.x, p.y, dir.x * 420, dir.y * 420, p, p.dmg * 1.5); t.fx.pierce = true; t.fx.spectral = true; t.color = '#bfe6ff'; G.tears.push(t); }
  Sfx.play('swing');
}

// Cuchillo de Mamá
function updateKnife(p, dt, firing, dir) {
  if (!p.knife) p.knife = { state: 'held', dist: 20, charge: 0, a: Math.PI / 2, hits: new Set() };
  const k = p.knife;
  if (k.state === 'held') {
    if (firing) { k.a = Math.atan2(dir.y, dir.x); k.charge = Math.min(1, k.charge + dt / 0.8); }
    else if (k.charge > 0.08) { k.state = 'out'; k.max = 70 + k.charge * p.range * 0.75; k.speed = 560 * p.shot; k.hits = new Set(); Sfx.play('swing'); }
    else k.charge = 0;
  } else if (k.state === 'out') { k.dist += k.speed * dt; if (k.dist >= k.max) k.state = 'back'; }
  else { k.dist -= k.speed * 1.2 * dt; if (k.dist <= 20) { k.dist = 20; k.state = 'held'; k.charge = 0; } }
  k.x = p.x + Math.cos(k.a) * k.dist; k.y = p.y + Math.sin(k.a) * k.dist;
  for (const e of G.enemies) {
    if (e.dead || e.untargetable || e.invisible || dist(e, k) > e.r + 14) continue;
    if (k.state === 'held') { e.knT = (e.knT || 0) - dt; if (e.knT <= 0) { e.knT = 0.25; hitEnemy(e, p.dmg * 0.6, { vx: Math.cos(k.a), vy: Math.sin(k.a) }, p.fx); } }
    else if (!k.hits.has(e)) { k.hits.add(e); hitEnemy(e, p.dmg * (2 + 4 * k.charge), { vx: Math.cos(k.a), vy: Math.sin(k.a) }, p.fx); }
  }
  const c = txOf(k.x), r = tyOf(k.y);
  if (inGrid(c, r)) { const t = G.room.tiles[r * COLS + c]; if (t === T.POOP || t === T.FIRE || t === T.TNT) hitTile(c, r); }
}

// Fetus épico: mira y misil
function updateEpic(p, dt, firing, dir) {
  if (!p.epic) p.epic = { on: false, x: p.x, y: p.y, cd: 0 };
  const E = p.epic;
  E.cd -= dt;
  if (firing) {
    if (!E.on) { E.on = true; E.x = p.x + dir.x * 70; E.y = p.y + dir.y * 70; }
    E.x = clamp(E.x + dir.x * 320 * dt, X0 + 10, X1 - 10); E.y = clamp(E.y + dir.y * 320 * dt, Y0 + 10, Y1 - 10);
  } else if (E.on) {
    E.on = false;
    if (E.cd <= 0) { G.missiles.push({ x: E.x, y: E.y, t: 0.6, max: 0.6, dmg: p.dmg * 12 + 20, r: 70, kind: 'missile' }); E.cd = 2.5 / p.tps; Sfx.play('jump'); }
  }
}

// Técnica de Ludovico: una lágrima controlable
function updateLudo(p, dt, firing, dir) {
  let L = p.ludo;
  if (!L || L.room !== G.room) L = p.ludo = { x: p.x, y: p.y - 30, vx: 0, vy: 0, room: G.room, tick: new Map() };
  const sp = 240 * p.shot;
  if (firing) { L.vx += dir.x * 1100 * dt; L.vy += dir.y * 1100 * dt; const l = Math.hypot(L.vx, L.vy); if (l > sp) { L.vx *= sp / l; L.vy *= sp / l; } }
  else { L.vx *= Math.pow(0.05, dt); L.vy *= Math.pow(0.05, dt); }
  L.x += L.vx * dt; L.y += L.vy * dt;
  L.r = clamp(10 + Math.sqrt(p.dmg) * 2.5, 12, 26);
  if (L.x < X0 + L.r) { L.x = X0 + L.r; L.vx = Math.abs(L.vx); } if (L.x > X1 - L.r) { L.x = X1 - L.r; L.vx = -Math.abs(L.vx); }
  if (L.y < Y0 + L.r) { L.y = Y0 + L.r; L.vy = Math.abs(L.vy); } if (L.y > Y1 - L.r) { L.y = Y1 - L.r; L.vy = -Math.abs(L.vy); }
  const rate = 1 / Math.max(1, p.tps);
  for (const e of G.enemies) {
    if (e.dead || e.untargetable || e.invisible || dist(e, L) > e.r + L.r) continue;
    const tt = L.tick.get(e) || 0;
    if (G.time - tt >= rate) { L.tick.set(e, G.time); hitEnemy(e, p.dmg, { vx: L.vx, vy: L.vy }, p.fx); }
  }
  for (const t of G.etears) if (!t.dead && p.fx.shieldtears && dist(t, L) < L.r + t.r) endETear(t);
}

// ---------- Bombas ----------
function placeBomb(p) {
  if (p.bombs <= 0 || p.bombCd > 0) { if (p.bombs <= 0) Sfx.play('nope'); return; }
  p.bombs--;
  const fx = new Set(p.bombFx);
  if (fx.has('random')) fx.add(pick(['big', 'homing', 'poison', 'sad', 'cross', 'brim', 'scatter', 'fire', 'confuse', 'glitter']));
  p.bombCd = fx.has('fast') ? 0.1 : 0.35;
  const b = { x: p.x, y: p.y + 2, r: fx.has('big') ? 13 : 10, t: 1.6, free: false, fx };
  if (fx.has('rocket') && (Input.fire.x || Input.fire.y)) { b.vx = p.lastDir.x * 320; b.vy = p.lastDir.y * 320; b.rocket = true; b.free = true; }
  G.bombs.push(b);
  Sfx.play('bombput');
}

function updateBombs(dt) {
  const p = G.player;
  for (const b of G.bombs) {
    b.t -= dt;
    const d = dist(p, b);
    if (b.rocket) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      const c = txOf(b.x), r = tyOf(b.y);
      const hitE = G.enemies.some(e => !e.dead && !e.invisible && dist(e, b) < e.r + b.r);
      if (hitE || b.x < X0 || b.x > X1 || b.y < Y0 || b.y > Y1 || (inGrid(c, r) && solidTear(G.room.tiles[r * COLS + c]))) b.t = 0;
    } else {
      if (b.fx && b.fx.has('homing')) { const e = nearestEnemy(b.x, b.y, 300); if (e) { const a = angTo(b, e); b.x += Math.cos(a) * 70 * dt; b.y += Math.sin(a) * 70 * dt; } }
      if (!b.free) { if (d > p.r + b.r + 2) b.free = true; }
      else if (d < p.r + b.r && d > 0.1) {
        const push = p.r + b.r - d;
        b.x += (b.x - p.x) / d * push; b.y += (b.y - p.y) / d * push;
      }
      collideTiles(b, G.room.tiles, solidWalk);
      b.x = clamp(b.x, X0 + b.r, X1 - b.r); b.y = clamp(b.y, Y0 + b.r, Y1 - b.r);
    }
    if (b.t <= 0) { b.dead = true; bombExplode(b); }
  }
  G.bombs = G.bombs.filter(b => !b.dead);
}

function bombExplode(b) {
  const fx = b.fx || new Set(), p = G.player;
  const big = fx.has('big') || b.mega;
  const rad = b.mini ? 45 : big ? 105 : 78, dmg = b.mini ? 25 : b.mega ? 110 : big ? 100 : 60;
  const hurts = !fx.has('heal') && !b.decoy;
  explode(b.x, b.y, rad, dmg, hurts, b.troll ? 'Una bomba trampa' : 'Tu propia bomba', { poison: fx.has('poison'), confuse: fx.has('confuse'), burn: fx.has('fire'), charm: fx.has('glitter') && Math.random() < 0.5 });
  if (fx.has('heal') && dist(p, b) < rad + p.r) healRed(p, 2);
  if (fx.has('sad')) tearRing(b.x, b.y, 10, p, 1);
  if (fx.has('cross')) for (const d of N4) for (let i = 1; i <= 2; i++) G.pendingBooms.push({ x: clamp(b.x + d[0] * i * 55, X0 + 10, X1 - 10), y: clamp(b.y + d[1] * i * 55, Y0 + 10, Y1 - 10), t: 0.08 * i, mini: true });
  if (fx.has('brim')) for (const d of N4) G.beams.push({ dx: d[0], dy: d[1], t: 0.5, tick: 0, dmg: p.dmg + 4, w: 13, fixed: { x: b.x, y: b.y } });
  if (fx.has('scatter')) for (let i = 0; i < ri(2, 4); i++) G.bombs.push({ x: clamp(b.x + rr(-40, 40), X0 + 12, X1 - 12), y: clamp(b.y + rr(-40, 40), Y0 + 12, Y1 - 12), r: 7, t: rr(0.3, 0.6), free: true, mini: true, fx: new Set() });
  if (fx.has('glitter') && Math.random() < 0.3) spawnPickup(randomBasicKind(), b.x, b.y);
  if (fx.has('blood')) G.pcreeps.push({ x: b.x, y: b.y, r: 50, t: 4, max: 4, dmg: 6, kind: 'dmg', col: 'red' });
  if (fx.has('ghost')) G.lights.push({ x: b.x, y: b.y, t: 0.8, dmg: 10, tick: 0 });
}

function explode(x, y, rad, dmg, hurtsPlayer, src = 'Una explosión', o = {}) {
  const room = G.room;
  G.effects.push({ type: 'boom', x, y, t: 0, max: 0.45, r: rad });
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * TAU, s = rr(40, 220);
    addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, { z: rr(0, 10), vz: rr(80, 260), color: pick(['#3a2a20', '#5a4a3a', '#ff9b2f', '#ffd34a']), size: rr(2, 4), life: rr(0.4, 0.9) });
  }
  G.shake = Math.max(G.shake, 0.35);
  Sfx.play('boom');
  addDecal({ type: 'scorch', x, y, r: rad * 0.55, rot: Math.random() * TAU });
  for (const e of G.enemies) {
    if (e.dead || e.invisible || e.untargetable) continue;
    if (Math.hypot(e.x - x, e.y - y) < rad + e.r) {
      damageEnemy(e, dmg, { vx: e.x - x, vy: e.y - y }, true, true);
      if (o.poison) applyStatus(e, 'poison', 3, 6);
      if (o.confuse) applyStatus(e, 'confuse', 4);
      if (o.burn) applyStatus(e, 'burn', 3, 5);
      if (o.charm) applyStatus(e, 'charm', 4);
    }
  }
  const p = G.player;
  const immune = p.passive.has('explosionimmune') || p.passive.has('fireimmune') && false;
  if (hurtsPlayer && !immune && Math.hypot(p.x - x, p.y - y) < rad + p.r * 0.5) {
    if (hurtPlayer(2, src)) { const a = Math.atan2(p.y - y, p.x - x); p.vx += Math.cos(a) * 300; p.vy += Math.sin(a) * 300; }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = room.tiles[r * COLS + c];
    if (t === T.EMPTY || t === T.PIT || t === T.SPIKE || t === T.METAL) continue;
    if (Math.hypot(tcx(c) - x, tcy(r) - y) < rad + 8) destroyTile(c, r);
  }
  for (const k of DIRNAMES) {
    const d = room.doors[k];
    if (d && d.hidden && Math.hypot(DIRS[k].x - x, DIRS[k].y - y) < rad + 12) {
      d.hidden = false; Sfx.play('secret');
      const o2 = d.rooms[0] === room ? d.rooms[1] : d.rooms[0];
      o2.seen = true;
      G.effects.push({ type: 'poof', x: DIRS[k].x, y: DIRS[k].y, t: 0, max: 0.6, r: 30 });
    }
  }
  for (const b of G.bombs) if (!b.dead && Math.hypot(b.x - x, b.y - y) < rad) b.t = Math.min(b.t, 0.08);
  for (const pk of room.pickups) {
    if (pk.kind === 'item' || pk.price != null || pk.kind === 'trophy') continue;
    const d = Math.hypot(pk.x - x, pk.y - y);
    if (d < rad + 20 && d > 0.1) { pk.vx += (pk.x - x) / d * 300; pk.vy += (pk.y - y) / d * 300; }
  }
}

function destroyTile(c, r) {
  const room = G.room, i = r * COLS + c, t = room.tiles[i];
  const x = tcx(c), y = tcy(r), th = THEMES[FLOORS[G.floorIdx].theme];
  room.tiles[i] = T.EMPTY; room.thp[i] = 0;
  if (t === T.ROCK || t === T.TINTED) {
    addDecal({ type: 'rubble', x, y, r: 14, rot: Math.random() * TAU, col: th.rock2 });
    for (let k = 0; k < 8; k++) addParticle(x, y, rr(-120, 120), rr(-120, 120), { z: 8, vz: rr(60, 200), color: th.rock, size: rr(2, 4), life: 0.6 });
    if (t === T.TINTED) spawnPickup(Math.random() < 0.55 ? 'soul' : pick(['bomb2', 'key', 'key', 'coin']), x, y);
    else if (Math.random() < 0.03) spawnPickup('coin', x, y);
  } else if (t === T.POOP) {
    addDecal({ type: 'poop', x, y, r: 13, rot: Math.random() * TAU });
    for (let k = 0; k < 8; k++) addParticle(x, y, rr(-100, 100), rr(-100, 100), { z: 6, vz: rr(60, 160), color: '#6b4423', size: rr(2, 4), life: 0.5 });
    if (Math.random() < 0.22) spawnPickup(Math.random() < 0.7 ? 'coin' : 'half', x, y);
    if (G.player && G.player.passive.has('dirtymind')) EFX.flies(G.player, [1]);
  } else if (t === T.FIRE) {
    addDecal({ type: 'burnt', x, y, r: 14, rot: Math.random() * TAU });
    G.effects.push({ type: 'poof', x, y: y - 8, t: 0, max: 0.5, r: 16 });
  } else if (t === T.TNT) {
    G.pendingBooms.push({ x, y, t: 0.12 });
  }
  G.flowT = 0;
}

function hitTile(c, r) {
  const room = G.room, i = r * COLS + c, t = room.tiles[i];
  if (t === T.POOP || t === T.FIRE || t === T.TNT) {
    room.thp[i]++;
    if (room.thp[i] >= (t === T.TNT ? 3 : 4)) destroyTile(c, r);
  }
}

// ---------- Lágrimas del jugador ----------
function nearestEnemy(x, y, maxD) {
  let best = null, bd = maxD;
  for (const e of G.enemies) {
    if (e.dead || e.untargetable || e.invisible || e.shielded || e.charm > 0) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

// Daño de lágrima/láser con todos sus efectos de estado
function hitEnemy(e, dmg, src, fx, silent) {
  const p = G.player;
  let d = dmg;
  if (fx.needle && !e.boss) d = Math.max(d, e.hp + 1); else if (fx.needle) d *= 3;
  damageEnemy(e, d, src, silent);
  if (fx.poison) applyStatus(e, 'poison', 3, Math.max(1, p.dmg * 0.35));
  if (fx.burn) applyStatus(e, 'burn', 3, Math.max(1, p.dmg * 0.35));
  if (fx.bleed) applyStatus(e, 'bleed', 4, Math.max(1, p.dmg * 0.25));
  if (fx.slow) applyStatus(e, 'slow', 2.5);
  if (fx.fear) applyStatus(e, 'fear', 3);
  if (fx.charm) applyStatus(e, 'charm', 3);
  if (fx.confuse) applyStatus(e, 'confuse', 3);
  if (fx.freeze) applyStatus(e, 'freeze', 2);
  if (fx.knock && src && !e.boss) { const l = Math.hypot(src.vx, src.vy) || 1; e.kx += src.vx / l * 220; e.ky += src.vy / l * 220; }
  if (fx.electric) zapFrom(e, p.dmg * 0.5);
  if (fx.holy) G.lights.push({ x: e.x, y: e.y, t: 0.5, dmg: p.dmg * 1.2, tick: 0 });
  if (fx.creephit) G.pcreeps.push({ x: e.x, y: e.y, r: 22, t: 2, max: 2, dmg: p.dmg * 0.3, kind: 'dmg', col: 'holy' });
  if (p.passive.has('keeperhead') && Math.random() < 0.06) spawnPickup('coin', e.x, e.y);
  if (p.passive.has('volt45') && p.active) { p.dmgAcc = (p.dmgAcc || 0) + d; if (p.dmgAcc >= 40) { p.dmgAcc = 0; EFX.charge(p); } }
}

function zapFrom(e, dmg) {
  const L = G.enemies.filter(o => o !== e && !o.dead && !o.invisible && dist(o, e) < 110).slice(0, 2);
  for (const o of L) { damageEnemy(o, dmg, null, true); G.effects.push({ type: 'zap', x0: e.x, y0: e.y - 8, x1: o.x, y1: o.y - 8, t: 0, max: 0.15 }); }
}

function updateTears(dt) {
  const room = G.room, p = G.player;
  if (G.tears.length > 500) G.tears.splice(0, G.tears.length - 500);
  if (G.blueflies.length > 60) G.blueflies.splice(0, G.blueflies.length - 60);
  for (const t of G.tears) {
    t.life -= dt;
    if (t.stuck) {
      t.x = t.stuck.x; t.y = t.stuck.y; t.stuckT -= dt;
      if (t.stuckT <= 0 || t.stuck.dead) { t.dead = true; explode(t.x, t.y, 45, t.dmg * 2 + 10, false); }
      continue;
    }
    if (t.orbit) {
      t.orbit.a += dt * 3.6; t.orbit.r += (t.orbit.grow || 0) * dt;
      const ox = p.x + Math.cos(t.orbit.a) * t.orbit.r, oy = p.y - 4 + Math.sin(t.orbit.a) * t.orbit.r;
      t.vx = (ox - t.x) / dt; t.vy = (oy - t.y) / dt; t.x = ox; t.y = oy;
    } else {
      if (t.fx.homing) {
        const e = nearestEnemy(t.x, t.y, 260);
        if (e) {
          const cur = Math.atan2(t.vy, t.vx), want = Math.atan2(e.y - t.y, e.x - t.x);
          let d = want - cur; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
          const na = cur + clamp(d, -5 * dt, 5 * dt), sp = Math.hypot(t.vx, t.vy);
          t.vx = Math.cos(na) * sp; t.vy = Math.sin(na) * sp;
        }
      }
      if (t.boomer && t.life < t.max * 0.5) {
        const a = Math.atan2(p.y - t.y, p.x - t.x), sp = Math.hypot(t.vx, t.vy);
        t.vx = Math.cos(a) * sp; t.vy = Math.sin(a) * sp;
        for (const pk of room.pickups) if (pk.kind !== 'item' && pk.price == null && dist(pk, t) < 20) { pk.x = t.x; pk.y = t.y; }
        if (dist(t, p) < 16) { t.dead = true; continue; }
      }
      const px = t.x, py = t.y;
      t.x += t.vx * dt; t.y += t.vy * dt;
      t.dist += Math.hypot(t.vx, t.vy) * dt;
      // muros
      if (t.x < X0 || t.x > X1 || t.y < Y0 - 4 || t.y > Y1) {
        if (t.fx.continuum) {
          if (t.x < X0) t.x = X1 - 2; else if (t.x > X1) t.x = X0 + 2;
          if (t.y < Y0 - 4) t.y = Y1 - 2; else if (t.y > Y1) t.y = Y0 + 2;
        } else if (t.fx.bounce && (t.bounces || 0) < 3) {
          t.bounces = (t.bounces || 0) + 1; t.x = px; t.y = py;
          if (t.x + t.vx * dt < X0 || t.x + t.vx * dt > X1) t.vx = -t.vx;
          if (t.y + t.vy * dt < Y0 - 4 || t.y + t.vy * dt > Y1) t.vy = -t.vy;
        } else { endTear(t); continue; }
      }
      // obstáculos
      const c = txOf(t.x), r = tyOf(t.y);
      if (!t.fx.spectral && !t.arc && inGrid(c, r) && solidTear(room.tiles[r * COLS + c])) {
        hitTile(c, r);
        if (t.fx.acid && (room.tiles[r * COLS + c] === T.ROCK || room.tiles[r * COLS + c] === T.TINTED)) destroyTile(c, r);
        if (t.fx.bounce && (t.bounces || 0) < 3) {
          t.bounces = (t.bounces || 0) + 1;
          const pc = txOf(px), pr = tyOf(py);
          t.x = px; t.y = py;
          if (pc !== c) t.vx = -t.vx;
          if (pr !== r) t.vy = -t.vy;
          if (pc === c && pr === r) { t.vx = -t.vx; t.vy = -t.vy; }
        } else { endTear(t); continue; }
      }
    }
    const fr = t.life / t.max;
    t.z = t.arc ? 12 + Math.sin(Math.PI * (1 - fr)) * 26 : t.orbit ? 16 : 18 * Math.min(1, fr / 0.3 + 0.05);
    // enemigos
    for (const e of G.enemies) {
      if (e.dead || e.untargetable || e.invisible) continue;
      if (t.arc && t.z > 24) continue;
      if (t.hit && t.hit.has(e)) { if (!t.fx.multihit || G.time - t.hit.get(e) < 0.2) continue; }
      const rr2 = e.r + t.r, dx = e.x - t.x, dy = e.y - t.y;
      if (dx * dx + dy * dy > rr2 * rr2) continue;
      if (e.shielded) { Sfx.play('tink'); endTear(t, true); break; }
      if (t.kind === 'fetus' || t.kind === 'ipecac') { endTear(t); break; }
      if (t.fx.stickybomb) { t.stuck = e; t.stuckT = 1.1; break; }
      let d = t.dmg;
      if (t.fx.proptosis) d *= Math.max(0.25, 2 - t.dist / 110);
      if (t.fx.coal) d *= 1 + Math.min(2, t.dist / 220);
      if (p.passive.has('deadeye')) { d *= 1 + 0.2 * Math.min(4, p.deadEye || 0); p.deadEye = (p.deadEye || 0) + 1; t.scored = true; }
      hitEnemy(e, d, t, t.fx);
      if (t.gold && e.dead) spawnPickup('coin', e.x, e.y);
      spawnOnHit(t, e);
      if (t.fx.pierce || t.fx.multihit) { (t.hit || (t.hit = new Map())).set(e, G.time); }
      else { endTear(t); break; }
    }
    if (t.dead) continue;
    if (t.fx.shieldtears || t.fx.auratear) {
      for (const et of G.etears) if (!et.dead && t.fx.shieldtears && Math.hypot(et.x - t.x, et.y - t.y) < et.r + t.r) endETear(et);
      if (t.fx.auratear) for (const e of G.enemies) if (!e.dead && !e.invisible && dist(e, t) < e.r + 26) { e.auraT = (e.auraT || 0) - dt; if (e.auraT <= 0) { e.auraT = 0.2; damageEnemy(e, Math.max(0.5, p.dmg * 0.2), null, true); } }
    }
    if (t.life <= 0) endTear(t);
  }
  G.tears = G.tears.filter(t => !t.dead);
}

function spawnOnHit(t, e) {
  const p = G.player, a = Math.atan2(t.vy, t.vx), sp = Math.hypot(t.vx, t.vy) * 0.8;
  const small = (ang, mult) => { const s = makeTear(e.x, e.y, Math.cos(ang) * sp, Math.sin(ang) * sp, p, t.dmg * mult, { plain: true, range: 120, color: t.color }); s.hit = new Map([[e, G.time]]); G.tears.push(s); };
  if (t.fx.split) { small(a + 1, 0.5); small(a - 1, 0.5); }
  if (t.fx.quad) for (let i = 0; i < 4; i++) small(a + Math.PI / 4 + i * Math.PI / 2, 0.5);
  if (t.fx.bones) for (let i = 0; i < ri(1, 3); i++) small(a + rr(-1.2, 1.2), 0.5);
}

function endTear(t, quiet) {
  if (t.dead) return;
  t.dead = true;
  const p = G.player;
  if (p && p.passive.has('deadeye') && !t.scored && t.kind === 'tear') p.deadEye = 0;
  if (t.kind === 'ipecac') { explode(t.x, t.y, 55, t.dmg * 2, false); return; }
  if (t.kind === 'fetus') { explode(t.x, t.y, 55, t.dmg * 3 + 10, false); return; }
  if (t.kind === 'haemo' || t.fx.burst) {
    const n = t.kind === 'haemo' ? ri(6, 10) : 8;
    for (let i = 0; i < n; i++) { const a = i * TAU / n + rr(-0.2, 0.2), s = rr(150, 260); G.tears.push(makeTear(t.x, t.y, Math.cos(a) * s, Math.sin(a) * s, p, t.dmg * 0.45, { plain: true, range: 110, color: t.color })); }
  }
  if (t.fx.quad && !t.hit) for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; G.tears.push(makeTear(t.x, t.y, Math.cos(a) * 200, Math.sin(a) * 200, p, t.dmg * 0.5, { plain: true, range: 90, color: t.color })); }
  G.effects.push({ type: 'splash', x: t.x, y: t.y - t.z, t: 0, max: 0.22, color: t.color, r: Math.min(t.r, 14) });
  if (!quiet) Sfx.play('splash');
}

// Ojos de Mal de Ojo
function updateEyes(dt) {
  const p = G.player;
  for (const e of G.eyes) {
    e.life -= dt; e.x += e.vx * dt; e.y += e.vy * dt; e.cd -= dt;
    if (e.cd <= 0) { e.cd = 0.45; G.tears.push(makeTear(e.x, e.y, e.dx * 330, e.dy * 330, p, p.dmg, { range: 260 })); }
    if (e.x < X0 || e.x > X1 || e.y < Y0 || e.y > Y1 || e.life <= 0) e.dead = true;
  }
  G.eyes = G.eyes.filter(e => !e.dead);
}

// ---------- Proyectiles enemigos ----------
function eTear(x, y, vx, vy, o = {}) {
  const s = G.shooter;
  if (s && (s.freeze > 0 || s.fear > 0 || s.charm > 0)) return null;
  const t = { x, y, vx, vy, r: o.r || 5, z: o.z != null ? o.z : 14, vz: o.vz || 0, g: o.g || 0, life: o.life || 3.5, color: o.color || '#c8282e', dmg: o.dmg || dmgUnit(!!o.boss), src: o.src || 'Una lágrima' };
  t.arc = !!o.vz;
  G.etears.push(t);
  return t;
}

function updateETears(dt) {
  const p = G.player, room = G.room, P = p.passive;
  let sdt = dt; if (G.slowTime > 0) sdt *= 0.4;
  for (const t of G.etears) {
    let tdt = sdt;
    if (t.slowed > 0) { t.slowed -= dt; tdt *= 0.4; }
    t.life -= tdt;
    t.x += t.vx * tdt; t.y += t.vy * tdt;
    if (t.arc) { t.z += t.vz * tdt; t.vz -= t.g * tdt; if (t.z <= 0) { endETear(t); continue; } }
    if (t.x < X0 || t.x > X1 || t.y < Y0 - 4 || t.y > Y1 || t.life <= 0) { endETear(t); continue; }
    const c = txOf(t.x), r = tyOf(t.y);
    if ((!t.arc || t.z < 10) && inGrid(c, r) && solidTear(room.tiles[r * COLS + c])) { endETear(t); continue; }
    if ((!t.arc || t.z < 22) && Math.hypot(p.x - t.x, p.y - t.y) < p.r + t.r - 1) {
      if (p.shield > 0 || p.invuln > 0) { endETear(t); continue; }
      if (P.has('infamy') && Math.random() < 0.5) { Sfx.play('tink'); endETear(t); continue; }
      if (P.has('trinity') && (Input.fire.x || Input.fire.y)) {
        const da = Math.abs(((Math.atan2(t.y - p.y, t.x - p.x) - Math.atan2(p.lastDir.y, p.lastDir.x) + Math.PI * 3) % TAU) - Math.PI);
        if (da < 0.9) { Sfx.play('tink'); endETear(t); continue; }
      }
      if (P.has('reflect?') && Math.random() < luckChance(p)) {
        t.dead = true; G.tears.push(makeTear(t.x, t.y, -t.vx * 1.2, -t.vy * 1.2, p, p.dmg * 2, { plain: true, range: 300, fx: { confuse: true } })); continue;
      }
      if (hurtPlayer(t.dmg, t.src)) { const l = Math.hypot(t.vx, t.vy) || 1; p.vx += t.vx / l * 150; p.vy += t.vy / l * 150; }
      endETear(t);
    }
  }
  G.etears = G.etears.filter(t => !t.dead);
}
function endETear(t) {
  if (t.dead) return;
  t.dead = true;
  G.effects.push({ type: 'splash', x: t.x, y: t.y - Math.max(0, t.z), t: 0, max: 0.22, color: t.color, r: t.r });
}

// ---------- Bestiario ----------
// Apunta que se ha visto un enemigo o jefe (se guarda al momento) y suma derrotas (se guardan con el resto de datos).
function bestiarySee(id) {
  const b = Store.data.bestiary || (Store.data.bestiary = {});
  if (b[id] == null) { b[id] = 0; Store.save(); }
}
function bestiaryKill(id) {
  const b = Store.data.bestiary;
  if (b && b[id] != null) b[id]++;
}

// ---------- Enemigos ----------
function makeEnemy(type, x, y, o = {}) {
  const d = EN[type] || { hp: 10, r: 12, speed: 60 };
  if (!o.noSeen && EN[type]) bestiarySee(type);
  const sc = (1 + G.floorIdx * DIFFICULTY.hpPerFloor) * diffMul('hp');
  const e = {
    type, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: d.r, hp: d.hp * sc, maxHp: d.hp * sc,
    flying: !!d.fly, speed: d.speed, t: Math.random() * 1.5, t2: rr(0.8, 2.2), state: 0,
    flash: 0, dead: false, champ: false, boss: false, contact: true, slow: 0,
    spawnT: o.spawnT != null ? o.spawnT : 0.5, z: 0, anim: Math.random() * 10, face: 1, kb: 1, dirx: 0, diry: 0, hit: null,
  };
  if (o.champ) {
    const kind = typeof o.champ === 'string' && CHAMPIONS[o.champ] ? o.champ : pickChampion(), ch = CHAMPIONS[kind];
    e.champ = kind; e.hp *= ch.hp; e.maxHp *= ch.hp; e.r *= ch.r;
    if (ch.speed) e.speed *= ch.speed;
  }
  if (type === 'host') e.shielded = true;
  if (d.armor) { e.armor = true; e.hd = Math.random() * TAU; }
  if (d.kb !== undefined) e.kb = d.kb;
  if (d.immune) e.immune = true;
  return e;
}
function spawnEnemy(type, x, y) { const e = makeEnemy(type, x, y, { spawnT: 0.15 }); G.enemies.push(e); return e; }

function bossPos(side, off) {
  if (!side) return { x: CX, y: CY - 50 };
  const D = DIRS[side];
  return { x: CX - D.dx * off, y: CY - D.dy * off * 0.55 };
}

function makeBoss(id, side, quiet) {
  const b = BOSSES[id];
  if (!quiet) bestiarySee(id);
  const final = id === 'mama' || id === 'corazon';
  const sc = (final ? 1 : 1 + G.floorIdx * 0.22) * diffMul('hp');
  const pos = id === 'corazon' ? { x: CX, y: CY } : bossPos(side, id === 'masa' ? 170 : 120);
  const e = makeEnemy('boss', pos.x, pos.y, { spawnT: 0.4 });
  Object.assign(e, { type: id, boss: true, kb: 0, hp: b.hp * sc, maxHp: b.hp * sc, r: b.r, name: b.name, flying: !!b.fly, state: 'idle', t2: 1.0 });
  const list = [e];
  if (id === 'gusano') {
    e.dir = side === 'left' || side === 'right' ? { x: 0, y: 1 } : { x: 1, y: 0 };
    e.hist = []; e.segs = [];
    for (let i = 0; i < 6; i++) {
      const s = makeEnemy('seg', e.x, e.y, { spawnT: 0.4 });
      Object.assign(s, { parent: e, r: 13, kb: 0, idx: i, boss: true, ignoreClear: true, noCollide: true, name: b.name });
      list.push(s); e.segs.push(s);
    }
  }
  if (id === 'mama') Object.assign(e, { untargetable: true, invisible: true, contact: false, noCollide: true, x: CX, y: CY, t2: 1.4 });
  return list;
}

function applyStatus(e, k, s, dmg) {
  if (e.dead || e.invisible) return;
  if (G.player && G.player.passive.has('nostatus')) return;
  if (e.boss && (k === 'fear' || k === 'charm' || k === 'confuse')) s *= 0.35;
  if (e.boss && k === 'freeze') s *= 0.3;
  if (k === 'poison' || k === 'burn' || k === 'bleed') {
    e[k] = Math.max(e[k] || 0, s);
    e[k + 'Dmg'] = Math.max(e[k + 'Dmg'] || 0, dmg || 2);
    if (!e[k + 'T']) e[k + 'T'] = 0.4;
    return;
  }
  e[k] = Math.max(e[k] || 0, s);
}

// Fase 2 de un jefe: al bajar del 50 % de vida suelta un grito (anillo de 12 lágrimas rojas), sacude la pantalla y queda
// protegido 1 s; a partir de ahí lleva un aura roja. Cada jefe añade sus ataques propios con `e.hp < e.maxHp * 0.5` en BEHAV
function startPhase2(e) {
  e.phase2 = true; e.p2T = 1; e.shielded = true; e.flash = 0.3;
  const off = Math.random() * TAU;
  for (let i = 0; i < 12; i++) { const a = off + i * TAU / 12; eTear(e.x, e.y - 8, Math.cos(a) * 120, Math.sin(a) * 120, { boss: true, color: '#ff5a40', src: e.name }); }
  G.shake = Math.max(G.shake, 0.4); Sfx.play('roar');
  G.effects.push({ type: 'poof', x: e.x, y: e.y - 8, t: 0, max: 0.6, r: e.r + 20 });
  G.showBanner(e.name, '¡Se enfurece!', 1.6);
}

function updateEnemy(e, dt) {
  e.anim += dt;
  if (e.flash > 0) e.flash -= dt;
  if (e.boss && !e.parent && !e.phase2 && e.hp < e.maxHp * 0.5 && !e.dead) startPhase2(e);
  if (e.p2T > 0) { e.p2T -= dt; if (e.p2T <= 0) e.shielded = false; }
  for (const k of ['poison', 'burn', 'bleed']) {
    if (!(e[k] > 0)) continue;
    e[k] -= dt; e[k + 'T'] -= dt;
    if (e[k + 'T'] <= 0) { e[k + 'T'] = 0.4; damageEnemy(e, e[k + 'Dmg'], null, true); if (e.dead) return; }
    if (e[k] <= 0) e[k + 'Dmg'] = 0;
  }
  if (e.immune) { e.slow = e.freeze = e.fear = e.charm = e.confuse = 0; e.kx = e.ky = 0; }   // inmune a empuje y a estados
  if (e.champ === 'regen') {   // campeón regenerador: tras 1,5 s sin daño recupera un 8 % de vida máxima por segundo
    e.rgT = e.flash > 0 ? 0 : (e.rgT || 0) + dt;
    if (e.rgT > 1.5 && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.08 * dt);
  }
  let sdt = dt;
  if (e.slow > 0) { e.slow -= dt; sdt *= 0.5; }
  if (G.slowTime > 0) sdt *= 0.4;
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  if (e.freeze > 0) {
    e.freeze -= dt; e.vx = e.vy = 0;
  } else if (!e.boss && (e.fear > 0 || e.confuse > 0 || e.charm > 0)) {
    const p = G.player, sp = Math.max(40, e.speed || 50);
    if (e.fear > 0) { e.fear -= dt; const a = Math.atan2(e.y - p.y, e.x - p.x); e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; }
    else if (e.charm > 0) {
      e.charm -= dt;
      const o = G.enemies.find(x => x !== e && !x.dead && !x.invisible && !(x.charm > 0));
      if (o) { const a = angTo(e, o); e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; if (dist(e, o) < e.r + o.r + 2) { e.chT = (e.chT || 0) - dt; if (e.chT <= 0) { e.chT = 0.3; damageEnemy(o, 4, null, true); } } }
      else { e.vx *= 0.9; e.vy *= 0.9; }
    } else { e.confuse -= dt; e.t -= dt; if (e.t <= 0) { e.t = rr(0.3, 0.8); const a = Math.random() * TAU; e.dirx = Math.cos(a); e.diry = Math.sin(a); } e.vx = e.dirx * sp * 0.7; e.vy = e.diry * sp * 0.7; }
  } else {
    if (e.boss) { if (e.fear > 0) e.fear -= dt; if (e.charm > 0) e.charm -= dt; if (e.confuse > 0) e.confuse -= dt; }
    const fn = BEHAV[e.type];
    G.shooter = e;
    if (fn) fn(e, sdt);
    G.shooter = null;
  }
  e.x += (e.vx + e.kx) * sdt; e.y += (e.vy + e.ky) * sdt;
  const dec = Math.pow(0.0008, dt); e.kx *= dec; e.ky *= dec;
  e.hit = null;
  if (!e.noCollide) {
    if (!e.flying) e.hit = collideTiles(e, G.room.tiles, solidWalk);
    const m = e.r; let hx = false, hy = false;
    if (e.x < X0 + m) { e.x = X0 + m; hx = true; }
    if (e.x > X1 - m) { e.x = X1 - m; hx = true; }
    if (e.y < Y0 + m) { e.y = Y0 + m; hy = true; }
    if (e.y > Y1 - m) { e.y = Y1 - m; hy = true; }
    if (hx || hy) e.hit = { hx: hx || !!(e.hit && e.hit.hx), hy: hy || !!(e.hit && e.hit.hy) };
  }
}

function damageEnemy(e, dmg, src, silent, force) {
  if (e.dead) return;
  if ((e.shielded || e.untargetable || (e.parent && e.parent.shielded)) && !force) return;
  // armadura: los golpes con dirección (lágrimas, láseres, cuchillos) que llegan de frente rebotan;
  // veneno, fuego, explosiones y golpes por detrás o de lado hacen daño normal
  if (e.armor && src && !force) {
    const l = Math.hypot(src.vx, src.vy);
    if (l > 0 && (src.vx * Math.cos(e.hd) + src.vy * Math.sin(e.hd)) / l < -0.3) {
      Sfx.play('tink'); e.flash = 0.05;
      G.effects.push({ type: 'poof', x: e.x + Math.cos(e.hd) * e.r, y: e.y + Math.sin(e.hd) * e.r - 4, t: 0, max: 0.2, r: 7 });
      return;
    }
  }
  const tgt = e.parent || e;
  if (tgt.dead) return;
  tgt.hp -= dmg; e.flash = 0.09; tgt.flash = 0.09;
  if (src && !tgt.boss && e.kb) {
    const l = Math.hypot(src.vx, src.vy) || 1;
    e.kx = clamp(e.kx + src.vx / l * 110 * e.kb, -260, 260);
    e.ky = clamp(e.ky + src.vy / l * 110 * e.kb, -260, 260);
  }
  if (!silent) Sfx.play('hit');
  if (tgt.hp <= 0) killEnemy(tgt);
}

function killEnemy(e) {
  if (e.dead) return;
  if (e.type === 'globin' && e.state !== 'goo') {
    Object.assign(e, { state: 'goo', hp: 7 * (1 + G.floorIdx * DIFFICULTY.hpPerFloor) * diffMul('hp'), t2: 4, contact: false, vx: 0, vy: 0, poison: 0, burn: 0, bleed: 0 });
    bloodBurst(e.x, e.y, 6); Sfx.play('kill');
    return;
  }
  e.dead = true;
  if (!e.parent) bestiaryKill(e.type);
  G.run.kills++;
  const big = e.boss ? 3 : 1;
  bloodBurst(e.x, e.y - 6, Math.round((6 + e.r * 0.6) * big), e.type === 'boomfly' ? '#7a3a10' : '#7d0f12');
  addDecal({ type: 'blood', x: e.x, y: e.y, r: Math.min(60, e.r * (e.boss ? 1.6 : 1.1)), rot: Math.random() * TAU });
  Sfx.play(e.boss ? 'bossdie' : 'kill');
  switch (e.type) {
    case 'boomfly': explode(e.x, e.y, 62, 30, true, 'Una mosca bomba'); break;
    case 'mulligan': for (let i = 0; i < 3; i++) spawnEnemy('afly', e.x + rr(-8, 8), e.y + rr(-8, 8)); break;
    case 'bigspider': for (let i = 0; i < 2; i++) spawnEnemy('spider', e.x + rr(-8, 8), e.y + rr(-8, 8)); break;
    case 'hive': for (let i = 0; i < 3; i++) spawnEnemy('afly', e.x + rr(-8, 8), e.y + rr(-8, 8)); break;
    case 'jelly': for (let i = 0; i < 2; i++) spawnEnemy('jellet', e.x + rr(-8, 8), e.y + rr(-8, 8)); break;
  }
  if (e.type === 'mine') explode(e.x, e.y, 50, 25, true, 'Una mina');
  if (e.type === 'pira' && e.fires) { for (const i of e.fires) if (G.room.tiles[i] === T.FIRE) { G.room.tiles[i] = T.EMPTY; G.room.thp[i] = 0; } G.flowT = 0; }
  if (e.champ === 'volatile') explode(e.x, e.y, 55, 20, true, 'Un campeón explosivo');
  if (e.champ === 'toxic') for (let i = 0; i < 3; i++) G.creeps.push({ x: e.x + rr(-14, 14), y: e.y + rr(-8, 8) + 6, r: rr(20, 26), t: 5, max: 5, col: '#58b24a', src: 'Un campeón tóxico' });
  if (e.champ) spawnPickup(Math.random() < 0.7 ? 'heart' : 'soul', e.x, e.y);
  if (e.segs) for (const s of e.segs) if (!s.dead) { s.dead = true; bloodBurst(s.x, s.y, 8); addDecal({ type: 'blood', x: s.x, y: s.y, r: 14, rot: Math.random() * TAU }); }
  if (e.boss && !e.parent) {
    G.shake = 0.6;
    const others = G.enemies.some(x => !x.dead && x.boss && !x.parent);
    if (!others) for (const x of G.enemies) if (!x.dead) { x.dead = true; if (!x.invisible) bloodBurst(x.x, x.y, 5); }
  }
  // efectos del jugador al matar
  const p = G.player;
  if (!p || e.invisible) return;
  const P = p.passive;
  p.kills++;
  if (P.has('vampire') && p.kills % 13 === 0) healRed(p, 1);
  if (P.has('lustyblood')) p.lusty = Math.min(10, (p.lusty || 0) + 1);
  if (P.has('jarflies')) p.jarFlies = Math.min(20, (p.jarFlies || 0) + 1);
  if (P.has('coinkills') && Math.random() < 0.5) spawnPickup('coin', e.x, e.y);
  if (P.has('jumper') && p.kills % 15 === 0) EFX.charge(p);
  if (P.has('contagion') && !G.room.contagion) { G.room.contagion = true; EFX.gas(p); for (const o of G.enemies) if (!o.dead && dist(o, e) < 90) applyStatus(o, 'poison', 3, p.dmg); }
  fireEvent('kill', { e });
}

function separateEnemies() {
  const L = G.enemies;
  for (let i = 0; i < L.length; i++) {
    const a = L[i];
    if (a.dead || a.boss || a.noCollide || a.z > 5 || a.spawnT > 0) continue;
    for (let j = i + 1; j < L.length; j++) {
      const b = L[j];
      if (b.dead || b.boss || b.noCollide || b.z > 5 || a.flying !== b.flying) continue;
      const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < m * m && d2 > 0.01) {
        const d = Math.sqrt(d2), push = (m - d) * 0.5;
        a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
      }
    }
  }
}

const FLY_TYPES = new Set(['fly', 'afly', 'pooter', 'boomfly']);
const SPIDER_TYPES = new Set(['spider', 'bigspider']);
function contactDamage(dt) {
  const p = G.player, P = p.passive;
  for (const e of G.enemies) {
    if (e.dead || !e.contact || e.spawnT > 0 || e.invisible || e.z > 14) continue;
    const m = e.r + p.r - 3, dx = p.x - e.x, dy = p.y - e.y;
    if (dx * dx + dy * dy >= m * m) continue;
    if (e.charm > 0 || e.freeze > 0) continue;
    if (P.has('skatole') && FLY_TYPES.has(e.type)) continue;
    if (P.has('spiderfriend') && SPIDER_TYPES.has(e.type)) continue;
    if (p.contactDmg) { e.ctT = (e.ctT || 0) - dt; if (e.ctT <= 0) { e.ctT = 0.25; damageEnemy(e, p.contactDmg, { vx: -dx, vy: -dy }); } }
    if (P.has('viruscontact')) applyStatus(e, 'poison', 3, 4);
    if (P.has('midas')) applyStatus(e, 'freeze', 3);
    if (P.has('ecoli') && !e.boss) { e.hp = 0; killEnemy(e); if (!e.dead) killEnemy(e); const c = txOf(e.x), r = tyOf(e.y); if (inGrid(c, r) && !G.room.tiles[r * COLS + c]) G.room.tiles[r * COLS + c] = T.POOP; continue; }
    if (P.has('aries') && !e.boss && Math.hypot(p.vx, p.vy) > 150) { damageEnemy(e, 25, { vx: -dx, vy: -dy }); continue; }
    if (P.has('bellyjelly') && !e.boss) { const d = Math.hypot(dx, dy) || 1; e.kx -= dx / d * 400; e.ky -= dy / d * 400; damageEnemy(e, 8, null, true); if (Math.random() < 0.5) continue; }
    if (p.unicorn > 0 || p.dash) continue;
    const src = e.name || (e.parent && e.parent.name) || (EN[e.type] ? EN[e.type].name : 'Un monstruo');
    if (hurtPlayer(dmgUnit(e.boss), src)) { const d = Math.hypot(dx, dy) || 1; p.vx = dx / d * 320; p.vy = dy / d * 320; }
    break;
  }
}

// ---------- Familiares ----------
// k: tipo de comportamiento · look: aspecto · col: color
const FAMS = {
  bobby: { k: 'shoot', dmg: 3.5, rate: 0.55, look: 'baby', col: '#f0d2c2' },
  maggy: { k: 'shoot', dmg: 7, rate: 0.55, look: 'baby', col: '#f2c0c0', tear: '#d8343a', hair: '#e2b84e' },
  gish: { k: 'shoot', dmg: 3.5, rate: 0.6, fx: { slow: 1 }, look: 'baby', col: '#3a3a3a', tear: '#2a2a2a' },
  lilsteven: { k: 'shoot', dmg: 5, rate: 0.6, fx: { homing: 1 }, look: 'baby', col: '#b090d0', tear: '#c48cff' },
  ghostbaby: { k: 'shoot', dmg: 3.5, rate: 0.55, fx: { spectral: 1 }, look: 'ghost', col: '#e8f0ff' },
  harlequin: { k: 'shoot', dmg: 4, rate: 0.6, dirs: 'v', look: 'baby', col: '#e05050' },
  rainbow: { k: 'shoot', dmg: 3.5, rate: 0.55, rand: true, look: 'baby', col: '#e0a0f0' },
  robo: { k: 'shoot', dmg: 3.5, rate: 0.7, laser: true, look: 'robot', col: '#a0a0b0' },
  robo2: { k: 'shoot', dmg: 3.5, rate: 0.3, laser: true, look: 'robot', col: '#7a8ca0' },
  lilloki: { k: 'shoot', dmg: 3.5, rate: 0.7, dirs: 'cross', look: 'baby', col: '#b03030', horns: true },
  lilmonstro: { k: 'shoot', dmg: 3.5, rate: 1.6, dirs: 'burst', look: 'blob', col: '#bda1a0' },
  boiled: { k: 'shoot', dmg: 3, rate: 1.5, dirs: 'ring', look: 'baby', col: '#d06050' },
  freezer: { k: 'shoot', dmg: 3.5, rate: 0.6, fx: { freeze: 1 }, look: 'baby', col: '#a0d8ff', tear: '#9aa6b4' },
  mongo: { k: 'shoot', dmg: 3.5, rate: 0.55, look: 'baby', col: '#90c070' },
  buddybox: { k: 'shoot', dmg: 3.5, rate: 0.55, rand: true, look: 'box', col: '#c09060' },
  lildelirium: { k: 'shoot', dmg: 4, rate: 0.5, rand: true, look: 'baby', col: '#f0f0f0' },
  intruder: { k: 'shoot', dmg: 3.5, rate: 0.9, dirs: 'cross', fx: { slow: 1 }, look: 'spider', col: '#2a1a1a' },
  lilspewer: { k: 'shoot', dmg: 2, rate: 1.4, creep: true, look: 'baby', col: '#e0e0a0' },
  incubus: { k: 'shoot', player: 1, look: 'baby', col: '#3a2030', horns: true },
  twisted: { k: 'shoot', player: 0.4, look: 'baby', col: '#5a2a4a', horns: true },
  fatereward: { k: 'shoot', player: 1, plain: true, look: 'baby', col: '#f0e0a0' },
  abel: { k: 'abel', dmg: 3.5, rate: 0.55, look: 'baby', col: '#f0d2c2' },
  esau: { k: 'twin', dmg: 3.75, rate: 0.4, look: 'baby', col: '#e8c4b0', hair: '#6a4424' },
  seraphim: { k: 'auto', dmg: 10, rate: 1.2, fx: { homing: 1 }, look: 'angel', col: '#fff8e0' },
  demonbaby: { k: 'auto', dmg: 3, rate: 0.45, range: 170, look: 'baby', col: '#3a2a3a', horns: true, tear: '#e04040' },
  papafly: { k: 'auto', dmg: 3.5, rate: 0.8, look: 'fly', col: '#6a5040' },
  bloodshot: { k: 'auto', dmg: 3.5, rate: 1.0, look: 'eye', col: '#f0e8e0' },
  littlehorn: { k: 'auto', dmg: 5, rate: 2.5, fx: { needle: 1 }, look: 'baby', col: '#3a2a2a', horns: true },
  mini: { k: 'auto', dmg: 2, rate: 0.5, range: 200, look: 'baby', col: '#f0d2c2', small: true },
  strawman: { k: 'auto', dmg: 4, rate: 0.55, range: 220, look: 'baby', col: '#b8c890' },
  turret: { k: 'turret', dmg: 0, rate: 0.5, look: 'fly', col: '#8a6a4a' },
  sprinkler: { k: 'sprinkler', look: 'orb', col: '#a0c8f0' },
  caineye: { k: 'bounce', dps: 0, shoot: true, look: 'eye', col: '#f0e8e0' },
  fruityplum: { k: 'bounce', dps: 6, shoot: true, look: 'baby', col: '#a080d0' },
  lilgurdy: { k: 'bounce', dps: 20, look: 'blob', col: '#c08070' },
  peeper: { k: 'bounce', dps: 16, look: 'eye', col: '#f0e8e0' },
  hushy: { k: 'bounce', dps: 12, look: 'blob', col: '#5a7ad0' },
  gbbug: { k: 'bounce', dps: 8, status: 'rand', look: 'fly', col: '#40a040' },
  cubebaby: { k: 'bounce', dps: 10, status: 'slow', look: 'cube', col: '#c0e8ff' },
  sissy: { k: 'bounce', dps: 6, spiders: true, look: 'spider', col: '#e0c0c0' },
  lostfly: { k: 'bounce', dps: 30, look: 'fly', col: '#d0d0d0' },
  punchbag: { k: 'bounce', dps: 0, look: 'bag', col: '#c04040' },
  lildumpy: { k: 'bounce', dps: 4, status: 'confuse', look: 'poop', col: '#8a6a4a' },
  spidermod: { k: 'bounce', dps: 3, status: 'rand', look: 'spider', col: '#80c080' },
  bbf: { k: 'bounce', dps: 0, boom: true, look: 'fly', col: '#e08030' },
  succubus: { k: 'bounce', dps: 0, aura: 45, look: 'demon', col: '#3a1a2a' },
  chubby: { k: 'charge', dps: 30, look: 'blob', col: '#e0c8b0' },
  bigchubby: { k: 'charge', dps: 45, look: 'blob', col: '#e0b8a0', big: true },
  bobbrain: { k: 'charge', dps: 0, boom: true, look: 'brain', col: '#e090a0' },
  leech: { k: 'chase', dps: 15, heal: true, look: 'worm', col: '#a03030' },
  lilhaunt: { k: 'chase', dps: 4, status: 'fear', look: 'ghost', col: '#e8e8f8' },
  bloodpuppy: { k: 'chase', dps: 15, look: 'dog', col: '#b03030' },
  angryfly: { k: 'chase', dps: 30, look: 'fly', col: '#c03030' },
  gemini: { k: 'chase', dps: 13, tether: 80, look: 'baby', col: '#e0b0a0' },
  wormfriend: { k: 'chase', dps: 6, status: 'slow', look: 'worm', col: '#e0a0a0' },
  lilportal: { k: 'chase', dps: 10, look: 'orb', col: '#5040a0' },
  sevenseals: { k: 'chase', dps: 20, look: 'fly', col: '#e0e0e0' },
  jawbone: { k: 'chase', dps: 20, look: 'bone', col: '#ece4d2' },
  deadbird: { k: 'chase', dps: 20, look: 'fly', col: '#3a3a3a' },
  locust: { k: 'chase', dps: 12, look: 'fly', col: '#8a7a3a' },
  clot: { k: 'chase', dps: 8, look: 'blob', col: '#a01818', small: true },
  smartfly: { k: 'orbit', r: 28, dps: 8, block: true, look: 'fly', col: '#e0e0f0' },
  guardian: { k: 'orbit', r: 28, dps: 28, block: true, look: 'angel', col: '#fffbe8' },
  dagger: { k: 'orbit', r: 30, dps: 60, block: true, look: 'blade', col: '#d0d0e0' },
  cube: { k: 'orbit', r: 30, dps: 20, block: true, look: 'meat', col: '#c04050' },
  bandages: { k: 'orbit', r: 30, dps: 20, block: true, look: 'bandage', col: '#f0e8d0' },
  prettyfly: { k: 'orbit', r: 22, dps: 0, block: true, look: 'fly', col: '#f0f0ff' },
  distant: { k: 'orbit', r: 70, dps: 30, look: 'fly', col: '#c03030' },
  foreveralone: { k: 'orbit', r: 95, dps: 30, look: 'fly', col: '#4060c0' },
  friendzone: { k: 'orbit', r: 70, dps: 45, look: 'fly', col: '#40c060' },
  bigfan: { k: 'orbit', r: 36, dps: 30, block: true, big: true, look: 'fly', col: '#6a4a3a' },
  momrazor: { k: 'orbit', r: 30, dps: 20, status: 'bleed', look: 'blade', col: '#c0c0c8' },
  slippedrib: { k: 'orbit', r: 30, dps: 0, block: true, look: 'bone', col: '#ece4d2' },
  sworn: { k: 'orbit', r: 30, dps: 28, block: true, look: 'angel', col: '#fff0d0' },
  swarm: { k: 'orbit', r: 22, dps: 5, block: true, look: 'fly', col: '#202020', count: 9 },
  tinytoma: { k: 'orbit', r: 30, dps: 15, block: true, look: 'blob', col: '#c04040' },
  psyfly: { k: 'orbit', r: 40, dps: 5, block: true, look: 'fly', col: '#c0a0f0' },
  botfly: { k: 'orbit', r: 30, dps: 8, block: true, look: 'fly', col: '#80a0c0' },
  leprosy: { k: 'orbit', r: 30, dps: 28, block: true, look: 'blob', col: '#c0a080' },
  boneorb: { k: 'orbit', r: 34, dps: 10, block: true, look: 'bone', col: '#ece4d2' },
  wisp: { k: 'orbit', r: 26, dps: 4, block: true, shoot: true, look: 'flame', col: '#ffd070' },
  prism: { k: 'orbit', r: 60, dps: 0, look: 'orb', col: '#e0f0ff' },
  tonsil: { k: 'follow', block: true, look: 'meat', col: '#e090a0' },
  drybaby: { k: 'follow', block: true, look: 'baby', col: '#e8e0c8' },
  fartbaby: { k: 'follow', block: true, look: 'baby', col: '#c0a070' },
  kingbaby: { k: 'follow', look: 'baby', col: '#f0d060', crown: true },
  shade: { k: 'follow', dps: 12, delay: 60, look: 'ghost', col: '#202020' },
  obsessed: { k: 'follow', dps: 10, delay: 180, look: 'baby', col: '#f0c0d0' },
  multibaby: { k: 'follow', delay: 150, look: 'baby', col: '#a0e0d0' },
  headless: { k: 'follow', trail: 'red', look: 'baby', col: '#f0d2c2' },
  depression: { k: 'follow', trail: 'tar', look: 'blob', col: '#6080a0' },
  juicysack: { k: 'follow', trail: 'tar', look: 'sack', col: '#e0e0c0' },
  rotten: { k: 'follow', flies: true, look: 'baby', col: '#a0b070' },
  holywater: { k: 'follow', look: 'orb', col: '#a0d8ff' },
  egg: { k: 'follow', look: 'egg', col: '#f0f0e0' },
  yolisten: { k: 'follow', look: 'fly', col: '#80c0ff' },
  lostsoul: { k: 'follow', look: 'ghost', col: '#c0e0ff' },
  hallowed: { k: 'follow', look: 'poop', col: '#f0ece0' },
  daddy: { k: 'stomp', dmg: 40, rate: 3, look: 'none' },
  censer: { k: 'aura', r: 90, look: 'orb', col: '#e0c070' },
  star: { k: 'aura', r: 70, buff: true, look: 'star', col: '#ffe070' },
  spear: { k: 'spear', look: 'blade', col: '#e0e0e8' },
  pointyrib: { k: 'spear', look: 'bone', col: '#ece4d2' },
  finger: { k: 'finger', look: 'finger', col: '#f0d2c2' },
  chains: { k: 'chain', dps: 30, block: true, look: 'ball', col: '#5a5a62' },
  onlyfriend: { k: 'pilot', dps: 37.5, look: 'fly', col: '#3a3a5a' },
  lilabaddon: { k: 'follow', maw: true, look: 'baby', col: '#2a1a3a', horns: true },
  lilbrim: { k: 'brim', look: 'baby', col: '#3a2a2a', horns: true },
  pennies: { k: 'drop', every: 2, kind: 'coin', look: 'sack', col: '#c0a060' },
  chad: { k: 'drop', every: 3, kind: 'half', look: 'baby', col: '#e0b0a0' },
  relic: { k: 'drop', every: 5, kind: 'soul', look: 'orb', col: '#6b8fe6' },
  bombbag: { k: 'drop', every: 3, kind: 'bomb', look: 'sack', col: '#606070' },
  mystsack: { k: 'drop', every: 5, kind: 'random', look: 'sack', col: '#8a7050' },
  runebag: { k: 'drop', every: 5, kind: 'card', look: 'sack', col: '#606090' },
  sackofsacks: { k: 'drop', every: 5, kind: 'chest', look: 'sack', col: '#9a8060' },
  acidbaby: { k: 'drop', every: 3, kind: 'pill', look: 'baby', col: '#90e070' },
  lilchest: { k: 'drop', every: 1, chance: 0.35, kind: 'random', look: 'box', col: '#c09060' },
  chargedbaby: { k: 'drop', every: 1, chance: 0.2, kind: 'battery', look: 'baby', col: '#f0e060' },
  bum: { k: 'drop', every: 4, kind: 'random', look: 'baby', col: '#a08060' },
  darkbum: { k: 'drop', every: 4, kind: 'soul', look: 'baby', col: '#402030' },
  keybum: { k: 'drop', every: 5, kind: 'chest', look: 'baby', col: '#e0c060' },
  bumbo: { k: 'drop', every: 3, kind: 'coin', look: 'baby', col: '#c8a060' },
};

function addFamiliar(name, temp, o = {}) {
  const def = FAMS[name];
  if (!def || G.familiars.length >= 60) return;
  const p = G.player;
  const n = def.count || 1;
  for (let i = 0; i < n; i++) {
    G.familiars.push({ name, def, x: o.x != null ? o.x : (p ? p.x : CX), y: o.y != null ? o.y : (p ? p.y : CY), cd: rr(0, 0.5), a: Math.random() * TAU, t: 0, vx: 0, vy: 0, temp: !!temp, rooms: 0, dx: pick([-1, 1]), dy: pick([-1, 1]), charge: 0 });
  }
}

function famDmg(f, base) { return base * (G.player.passive.has('bffs') ? 2 : 1); }

function famShoot(f, dir, def) {
  const p = G.player;
  const pl = def.player;
  const dmg = pl ? p.dmg * pl : famDmg(f, def.dmg);
  const spd = (pl ? 360 * p.shot : 330);
  const mk = a => {
    if (def.laser) { const dx = Math.cos(a), dy = Math.sin(a), len = rayLen(f.x, f.y, dx, dy); laserHit(f.x, f.y, f.x + dx * len, f.y + dy * len, 4, dmg, { vx: dx, vy: dy }, {}); G.effects.push({ type: 'laser', x0: f.x, y0: f.y - 8, x1: f.x + dx * len, y1: f.y + dy * len - 8, t: 0, max: 0.1, color: '#ff4a4a', w: 2 }); return; }
    const fx = Object.assign({}, def.fx || {});
    if (def.rand) fx[pick(RAND_TEAR)] = true;
    const t = makeTear(f.x, f.y, Math.cos(a) * spd, Math.sin(a) * spd, p, dmg, { plain: !pl || def.plain, range: pl ? p.range : 240, color: def.tear, fx });
    if (def.creep) t.fx.creephit = true;
    G.tears.push(t);
  };
  const base = Math.atan2(dir.y, dir.x);
  if (def.dirs === 'v') { mk(base - 0.25); mk(base + 0.25); }
  else if (def.dirs === 'cross') for (let i = 0; i < 4; i++) mk(base + i * Math.PI / 2);
  else if (def.dirs === 'burst') for (let i = 0; i < 6; i++) mk(base + rr(-0.4, 0.4));
  else if (def.dirs === 'ring') for (let i = 0; i < 8; i++) mk(base + i * TAU / 8);
  else mk(base);
}

function famContact(f, dps, dt, status) {
  if (!dps && !status) return;
  for (const e of G.enemies) {
    if (e.dead || e.untargetable || e.invisible) continue;
    if (dist(e, f) > e.r + (f.def.big ? 14 : 9)) continue;
    f.hitT = (f.hitT || 0) - dt;
    if (f.hitT <= 0) {
      f.hitT = 0.2;
      if (dps) damageEnemy(e, famDmg(f, dps) * 0.2, null, true);
      if (status === 'rand') applyStatus(e, pick(['slow', 'fear', 'charm', 'confuse', 'freeze', 'poison']), 2, 3);
      else if (status) applyStatus(e, status, 2, 3);
    }
    if (f.def.heal && e.dead) healRed(G.player, 1);
    break;
  }
}

function updateFamiliars(dt) {
  const p = G.player;
  const fire = Input.fire.x || Input.fire.y ? fireVec(p) : null;
  const orbs = {};
  let follower = 0;
  p.starBuff = false;
  for (const f of G.familiars) {
    const d = f.def;
    f.t += dt; f.cd -= dt;
    const followPos = () => {
      follower++;
      const tr = G.trail[Math.min(G.trail.length - 1, d.delay || follower * 14)] || p;
      f.x += (tr.x - f.x) * Math.min(1, dt * 10); f.y += (tr.y - f.y) * Math.min(1, dt * 10);
    };
    switch (d.k) {
      case 'shoot':
        followPos();
        if (fire && f.cd <= 0) { famShoot(f, fire, d); f.cd = d.player ? 1 / p.tps : d.rate; }
        break;
      case 'abel': {
        f.x = 2 * CX - p.x; f.y = 2 * CY - p.y;
        if (fire && f.cd <= 0) { famShoot(f, { x: -fire.x, y: -fire.y }, d); f.cd = d.rate; }
        break;
      }
      case 'twin': {
        const mv = Input.move, sp = 160;
        f.x += mv.x * sp * dt; f.y += mv.y * sp * dt;
        f.r = 10; collideTiles(f, G.room.tiles, solidWalk);
        f.x = clamp(f.x, X0 + 10, X1 - 10); f.y = clamp(f.y, Y0 + 10, Y1 - 10);
        if (fire && f.cd <= 0) { famShoot(f, fire, d); f.cd = d.rate; }
        break;
      }
      case 'auto': {
        followPos();
        if (f.cd <= 0) { const e = nearestEnemy(f.x, f.y, d.range || 220); if (e) { famShoot(f, { x: e.x - f.x, y: e.y - f.y }, d); f.cd = d.rate; } }
        break;
      }
      case 'turret': case 'sprinkler': {
        if (f.cd <= 0) {
          if (d.k === 'sprinkler') { f.a += 0.6; famShoot(f, { x: Math.cos(f.a), y: Math.sin(f.a) }, { dmg: p.dmg * 0.8, rate: 0.12 }); f.cd = 0.12; }
          else { const e = nearestEnemy(f.x, f.y, 400); if (e) { famShoot(f, { x: e.x - f.x, y: e.y - f.y }, { dmg: p.dmg, rate: 0.5 }); f.cd = 0.5; } }
        }
        break;
      }
      case 'bounce': {
        const sp = 85;
        f.x += f.dx * sp * dt; f.y += f.dy * sp * dt;
        if (f.x < X0 + 10 || f.x > X1 - 10) { f.dx *= -1; f.x = clamp(f.x, X0 + 10, X1 - 10); }
        if (f.y < Y0 + 10 || f.y > Y1 - 10) { f.dy *= -1; f.y = clamp(f.y, Y0 + 10, Y1 - 10); }
        famContact(f, d.dps, dt, d.status);
        if (d.shoot && fire && f.cd <= 0) { famShoot(f, fire, { dmg: 3.5, rate: 0.6 }); f.cd = 0.6; }
        if (d.aura) for (const e of G.enemies) if (!e.dead && !e.invisible && dist(e, f) < d.aura) { e.auraT = (e.auraT || 0) - dt; if (e.auraT <= 0) { e.auraT = 0.25; damageEnemy(e, famDmg(f, 3), null, true); } }
        if (d.spiders && f.cd <= 0) { f.cd = 6; if (!G.room.cleared) EFX.spiders(p, [1], {}); }
        if (d.boom && G.enemies.some(e => !e.dead && !e.invisible && dist(e, f) < e.r + 10)) { explode(f.x, f.y, 60, 60, false); f.x = p.x; f.y = p.y; }
        break;
      }
      case 'charge': {
        if (f.dashT > 0) {
          f.dashT -= dt; f.x += f.vx * dt; f.y += f.vy * dt;
          if (f.x < X0 + 10 || f.x > X1 - 10 || f.y < Y0 + 10 || f.y > Y1 - 10) { f.dashT = 0; if (d.boom) { explode(f.x, f.y, 55, 50, false); } }
          famContact(f, d.dps, dt);
          if (d.boom && G.enemies.some(e => !e.dead && !e.invisible && dist(e, f) < e.r + 10)) { f.dashT = 0; explode(f.x, f.y, 60, 60, false); f.x = p.x; f.y = p.y; }
        } else {
          followPos();
          if (fire && f.cd <= 0) { f.dashT = 1.2; f.vx = fire.x * (d.big ? 160 : 300); f.vy = fire.y * (d.big ? 160 : 300); f.cd = 2.5; }
        }
        break;
      }
      case 'chase': {
        const e = nearestEnemy(f.x, f.y, 600);
        let tx = p.x, ty = p.y;
        if (e) { tx = e.x; ty = e.y; }
        if (d.tether && dist({ x: tx, y: ty }, p) > d.tether + 60) { tx = p.x; ty = p.y; }
        const a = Math.atan2(ty - f.y, tx - f.x), sp = e ? 120 : 160;
        if (Math.hypot(tx - f.x, ty - f.y) > (e ? 2 : 30)) { f.x += Math.cos(a) * sp * dt; f.y += Math.sin(a) * sp * dt; }
        famContact(f, d.dps, dt, d.status);
        break;
      }
      case 'orbit': {
        const key = d.r;
        orbs[key] = orbs[key] || G.familiars.filter(o => o.def.k === 'orbit' && o.def.r === key);
        const list = orbs[key], i = list.indexOf(f);
        const base = (G.time * (d.r > 50 ? 1.6 : 3.2)) + i * TAU / list.length;
        f.x = p.x + Math.cos(base) * d.r; f.y = p.y - 6 + Math.sin(base) * d.r * 0.85;
        if (d.block) for (const t of G.etears) if (!t.dead && Math.hypot(t.x - f.x, t.y - f.y) < t.r + 9) endETear(t);
        famContact(f, d.dps, dt, d.status);
        if (d.shoot && fire && f.cd <= 0) { famShoot(f, fire, { dmg: 3, rate: 1, fx: { spectral: 1 } }); f.cd = 1; }
        break;
      }
      case 'follow': {
        followPos();
        if (d.block) for (const t of G.etears) if (!t.dead && Math.hypot(t.x - f.x, t.y - f.y) < t.r + 10) endETear(t);
        if (d.dps) famContact(f, d.dps, dt);
        if (d.trail && f.cd <= 0 && !G.room.cleared) { f.cd = 0.35; G.pcreeps.push({ x: f.x, y: f.y + 4, r: 14, t: 2.5, max: 2.5, dmg: d.trail === 'red' ? 4 : 0, kind: d.trail === 'red' ? 'dmg' : 'slow', col: d.trail === 'red' ? 'red' : 'tar' }); }
        if (d.flies && fire && f.cd <= 0) { f.cd = 3; EFX.flies(p, [1]); }
        if (d.maw) { if (fire) f.charge += dt; else { if (f.charge > 1.5) G.rings.push({ x: f.x, y: f.y, t: 0.8, r: 45, dmg: 4, follow: false, dark: true, fam: f }); f.charge = 0; } }
        break;
      }
      case 'stomp': {
        f.x = p.x; f.y = p.y;
        if (f.cd <= 0) { const e = nearestEnemy(p.x, p.y, 999); if (e) { G.missiles.push({ x: e.x, y: e.y, t: 0.6, max: 0.6, dmg: famDmg(f, d.dmg), r: 35, kind: 'stomp' }); } f.cd = d.rate; }
        break;
      }
      case 'aura': {
        followPos();
        for (const e of G.enemies) if (!e.dead && dist(e, f) < d.r) applyStatus(e, 'slow', 0.3);
        for (const t of G.etears) if (dist(t, f) < d.r) t.slowed = 0.2;
        if (d.buff && dist(p, f) < d.r) p.starBuff = true;
        break;
      }
      case 'spear': {
        const dir = fire || p.lastDir;
        f.x = p.x + dir.x * 26; f.y = p.y - 4 + dir.y * 26;
        for (const e of G.enemies) if (!e.dead && !e.invisible && !e.untargetable && dist(e, f) < e.r + 12) { e.spT = (e.spT || 0) - dt; if (e.spT <= 0) { e.spT = 0.25; damageEnemy(e, p.dmg * 2 * 0.25 * 4, null, true); } }
        break;
      }
      case 'finger': {
        followPos();
        if (f.cd <= 0) { const e = nearestEnemy(f.x, f.y, 260); if (e) { damageEnemy(e, p.dmg * 0.5, null, true); G.effects.push({ type: 'zap', x0: f.x, y0: f.y - 8, x1: e.x, y1: e.y - 8, t: 0, max: 0.12 }); } f.cd = 0.4; }
        break;
      }
      case 'chain': {
        const dd = dist(f, p);
        if (dd > 55) { f.x += (p.x - f.x) * (dd - 55) / dd; f.y += (p.y - f.y) * (dd - 55) / dd; }
        for (const t of G.etears) if (!t.dead && Math.hypot(t.x - f.x, t.y - f.y) < t.r + 11) endETear(t);
        famContact(f, d.dps, dt);
        break;
      }
      case 'pilot': {
        const dir = fire || { x: 0, y: 0 };
        f.x = clamp(f.x + dir.x * 220 * dt, X0 + 8, X1 - 8); f.y = clamp(f.y + dir.y * 220 * dt, Y0 + 8, Y1 - 8);
        famContact(f, d.dps, dt);
        break;
      }
      case 'brim': {
        followPos();
        if (fire) { f.charge += dt; f.dir = fire; }
        else if (f.charge > 0) { if (f.charge > 1.5) G.beams.push({ dx: f.dir.x, dy: f.dir.y, t: 0.4, tick: 0, dmg: famDmg(f, 3), w: 8, fixed: { x: f.x, y: f.y } }); f.charge = 0; }
        break;
      }
      case 'drop': followPos(); break;
    }
  }
  G.familiars = G.familiars.filter(f => !f.dead);
}

function familiarsOnClear() {
  const p = G.player;
  for (const f of G.familiars) {
    const d = f.def;
    if (d.k !== 'drop') continue;
    f.rooms++;
    if (f.rooms >= d.every && (!d.chance || Math.random() < d.chance)) { f.rooms = 0; dropKind(d.kind, f.x, f.y); }
  }
}

function updateBlueFlies(dt) {
  const p = G.player;
  const mult = p.passive.has('hivemind') ? 2 : 1;
  for (const b of G.blueflies) {
    b.life -= dt;
    const e = nearestEnemy(b.x, b.y, 500);
    let tx, ty;
    if (e) { tx = e.x; ty = e.y; } else { b.a += dt * 3; tx = p.x + Math.cos(b.a) * 30; ty = p.y + Math.sin(b.a) * 30; }
    const spider = b.kind === 'spider';
    const a = Math.atan2(ty - b.y, tx - b.x) + Math.sin(G.time * 8 + b.a) * (spider ? 0.2 : 0.5);
    const sp = spider ? (Math.sin(G.time * 10 + b.a) > 0 ? 200 : 40) : 170;
    b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt;
    if (e && dist(b, e) < e.r + 5) { damageEnemy(e, (spider ? 6 : 8) * mult + p.dmg * 0.5, null); b.dead = true; bloodBurst(b.x, b.y, 4, '#4060c0'); }
    if (b.life <= 0) b.dead = true;
  }
  G.blueflies = G.blueflies.filter(b => !b.dead);
}

// ---------- Activos y bolsillo ----------
function useActive(p) {
  const a = p.active;
  if (!a) return;
  const it = ITEMS[a.id], max = activeMax(p);
  const free = !it.charge;
  if (free) { if (p.actCd > 0) return; }
  else if (a.charge < max) {
    if (p.passive.has('sharpplug') && p.red > 2 && !G.run.god) { p.iframes = 0; hurtPlayer(2, 'Enchufe afilado'); a.charge = max; }
    else { Sfx.play('nope'); return; }
  }
  if (it.use(p) === false) { Sfx.play('nope'); return; }
  if (p.passive.has('carbattery')) it.use(p);
  if (free) p.actCd = 0.4; else a.charge = Math.max(0, a.charge - max);
  if (it.once) { p.active = p.active2 || null; p.active2 = null; }
  Sfx.play('active');
  G.showBanner(it.name, '', 1.2);
}

function usePocket(p) {
  const pk = p.pocket;
  if (!pk) return;
  p.pocket = null;
  if (pk.k === 'pill') { applyPill(p, pk.v); return; }
  const c = CARDS[pk.v];
  runEffects(p, c[1].split(','), {});
  if (p.passive.has('tarotcloth')) runEffects(p, c[1].split(','), {});
  G.showBanner(c[0], '', 2);
  Sfx.play('pill');
}

// ---------- Recogibles ----------
function spawnPickup(kind, x, y, o = {}) {
  const p = G.player;
  if (p && !o.raw) {
    const P = p.passive;
    if (kind === 'pill' && P.has('deck')) kind = 'card';
    else if (kind === 'card' && P.has('baggy')) kind = 'pill';
    if (kind === 'bomb' && P.has('bogo')) kind = 'bomb2';
    if (kind === 'heart' && P.has('mitre') && Math.random() < 0.33) kind = 'soul';
    if ((kind === 'coin' || kind === 'bomb' || kind === 'key') && P.has('sackhead') && Math.random() < 0.2) kind = 'chest';
    if (P.has('humble') && (kind === 'coin' || kind === 'key' || kind === 'heart')) spawnPickup(kind, x, y, Object.assign({}, o, { raw: true }));
  }
  const pk = mkPickup(kind, x, y, Object.assign({ pop: true }, o));
  if (kind === 'card' && pk.card == null) pk.card = ri(0, CARDS.length - 1);
  G.room.pickups.push(pk);
  return pk;
}
function randomRewardKind() {
  return weighted([['coin', 30], ['nickel', 3], ['dime', 1], ['heart', 16], ['half', 6], ['soul', 4], ['black', 1], ['bomb', 14], ['key', 16], ['chest', 6], ['gchest', 2], ['pill', 6], ['card', 4], ['battery', 2]]);
}
function randomBasicKind() {
  return weighted([['coin', 40], ['nickel', 4], ['dime', 1], ['heart', 12], ['soul', 5], ['black', 1], ['bomb', 14], ['key', 14], ['pill', 5], ['card', 4], ['battery', 2]]);
}

function pocketName(pk) {
  if (pk.k === 'card') return CARDS[pk.v][0];
  return G.run.pillKnown[pk.v] ? PILL_EFFECTS[G.run.pillMap[pk.v]].name : 'Píldora ???';
}

function applyPickup(pk) {
  const p = G.player, P = p.passive;
  switch (pk.kind) {
    case 'coin': case 'nickel': case 'dime': {
      if (p.keeper && p.red < p.maxRed * 2) { p.red = Math.min(p.maxRed * 2, p.red + 2); Sfx.play('heart'); return true; }
      const v = pk.kind === 'coin' ? 1 : pk.kind === 'nickel' ? 5 : 10;
      if (p.coins >= coinCap(p)) return false;
      p.coins = Math.min(coinCap(p), p.coins + v); Sfx.play('coin');
      if (P.has('gullet')) { const want = Math.floor(p.coins / 25); p.gullet = p.gullet || 0; while (p.gullet < want) { p.gullet++; addHp(p, 'hp', 1); } }
      return true;
    }
    case 'heart': case 'half':
      if (p.jar != null && P.has('jar') && !canHealRed(p) && !p.keeper && !p.noRed) { if (p.jar >= 4) return false; p.jar++; Sfx.play('heart'); return true; }
      if (!healRed(p, pk.kind === 'heart' ? 2 : 1)) return false;
      Sfx.play('heart');
      if (P.has('immaculate')) { p.hearts = (p.hearts || 0) + 1; if (p.hearts % 15 === 0) { if (Math.random() < 0.5) addFamiliar('seraphim'); else addHp(p, 'soul', 1); } }
      return true;
    case 'soul': case 'black':
      if (!canAddSoul(p)) return false;
      if (pk.kind === 'soul') p.soul += 2; else p.black += 2;
      clampHearts(p); Sfx.play('heart');
      if (P.has('soullocket')) p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd', 'rangeAdd'])] += pick([0.2, 0.25]) * (Math.random() < 0.5 ? 1 : 1);
      return true;
    case 'bomb': if (p.bombs >= 99) return false; p.bombs = Math.min(99, p.bombs + 1); Sfx.play('pickup'); return true;
    case 'bomb2': if (p.bombs >= 99) return false; p.bombs = Math.min(99, p.bombs + 2); Sfx.play('pickup'); return true;
    case 'key': if (p.keys >= 99) return false; p.keys = Math.min(99, p.keys + 1); Sfx.play('key'); return true;
    case 'battery':
      if (!p.active || !ITEMS[p.active.id].charge) return false;
      { const max = activeMax(p) * (P.has('battery') ? 2 : 1); if (p.active.charge >= max) return false; p.active.charge = max; Sfx.play('charged'); return true; }
    case 'pill': case 'card': {
      const mine = { k: pk.kind, v: pk.kind === 'pill' ? pk.pill : pk.card };
      if (!p.pocket) { p.pocket = mine; Sfx.play('pickup'); G.showBanner(pocketName(mine), '', 1.5); return true; }
      const old = p.pocket; p.pocket = mine;
      pk.kind = old.k; pk.pill = old.k === 'pill' ? old.v : null; pk.card = old.k === 'card' ? old.v : null; pk.r = PK_R[pk.kind];
      pk.cd = 1.2; Sfx.play('pickup'); G.showBanner(pocketName(mine), '', 1.5);
      return 'swap';
    }
  }
  return false;
}

function openChest(pk, gold) {
  pk.gone = true;
  Sfx.play('unlock');
  G.effects.push({ type: 'poof', x: pk.x, y: pk.y, t: 0, max: 0.4, r: 16 });
  if (gold && Math.random() < 0.15) { G.room.pickups.push(mkPickup('item', pk.x, pk.y, { item: pickItem('treasure') })); return; }
  let n = gold ? ri(2, 4) : ri(1, 3);
  if (G.player.passive.has('momkey')) n += 2;
  for (let i = 0; i < n; i++) spawnPickup(randomBasicKind(), pk.x, pk.y);
}

function pushAway(pk) {
  const p = G.player, d = dist(p, pk) || 1;
  pk.vx = (pk.x - p.x) / d * 160; pk.vy = (pk.y - p.y) / d * 160;
}

function shopPrice(pk) {
  if (pk.price == null) return null;
  return G.player.passive.has('sale') ? Math.ceil(pk.price / 2) : pk.price;
}

function touchStatic(pk) {
  const p = G.player, P = p.passive;
  if (pk.kind === 'trophy') { G.win(); return; }
  if (pk.kind === 'item') {
    if (!pk.item) return;
    if (pk.hprice) {
      const h = pk.hprice;
      if (p.lost) { /* gratis para The Lost */ }
      else if (p.keeper || P.has('poundflesh')) { const c = 15 * h; if (p.coins < c) return; p.coins -= c; }
      else if (p.maxRed >= h && (p.maxRed > h || p.soul + p.black > 0)) { p.maxRed -= h; clampHearts(p); }
      else if (p.soul + p.black >= 6 && (p.soul + p.black > 6 || p.maxRed > 0)) { let n = 6; const s = Math.min(p.soul, n); p.soul -= s; n -= s; p.black -= n; }
      else return;
      pk.hprice = null; Sfx.play('devil');
    } else if (pk.sprice) {
      const n = pk.sprice, halves = n * 2, have = p.soul + p.black;
      if (p.lost) { /* gratis para The Lost */ }
      else if (p.keeper || P.has('poundflesh')) { const c = 15 * n; if (p.coins < c) return; p.coins -= c; }
      else if (have >= halves && (have > halves || p.red > 0)) { let h = halves; const s = Math.min(p.soul, h); p.soul -= s; h -= s; p.black -= h; }
      else return;
      pk.sprice = null; Sfx.play('devil');
    } else if (pk.kprice) {
      if (!p.lost) { if (p.keys < pk.kprice) return; p.keys -= pk.kprice; }
      pk.kprice = null; Sfx.play('unlock');
    } else if (pk.price != null) {
      if (P.has('poundflesh') && pk.shop) { if (p.maxRed < 1 || p.maxRed === 1 && p.soul + p.black === 0) return; p.maxRed--; clampHearts(p); }
      else { const c = shopPrice(pk); if (p.coins < c) return; p.coins -= c; }
      pk.price = null; Sfx.play('buy');
      if (P.has('keepersack')) p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd', 'rangeAdd'])] += 0.3;
      if (P.has('restock') && pk.shop) G.room.pickups.push(mkPickup('item', pk.x, pk.y, { item: pickItem('shop'), price: 15, shop: true, cd: 1.5 }));
    }
    const old = G.giveItem(pk.item);
    if (pk.choice) for (const o of G.room.pickups) if (o !== pk && o.choice === pk.choice) { o.gone = true; poofAt(o.x, o.y - 20); }
    if (pk.shop) pk.gone = true;
    pk.item = old || null; pk.cycle = null; pk.cd = 1.2;
    return;
  }
  if (pk.price != null) {
    const c = shopPrice(pk);
    if (p.coins < c) return;
    const res = applyPickup(pk);
    if (!res) return;
    p.coins -= c; Sfx.play('buy');
    if (P.has('keepersack')) p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd', 'rangeAdd'])] += 0.15;
    if (P.has('restock')) G.room.pickups.push(mkPickup(pk.kind === 'pill' || pk.kind === 'card' ? 'heart' : pk.kind, pk.x, pk.y, { price: pk.price, shop: true, cd: 1.5 }));
    if (res === true) pk.gone = true; else pk.price = null;
  }
}

function updatePickups(dt) {
  const p = G.player, room = G.room;
  for (const pk of room.pickups) {
    pk.t += dt;
    if (pk.cd > 0) pk.cd -= dt;
    if (pk.cycle) { pk.ct -= dt; if (pk.ct <= 0) { pk.ci = (pk.ci + 1) % pk.cycle.length; pk.item = pk.cycle[pk.ci]; pk.ct = pk.cycleT || 0.4; } }
    if (pk.kind === 'item' || pk.price != null || pk.kind === 'trophy') {
      const d = dist(p, pk);
      if (pk.cd <= 0 && d < p.r + 15) touchStatic(pk);
      const solidR = pk.kind === 'trophy' ? 20 : pk.kind === 'item' ? 13 : 0;
      if (solidR && d < p.r + solidR && d > 0.01) {
        const push = p.r + solidR - d;
        p.x += (p.x - pk.x) / d * push; p.y += (p.y - pk.y) / d * push;
      }
      continue;
    }
    if (p.flags.magnet && (pk.kind === 'coin' || pk.kind === 'nickel' || pk.kind === 'dime' || pk.kind === 'key' || pk.kind === 'bomb' || pk.kind === 'bomb2')) {
      const d = dist(p, pk);
      if (d < 170 && d > 1) { pk.vx += (p.x - pk.x) / d * 700 * dt; pk.vy += (p.y - pk.y) / d * 700 * dt; }
    }
    pk.x += pk.vx * dt; pk.y += pk.vy * dt;
    const fr = Math.pow(0.04, dt); pk.vx *= fr; pk.vy *= fr;
    const h = collideTiles(pk, room.tiles, solidWalk);
    if (h) { if (h.hx) pk.vx *= -0.6; if (h.hy) pk.vy *= -0.6; }
    if (pk.x < X0 + pk.r) { pk.x = X0 + pk.r; pk.vx = Math.abs(pk.vx) * 0.6; }
    if (pk.x > X1 - pk.r) { pk.x = X1 - pk.r; pk.vx = -Math.abs(pk.vx) * 0.6; }
    if (pk.y < Y0 + pk.r) { pk.y = Y0 + pk.r; pk.vy = Math.abs(pk.vy) * 0.6; }
    if (pk.y > Y1 - pk.r) { pk.y = Y1 - pk.r; pk.vy = -Math.abs(pk.vy) * 0.6; }
    if (pk.cd > 0) continue;
    const m = p.r + pk.r;
    if ((p.x - pk.x) ** 2 + (p.y - pk.y) ** 2 >= m * m) continue;
    if (pk.kind === 'chest') { openChest(pk, false); continue; }
    if (pk.kind === 'gchest') {
      if (p.keys > 0) { p.keys--; openChest(pk, true); } else pushAway(pk);
      continue;
    }
    const res = applyPickup(pk);
    if (res === true) {
      pk.gone = true;
      if (pk.choice) for (const o of room.pickups) if (o !== pk && o.choice === pk.choice) { o.gone = true; poofAt(o.x, o.y); }
    } else pushAway(pk);
  }
  room.pickups = room.pickups.filter(pk => !pk.gone);
}

// ---------- Charcos, luces, misiles, agujeros y anillos ----------
function updateCreeps(dt) {
  const p = G.player, P = p.passive;
  for (const c of G.creeps) {
    c.t -= dt;
    if (!isFlying(p) && !P.has('socks') && c.t > 0.3 && Math.hypot(p.x - c.x, p.y - c.y) < c.r * 0.8 + 3) hurtPlayer(dmgUnit(!c.small), c.src);
  }
  G.creeps = G.creeps.filter(c => c.t > 0);
  for (const c of G.pcreeps) {
    c.t -= dt; c.tick = (c.tick || 0) - dt;
    if (c.tick > 0) continue;
    c.tick = 0.25;
    for (const e of G.enemies) {
      if (e.dead || e.invisible || e.flying && c.kind !== 'gas' || Math.hypot(e.x - c.x, e.y - c.y) > c.r + e.r * 0.5) continue;
      if (c.kind === 'dmg' && c.dmg) damageEnemy(e, c.dmg * 0.5, null, true);
      else if (c.kind === 'slow') applyStatus(e, 'slow', 0.5);
      else if (c.kind === 'gas') applyStatus(e, 'poison', 2, Math.max(2, p.dmg * 0.4));
    }
  }
  G.pcreeps = G.pcreeps.filter(c => c.t > 0);
  for (const l of G.lights) {
    l.t -= dt; l.tick -= dt;
    if (l.tick <= 0) { l.tick = 0.1; for (const e of G.enemies) if (!e.dead && !e.invisible && !e.untargetable && Math.hypot(e.x - l.x, e.y - l.y) < 24 + e.r) damageEnemy(e, l.dmg * 0.2, null, true); }
  }
  G.lights = G.lights.filter(l => l.t > 0);
  for (const m of G.missiles) {
    m.t -= dt;
    if (m.t <= 0) {
      m.dead = true;
      if (m.kind === 'stomp' || m.kind === 'monstro') {
        G.shake = Math.max(G.shake, 0.3); Sfx.play('boom2');
        for (const e of G.enemies) if (!e.dead && !e.invisible && Math.hypot(e.x - m.x, e.y - m.y) < m.r + e.r) damageEnemy(e, m.dmg, null, true, true);
        if (m.hurts && Math.hypot(p.x - m.x, p.y - m.y) < m.r) hurtPlayer(2, 'Monstro');
        addDecal({ type: 'scorch', x: m.x, y: m.y, r: m.r * 0.5, rot: 0 });
      } else explode(m.x, m.y, m.r, m.dmg, false);
    }
  }
  G.missiles = G.missiles.filter(m => !m.dead);
  for (const h of G.holes) {
    h.t -= dt; h.tick -= dt;
    for (const e of G.enemies) if (!e.dead && !e.boss && !e.invisible) { const d = Math.hypot(h.x - e.x, h.y - e.y) || 1; if (d < 220) { e.kx += (h.x - e.x) / d * 260 * dt * 3; e.ky += (h.y - e.y) / d * 260 * dt * 3; } }
    for (const t of G.etears) { const d = Math.hypot(h.x - t.x, h.y - t.y); if (d < 40) t.dead = true; }
    if (h.tick <= 0) { h.tick = 0.2; for (const e of G.enemies) if (!e.dead && !e.invisible && Math.hypot(h.x - e.x, h.y - e.y) < 40 + e.r) damageEnemy(e, 3, null, true); }
  }
  G.holes = G.holes.filter(h => h.t > 0);
  for (const r of G.rings) {
    r.t -= dt; r.tick = (r.tick || 0) - dt;
    if (r.follow) { r.x = p.x; r.y = p.y; } else if (r.fam) { r.x = r.fam.x; r.y = r.fam.y; }
    if (r.dmg && r.tick <= 0) { r.tick = 0.1; for (const e of G.enemies) if (!e.dead && !e.invisible && !e.untargetable && Math.hypot(e.x - r.x, e.y - r.y) < r.r + e.r) damageEnemy(e, r.dmg * 0.25, null, true); }
  }
  G.rings = G.rings.filter(r => r.t > 0);
}

// Auras del jugador
function updateAuras(dt) {
  const p = G.player, A = p.auras;
  if (!A.size && !p.passive.has('repel')) return;
  p.auraT = (p.auraT || 0) - dt;
  const tick = p.auraT <= 0;
  if (tick) p.auraT = 0.25;
  if (p.passive.has('repel')) {
    for (const e of G.enemies) if (!e.dead && !e.boss && dist(e, p) < 60) { const d = dist(e, p) || 1; e.kx += (e.x - p.x) / d * 40; e.ky += (e.y - p.y) / d * 40; }
    for (const t of G.etears) if (dist(t, p) < 50) { const d = dist(t, p) || 1; t.vx += (t.x - p.x) / d * 30; t.vy += (t.y - p.y) / d * 30; }
  }
  if (!tick) return;
  for (const e of G.enemies) {
    if (e.dead || e.invisible || e.untargetable) continue;
    const d = dist(e, p);
    if (A.has('dmg') && d < 70 + e.r) damageEnemy(e, Math.max(1, p.dmg * 0.25), null, true);
    if (A.has('fear') && d < 70) applyStatus(e, 'fear', 1);
    if (A.has('slow') && d < 90) applyStatus(e, 'slow', 1);
    if (A.has('charm') && d < 60) applyStatus(e, 'charm', 1);
    if (A.has('freeze') && d < 42 + e.r) applyStatus(e, 'freeze', 1);
  }
  if (A.has('slow')) for (const t of G.etears) if (dist(t, p) < 90) t.slowed = 0.3;
  if (A.has('zap') && Math.random() < 0.25) { const e = nearestEnemy(p.x, p.y, 110); if (e) { damageEnemy(e, p.dmg * 0.75, null, true); G.effects.push({ type: 'zap', x0: p.x, y0: p.y - 10, x1: e.x, y1: e.y - 8, t: 0, max: 0.15 }); } }
  if (A.has('light') && Math.random() < 0.12) { const e = nearestEnemy(p.x, p.y, 120); if (e) G.lights.push({ x: e.x, y: e.y, t: 0.5, dmg: p.dmg, tick: 0 }); }
}

// ---------- Efectos ----------
function addParticle(x, y, vx, vy, o = {}) {
  if (G.parts.length > 400) return;
  G.parts.push({ x, y, vx, vy, z: o.z != null ? o.z : 0, vz: o.vz || 0, g: o.g != null ? o.g : 500, life: o.life || 0.6, max: o.life || 0.6, color: o.color || '#900', size: o.size || 2, decal: o.decal });
}
function bloodBurst(x, y, n, color = '#7d0f12') {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rr(30, 150);
    addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, { z: rr(4, 16), vz: rr(60, 200), color, size: rr(1.5, 3.5), life: rr(0.4, 0.9), decal: Math.random() < 0.35 });
  }
}
function updateParticles(dt) {
  for (const q of G.parts) {
    q.life -= dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
    q.z += q.vz * dt; q.vz -= q.g * dt;
    if (q.z <= 0) {
      q.z = 0; q.vz = 0; q.vx *= 0.6; q.vy *= 0.6;
      if (q.decal) { q.decal = false; addDecal({ type: 'drop', x: q.x, y: q.y, r: q.size * 1.3, color: q.color }); q.life = 0; }
    }
  }
  G.parts = G.parts.filter(q => q.life > 0);
  for (const f of G.effects) f.t += dt;
  G.effects = G.effects.filter(f => f.t < f.max);
}
function addDecal(d) {
  const room = G.room;
  if (!room) return;
  room.decals.push(d);
  if (room.decals.length > 160) room.decals.shift();
  if (G.bgRoom === room && G.bgCtx) paintDecal(G.bgCtx, d);
}
