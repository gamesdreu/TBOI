'use strict';
/* =========================================================
   Juego: estado, bucle principal, salas, menús y controles
   ========================================================= */
const G = {
  state: 'title', canvas: null, ctx: null, dpr: 1, w: 0, h: 0, scale: 1, offX: 0, offY: 0,
  safe: { t: 0, r: 0, b: 0, l: 0 }, portrait: false, touchUI: false,
  time: 0, last: 0, acc: 0, player: null, floorIdx: 0, floor: null, room: null,
  enemies: [], tears: [], etears: [], bombs: [], effects: [], parts: [], beams: [], creeps: [],
  familiars: [], blueflies: [], trail: [], pendingBooms: [], pcreeps: [], lights: [], missiles: [], holes: [], rings: [], eyes: [],
  shake: 0, banner: null, floorBanner: 0, slowTime: 0, flow: null, flowT: 0, shooter: null,
  bg: null, bgCtx: null, bgRoom: null, bgScale: 1, vig: null, snapA: null, snapB: null,
  trans: null, fade: null, intro: null, pendingIntro: null, prevRoom: null, prevSide: null, lastSide: null,
  menuSel: 0, menuButtons: [], menuT: { s: 1, ox: 0, oy: 0 }, mw: RW, mh: RH,
  run: null, charSel: 0, charTab: 0, deadT: 0, endT: 0,
  cheatSel: 0, cheatPage: 0, cheatFilter: 0, cheatMsg: null, cheatItem: null,

  init() {
    Store.load();
    Sfx.muted = !!Store.data.muted; Sfx.musicOn = Store.data.music !== false;
    this.charSel = clamp(Store.data.char | 0, 0, CHARS.length - 1);
    this.charTab = CHARS[this.charSel].tainted ? 1 : 0;
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    Input.init(this.canvas);
    try { Input.touchMode = matchMedia('(pointer: coarse)').matches; } catch (e) { /* sin matchMedia */ }
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'playing') this.pause(); });
    this.snapA = document.createElement('canvas');
    this.snapB = document.createElement('canvas');
    this.vig = buildVignette(0.55);
    this.resize();
    requestAnimationFrame(t => this.frame(t));
  },

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.w = w; this.h = h;
    const el = document.getElementById('safe');
    if (el) {
      const sp = getComputedStyle(el);
      this.safe = { t: parseFloat(sp.paddingTop) || 0, r: parseFloat(sp.paddingRight) || 0, b: parseFloat(sp.paddingBottom) || 0, l: parseFloat(sp.paddingLeft) || 0 };
    }
    this.layout();
  },

  layout() {
    const { w, h, safe } = this;
    const aw = w - safe.l - safe.r, ah = h - safe.t - safe.b;
    this.portrait = h > w * 1.05;
    this.touchUI = Input.touchMode;
    let s;
    if (this.portrait && this.touchUI) {
      s = Math.min(aw / RW, (ah * 0.6) / RH);
      this.offX = safe.l + (aw - RW * s) / 2; this.offY = safe.t + 10;
    } else {
      s = Math.min(aw / RW, ah / RH);
      this.offX = safe.l + (aw - RW * s) / 2; this.offY = safe.t + (ah - RH * s) / 2;
    }
    this.scale = s;
    if (this.portrait) { this.mw = 360; this.mh = 640; } else { this.mw = RW; this.mh = RH; }
    const ms = Math.min(aw / this.mw, ah / this.mh);
    this.menuT = { s: ms, ox: safe.l + (aw - this.mw * ms) / 2, oy: safe.t + (ah - this.mh * ms) / 2 };
    const bs = clamp(s * this.dpr, 1, 3);
    if (Math.abs(bs - this.bgScale) > 0.01 || !this.bg) { this.bgScale = bs; if (this.room) this.buildBg(); }
  },

  layoutButtons() {
    const B = [];
    const inGame = ['playing', 'slide', 'fade', 'bossintro'].includes(this.state);
    if (this.touchUI !== Input.touchMode) this.layout();
    if (inGame && this.touchUI) {
      const { w, h, safe } = this, r = 27;
      const p = this.player;
      if (this.portrait) {
        const by = this.offY + RH * this.scale + 62;
        B.push({ id: 'pause', x: safe.l + 32, y: by, r: 19 });
        B.push({ id: 'active', x: w - safe.r - 44, y: by, r }, { id: 'bomb', x: w - safe.r - 110, y: by, r }, { id: 'pill', x: w - safe.r - 176, y: by, r });
        if (p && p.active2) B.push({ id: 'swap', x: w - safe.r - 44, y: by + 50, r: 16 });
      } else {
        B.push({ id: 'pause', x: w - safe.r - 26, y: safe.t + 26, r: 19 });
        const bx = w - safe.r - 40;
        B.push({ id: 'active', x: bx, y: h * 0.34, r }, { id: 'bomb', x: bx, y: h * 0.34 + 64, r }, { id: 'pill', x: bx - 64, y: h * 0.34, r });
        if (p && p.active2) B.push({ id: 'swap', x: bx - 54, y: h * 0.34 + 50, r: 16 });
      }
    }
    Input.buttons = B;
  },

  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    if (!this.last) this.last = now;
    let el = (now - this.last) / 1000;
    this.last = now;
    if (el > 0.25) el = 0.25;
    this.acc += el;
    this.layoutButtons();
    Input.sticksEnabled = this.state === 'playing';
    Input.update();
    let steps = 0;
    while (this.acc >= DT && steps < 5) {
      this.update(DT);
      this.acc -= DT; steps++;
      if (steps === 1) Input.clearEdges();
    }
    if (steps >= 5) this.acc = 0;
    this.render();
  },

  // ---------- Lógica ----------
  update(dt) {
    this.time += dt;
    if (Input.take('mute')) this.toggleSound();
    switch (this.state) {
      case 'title': this.updateTitle(); break;
      case 'playing': this.updatePlaying(dt); break;
      case 'slide':
        this.trans.t += dt;
        if (this.trans.t >= this.trans.dur) { this.trans = null; this.state = 'playing'; this.afterEnter(); }
        break;
      case 'fade': this.updateFade(dt); break;
      case 'bossintro':
        this.intro.t += dt;
        if (this.intro.t > 2.4 || (this.intro.t > 0.5 && (Input.any() || Input.taps.length))) { this.state = 'playing'; this.intro = null; }
        break;
      case 'paused': this.updateMenu(this.pauseOptions(), id => this.pauseAction(id), true); break;
      case 'cheats': this.updateCheats(dt); break;
      case 'dying':
        this.deadT += dt; updateParticles(dt);
        if (this.deadT > 1.5) { this.state = 'dead'; this.endT = 0; this.menuSel = 0; }
        break;
      case 'dead': case 'win':
        this.endT += dt;
        if (this.endT > 0.9) this.updateMenu(this.endOptions(), id => this.endAction(id), false);
        break;
    }
  },

  updatePlaying(dt) {
    const p = this.player;
    this.run.time += dt;
    if (Input.take('pause')) { this.pause(); return; }
    if (Input.take('cheats')) { this.openCheats(); return; }
    if (this.slowTime > 0) this.slowTime -= dt;
    updatePlayer(p, dt);
    if (this.state !== 'playing' && this.state !== 'fade') return;
    this.trail.unshift({ x: p.x, y: p.y });
    if (this.trail.length > 200) this.trail.length = 200;
    if (--this.flowT <= 0) { this.flowT = 12; this.flow = computeFlow(this.room.tiles, txOf(p.x), tyOf(p.y)); }
    for (const e of this.enemies) if (!e.dead) updateEnemy(e, dt);
    separateEnemies();
    contactDamage(dt);
    updateTears(dt); updateETears(dt); updateBeams(dt); updateBombs(dt); updateEyes(dt);
    updateFamiliars(dt); updateBlueFlies(dt); updatePickups(dt); updateCreeps(dt); updateAuras(dt); updateParticles(dt);
    for (const b of this.pendingBooms) {
      b.t -= dt;
      if (b.t <= 0) { b.done = true; if (b.mini) explode(b.x, b.y, 45, 40, true, 'Tu propia bomba'); else explode(b.x, b.y, 85, 60, true, 'Un barril explosivo'); }
    }
    this.pendingBooms = this.pendingBooms.filter(b => !b.done);
    this.enemies = this.enemies.filter(e => !e.dead);
    if (!this.room.cleared && !this.enemies.some(e => !e.ignoreClear) && !p.dead) this.clearRoom();
    const td = this.room.trapdoor;
    if (td && this.state === 'playing') {
      td.t += dt;
      const d = dist(p, td);
      if (!td.armed && d > 36 && td.t > 0.5) td.armed = true;
      if (td.armed && d < 15) this.nextFloor();
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.floorBanner > 0) this.floorBanner -= dt;
  },

  playerBounds(p) {
    const room = this.room, r = p.r;
    const inX = Math.abs(p.x - CX) < 16, inY = Math.abs(p.y - CY) < 16;
    let minX = X0 + r, maxX = X1 - r, minY = Y0 + r, maxY = Y1 - r;
    const op = k => room.doors[k] && this.doorOpen(room.doors[k]);
    if (inX && op('up')) minY = Y0 - 30;
    if (inX && op('down')) maxY = Y1 + 30;
    if (inY && op('left')) minX = X0 - 30;
    if (inY && op('right')) maxX = X1 + 30;
    p.x = clamp(p.x, minX, maxX); p.y = clamp(p.y, minY, maxY);
    if (p.y < Y0 + r || p.y > Y1 - r) p.x = clamp(p.x, CX - 13, CX + 13);
    if (p.x < X0 + r || p.x > X1 - r) p.y = clamp(p.y, CY - 13, CY + 13);
    if (room.cleared) for (const k of DIRNAMES) {
      const d = room.doors[k];
      if (!d || !d.locked) continue;
      const D = DIRS[k];
      const near = D.dx ? (Math.abs(p.y - CY) < 18 && Math.abs(p.x - D.x) < r + 4) : (Math.abs(p.x - CX) < 18 && Math.abs(p.y - D.y) < r + 4);
      if (!near) continue;
      if (p.keys > 0) { p.keys--; d.locked = false; Sfx.play('unlock'); }
      else if (p.passive.has('paytoplay') && p.coins > 0) { p.coins--; d.locked = false; Sfx.play('coin'); }
    }
    if (p.y < Y0 - 8) this.goDoor('up');
    else if (p.y > Y1 + 8) this.goDoor('down');
    else if (p.x < X0 - 8) this.goDoor('left');
    else if (p.x > X1 + 8) this.goDoor('right');
  },
  doorOpen(d) {
    const merc = this.player && this.player.passive.has('mercurius') && this.room.type !== 'boss';
    return (this.room.cleared || merc) && !d.locked && !d.hidden;
  },

  // ---------- Partida ----------
  startRun() {
    const ch = CHARS[this.charSel];
    Store.data.char = this.charSel; Store.save();
    Sfx.init();
    const seed = (Math.random() * 2147483647) >>> 0;
    const order = shuffle(PILL_EFFECTS.map((_, i) => i));
    this.run = {
      seed, pool: new Set(ITEM_IDS.filter(id => Object.keys(ITEMS[id].pools).length)),
      bossesUsed: [], pillMap: PILL_COLORS.map((_, i) => order[i]), pillKnown: PILL_COLORS.map(() => false),
      kills: 0, time: 0, floorHit: false, killedBy: '', devilTaken: false, cheated: false, god: false, dmgx: false,
    };
    for (const id of [...(ch.items || []), ch.active]) if (id) this.run.pool.delete(id);
    this.floorIdx = 0;
    this.familiars = []; this.blueflies = [];
    this.room = null; this.floor = null;
    this.player = makePlayer(ch);
    this.banner = null; this.shake = 0; this.slowTime = 0;
    this.state = 'playing';
    this.layout();
    this.loadFloor();
  },

  loadFloor(sameFloor) {
    const p = this.player;
    const seed = sameFloor ? (Math.random() * 2147483647) >>> 0 : (this.run.seed + this.floorIdx * 7919) >>> 0;
    this.floor = generateFloor(this.floorIdx, seed);
    this.run.floorHit = false;
    this.vig = buildVignette(THEMES[FLOORS[this.floorIdx].theme].vig);
    p.bloodyLust = 0; p.solFloor = false; p.gust = 0;
    const P = p.passive;
    if (P.has('emptyheart') && p.red <= 2 && !p.noRed && !p.lost) addHp(p, 'hpe', 1);
    if (P.has('bloodoath') && p.red > 1) { const lost = Math.floor((p.red - 1) / 2); p.red = 1; p.bloodoath = lost; } else p.bloodoath = 0;
    if (P.has('zodiac')) p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd', 'rangeAdd', 'luckAdd'])] += pick([0.3, 0.5]);
    if (P.has('missingno') && this.floorIdx > 0) rerollPassives(p);
    this.enterRoom(this.floor.start, null);
    revealFlags(p);
    fireEvent('floor', {});
    this.floorBanner = 3;
    Store.data.best = Math.max(Store.data.best, this.floorIdx + 1); Store.save();
  },

  nextFloor() {
    Sfx.play('fall');
    this.startFade(1.0, () => { this.floorIdx = Math.min(FLOORS.length - 1, this.floorIdx + 1); this.loadFloor(); });
  },

  startFade(dur, mid) { this.fade = { t: 0, dur, mid, done: false }; this.state = 'fade'; },
  updateFade(dt) {
    const f = this.fade;
    f.t += dt;
    if (!f.done && f.t >= f.dur / 2) { f.done = true; f.mid(); }
    if (f.t >= f.dur) { this.fade = null; this.state = 'playing'; this.afterEnter(); }
  },

  buildBg() {
    this.bg = buildRoomBg(this.room, this.bgScale);
    this.bgCtx = this.bg.getContext('2d');
    this.bgCtx.setTransform(this.bgScale, 0, 0, this.bgScale, 0, 0);
    this.bgRoom = this.room;
  },

  enterRoom(room, side) {
    const p = this.player, P = p.passive;
    if (this.room && this.room !== room) { this.prevRoom = this.room; this.prevSide = this.lastSide; }
    if (this.room && this.room.type === 'devil' && room !== this.room && P.has('redemption') && !this.room.taken) { addHp(p, 'soul', 1); p.mods.dmgAdd += 1; }
    this.room = room; this.lastSide = side;
    room.visited = true; room.seen = true;
    for (const k of DIRNAMES) {
      const d = room.doors[k];
      if (d && !d.hidden) { const o = d.rooms[0] === room ? d.rooms[1] : d.rooms[0]; o.seen = true; }
    }
    this.tears = []; this.etears = []; this.bombs = []; this.beams = []; this.creeps = []; this.pcreeps = [];
    this.parts = []; this.effects = []; this.blueflies = []; this.enemies = []; this.pendingBooms = [];
    this.lights = []; this.missiles = []; this.holes = []; this.rings = []; this.eyes = [];
    this.familiars = this.familiars.filter(f => !f.temp);
    if (side) { const D = DIRS[side]; p.x = tcx(D.c); p.y = tcy(D.r); }
    else { const s = this.freeSpot(CX, CY); p.x = s.x; p.y = s.y; }
    p.vx *= 0.3; p.vy *= 0.3;
    p.roomMods = {}; p.roomTrail = null; p.lusty = 0; p.hurtInRoom = false; p.scapularUsed = false;
    if (p.roomItems.length) { p.roomItems = []; rebuildPlayer(p); }
    p.charge = 0; p.beamT = 0; p.ludo = null; p.knife = null; p.epic = null; p.dash = null;
    p.mantleUp = P.has('mantle') || (P.has('blanket') && room.type === 'boss' && !room.cleared);
    if (p.purity) { if (!p.purity.on) p.purity = { stat: pick(['dmg', 'tps', 'spd', 'rng']), on: true }; }
    else if (P.has('purity')) p.purity = { stat: pick(['dmg', 'tps', 'spd', 'rng']), on: true };
    this.trail = [];
    for (const f of this.familiars) { f.x = p.x; f.y = p.y; }
    this.slowTime = 0;
    if (!room.cleared) {
      if (room.type === 'boss') { this.enemies.push(...makeBoss(room.boss, side)); this.pendingIntro = room.boss; }
      else for (const s of room.spawns) this.enemies.push(makeEnemy(s.type, tcx(s.c) + rr(-4, 4), tcy(s.r) + rr(-4, 4), { champ: s.champ || (P.has('champions') && Math.random() < 0.08) }));
      if (!this.enemies.length) room.cleared = true;
      else {
        Sfx.play('doorclose');
        if (P.has('camo')) for (const e of this.enemies) if (!e.boss) applyStatus(e, 'confuse', 3);
        if (P.has('pokego') && Math.random() < 0.25) { const L = this.enemies.filter(e => !e.boss); if (L.length) applyStatus(pick(L), 'charm', 999); }
        fireEvent('enter', {});
      }
    }
    this.prepPedestals(room);
    this.flow = null; this.flowT = 0;
    this.buildBg();
    if (this.state !== 'title') Sfx.startMusic(room.type === 'boss' && !room.cleared ? 'boss' : 'normal');
  },

  // Pedestales que cambian (Corona con falla, Tainted Isaac) y opciones extra
  prepPedestals(room) {
    const p = this.player, P = p.passive;
    if (room.type === 'treasure' && !room.optDone && P.has('moreoptions')) {
      room.optDone = true;
      const first = room.pickups.find(pk => pk.kind === 'item');
      if (first) { first.choice = 'tr'; first.x -= 40; room.pickups.push(mkPickup('item', first.x + 80, first.y, { item: pickItem('treasure'), choice: 'tr' })); }
    }
    for (const pk of room.pickups) {
      if (pk.kind !== 'item' || !pk.item || pk.cycDone || pk.price != null || pk.hprice) continue;
      pk.cycDone = true;
      if (P.has('glitchcrown')) { pk.cycle = [pk.item, ...Array.from({ length: 4 }, () => pickItem(this.poolForRoom()))]; pk.ci = 0; pk.ct = 0.4; pk.cycleT = 0.35; }
      else if (P.has('cycle2')) { pk.cycle = [pk.item, pickItem(this.poolForRoom())]; pk.ci = 0; pk.ct = 1; pk.cycleT = 1; }
    }
  },

  afterEnter() {
    if (this.pendingIntro) {
      const boss = this.enemies.find(e => e.boss && !e.parent);
      this.intro = { t: 0, id: this.pendingIntro, boss };
      this.pendingIntro = null;
      this.state = 'bossintro';
      Sfx.play('roar');
    }
  },

  goDoor(dir) {
    const d = this.room.doors[dir];
    if (!d || this.state !== 'playing') return;
    const target = d.rooms[0] === this.room ? d.rooms[1] : d.rooms[0];
    this.renderWorldTo(this.snapA);
    this.enterRoom(target, OPP[dir]);
    this.renderWorldTo(this.snapB);
    this.trans = { dir, t: 0, dur: 0.3 };
    this.state = 'slide';
    Sfx.play('door');
  },

  freeSpot(x, y) {
    const t = this.room.tiles;
    const c = clamp(txOf(x), 0, COLS - 1), r = clamp(tyOf(y), 0, ROWS - 1);
    for (let rad = 0; rad < 8; rad++) for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
      const nc = c + dc, nr = r + dr;
      if (inGrid(nc, nr) && t[nr * COLS + nc] === T.EMPTY) return { x: rad ? tcx(nc) : x, y: rad ? tcy(nr) : y };
    }
    return { x, y };
  },

  poolForRoom() {
    const p = this.player;
    if (p && p.passive.has('chaos')) return pick(['treasure', 'boss', 'shop', 'devil', 'angel', 'secret']);
    const t = this.room ? this.room.type : 'treasure';
    return { treasure: 'treasure', shop: 'shop', boss: 'boss', devil: 'devil', angel: 'angel', secret: 'secret' }[t] || 'treasure';
  },

  clearRoom() {
    const room = this.room, p = this.player, P = p.passive;
    room.cleared = true;
    Sfx.play('door');
    if (p.active && !P.has('volt45')) {
      const max = activeMax(p), cap = max * (P.has('battery') ? 2 : 1);
      if (max && p.active.charge < cap) { p.active.charge = Math.min(cap, p.active.charge + (room.type === 'boss' ? 2 : 1)); if (p.active.charge >= max) Sfx.play('charged'); }
    }
    familiarsOnClear();
    if (P.has('paschal') && !p.hurtInRoom) p.paschal = Math.min(4, (p.paschal || 0) + 1);
    else if (P.has('paschal')) p.paschal = 0;
    if (P.has('deathlist') && Math.random() < 0.15) p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd'])] += 0.2;
    fireEvent('clear', {});
    if (room.type === 'boss') { this.bossRewards(); return; }
    if (room.type !== 'normal') return;
    let chance = clamp(0.38 + p.luck * 0.05, 0.1, 0.85);
    if (P.has('contract')) chance *= 0.67;
    if (Math.random() >= chance) return;
    const s = this.freeSpot(CX, CY);
    let kind = randomRewardKind();
    if (P.has('guppytail')) { const r = Math.random(); if (r < 0.33) kind = 'chest'; else if (r < 0.66) return; }
    const n = P.has('contract') ? 2 : 1;
    if (P.has('optionsq')) {
      const a = spawnPickup(kind, s.x - 30, s.y, { pop: false }), b = spawnPickup(randomRewardKind(), s.x + 30, s.y, { pop: false });
      a.choice = b.choice = 'opt' + this.time;
    } else for (let i = 0; i < n; i++) spawnPickup(kind, s.x, s.y);
  },

  bossRewards() {
    const room = this.room, f = this.floorIdx, p = this.player, P = p.passive;
    this.shake = 0.6;
    Sfx.startMusic('normal');
    if (f === FLOORS.length - 1) {
      room.pickups.push(mkPickup('trophy', CX, CY + 10));
      this.showBanner('¡El Corazón ha caído!', 'Abre el cofre', 3);
      return;
    }
    const s1 = this.freeSpot(CX, CY - 40);
    if (room.boss === 'mama') {
      room.pickups.push(mkPickup('item', s1.x - 70, s1.y, { item: '327', choice: 'mom' }));
      room.pickups.push(mkPickup('item', s1.x + 70, s1.y, { item: '328', choice: 'mom' }));
    }
    if (P.has('options')) {
      room.pickups.push(mkPickup('item', s1.x - 35, s1.y, { item: pickItem('boss'), choice: 'boss' }));
      room.pickups.push(mkPickup('item', s1.x + 35, s1.y, { item: pickItem('boss'), choice: 'boss' }));
    } else room.pickups.push(mkPickup('item', s1.x, s1.y, { item: pickItem('boss') }));
    spawnPickup(Math.random() < 0.6 ? 'heart' : 'soul', CX + 60, CY);
    const s2 = this.freeSpot(CX, CY + 80);
    room.trapdoor = { x: s2.x, y: s2.y, t: 0, armed: false };
    if (P.has('sol')) { p.solFloor = true; healRed(p, 99); if (p.active) p.active.charge = Math.max(p.active.charge, activeMax(p)); }
    if (f < 1) return;
    let chance = this.run.floorHit ? 0.2 : 0.55;
    if (P.has('devil')) chance += 0.15;
    if (P.has('angel')) chance += 0.15;
    if (P.has('devil100') || P.has('eucharist')) chance = 1;
    if (Math.random() >= chance) return;
    let angel = !this.run.devilTaken && Math.random() < 0.5 + (P.has('angel') ? 0.25 : 0);
    if (P.has('eucharist')) angel = true;
    if (P.has('devil100')) angel = false;
    if (P.has('duality')) { this.makeDealDoor(room, true); this.makeDealDoor(room, false); }
    else this.makeDealDoor(room, angel);
  },

  makeDealDoor(room, angel) {
    const free = DIRNAMES.filter(k => !room.doors[k]);
    if (!free.length) return;
    const side = pick(free);
    const dv = makeRoom(-9, -9, angel ? 'angel' : 'devil');
    dv.cleared = true; dv.seed = (Math.random() * 1e9) | 0;
    const door = { type: angel ? 'angel' : 'devil', locked: false, hidden: false, rooms: [room, dv] };
    room.doors[side] = door; dv.doors[OPP[side]] = door;
    const fires = angel ? [] : [[1, 1], [11, 1], [1, 5], [11, 5]];
    for (const [c, r] of fires) dv.tiles[r * COLS + c] = T.FIRE;
    const cols = Math.random() < 0.5 ? [4, 8] : [3, 6, 9];
    for (const c of cols) {
      if (angel) dv.pickups.push(mkPickup('item', tcx(c), tcy(3), { item: pickItem('angel'), choice: 'angel' }));
      else dv.pickups.push(mkPickup('item', tcx(c), tcy(3), { item: pickItem('devil'), hprice: Math.random() < 0.4 ? 1 : 2 }));
    }
    Sfx.play(angel ? 'secret' : 'devil');
    this.showBanner(angel ? 'Se abre una puerta celestial...' : 'Se abre una puerta oscura...', '', 2.2);
  },

  giveItem(id) {
    const p = this.player, it = ITEMS[id];
    const old = giveItemTo(p, id);
    p.holdItem = id; p.holdT = 1.1;
    if (this.room && (this.room.type === 'devil' || this.room.type === 'angel')) this.room.taken = true;
    this.showBanner(it.name, it.desc.length > 70 ? it.desc.slice(0, 68) + '…' : it.desc);
    Sfx.play('item');
    return old;
  },

  revealMap() { if (this.floor) for (const r of this.floor.rooms) if (r.type !== 'secret') r.seen = true; },

  damageAll(dmg) {
    for (const e of this.enemies) {
      if (e.dead || e.parent) continue;
      e.hp -= dmg; e.flash = 0.15;
      if (e.hp <= 0) killEnemy(e);
    }
  },

  teleport(kind) {
    if (this.state !== 'playing') return false;
    const rooms = this.floor.rooms.filter(r => r !== this.room);
    let target = null;
    if (kind === 'prev') target = this.prevRoom && this.prevRoom !== this.room ? this.prevRoom : null;
    else if (kind === 'new') target = pick(rooms.filter(r => !r.visited && r.type !== 'secret')) || pick(rooms);
    else if (kind === 'boss' || kind === 'shop' || kind === 'treasure' || kind === 'secret' || kind === 'start') target = rooms.find(r => r.type === kind);
    else target = pick(rooms.filter(r => r.type !== 'secret'));
    if (!target) return false;
    if (kind === 'prev' && this.room.type !== 'boss') this.room.cleared = this.room.cleared;
    const side = kind === 'prev' && this.prevSide ? this.prevSide : DIRNAMES.find(k => target.doors[k] && !target.doors[k].hidden) || null;
    this.startFade(0.6, () => this.enterRoom(target, side));
  },
  teleportRandom() { return this.teleport('random'); },

  restartRoom() {
    const r = this.room;
    if (r.type !== 'normal' || !r.spawns.length) return false;
    r.cleared = false;
    this.startFade(0.5, () => this.enterRoom(r, this.lastSide));
  },

  showBanner(title, sub, t = 2.6) { this.banner = { title, sub, t, max: t }; },

  killPlayer(src) {
    const p = this.player;
    if (p.dead) return;
    p.dead = true;
    this.run.killedBy = src || 'Algo desconocido';
    this.state = 'dying'; this.deadT = 0;
    Sfx.play('die'); Sfx.stopMusic();
    bloodBurst(p.x, p.y - 10, 24);
    Store.data.runs++; Store.data.best = Math.max(Store.data.best, this.floorIdx + 1); Store.save();
  },

  win() {
    if (this.state !== 'playing') return;
    this.state = 'win'; this.endT = 0; this.menuSel = 0;
    Sfx.stopMusic(); Sfx.play('win');
    Store.data.runs++;
    if (!this.run.cheated) Store.data.wins++;
    Store.data.best = FLOORS.length; Store.save();
  },

  pause() { if (this.state !== 'playing') return; this.state = 'paused'; this.menuSel = 0; },

  toggleSound() { Sfx.setMuted(!Sfx.muted); Store.data.muted = Sfx.muted; Store.save(); },
  toggleMusic() { Sfx.setMusic(!Sfx.musicOn); Store.data.music = Sfx.musicOn; Store.save(); },

  toTitle() {
    this.state = 'title'; this.room = null; this.floor = null; this.bg = null;
    Sfx.startMusic('menu');
    this.layout();
  },

  // ---------- Menús ----------
  pauseOptions() {
    return [
      { id: 'resume', label: 'Continuar' },
      { id: 'cheats', label: 'Trucos' },
      { id: 'stats', label: `Estadísticas: ${Store.data.stats !== false ? 'Sí' : 'No'}` },
      { id: 'music', label: `Música: ${Sfx.musicOn ? 'Sí' : 'No'}` },
      { id: 'sound', label: `Sonido: ${Sfx.muted ? 'No' : 'Sí'}` },
      { id: 'quit', label: 'Abandonar partida' },
    ];
  },
  pauseAction(id) {
    Sfx.play('select');
    if (id === 'resume') this.state = 'playing';
    else if (id === 'cheats') this.openCheats();
    else if (id === 'stats') { Store.data.stats = Store.data.stats === false; Store.save(); }
    else if (id === 'music') this.toggleMusic();
    else if (id === 'sound') this.toggleSound();
    else if (id === 'quit') this.toTitle();
  },
  endOptions() { return [{ id: 'again', label: 'Jugar otra vez' }, { id: 'menu', label: 'Menú principal' }]; },
  endAction(id) { Sfx.play('select'); if (id === 'again') this.startRun(); else this.toTitle(); },

  updateMenu(opts, act, isPause) {
    if (isPause && Input.take('pause')) { this.state = 'playing'; return; }
    if (isPause && Input.take('cheats')) { this.openCheats(); return; }
    if (!isPause && Input.take('restart')) { act('again'); return; }
    const n = opts.length;
    if (Input.take('up') || Input.take('fup') || Input.take('left') || Input.take('fleft')) { this.menuSel = (this.menuSel + n - 1) % n; Sfx.play('select'); }
    if (Input.take('down') || Input.take('fdown') || Input.take('right') || Input.take('fright')) { this.menuSel = (this.menuSel + 1) % n; Sfx.play('select'); }
    this.menuSel = clamp(this.menuSel, 0, n - 1);
    if (Input.take('confirm') || Input.take('active') || Input.take('bomb')) { act(opts[this.menuSel].id); return; }
    const hit = this.tapHit();
    if (hit) act(hit);
  },

  tapHit() {
    for (const tp of Input.taps) {
      const m = this.toMenu(tp.x, tp.y);
      for (let i = this.menuButtons.length - 1; i >= 0; i--) { const b = this.menuButtons[i]; if (m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h) return b.id; }
    }
    return null;
  },
  toMenu(x, y) { const t = this.menuT; return { x: (x - t.ox) / t.s, y: (y - t.oy) / t.s }; },

  charList() { return CHARS.filter(c => !!c.tainted === (this.charTab === 1)); },

  updateTitle() {
    if (Sfx.ctx && Sfx.music.mode !== 'menu') Sfx.startMusic('menu');
    const list = this.charList();
    let i = list.indexOf(CHARS[this.charSel]);
    if (i < 0) { i = 0; this.charSel = CHARS.indexOf(list[0]); }
    const cols = this.portrait ? 6 : 9, n = list.length;
    const sel = j => { this.charSel = CHARS.indexOf(list[clamp(j, 0, n - 1)]); Sfx.play('select'); };
    if (Input.take('left') || Input.take('fleft')) sel(i - 1);
    if (Input.take('right') || Input.take('fright')) sel(i + 1);
    if (Input.take('up') || Input.take('fup')) sel(i - cols);
    if (Input.take('down') || Input.take('fdown')) sel(i + cols);
    if (Input.take('pill') || Input.take('swap')) this.switchTab();
    if (Input.take('confirm') || Input.take('active') || Input.take('bomb')) { this.startRun(); return; }
    const hit = this.tapHit();
    if (hit === 'play') this.startRun();
    else if (hit === 'tab0' || hit === 'tab1') { if (+hit.slice(3) !== this.charTab) this.switchTab(); }
    else if (hit && hit.startsWith('char')) {
      const j = +hit.slice(4);
      if (this.charSel === j && Input.touchMode) this.startRun();
      else { this.charSel = j; Sfx.play('select'); }
    }
    else if (hit === 'sound') this.toggleSound();
  },
  switchTab() {
    this.charTab = 1 - this.charTab;
    this.charSel = CHARS.indexOf(this.charList()[0]);
    Sfx.play('select');
  },

  // ---------- Trucos ----------
  openCheats() {
    this.state = 'cheats';
    this.cheatMsg = null;
    if (!this.cheatItem) this.cheatItem = this.cheatIds()[0];
  },
  cheatIds() {
    const f = this.cheatFilter, p = this.player;
    return ITEM_IDS.filter(id => {
      const it = ITEMS[id];
      if (f === 1) return it.kind === 'p';
      if (f === 2) return it.kind === 'a';
      if (f === 3) return it.spec.fams.length > 0;
      if (f === 4) return p.items.includes(id) || (p.active && p.active.id === id);
      return true;
    });
  },
  cheatActions() {
    const r = this.run;
    return [
      { id: 'god', label: `Invencible: ${r.god ? 'Sí' : 'No'}` },
      { id: 'dmg', label: `Daño ×5: ${r.dmgx ? 'Sí' : 'No'}` },
      { id: 'kill', label: 'Matar a todos' },
      { id: 'stuff', label: '+10 monedas, bombas y llaves' },
      { id: 'heal', label: 'Curar y +1 corazón' },
      { id: 'charge', label: 'Cargar objeto activo' },
      { id: 'map', label: 'Revelar mapa' },
      { id: 'boss', label: 'Ir a la sala del jefe' },
      { id: 'next', label: 'Siguiente piso' },
      { id: 'filter', label: `Ver: ${['Todos', 'Pasivos', 'Activos', 'Familiares', 'Tus objetos'][this.cheatFilter]}` },
      { id: 'back', label: 'Volver al juego' },
    ];
  },
  cheatGrid() { return this.portrait ? { cols: 8, rows: 6 } : { cols: 10, rows: 5 }; },

  updateCheats(dt) {
    if (this.cheatMsg) { this.cheatMsg.t -= dt; if (this.cheatMsg.t <= 0) this.cheatMsg = null; }
    if (Input.take('cheats')) { this.state = 'playing'; return; }
    if (Input.take('pause')) { this.state = 'paused'; this.menuSel = 1; return; }
    const ids = this.cheatIds(), acts = this.cheatActions(), { cols, rows } = this.cheatGrid();
    const per = cols * rows, pages = Math.max(1, Math.ceil(ids.length / per));
    this.cheatPage = clamp(this.cheatPage, 0, pages - 1);
    const pageIds = ids.slice(this.cheatPage * per, this.cheatPage * per + per);
    const nI = pageIds.length, n = nI + acts.length;
    let f = clamp(this.cheatSel, 0, n - 1);
    const key = (...ks) => ks.some(k => Input.take(k));
    const step = this.portrait ? 2 : 1;
    const turn = d => { this.cheatPage = (this.cheatPage + d + pages) % pages; Sfx.play('select'); };
    if (key('left', 'fleft')) { if (f < nI && f % cols === 0) { turn(-1); f = Math.min(f + cols - 1, nI - 1); } else f = (f + n - 1) % n; }
    if (key('right', 'fright')) { if (f < nI && (f % cols === cols - 1 || f === nI - 1)) { turn(1); f = f - (f % cols); } else f = (f + 1) % n; }
    if (key('up', 'fup')) { if (f < nI) { if (f - cols >= 0) f -= cols; } else if (f - step >= nI) f -= step; else f = nI - 1; }
    if (key('down', 'fdown')) { if (f < nI) { f = f + cols < nI ? f + cols : nI; } else if (f + step < n) f += step; }
    if (key('pill')) turn(-1);
    if (key('swap')) turn(1);
    if (f !== this.cheatSel) { Sfx.play('select'); this.cheatSel = f; }
    if (f < nI) this.cheatItem = pageIds[f];
    if (key('confirm', 'active', 'bomb')) { if (f < nI) this.cheatGive(pageIds[f]); else this.cheatAction(acts[f - nI].id); return; }
    const hit = this.tapHit();
    if (!hit) return;
    if (hit.startsWith('item:')) {
      const id = hit.slice(5);
      if (this.cheatItem === id) this.cheatGive(id);
      else { this.cheatItem = id; this.cheatSel = pageIds.indexOf(id); Sfx.play('select'); }
    } else if (hit === 'take') { if (this.cheatItem) this.cheatGive(this.cheatItem); }
    else if (hit === 'prev') turn(-1);
    else if (hit === 'next') turn(1);
    else if (hit.startsWith('cheat:')) this.cheatAction(hit.slice(6));
  },

  cheatMsgSet(text) { this.cheatMsg = { text, t: 1.8 }; },

  cheatGive(id) {
    const p = this.player, it = ITEMS[id];
    this.run.cheated = true;
    const old = this.giveItem(id);
    if (old) { const s = this.freeSpot(p.x + 40, p.y); this.room.pickups.push(mkPickup('item', s.x, s.y, { item: old, cd: 1 })); }
    this.cheatMsgSet(`Conseguido: ${it.name}`);
  },

  cheatAction(id) {
    const p = this.player, r = this.run;
    if (id === 'back') { this.state = 'playing'; return; }
    if (id === 'filter') { this.cheatFilter = (this.cheatFilter + 1) % 5; this.cheatPage = 0; Sfx.play('select'); return; }
    r.cheated = true; Sfx.play('select');
    switch (id) {
      case 'god': r.god = !r.god; this.cheatMsgSet(r.god ? 'Ahora eres invencible' : 'Vuelves a ser mortal'); break;
      case 'dmg': r.dmgx = !r.dmgx; recalc(p); this.cheatMsgSet(r.dmgx ? 'Daño multiplicado por 5' : 'Daño normal'); break;
      case 'kill': for (const e of this.enemies) if (!e.dead && !e.parent) { killEnemy(e); if (!e.dead) killEnemy(e); } this.cheatMsgSet('Sala arrasada'); break;
      case 'stuff': p.coins = Math.min(coinCap(p), p.coins + 10); p.bombs = Math.min(99, p.bombs + 10); p.keys = Math.min(99, p.keys + 10); Sfx.play('coin'); this.cheatMsgSet('+10 de todo'); break;
      case 'heal':
        if (p.lost) { p.mantleUp = true; this.cheatMsgSet('Manto restaurado'); break; }
        if (p.noRed) p.soul += 2; else { addHp(p, 'hp', 1); p.red = p.maxRed * 2; }
        clampHearts(p); Sfx.play('heart'); this.cheatMsgSet('Vida restaurada');
        break;
      case 'charge': if (p.active) { p.active.charge = Math.max(p.active.charge, activeMax(p)); Sfx.play('charged'); this.cheatMsgSet('Objeto activo cargado'); } else this.cheatMsgSet('No tienes objeto activo'); break;
      case 'map': for (const rm of this.floor.rooms) { rm.seen = true; for (const k in rm.doors) rm.doors[k].hidden = false; } this.cheatMsgSet('Mapa revelado'); break;
      case 'boss': { const b = this.floor.rooms.find(x => x.type === 'boss'); if (b === this.room) { this.cheatMsgSet('Ya estás en la sala del jefe'); break; } this.state = 'playing'; this.teleport('boss'); break; }
      case 'next': if (this.floorIdx >= FLOORS.length - 1) this.cheatMsgSet('Ya estás en el último piso'); else { this.state = 'playing'; this.nextFloor(); } break;
    }
  },

  // ---------- Dibujo ----------
  renderWorldTo(cv) {
    const S = this.bgScale;
    const W = Math.ceil(RW * S), H = Math.ceil(RH * S);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d');
    c.setTransform(S, 0, 0, S, 0, 0);
    c.clearRect(0, 0, RW, RH);
    this.renderWorld(c);
  },

  renderWorld(c) {
    const room = this.room, p = this.player, th = THEMES[FLOORS[this.floorIdx].theme];
    if (this.bg) c.drawImage(this.bg, 0, 0, RW, RH);
    for (const k of DIRNAMES) { const d = room.doors[k]; if (d) drawDoor(c, room, k, d, this.doorOpen(d)); }
    if (room.type === 'start' && this.floorIdx === 0) this.drawHints(c);
    if (room.type === 'shop') {
      fillRR(c, tcx(2), tcy(3) - 26, tcx(10) - tcx(2), 52, 6, 'rgba(120,40,30,0.35)', 2, 'rgba(230,190,120,0.3)');
      txt(c, 'TIENDA', CX, Y0 + 18, 16, 'rgba(240,220,170,0.5)', 'center', '');
    }
    if (room.type === 'angel') { const g = c.createRadialGradient(CX, CY, 10, CX, CY, 200); g.addColorStop(0, 'rgba(255,250,230,0.25)'); g.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0); }
    const tiles = room.tiles;
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      const t = tiles[r * COLS + col];
      if (t === T.PIT) drawPit(c, tcx(col), tcy(r));
      else if (t === T.SPIKE) drawSpike(c, tcx(col), tcy(r));
    }
    if (room.trapdoor) drawTrapdoor(c, room.trapdoor);
    for (const cr of this.creeps) { c.globalAlpha = Math.min(1, cr.t) * 0.7; ell(c, cr.x, cr.y, cr.r, cr.r * 0.6, '#c8b23a'); }
    c.globalAlpha = 1;
    drawFloorExtras(c);

    const L = [];
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      const t = tiles[r * COLS + col];
      if (t && t !== T.PIT && t !== T.SPIKE) L.push({ y: tcy(r) + 6, k: 1, c: col, r, t });
    }
    for (const pk of room.pickups) L.push({ y: pk.y, k: 2, o: pk });
    for (const e of this.enemies) L.push({ y: e.y + (e.type === 'foot' ? 40 : 0), k: 3, o: e });
    for (const b of this.bombs) L.push({ y: b.y, k: 4, o: b });
    for (const f of this.familiars) L.push({ y: f.y, k: 5, o: f });
    for (const f of this.blueflies) L.push({ y: f.y, k: 7, o: f });
    if (p) L.push({ y: p.y, k: 6, o: p });
    L.sort((a, b) => a.y - b.y);
    for (const it of L) {
      switch (it.k) {
        case 1: {
          const x = tcx(it.c), y = tcy(it.r), i = it.r * COLS + it.c;
          if (it.t === T.ROCK) drawRock(c, x, y, room.seed + i * 7, th, false);
          else if (it.t === T.TINTED) drawRock(c, x, y, room.seed + i * 7, th, true);
          else if (it.t === T.POOP) drawPoop(c, x, y, room.thp[i]);
          else if (it.t === T.FIRE) drawFire(c, x, y, room.thp[i], this.time, i);
          else if (it.t === T.METAL) drawMetal(c, x, y);
          else if (it.t === T.TNT) drawTNT(c, x, y, room.thp[i]);
          break;
        }
        case 2: drawPickup(c, it.o); if (it.o.price != null && p && p.passive.has('sale') && it.o.kind !== 'item') { /* precio rebajado dibujado en drawPickup */ } break;
        case 3: drawEnemy(c, it.o); break;
        case 4: {
          const b = it.o, bl = b.t < 0.6 && Math.floor(b.t * 14) % 2;
          shadow(c, b.x, b.y + 7, 9, 3.5, 0.35);
          const s = (b.mini ? 0.75 : b.mega || (b.fx && b.fx.has('big')) ? 1.45 : 1.15) + Math.sin(this.time * 20) * (b.t < 0.6 ? 0.08 : 0.02);
          drawBombIcon(c, b.x, b.y - 4, s);
          if (bl) circ(c, b.x, b.y - 3, 8.5 * s, 'rgba(255,60,40,0.5)');
          break;
        }
        case 5: drawFamiliar(c, it.o); break;
        case 6: this.drawPlayerOrCorpse(c, it.o); break;
        case 7: {
          const f = it.o;
          if (f.kind === 'spider') { for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) line(c, f.x, f.y - 4, f.x + sd * 6, f.y - 6 + i * 3, '#1a2a6a', 1); circ(c, f.x, f.y - 4, 3.5, '#3a5ad8', 1); break; }
          const w = Math.abs(Math.sin(this.time * 40 + f.a));
          ell(c, f.x - 3, f.y - 13, 3, 1.5 + w, 'rgba(220,230,255,0.7)'); ell(c, f.x + 3, f.y - 13, 3, 1.5 + w, 'rgba(220,230,255,0.7)');
          circ(c, f.x, f.y - 10, 3.5, '#3a5ad8', 1);
          break;
        }
      }
    }
    for (const t of this.tears) drawTear(c, t, false);
    for (const t of this.etears) drawTear(c, t, true);
    for (const b of this.beams) if (b.x1 != null) drawBeam(c, b);
    drawAirExtras(c);
    for (const q of this.parts) { c.globalAlpha = Math.min(1, q.life / q.max * 2); circ(c, q.x, q.y - q.z, q.size, q.color); }
    c.globalAlpha = 1;
    for (const f of this.effects) drawEffect(c, f);
    if (this.slowTime > 0) { c.fillStyle = 'rgba(120,160,255,0.08)'; c.fillRect(0, 0, RW, RH); }
    c.drawImage(this.vig, 0, 0, RW, RH);
  },

  drawPlayerOrCorpse(c, p) {
    if (p.dead) {
      const skin = (p.char.look && p.char.look.skin) || '#f0d2c2';
      c.save(); c.translate(p.x, p.y);
      shadow(c, 0, 6, 16, 5, 0.35);
      c.rotate(Math.PI / 2 * Math.min(1, this.deadT * 3));
      circ(c, -6, 0, 12, skin, 1.6, '#3a2418');
      line(c, -10, -4, -6, 0, '#111', 1.6); line(c, -6, -4, -10, 0, '#111', 1.6);
      line(c, -2, -4, 2, 0, '#111', 1.6); line(c, 2, -4, -2, 0, '#111', 1.6);
      ell(c, 10, 0, 8, 6, skin, 1.4, '#3a2418');
      c.restore();
      return;
    }
    if (p.iframes > 0 && Math.floor(p.iframes * 15) % 2 === 1) return;
    drawPlayer(c, p, p.x, p.y);
  },

  drawHints(c) {
    c.save(); c.globalAlpha = 0.34;
    const col = '#f6e8d0';
    if (this.touchUI) {
      txt(c, 'Joystick izquierdo: moverte', CX, CY - 50, 17, col, 'center', '');
      txt(c, 'Joystick derecho: disparar lágrimas', CX, CY - 28, 17, col, 'center', '');
      txt(c, 'Botones: objeto · bomba · píldora', CX, CY + 46, 15, col, 'center', '');
    } else {
      txt(c, 'W A S D  moverte', CX - 135, CY - 44, 19, col, 'center', '');
      txt(c, '← ↑ ↓ →  disparar', CX + 135, CY - 44, 19, col, 'center', '');
      txt(c, 'E bomba   ·   ESPACIO objeto   ·   Q píldora/carta', CX, CY + 46, 16, col, 'center', '');
      txt(c, 'P pausa   ·   M silencio   ·   T trucos', CX, CY + 68, 14, col, 'center', '');
    }
    c.restore();
  },

  drawSlide(c) {
    const tr = this.trans, k = Math.min(1, tr.t / tr.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const D = DIRS[tr.dir];
    const ox = -D.dx * RW * e, oy = -D.dy * RH * e;
    c.drawImage(this.snapA, ox, oy, RW, RH);
    c.drawImage(this.snapB, ox + D.dx * RW, oy + D.dy * RH, RW, RH);
  },

  render() {
    const c = this.ctx, d = this.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#0b0705'; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.state === 'title') { this.setMenuTransform(c); this.drawTitle(c); return; }
    let sx = 0, sy = 0;
    if (this.shake > 0 && this.state === 'playing') { const m = Math.min(1, this.shake) * 7; sx = rr(-m, m); sy = rr(-m, m); }
    const k = this.scale * d;
    c.setTransform(k, 0, 0, k, (this.offX + sx * this.scale) * d, (this.offY + sy * this.scale) * d);
    c.save(); c.beginPath(); c.rect(0, 0, RW, RH); c.clip();
    if (this.state === 'slide') this.drawSlide(c); else this.renderWorld(c);
    c.restore();
    c.setTransform(k, 0, 0, k, this.offX * d, this.offY * d);
    drawHUD(c);
    if (this.banner && this.state !== 'paused' && this.state !== 'cheats') {
      const b = this.banner, a = Math.min(1, (b.max - b.t) * 5, b.t * 2.5);
      drawPaperBanner(c, CX, 98, b.title, b.sub, a, 24);
    }
    if (this.floorBanner > 0 && this.state === 'playing' && !this.banner) drawPaperBanner(c, CX, CY - 92, FLOORS[this.floorIdx].name, '', Math.min(1, this.floorBanner), 30);
    if (this.state === 'bossintro') this.drawBossIntro(c);
    if (this.state === 'fade') {
      const f = this.fade, a = 1 - Math.abs(f.t / f.dur * 2 - 1);
      c.fillStyle = `rgba(0,0,0,${clamp(a * 1.15, 0, 1)})`; c.fillRect(-2, -2, RW + 4, RH + 4);
    }
    if (this.state === 'dying') { c.fillStyle = `rgba(40,0,0,${Math.min(0.5, this.deadT * 0.4)})`; c.fillRect(0, 0, RW, RH); }
    c.setTransform(d, 0, 0, d, 0, 0);
    if (this.touchUI && ['playing', 'slide', 'fade', 'bossintro'].includes(this.state)) this.drawTouch(c);
    if (this.state === 'paused') { this.drawDim(c); this.setMenuTransform(c); this.drawPause(c); }
    if (this.state === 'cheats') { this.drawDim(c, 'rgba(0,0,0,0.82)'); this.setMenuTransform(c); this.drawCheats(c); }
    if (this.state === 'dead' || this.state === 'win') { this.drawDim(c, this.state === 'dead' ? 'rgba(20,0,0,0.78)' : 'rgba(0,0,0,0.75)'); this.setMenuTransform(c); this.drawEnd(c); }
  },

  drawDim(c, col = 'rgba(0,0,0,0.72)') { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = col; c.fillRect(0, 0, this.canvas.width, this.canvas.height); },
  setMenuTransform(c) { const t = this.menuT, d = this.dpr; c.setTransform(t.s * d, 0, 0, t.s * d, t.ox * d, t.oy * d); },

  drawBossIntro(c) {
    const t = this.intro.t;
    const a = clamp(Math.min(t / 0.25, (2.4 - t) / 0.3), 0, 1);
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(0, 0, RW, RH);
    const slide = (1 - Math.min(1, t / 0.35)) * 200;
    c.beginPath(); c.moveTo(0, 110); c.lineTo(RW, 90); c.lineTo(RW, 270); c.lineTo(0, 290); c.closePath();
    c.fillStyle = '#2b100b'; c.fill();
    c.strokeStyle = '#6a2a1a'; c.lineWidth = 3; c.stroke();
    drawPlayer(c, Object.assign({}, this.player, { holdT: 0, shield: 0, iframes: 0, mantleUp: false, size: 1 }), 150 - slide, 215, 2.6);
    const b = this.intro.boss;
    if (b) {
      c.save(); c.translate(445 + slide, 225);
      const fake = Object.assign({}, b, { x: 0, y: 0, z: 0, flash: 0, spawnT: 0, state: b.type === 'llorona' ? 'cry' : 'idle', t: 1, e: 0, mouth: 1 });
      if (b.type === 'mama') Object.assign(fake, { type: 'eye', side: 'up', t: 1, invisible: false });
      const sc = b.type === 'masa' ? 1.1 : b.type === 'corazon' ? 1.05 : b.type === 'mama' ? 2.2 : b.type === 'gusano' ? 2.2 : 1.5;
      c.scale(sc, sc);
      drawEnemy(c, fake);
      c.restore();
    }
    txt(c, this.player.char.name, 150 - slide, 300, 24, '#f4ead8');
    txt(c, 'VS', CX, 175, 46, '#e8d6b8', 'center', '#2a0a05', FONT_TITLE);
    txt(c, BOSSES[this.intro.id].name, 445 + slide, 300, 26, '#ff7a64');
    c.restore();
  },

  drawTouch(c) {
    const p = this.player;
    for (const b of Input.buttons) {
      const held = Input.btnHeld(b.id);
      circ(c, b.x, b.y, b.r, held ? 'rgba(255,240,220,0.28)' : 'rgba(255,240,220,0.1)', 2, 'rgba(255,240,220,0.32)');
      if (b.id === 'pause') { c.fillStyle = 'rgba(255,240,220,0.75)'; c.fillRect(b.x - 6, b.y - 7, 4, 14); c.fillRect(b.x + 2, b.y - 7, 4, 14); }
      else if (b.id === 'bomb') { c.globalAlpha = p.bombs ? 1 : 0.35; drawBombIcon(c, b.x, b.y + 1, 1.5); c.globalAlpha = 1; }
      else if (b.id === 'pill') { if (p.pocket) { if (p.pocket.k === 'pill') drawPill(c, p.pocket.v, b.x, b.y, 1.7); else drawCard(c, b.x, b.y, 1.7); } else txt(c, '—', b.x, b.y, 16, 'rgba(255,240,220,0.4)', 'center', ''); }
      else if (b.id === 'swap') { if (p.active2) drawIcon(c, p.active2.id, b.x, b.y, 0.6); }
      else if (b.id === 'active') {
        if (p.active) {
          const max = activeMax(p), k = max ? Math.min(1, p.active.charge / max) : 1;
          c.globalAlpha = k >= 1 ? 1 : 0.55; drawIcon(c, p.active.id, b.x, b.y, 1.05); c.globalAlpha = 1;
          c.beginPath(); c.arc(b.x, b.y, b.r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.strokeStyle = k >= 1 ? '#ffe27a' : 'rgba(255,240,220,0.6)'; c.lineWidth = 3; c.stroke();
        } else txt(c, '—', b.x, b.y, 16, 'rgba(255,240,220,0.4)', 'center', '');
      }
    }
    const { w, h, safe } = this;
    if (this.portrait && Store.data.stats !== false) {
      const rows = statRows(p), y = this.offY + RH * this.scale + 18, cw = (w - safe.l - safe.r) / rows.length;
      rows.forEach(([k, v], i) => {
        const x = safe.l + cw * i + cw / 2 - 12;
        drawStatIcon(c, k, x - 4, y, 1.4);
        txt(c, v, x + 6, y + 1, 13, '#f4ead8', 'left', '#120a06');
        const dd = statDelta(p, k);
        if (dd) { c.globalAlpha = dd.a; txt(c, dd.text, x + 6, y + 15, 11, dd.col, 'left', '#120a06'); c.globalAlpha = 1; }
      });
    }
    let mvDef, frDef;
    if (this.portrait) {
      const top = this.offY + RH * this.scale + 100, yy = top + (h - safe.b - top) * 0.55;
      mvDef = { x: w * 0.26, y: yy }; frDef = { x: w * 0.74, y: yy };
    } else { mvDef = { x: safe.l + 90, y: h - safe.b - 90 }; frDef = { x: w - safe.r - 90, y: h - safe.b - 90 }; }
    const stick = (s, def, fire) => {
      if (s) {
        circ(c, s.ox, s.oy, STICK_R, 'rgba(255,240,220,0.08)', 2, 'rgba(255,240,220,0.25)');
        let dx = s.x - s.ox, dy = s.y - s.oy; const l = Math.hypot(dx, dy);
        if (l > STICK_R) { dx = dx / l * STICK_R; dy = dy / l * STICK_R; }
        if (fire && l > 14 && !(p.fx && p.fx.analog)) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        circ(c, s.ox + dx, s.oy + dy, 22, 'rgba(255,240,220,0.32)', 2, 'rgba(255,240,220,0.5)');
      } else {
        c.globalAlpha = this.portrait ? 0.5 : 0.28;
        circ(c, def.x, def.y, STICK_R, 'rgba(255,240,220,0.05)', 2, 'rgba(255,240,220,0.22)');
        circ(c, def.x, def.y, 20, 'rgba(255,240,220,0.12)');
        if (fire) for (const [ax, ay] of N4) { c.beginPath(); c.moveTo(def.x + ax * 40 - ay * 6, def.y + ay * 40 + ax * 6); c.lineTo(def.x + ax * 48, def.y + ay * 48); c.lineTo(def.x + ax * 40 + ay * 6, def.y + ay * 40 - ax * 6); c.fillStyle = 'rgba(255,240,220,0.4)'; c.fill(); }
        txt(c, fire ? 'disparar' : 'mover', def.x, def.y + STICK_R + 16, 14, 'rgba(255,240,220,0.6)', 'center', '');
        c.globalAlpha = 1;
      }
    };
    stick(Input.sticks.move, mvDef, false);
    stick(Input.sticks.fire, frDef, true);
    if (this.portrait) txt(c, 'Consejo: gira el móvil para jugar en horizontal', w / 2, h - safe.b - 14, 12, 'rgba(255,240,220,0.35)', 'center', '');
  },

  menuButton(c, id, label, x, y, w, h, sel) {
    this.menuButtons.push({ id, x, y, w, h });
    fillRR(c, x, y, w, h, 6, sel ? '#e9dcc0' : 'rgba(233,220,192,0.12)', 1.5, sel ? '#6a5034' : 'rgba(233,220,192,0.35)');
    let size = Math.min(20, h * 0.6);
    c.font = `${size}px ${FONT}`;
    const tw = c.measureText(label).width;
    if (tw > w - 12) size *= (w - 12) / tw;
    txt(c, label, x + w / 2, y + h / 2 + 1, size, sel ? '#2a1a10' : '#e9dcc0', 'center', '');
  },

  wrapText(c, s, maxW, size) {
    c.font = `${size}px ${FONT}`;
    const out = []; let cur = '';
    for (const wd of s.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = wd; } else cur = t; }
    if (cur) out.push(cur);
    return out;
  },

  charStats(ch) {
    const b = { dmg: (ch.dmgBase ?? 3.5) * (ch.dmgMult ?? 1), tps: ch.tpsAbs ?? (2.73 + (ch.tps || 0)) * (ch.tpsMult || 1), spd: ch.spd ?? 1, rng: ch.rng ?? 6.5 };
    return b;
  },

  drawTitle(c) {
    this.menuButtons = [];
    const W = this.mw, H = this.mh, port = this.portrait, t = this.time;
    c.fillStyle = '#2a1a12'; c.fillRect(-500, -500, W + 1000, H + 1000);
    const g = c.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#5e412d'); g.addColorStop(1, '#120a06');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const ty = port ? 46 : 26;
    txt(c, 'LÁGRIMAS', W / 2, ty + Math.sin(t * 1.5) * 1.5, port ? 44 : 36, '#d8c8a8', 'center', '#1a0c06', FONT_TITLE);
    txt(c, 'del sótano', W / 2, ty + (port ? 34 : 26), port ? 20 : 17, '#b8402e', 'center', '#1a0c06', FONT);
    // pestañas
    const tabY = port ? 96 : 66, tabW = port ? 150 : 140;
    ['Personajes', 'Variantes (Tainted)'].forEach((lab, i) => {
      const x = W / 2 - tabW - 4 + i * (tabW + 8);
      this.menuButton(c, 'tab' + i, lab, x, tabY, tabW, port ? 30 : 22, this.charTab === i);
    });
    // rejilla
    const list = this.charList(), cols = port ? 6 : 9, cell = port ? 56 : 58;
    const gx = (W - cols * cell) / 2, gy = port ? 136 : 96;
    list.forEach((ch, i) => {
      const x = gx + (i % cols) * cell, y = gy + Math.floor(i / cols) * cell, idx = CHARS.indexOf(ch), sel = idx === this.charSel;
      this.menuButtons.push({ id: 'char' + idx, x, y, w: cell - 4, h: cell - 4 });
      fillRR(c, x, y, cell - 4, cell - 4, 6, sel ? 'rgba(233,220,192,0.2)' : 'rgba(0,0,0,0.28)', sel ? 2 : 1, sel ? '#e9dcc0' : 'rgba(233,220,192,0.2)');
      const fake = { char: ch, vx: 0, vy: 0, walkT: 0, shootAnim: sel && Math.sin(t * 3) > 0.6 ? 1 : 0, faceDir: 'down', flags: { flight: !!ch.flight }, holdT: 0, shield: 0, size: 1 };
      drawPlayer(c, fake, x + (cell - 4) / 2, y + (cell - 4) / 2 + 8 + (sel ? Math.sin(t * 4) * 1.5 : 0), 1.25);
    });
    // ficha del personaje elegido
    const ch = CHARS[this.charSel], st = this.charStats(ch);
    const by = port ? 312 : 216, bx = port ? 16 : 40, bw = port ? 328 : 520, bh = port ? 168 : 62;
    fillRR(c, bx, by, bw, bh, 8, 'rgba(0,0,0,0.3)', 1, 'rgba(233,220,192,0.2)');
    const nx = port ? bx + 14 : bx + 12;
    txt(c, ch.name, nx, by + 16, port ? 22 : 18, '#ffe9c8', 'left');
    let hx = nx + (port ? 0 : c.measureText(ch.name).width + 16), hy = by + (port ? 40 : 16);
    for (const k of ch.hp) { drawHeartShape(c, hx, hy, 5, k === 'a' ? 'soul' : k === 'n' ? 'black' : k === 'm' ? 'coin' : 'red', k === 'e' ? 0 : 2); hx += 12; }
    if (!ch.hp) txt(c, 'Sin vida', hx + 20, hy, 12, '#bfae90', 'center', '');
    const sx = port ? nx : bx + 12, sy = port ? by + 62 : by + 36;
    const stats = [['dmg', st.dmg.toFixed(2)], ['tps', st.tps.toFixed(2)], ['speed', st.spd.toFixed(2)], ['range', st.rng.toFixed(1)]];
    stats.forEach(([k, v], i) => { drawStatIcon(c, k, sx + 6 + i * 62, sy, 1.2); txt(c, v, sx + 16 + i * 62, sy + 1, 13, '#f4ead8', 'left', '#120a06'); });
    const items = [...(ch.items || []), ch.active].filter(Boolean);
    items.forEach((id, i) => drawIcon(c, id, (port ? sx + 270 - i * 30 : bx + bw - 22 - i * 30), port ? sy : by + 30, 0.9));
    const lines = this.wrapText(c, ch.desc || '', port ? bw - 28 : 250, 13);
    lines.slice(0, port ? 4 : 2).forEach((ln, i) => txt(c, ln, port ? nx : bx + 262, (port ? by + 92 : by + 20) + i * 16, 13, '#bfae90', 'left', ''));
    // jugar
    const pb = port ? { x: 80, y: 500, w: 200, h: 44 } : { x: W / 2 - 80, y: 286, w: 160, h: 30 };
    this.menuButton(c, 'play', Input.touchMode ? 'Jugar' : 'Jugar (Enter)', pb.x, pb.y, pb.w, pb.h, true);
    const s = Store.data, fy = port ? 572 : 326;
    txt(c, `Partidas: ${s.runs}   ·   Victorias: ${s.wins}   ·   Mejor piso: ${s.best}`, W / 2, fy, 13, '#a8977a', 'center', '');
    if (!Input.touchMode) txt(c, 'Flechas elegir · Q cambiar pestaña · Enter jugar · En partida: WASD mover, flechas disparar, T trucos', W / 2, fy + 14, 10.5, '#8a7a62', 'center', '');
    else txt(c, 'Toca un personaje para elegirlo y otra vez para jugar', W / 2, fy + 18, 13, '#8a7a62', 'center', '');
    txt(c, 'Fan-game inspirado en The Binding of Isaac. Nombres y datos de la wiki de Fandom; arte y sonido originales.', W / 2, H - 7, port ? 8 : 9, '#6a5a46', 'center', '');
    const sb = port ? { x: W - 48, y: 12, w: 36, h: 28 } : { x: W - 44, y: 10, w: 34, h: 24 };
    this.menuButtons.push({ id: 'sound', ...sb });
    fillRR(c, sb.x, sb.y, sb.w, sb.h, 5, 'rgba(0,0,0,0.3)', 1, 'rgba(233,220,192,0.3)');
    txt(c, Sfx.muted ? 'Mudo' : 'Son', sb.x + sb.w / 2, sb.y + sb.h / 2, 12, '#d8c8a8', 'center', '');
  },

  drawStats(c, x, y, lh, size) {
    const p = this.player;
    const rows = [
      ['Velocidad', p.speed.toFixed(2)], ['Lágrimas/s', p.tps.toFixed(2)], ['Daño', p.dmg.toFixed(2)],
      ['Alcance', (p.range / 40).toFixed(1)], ['Vel. disparo', p.shot.toFixed(2)], ['Suerte', String(p.luck)],
    ];
    rows.forEach((r, i) => { txt(c, r[0], x, y + i * lh, size, '#bfae90', 'left', ''); txt(c, r[1], x + 150, y + i * lh, size, '#f4ead8', 'right', ''); });
  },

  drawItemsGrid(c, x, y, cols, cell, maxRows) {
    const p = this.player;
    let list = p.items.slice();
    if (p.active) list.unshift(p.active.id);
    if (!list.length) { txt(c, 'Aún no tienes objetos', x, y + 10, 14, '#8a7a62', 'left', ''); return; }
    const max = cols * maxRows;
    if (list.length > max) list = list.slice(list.length - max);
    list.forEach((id, i) => {
      const cx = x + (i % cols) * cell + cell / 2, cy = y + Math.floor(i / cols) * cell + cell / 2;
      fillRR(c, cx - cell / 2 + 2, cy - cell / 2 + 2, cell - 4, cell - 4, 4, 'rgba(0,0,0,0.3)');
      drawIcon(c, id, cx, cy, cell / 30);
    });
  },

  drawPause(c) {
    this.menuButtons = [];
    const W = this.mw, port = this.portrait, opts = this.pauseOptions();
    txt(c, 'PAUSA', W / 2, port ? 56 : 30, port ? 40 : 32, '#e9dcc0', 'center', '#1a0c06', FONT_TITLE);
    const seed = this.run.seed.toString(36).toUpperCase().padStart(7, '0');
    txt(c, `${this.player.char.name}   ·   ${FLOORS[this.floorIdx].name}   ·   Semilla ${seed}`, W / 2, port ? 96 : 58, 14, '#a8977a', 'center', '');
    if (port) {
      this.drawStats(c, 105, 125, 22, 16);
      txt(c, `Objetos (${this.player.items.length})`, 30, 268, 16, '#e9dcc0', 'left', '');
      this.drawItemsGrid(c, 30, 280, 8, 37.5, 3);
      opts.forEach((o, i) => this.menuButton(c, o.id, o.label, 24 + (i % 2) * 160, 410 + Math.floor(i / 2) * 50, 152, 42, i === this.menuSel));
      if (this.run.cheated) txt(c, 'Partida con trucos', W / 2, 570, 13, '#ffe27a', 'center', '');
    } else {
      this.drawStats(c, 70, 92, 20, 15);
      txt(c, `Objetos (${this.player.items.length})`, 300, 82, 15, '#e9dcc0', 'left', '');
      this.drawItemsGrid(c, 300, 94, 8, 33, 4);
      opts.forEach((o, i) => this.menuButton(c, o.id, o.label, 30 + (i % 3) * 183, 252 + Math.floor(i / 3) * 38, 173, 32, i === this.menuSel));
      if (this.run.cheated) txt(c, 'Partida con trucos', W / 2, 342, 12, '#ffe27a', 'center', '');
    }
  },

  drawCheats(c) {
    this.menuButtons = [];
    const W = this.mw, port = this.portrait, p = this.player;
    const ids = this.cheatIds(), acts = this.cheatActions(), { cols, rows } = this.cheatGrid();
    const per = cols * rows, pages = Math.max(1, Math.ceil(ids.length / per));
    this.cheatPage = clamp(this.cheatPage, 0, pages - 1);
    const pageIds = ids.slice(this.cheatPage * per, this.cheatPage * per + per);
    const nI = pageIds.length;
    const cell = port ? 40 : 32, gx = port ? 20 : 24, gy = port ? 52 : 32;
    txt(c, 'TRUCOS', port ? W / 2 : gx + cols * cell / 2, port ? 28 : 16, port ? 30 : 22, '#e9dcc0', 'center', '#1a0c06', FONT_TITLE);
    pageIds.forEach((id, i) => {
      const x = gx + (i % cols) * cell, y = gy + Math.floor(i / cols) * cell, sel = id === this.cheatItem;
      this.menuButtons.push({ id: 'item:' + id, x, y, w: cell, h: cell });
      fillRR(c, x + 1.5, y + 1.5, cell - 3, cell - 3, 4, sel ? 'rgba(233,220,192,0.3)' : 'rgba(0,0,0,0.35)', sel || i === this.cheatSel ? 2 : 1, sel ? '#e9dcc0' : i === this.cheatSel ? 'rgba(233,220,192,0.6)' : 'rgba(233,220,192,0.18)');
      drawIcon(c, id, x + cell / 2, y + cell / 2, cell / 34);
      const n = p.items.filter(x2 => x2 === id).length + (p.active && p.active.id === id ? 1 : 0);
      if (n) txt(c, n > 1 ? '×' + n : '✓', x + cell - 7, y + 8, 10, '#7be07b', 'center', '#120a06');
      if (ITEMS[id].kind === 'a') { c.fillStyle = '#ffe27a'; c.fillRect(x + 4, y + cell - 6, 6, 2.5); }
    });
    if (!nI) txt(c, 'No hay objetos en esta vista', gx + cols * cell / 2, gy + 40, 14, '#8a7a62', 'center', '');
    // páginas
    const py = gy + rows * cell + 4;
    this.menuButton(c, 'prev', '◀', gx, py, 34, port ? 24 : 20, false);
    this.menuButton(c, 'next', '▶', gx + cols * cell - 34, py, 34, port ? 24 : 20, false);
    txt(c, `Página ${this.cheatPage + 1} / ${pages}  ·  ${ids.length} objetos`, gx + cols * cell / 2, py + (port ? 12 : 10), 13, '#bfae90', 'center', '');
    // ficha del objeto
    const iy = py + (port ? 30 : 26), iw = cols * cell, ih = port ? 72 : 70;
    fillRR(c, gx, iy, iw, ih, 6, 'rgba(0,0,0,0.4)', 1, 'rgba(233,220,192,0.2)');
    const id = this.cheatItem;
    if (id && ITEMS[id]) {
      const it = ITEMS[id];
      drawIcon(c, id, gx + 22, iy + 24, 1.1);
      txt(c, it.name, gx + 44, iy + 13, 16, '#f4ead8', 'left', '');
      txt(c, `#${id} · ${it.kind === 'a' ? `Activo (${it.charge} cargas)` : 'Pasivo'}`, gx + 44, iy + 29, 11, '#a8977a', 'left', '');
      this.wrapText(c, it.desc, iw - 52, 11.5).slice(0, 3).forEach((ln, i) => txt(c, ln, gx + 44, iy + 43 + i * 12.5, 11.5, '#d8c8a8', 'left', ''));
    }
    const ty = iy + ih + 6;
    this.menuButton(c, 'take', 'Coger', gx, ty, port ? 120 : 100, port ? 30 : 26, true);
    if (this.cheatMsg) txt(c, this.cheatMsg.text, gx + (port ? 130 : 110), ty + 14, 13, '#ffe27a', 'left', '');
    else txt(c, Input.touchMode ? 'Toca dos veces un objeto para cogerlo' : 'Enter coger · Q/F cambiar página · Esc volver', gx + (port ? 130 : 110), ty + 14, 11, '#8a7a62', 'left', '');
    // acciones
    acts.forEach((a, i) => {
      const sel = this.cheatSel === nI + i;
      if (port) this.menuButton(c, 'cheat:' + a.id, a.label, 20 + (i % 2) * 164, 428 + Math.floor(i / 2) * 35, 156, 31, sel);
      else this.menuButton(c, 'cheat:' + a.id, a.label, 362, 22 + i * 29, 222, 26, sel);
    });
  },

  drawEnd(c) {
    this.menuButtons = [];
    const W = this.mw, port = this.portrait, won = this.state === 'win', opts = this.endOptions();
    const r = this.run;
    const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60).toString().padStart(2, '0');
    const bx = port ? 30 : 110, by = port ? 40 : 18, bw = port ? 300 : 380, bh = port ? 420 : 262;
    fillRR(c, bx, by, bw, bh, 6, '#e6d6b4', 2, '#5a4030');
    txt(c, won ? '¡VICTORIA!' : 'HAS MUERTO', W / 2, by + 36, 36, won ? '#3a6a2a' : '#8a1a12', 'center', '', FONT_TITLE);
    drawPlayer(c, Object.assign({}, this.player, { faceDir: 'down', shootAnim: 1, iframes: 0, holdT: 0, shield: 0, mantleUp: false, size: 1 }), W / 2, by + 104, 1.8);
    const lines = [
      won ? 'Has escapado del sótano.' : `Te mató: ${r.killedBy}`,
      `Llegaste a: ${FLOORS[this.floorIdx].name}`,
      `Tiempo: ${mm}:${ss}   ·   Enemigos: ${r.kills}   ·   Objetos: ${this.player.items.length}`,
    ];
    lines.forEach((ln, i) => txt(c, ln, W / 2, by + 150 + i * 20, 16, '#3a2a1a', 'center', ''));
    const icons = this.player.items.slice(-(port ? 14 : 12));
    icons.forEach((id, i) => {
      const per = port ? 7 : 12, cell = port ? 36 : 28;
      const x = W / 2 - (Math.min(per, icons.length) * cell) / 2 + (i % per) * cell + cell / 2;
      drawIcon(c, id, x, by + 222 + Math.floor(i / per) * cell, cell / 32);
    });
    if (r.cheated) txt(c, 'Partida con trucos: no cuenta como victoria', W / 2, by + bh - 10, 12, '#8a5a1a', 'center', '');
    c.globalAlpha = this.endT > 0.9 ? 1 : 0.4;
    if (port) opts.forEach((o, i) => this.menuButton(c, o.id, o.label, 60, 490 + i * 54, 240, 42, i === this.menuSel));
    else opts.forEach((o, i) => this.menuButton(c, o.id, o.label, W / 2 - 170 + i * 180, 300, 160, 36, i === this.menuSel));
    c.globalAlpha = 1;
    if (!Input.touchMode) txt(c, 'R para reintentar', W / 2, port ? 620 : 350, 12, '#a8977a', 'center', '');
  },
};

window.addEventListener('load', () => G.init());
