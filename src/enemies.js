'use strict';
/* =========================================================
   IA de enemigos y jefes
   ========================================================= */
// ---------- Movimiento de enemigos ----------
function chase(e, speed, wob = 0) {
  const p = G.player;
  let a = Math.atan2(p.y - e.y, p.x - e.x);
  if (wob) a += Math.sin(e.anim * 5 + e.t * 7) * wob;
  e.vx = Math.cos(a) * speed; e.vy = Math.sin(a) * speed;
}
function walkTo(e, tx, ty, speed) {
  let gx = tx, gy = ty;
  if (!e.flying && !lineClear(G.room.tiles, e.x, e.y, tx, ty, solidWalk, e.r * 0.8)) {
    const s = flowStep(e);
    if (s) { gx = s.x; gy = s.y; }
  }
  const a = Math.atan2(gy - e.y, gx - e.x);
  e.vx = Math.cos(a) * speed; e.vy = Math.sin(a) * speed;
}
function flowStep(e) {
  const f = G.flow; if (!f) return null;
  const c = txOf(e.x), r = tyOf(e.y);
  if (!inGrid(c, r)) return null;
  const tiles = G.room.tiles;
  let bd = f[r * COLS + c]; if (bd < 0) bd = 9999;
  let best = null;
  for (const n of N8) {
    const nc = c + n[0], nr = r + n[1];
    if (!inGrid(nc, nr)) continue;
    if (n[0] && n[1] && (solidWalk(tiles[r * COLS + nc]) || solidWalk(tiles[nr * COLS + c]))) continue;
    const v = f[nr * COLS + nc];
    if (v >= 0 && v < bd) { bd = v; best = [nc, nr]; }
  }
  return best ? { x: tcx(best[0]), y: tcy(best[1]) } : null;
}
function shootAt(e, tx, ty, speed, o) { const a = Math.atan2(ty - e.y, tx - e.x); return eTear(e.x, e.y, Math.cos(a) * speed, Math.sin(a) * speed, o); }
function countAlive(fn) { let n = 0; for (const e of G.enemies) if (!e.dead && fn(e)) n++; return n; }

const BEHAV = {
  fly(e, dt) {
    e.t -= dt;
    if (e.t <= 0) { e.t = rr(0.3, 0.7); e.dirx = rr(-1, 1); e.diry = rr(-1, 1); }
    const p = G.player, a = Math.atan2(p.y - e.y, p.x - e.x);
    e.vx = (e.dirx * 0.9 + Math.cos(a) * 0.35) * e.speed;
    e.vy = (e.diry * 0.9 + Math.sin(a) * 0.35) * e.speed;
  },
  afly(e, dt) {
    if (e.orbit && !e.orbit.dead) {
      e.oa += dt * 2.2;
      const tx = e.orbit.x + Math.cos(e.oa) * e.orad, ty = e.orbit.y + Math.sin(e.oa) * e.orad * 0.8;
      e.vx = (tx - e.x) * 8; e.vy = (ty - e.y) * 8;
      return;
    }
    e.orbit = null;
    chase(e, e.speed, 0.7);
  },
  pooter(e, dt) {
    e.t -= dt;
    if (e.t <= 0) { e.t = rr(0.8, 1.6); const a = Math.random() * TAU; e.dirx = Math.cos(a); e.diry = Math.sin(a); }
    e.vx = e.dirx * e.speed; e.vy = e.diry * e.speed;
    const p = G.player; e.face = p.x < e.x ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      if (dist(e, p) < 300) { shootAt(e, p.x, p.y, 170, { src: 'Un escupemoscas' }); e.shoot = 0.25; Sfx.play('eshoot'); }
      e.t2 = rr(1.8, 2.8);
    }
    if (e.shoot > 0) e.shoot -= dt;
  },
  gaper(e) { const p = G.player; walkTo(e, p.x, p.y, e.speed); if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1; },
  fatty(e) { const p = G.player; walkTo(e, p.x, p.y, e.speed); if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1; },
  horf(e, dt) {
    e.vx = e.vy = 0; e.t2 -= dt;
    const p = G.player;
    if (e.t2 <= 0) {
      if (dist(e, p) < 280) { shootAt(e, p.x, p.y, 190, { src: 'Una cabeza flotante' }); e.shoot = 0.3; Sfx.play('eshoot'); }
      e.t2 = rr(2, 3);
    }
    if (e.shoot > 0) e.shoot -= dt;
  },
  clotty(e, dt) {
    e.t -= dt;
    if (e.t <= 0) {
      if (e.state === 0) { e.state = 1; e.t = 0.6; const a = Math.floor(Math.random() * 8) * TAU / 8; e.dirx = Math.cos(a); e.diry = Math.sin(a); }
      else { e.state = 0; e.t = rr(0.4, 0.8); }
    }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    const s = e.state ? e.speed : 0;
    e.vx = e.dirx * s; e.vy = e.diry * s;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.t2 = rr(2.4, 3.4);
      for (const d of N4) eTear(e.x, e.y, d[0] * 150, d[1] * 150, { src: 'Un coágulo' });
      Sfx.play('eshoot'); e.shoot = 0.3;
    }
    if (e.shoot > 0) e.shoot -= dt;
  },
  spider(e, dt) {
    e.t -= dt;
    if (e.t <= 0) {
      const p = G.player;
      e.state = e.state ? 0 : 1;
      if (e.state) {
        e.t = rr(0.25, 0.4);
        const a = Math.random() < 0.6 ? Math.atan2(p.y - e.y, p.x - e.x) + rr(-0.5, 0.5) : Math.random() * TAU;
        e.dirx = Math.cos(a); e.diry = Math.sin(a);
      } else e.t = rr(0.3, 0.9);
    }
    const s = e.state ? e.speed : 0;
    e.vx = e.dirx * s; e.vy = e.diry * s;
  },
  charger(e, dt) {
    const p = G.player;
    if (e.state === 2) {
      e.vx = e.dirx * 240; e.vy = e.diry * 240;
      if (e.hit) { e.state = 0; e.t = 0.6; e.vx = e.vy = 0; }
      return;
    }
    e.t -= dt;
    if (e.state === 0) {
      e.vx = e.vy = 0;
      if (e.t <= 0) { e.state = 1; e.t = rr(1, 2); const d = pick(N4); e.dirx = d[0]; e.diry = d[1]; }
    } else {
      e.vx = e.dirx * e.speed; e.vy = e.diry * e.speed;
      if (e.t <= 0 || e.hit) { const d = pick(N4); e.dirx = d[0]; e.diry = d[1]; e.t = rr(1, 2); }
    }
    const ax = Math.abs(p.x - e.x) < 14, ay = Math.abs(p.y - e.y) < 14;
    if ((ax || ay) && dist(e, p) < 320 && lineClear(G.room.tiles, e.x, e.y, p.x, p.y)) {
      e.state = 2;
      if (ax) { e.dirx = 0; e.diry = Math.sign(p.y - e.y) || 1; } else { e.diry = 0; e.dirx = Math.sign(p.x - e.x) || 1; }
      Sfx.play('charge');
    }
  },
  hopper(e, dt) {
    if (e.state === 1) {
      e.t += dt;
      const k = Math.min(1, e.t / 0.38);
      e.z = Math.sin(k * Math.PI) * 18;
      e.vx = e.dirx; e.vy = e.diry;
      if (k >= 1) { e.state = 0; e.z = 0; e.t2 = rr(0.5, 1.1); e.vx = e.vy = 0; }
      return;
    }
    e.vx = e.vy = 0; e.t2 -= dt;
    if (e.t2 <= 0) {
      const p = G.player;
      e.state = 1; e.t = 0;
      const a = Math.random() < 0.7 ? Math.atan2(p.y - e.y, p.x - e.x) : Math.random() * TAU;
      const d = rr(50, 90);
      e.dirx = Math.cos(a) * d / 0.38; e.diry = Math.sin(a) * d / 0.38;
    }
  },
  boomfly(e) {
    if (!e.dirx) { e.dirx = Math.random() < 0.5 ? -1 : 1; e.diry = Math.random() < 0.5 ? -1 : 1; }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    e.vx = e.dirx * e.speed * 0.707; e.vy = e.diry * e.speed * 0.707;
  },
  host(e, dt) {
    e.vx = e.vy = 0;
    const p = G.player;
    if (e.state === 0) {
      e.shielded = true; e.t2 -= dt;
      if (e.t2 <= 0 && dist(e, p) < 320) { e.state = 1; e.t = 0; }
    } else {
      e.t += dt; e.shielded = e.t < 0.15 || e.t > 1.2;
      if (e.t > 0.35 && !e.shot) {
        e.shot = true;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        for (const o of [-0.25, 0, 0.25]) eTear(e.x, e.y - 6, Math.cos(a + o) * 185, Math.sin(a + o) * 185, { src: 'Una calavera' });
        Sfx.play('eshoot');
      }
      if (e.t > 1.35) { e.state = 0; e.shot = false; e.t2 = rr(1.8, 2.8); }
    }
  },
  mulligan(e, dt) {
    const p = G.player;
    e.t -= dt;
    if (e.t <= 0 || e.hit) {
      e.t = rr(0.6, 1.2);
      const a = Math.atan2(e.y - p.y, e.x - p.x) + rr(-0.9, 0.9);
      e.dirx = Math.cos(a); e.diry = Math.sin(a);
    }
    e.vx = e.dirx * e.speed; e.vy = e.diry * e.speed;
  },
  globin(e, dt) {
    if (e.state === 'goo') {
      e.vx = e.vy = 0; e.t2 -= dt;
      if (e.t2 <= 0) { e.state = 0; e.hp = e.maxHp; e.contact = true; G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 14 }); }
      return;
    }
    const p = G.player; walkTo(e, p.x, p.y, e.speed);
  },
  bigspider(e, dt) { BEHAV.spider(e, dt); },
  hive(e, dt) {
    e.t -= dt;
    if (e.t <= 0) { e.t = rr(1, 2); const a = Math.random() * TAU; e.dirx = Math.cos(a); e.diry = Math.sin(a); }
    e.vx = e.dirx * e.speed; e.vy = e.diry * e.speed;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.t2 = rr(2.5, 3.5);
      if (countAlive(x => x.type === 'afly' || x.type === 'fly') < 6) spawnEnemy('afly', e.x, e.y - 5);
    }
  },
  leaper(e, dt) {
    if (e.state === 1) {
      e.t += dt;
      const k = Math.min(1, e.t / 0.75);
      e.z = Math.sin(k * Math.PI) * 70;
      e.vx = e.dirx; e.vy = e.diry;
      e.untargetable = e.z > 25; e.contact = e.z < 12;
      if (k >= 1) {
        Object.assign(e, { state: 0, z: 0, vx: 0, vy: 0, untargetable: false, contact: true, flying: false, t2: rr(0.9, 1.5) });
        if (G.floorIdx >= 6) for (const d of DIAG) eTear(e.x, e.y, d[0] * 130, d[1] * 130, { src: 'Un brincador' });
        G.shake = Math.max(G.shake, 0.06); Sfx.play('land');
      }
      return;
    }
    e.vx = e.vy = 0; e.t2 -= dt;
    if (e.t2 <= 0) {
      const p = G.player;
      e.state = 1; e.t = 0; e.flying = true;
      const d = Math.min(dist(e, p), 160), a = Math.atan2(p.y - e.y, p.x - e.x);
      e.dirx = Math.cos(a) * d / 0.75; e.diry = Math.sin(a) * d / 0.75;
      Sfx.play('jump');
    }
  },
  // Aspa: deambula despacio y, cada par de segundos, dispara cuatro lágrimas; alterna cruz y diagonales
  cross(e, dt) {
    e.t -= dt;
    if (e.t <= 0) { const a = Math.random() * TAU; e.dirx = Math.cos(a); e.diry = Math.sin(a); e.t = rr(0.8, 1.6); }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    const s = e.t2 < 0.4 ? e.speed * 0.2 : e.speed;
    e.vx = e.dirx * s; e.vy = e.diry * s;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.t2 = rr(2, 2.8); e.diag = !e.diag;
      for (const d of e.diag ? DIAG : N4) eTear(e.x, e.y - 4, d[0] * 150, d[1] * 150, { src: 'Un aspa' });
      Sfx.play('eshoot'); e.shoot = 0.3;
    }
    if (e.shoot > 0) e.shoot -= dt;
  },
  // Gelatina: persigue a ritmo pulsante; al morir se divide en dos gelatinitas (ver killEnemy)
  jelly(e) {
    const p = G.player;
    walkTo(e, p.x, p.y, e.speed * (1 + 0.35 * Math.sin(e.anim * 4)));
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
  },
  jellet(e) { chase(e, e.speed, 0.9); if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1; },
  // Topo: bajo tierra se acerca al jugador sin poder ser golpeado ni hacer daño (pasa por rocas y fosos);
  // emerge, dispara tres lágrimas y vuelve a enterrarse
  mole(e, dt) {
    const p = G.player;
    e.t2 -= dt;
    if (e.state === 'up') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.35 && !e.shot) {
        e.shot = true;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        for (const o of [-0.3, 0, 0.3]) eTear(e.x, e.y - 4, Math.cos(a + o) * 170, Math.sin(a + o) * 170, { src: 'Un topo' });
        Sfx.play('eshoot');
      }
      if (e.t2 <= 0) { e.state = 0; e.t2 = rr(1.3, 2); }
      return;
    }
    e.flying = true; e.untargetable = true; e.contact = false;
    chase(e, e.speed, 0.2);
    if (dist(e, p) < 60) e.vx = e.vy = 0;
    if (e.t2 <= 0) {
      const c = txOf(e.x), r = tyOf(e.y);
      if (!inGrid(c, r) || solidWalk(G.room.tiles[r * COLS + c])) { e.t2 = 0.15; return; }   // no emerge dentro de una roca
      Object.assign(e, { state: 'up', flying: false, untargetable: false, contact: true, vx: 0, vy: 0, t: 0, shot: false, t2: 1.6 });
      G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 14 });
      Sfx.play('land');
    }
  },
  // Baboso: se arrastra tras el jugador dejando charcos viscosos que hacen daño al pisarlos
  slug(e, dt) {
    const p = G.player;
    e.t -= dt;
    if (e.t <= 0) { e.t = rr(0.7, 1.4); const a = Math.atan2(p.y - e.y, p.x - e.x) + rr(-0.9, 0.9); e.dirx = Math.cos(a); e.diry = Math.sin(a); }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    e.vx = e.dirx * e.speed; e.vy = e.diry * e.speed;
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t3 = (e.t3 || 0) - dt;
    if (e.t3 <= 0 && G.creeps.length < 40) { e.t3 = 0.5; G.creeps.push({ x: e.x, y: e.y + 8, r: rr(13, 18), t: 4, max: 4, small: true, src: 'Un baboso' }); }
  },

  // Escarabajo: acorazado. Camina hacia donde mira y gira despacio hacia el jugador; las lágrimas que le llegan
  // de frente rebotan (ver damageEnemy), así que hay que rodearlo o usar bombas, veneno y fuego
  shell(e, dt) {
    const p = G.player, want = Math.atan2(p.y - e.y, p.x - e.x);
    const d = ((want - e.hd + Math.PI * 3) % TAU) - Math.PI;
    e.hd += clamp(d, -1.1 * dt, 1.1 * dt);
    e.vx = Math.cos(e.hd) * e.speed; e.vy = Math.sin(e.hd) * e.speed;
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
  },
  // Minero: mantiene la distancia con el jugador y va sembrando minas por la sala
  miner(e, dt) {
    const p = G.player, d = dist(e, p), a = Math.atan2(p.y - e.y, p.x - e.x);
    const s = d < 150 ? -1 : d > 240 ? 1 : 0;
    e.t -= dt;
    if (e.t <= 0) { e.t = rr(0.8, 1.6); e.side = Math.random() < 0.5 ? -1 : 1; }
    const sa = a + (s < 0 ? rr(-0.6, 0.6) : 0) + (s === 0 ? Math.PI / 2 * (e.side || 1) : 0);
    const sp = s === 0 ? e.speed * 0.6 : e.speed;
    e.vx = Math.cos(sa) * sp * (s < 0 ? -1 : 1); e.vy = Math.sin(sa) * sp * (s < 0 ? -1 : 1);
    if (e.hit) { e.t = 0; }
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.t2 = rr(2.2, 3.2);
      if (countAlive(x => x.type === 'mine') < 5) {
        const m = spawnEnemy('mine', e.x, e.y + 6);
        Object.assign(m, { ignoreClear: true, contact: false, arm: 0.9, life: 14 });
        e.shoot = 0.3; Sfx.play('land');
      }
    }
    if (e.shoot > 0) e.shoot -= dt;
  },
  // Mina: se arma al poco de caer y explota si el jugador se acerca o si la golpean; desaparece al limpiar la sala
  mine(e, dt) {
    e.vx = e.vy = 0;
    if (G.room.cleared) { e.dead = true; return; }
    e.arm -= dt; e.life -= dt;
    if (e.life <= 0) { e.dead = true; G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.3, r: 10 }); return; }
    if (e.arm <= 0 && dist(e, G.player) < 38) { e.hp = 0; killEnemy(e); }
  },
  // Parpadeo: aparece, dispara dos veces y se desvanece; reaparece lejos del jugador. Mientras no se ve, no se le puede dañar
  blinker(e, dt) {
    const p = G.player;
    e.vx = e.vy = 0; e.t2 -= dt;
    if (e.state === 'gone') {
      e.invisible = true; e.untargetable = true; e.contact = false;
      if (e.t2 > 0) return;
      for (let i = 0; i < 14; i++) {
        const c = ri(1, COLS - 2), r = ri(1, ROWS - 2);
        if (G.room.tiles[r * COLS + c] !== T.EMPTY || Math.hypot(tcx(c) - p.x, tcy(r) - p.y) < 130) continue;
        e.x = tcx(c); e.y = tcy(r); break;
      }
      Object.assign(e, { state: 0, invisible: false, untargetable: false, contact: true, t: 0, shot: 0, t2: 1.5 });
      G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 16 });
      return;
    }
    e.t += dt;
    const times = [0.4, 0.8];
    if (e.shot < 2 && e.t > times[e.shot]) {
      e.shot++; shootAt(e, p.x, p.y, 175, { src: 'Un parpadeo' }); Sfx.play('eshoot'); e.shoot = 0.25;
    }
    if (e.shoot > 0) e.shoot -= dt;
    if (e.t2 <= 0) {
      G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 16 });
      e.state = 'gone'; e.t2 = rr(0.8, 1.3);
    }
  },
  // Mortero: inmóvil; lanza proyectiles en arco al sitio donde está el jugador (se marca dónde caerán)
  mortar(e, dt) {
    e.vx = e.vy = 0; e.t2 -= dt;
    if (e.marks) { for (const m of e.marks) m.t -= dt; e.marks = e.marks.filter(m => m.t > 0); }
    if (e.t2 > 0) { if (e.shoot > 0) e.shoot -= dt; return; }
    const p = G.player, n = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const tx = p.x + (i ? rr(-60, 60) : 0), ty = p.y + (i ? rr(-40, 40) : 0);
      const T2 = clamp(dist(e, { x: tx, y: ty }) / 180, 0.8, 1.4) + i * 0.3, g = 420, z0 = 16;
      eTear(e.x, e.y - 8, (tx - e.x) / T2, (ty - e.y) / T2, { vz: (g * T2 * T2 / 2 - z0) / T2, g, z: z0, r: 6, src: 'Un mortero', color: '#8a7a68' });
      (e.marks = e.marks || []).push({ x: tx, y: ty, t: T2, max: T2 });
    }
    e.shoot = 0.3; Sfx.play('eshoot');
    e.t2 = rr(2.4, 3.2);
  },

  // Invocador: mantiene la distancia y, tras un conjuro de 0,7 s, llama a dos sombras (nunca más de 4 a la vez)
  summoner(e, dt) {
    const p = G.player, d = dist(e, p);
    if (e.cast > 0) {
      e.vx = e.vy = 0; e.cast -= dt;
      if (e.cast <= 0) {
        for (let i = 0; i < 2; i++) spawnEnemy('shade', e.x + (i ? 14 : -14), e.y + 6);
        G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 18 }); Sfx.play('roar');
        e.t2 = rr(3.8, 5);
      }
      return;
    }
    const a = Math.atan2(p.y - e.y, p.x - e.x), s = d < 170 ? -1 : d > 260 ? 1 : 0;
    e.t -= dt; if (e.t <= 0) { e.t = rr(0.8, 1.6); e.side = Math.random() < 0.5 ? -1 : 1; }
    const ang = s === 0 ? a + Math.PI / 2 * (e.side || 1) : a, sp = s === 0 ? e.speed * 0.5 : e.speed;
    e.vx = Math.cos(ang) * sp * (s < 0 ? -1 : 1); e.vy = Math.sin(ang) * sp * (s < 0 ? -1 : 1);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 <= 0) { if (countAlive(x => x.type === 'shade') < 4) e.cast = 0.7; else e.t2 = 0.8; }
  },
  shade(e) { chase(e, e.speed, 0.8); if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1; },
  // Vigía: ojo de piedra inmóvil. Apunta (0,55 s siguiendo al jugador y luego fijo), carga hasta 0,9 s y dispara un
  // rayo de 0,5 s que daña a quien lo cruce. El rayo se dibuja en drawEnemy
  laser(e, dt) {
    e.vx = e.vy = 0; e.t2 -= dt;
    const p = G.player;
    if (e.state === 0) {
      if (e.t2 > 0 || dist(e, p) > 400) return;
      Object.assign(e, { state: 'aim', t: 0 }); Sfx.play('charge');
    }
    e.t += dt;
    if (e.state === 'aim') {
      if (e.t < 0.55) e.ang = Math.atan2(p.y - e.y + 4, p.x - e.x);
      if (e.t >= 0.9) { e.state = 'fire'; e.t = 0; Sfx.play('laser'); }
    } else {
      const c = Math.cos(e.ang), s = Math.sin(e.ang), len = rayLen(e.x, e.y - 4, c, s);
      e.len = len;
      if (Math.sqrt(segDist2(p.x, p.y, e.x, e.y - 4, e.x + c * len, e.y - 4 + s * len)) < p.r + 4 && !isFlying(p)) hurtPlayer(dmgUnit(false), 'Un vigía');
      if (e.t >= 0.5) { e.state = 0; e.t2 = rr(2.2, 3.2); }
    }
    if (e.state === 'aim') e.len = rayLen(e.x, e.y - 4, Math.cos(e.ang), Math.sin(e.ang));
  },
  // Furioso: camina hacia el jugador; si es el único enemigo que queda en la sala, se enfurece y corre 2,6 veces más rápido
  enrager(e) {
    const p = G.player;
    e.enraged = countAlive(x => x !== e && !x.ignoreClear) === 0;
    walkTo(e, p.x, p.y, e.speed * (e.enraged ? 2.6 : 1));
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
  },
  // Espectro: atraviesa rocas y fosos persiguiendo al jugador; mientras está dentro de un obstáculo no se le puede dañar ni hace daño
  phaser(e) {
    const p = G.player;
    e.flying = true;
    chase(e, e.speed, 0.25);
    const c = txOf(e.x), r = tyOf(e.y), t = inGrid(c, r) ? G.room.tiles[r * COLS + c] : T.EMPTY;
    e.fused = t === T.ROCK || t === T.TINTED || t === T.POOP || t === T.TNT || t === T.METAL || t === T.WALL;
    e.untargetable = e.fused; e.contact = !e.fused;
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
  },

  // Sanador: se mantiene lejos del jugador y, tras 0,8 s de concentración, cura un 40 % de vida al aliado más herido
  // que tenga cerca (nunca a jefes). Conviene matarlo primero
  healer(e, dt) {
    const p = G.player, d = dist(e, p);
    if (e.heal > 0) {
      e.vx = e.vy = 0; e.heal -= dt;
      if (e.heal <= 0) {
        const o = e.target;
        if (o && !o.dead) {
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.4);
          G.effects.push({ type: 'poof', x: o.x, y: o.y - 6, t: 0, max: 0.45, r: o.r + 6 });
          Sfx.play('unlock');
        }
        e.target = null; e.t2 = rr(3, 4.2);
      }
      return;
    }
    const a = Math.atan2(p.y - e.y, p.x - e.x), s = d < 180 ? -1 : d > 270 ? 1 : 0;
    e.t -= dt; if (e.t <= 0) { e.t = rr(0.8, 1.6); e.side = Math.random() < 0.5 ? -1 : 1; }
    const ang = s === 0 ? a + Math.PI / 2 * (e.side || 1) : a, sp = s === 0 ? e.speed * 0.5 : e.speed;
    e.vx = Math.cos(ang) * sp * (s < 0 ? -1 : 1); e.vy = Math.sin(ang) * sp * (s < 0 ? -1 : 1);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      let best = null, br = 0.8;
      for (const x of G.enemies) {
        if (x === e || x.dead || x.boss || x.parent || dist(e, x) > 270) continue;
        const r = x.hp / x.maxHp;
        if (r < br) { br = r; best = x; }
      }
      if (best) { e.target = best; e.heal = 0.8; Sfx.play('charge'); } else e.t2 = 0.6;
    }
  },
  // Imparable: lentísimo pero nada lo detiene: no se le puede empujar, ralentizar, congelar, asustar, encantar ni
  // confundir (lo garantiza `immune` en updateEnemy); veneno, fuego y sangrado sí le afectan
  relentless(e) {
    const p = G.player;
    walkTo(e, p.x, p.y, e.speed);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
  },
  // Espiral: apenas se mueve; dispara ráfagas de 2,4 s con dos brazos de lágrimas que giran, y descansa entre ráfagas
  spiral(e, dt) {
    e.t -= dt;
    if (e.t <= 0) { e.t = rr(1, 2); const a = Math.random() * TAU; e.dirx = Math.cos(a); e.diry = Math.sin(a); }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    const spin = e.state === 'spin';
    e.vx = e.dirx * e.speed * (spin ? 0.3 : 1); e.vy = e.diry * e.speed * (spin ? 0.3 : 1);
    if (!spin) {
      e.t2 -= dt;
      if (e.t2 <= 0) Object.assign(e, { state: 'spin', t3: 0, st: 0, sa: Math.random() * TAU });
      return;
    }
    e.t3 += dt; e.st -= dt; e.sa += dt * 2.6;
    if (e.st <= 0) {
      e.st = 0.13;
      if (G.etears.length < 120) for (const k of [0, Math.PI]) eTear(e.x, e.y - 4, Math.cos(e.sa + k) * 125, Math.sin(e.sa + k) * 125, { src: 'Una espiral' });
      if (Math.floor(e.t3 / 0.13) % 3 === 0) Sfx.play('eshoot');
    }
    if (e.t3 > 2.4) { e.state = 0; e.t2 = rr(1.6, 2.4); }
  },
  // Gemelo: corre hacia el jugador; si dos gemelos se tocan durante 0,8 s se funden en unos gemelos fundidos
  // con la vida de los dos (el primero de la lista absorbe al otro)
  merger(e, dt) {
    chase(e, e.speed, 0.6);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    let o = null;
    for (const x of G.enemies) if (x !== e && !x.dead && x.type === 'merger' && x.spawnT <= 0 && dist(e, x) < e.r + x.r + 6) { o = x; break; }
    if (!o) { e.mt = 0; return; }
    e.mt = (e.mt || 0) + dt;
    if (e.mt > 0.8 && G.enemies.indexOf(e) < G.enemies.indexOf(o)) {
      Object.assign(e, { type: 'fused', hp: e.hp + o.hp, maxHp: e.maxHp + o.maxHp, r: EN.fused.r, speed: EN.fused.speed, t2: 1.2, mt: 0, champ: e.champ || o.champ, flash: 0.15 });
      o.dead = true;
      G.effects.push({ type: 'poof', x: (e.x + o.x) / 2, y: e.y - 4, t: 0, max: 0.5, r: 22 });
      Sfx.play('land');
    }
  },
  fused(e, dt) {
    const p = G.player;
    walkTo(e, p.x, p.y, e.speed);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.t2 = rr(2, 2.8);
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      for (const o of [-0.3, 0, 0.3]) eTear(e.x, e.y - 6, Math.cos(a + o) * 150, Math.sin(a + o) * 150, { src: 'Unos gemelos' });
      Sfx.play('eshoot'); e.shoot = 0.3;
    }
    if (e.shoot > 0) e.shoot -= dt;
  },

  // ----- Jefes -----
  // Fase 2 (bajo el 50 % de vida): descansa un 40 % menos, los saltos llegan a 150 px, escupe 20 lágrimas en vez de 13 y la
  // caída desde el aire suelta 14 en vez de 10 y deja tres charcos ácidos
  gloton(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5, rest = fast ? 0.6 : 1;
    e.vx = e.vy = 0;
    switch (e.state) {
      case 'idle':
        e.t2 -= dt; e.z = 0; e.contact = true; e.untargetable = false;
        if (e.t2 <= 0) {
          const r = Math.random();
          if (r < 0.45) {
            e.state = 'hop'; e.t = 0;
            const d = Math.min(dist(e, p), fast ? 150 : 110), a = angTo(e, p);
            e.sx = e.x; e.sy = e.y; e.tx = e.x + Math.cos(a) * d; e.ty = e.y + Math.sin(a) * d;
          } else if (r < 0.8) { e.state = 'spit'; e.t = 0; e.shot = false; }
          else { e.state = 'up'; e.t = 0; Sfx.play('jump'); }
        }
        break;
      case 'hop': {
        e.t += dt;
        const k = Math.min(1, e.t / 0.55);
        e.x = lerp(e.sx, e.tx, k); e.y = lerp(e.sy, e.ty, k);
        e.z = Math.sin(k * Math.PI) * 28;
        if (k >= 1) { e.state = 'idle'; e.z = 0; e.t2 = rr(0.25, 0.6) * rest; G.shake = Math.max(G.shake, 0.08); Sfx.play('land'); }
        break;
      }
      case 'spit':
        e.t += dt;
        if (e.t > 0.45 && !e.shot) {
          e.shot = true;
          const a = angTo(e, p);
          for (let i = 0; i < (fast ? 20 : 13); i++) {
            const aa = a + rr(-0.45, 0.45), sp = rr(130, 260);
            eTear(e.x, e.y - 10, Math.cos(aa) * sp, Math.sin(aa) * sp, { boss: true, z: 20, vz: rr(60, 200), g: 380, life: 4, src: e.name });
          }
          Sfx.play('spit');
        }
        if (e.t > 1.0) { e.state = 'idle'; e.t2 = rr(0.4, 0.9) * rest; }
        break;
      case 'up':
        e.t += dt; e.z = e.t * 900; e.contact = false; e.untargetable = e.z > 40;
        if (e.t > 0.45) { e.state = 'air'; e.t = 0; }
        break;
      case 'air':
        e.t += dt; e.z = 420;
        e.x = lerp(e.x, p.x, Math.min(1, dt * 3)); e.y = lerp(e.y, p.y, Math.min(1, dt * 3));
        if (e.t > 1.1) { e.state = 'down'; e.t = 0; }
        break;
      case 'down':
        e.t += dt; e.z = Math.max(0, 420 - e.t * 1400);
        if (e.z <= 0) {
          e.z = 0; e.contact = true; e.untargetable = false;
          G.shake = 0.35; Sfx.play('boom2');
          const nr = fast ? 14 : 10;
          for (let i = 0; i < nr; i++) { const aa = i * TAU / nr; eTear(e.x, e.y, Math.cos(aa) * 170, Math.sin(aa) * 170, { boss: true, src: e.name }); }
          if (fast) for (let k = 0; k < 3 && G.creeps.length < 40; k++) G.creeps.push({ x: e.x + rr(-50, 50), y: e.y + rr(-20, 30), r: rr(18, 24), t: 5, max: 5, col: '#9ac84a', src: e.name });
          e.state = 'idle'; e.t2 = 0.9 * rest;
        }
        break;
    }
  },
  // Fase 2 (bajo el 50 % de vida): vuela un 40 % más rápido, orbita con 4 moscas en vez de 3 y, cada 2,4–3,2 s,
  // dispara un abanico de 5 lágrimas
  zumbido(e, dt) {
    const fast = e.hp < e.maxHp * 0.5, n = fast ? 4 : 3;
    if (!e.dirx) { e.dirx = 45; e.diry = 35; }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    e.vx = e.dirx * (fast ? 1.4 : 1); e.vy = e.diry * (fast ? 1.4 : 1);
    if (fast) {
      e.fanT = (e.fanT === undefined ? 1.5 : e.fanT) - dt;
      if (e.fanT <= 0) {
        e.fanT = rr(2.4, 3.2);
        const a = angTo(e, G.player);
        for (let i = -2; i <= 2; i++) eTear(e.x, e.y, Math.cos(a + i * 0.2) * 180, Math.sin(a + i * 0.2) * 180, { boss: true, src: e.name });
        Sfx.play('eshoot');
      }
    }
    e.t2 -= dt;
    if (e.t2 <= 0) {
      const mine = G.enemies.filter(f => !f.dead && f.orbit === e);
      const total = countAlive(f => f.type === 'afly' || f.type === 'fly');
      if (mine.length >= n || (total >= 8 && mine.length)) { for (const f of mine) f.orbit = null; Sfx.play('roar'); }
      else if (total < 10) {
        for (let i = 0; i < n; i++) {
          const f = makeEnemy('afly', e.x, e.y, { spawnT: 0.05 });
          f.orbit = e; f.oa = i * TAU / n + Math.random(); f.orad = e.r + 22;
          G.enemies.push(f);
        }
        Sfx.play('burp');
      }
      e.burp = 0.4; e.t2 = e.hp < e.maxHp * 0.5 ? rr(1.6, 2.4) : rr(2.2, 3.2);
    }
    if (e.burp > 0) e.burp -= dt;
  },
  // Reina Babosa: se arrastra hacia el jugador dejando un rastro viscoso y, cada 2–3 s, escupe un abanico de lágrimas.
  // Por debajo de la mitad de vida pare dos baboso, va más rápida y escupe abanicos más anchos
  babosa(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (fast && !e.born) { e.born = true; Object.assign(e, { state: 'birth', t: 0, shot: false }); Sfx.play('roar'); }
    if (e.state === 'birth') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.6 && !e.shot) {
        e.shot = true;
        for (const s of [-1, 1]) spawnEnemy('slug', e.x + s * 36, e.y + 14);
        G.effects.push({ type: 'poof', x: e.x, y: e.y - 6, t: 0, max: 0.5, r: 40 });
      }
      if (e.t > 1.1) { e.state = 'walk'; e.t2 = 1.2; }
      return;
    }
    if (e.state === 'spit') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.4 && !e.shot) {
        e.shot = true;
        const a = angTo(e, p), n = fast ? 7 : 5, spread = fast ? 0.9 : 0.6;
        for (let i = 0; i < n; i++) {
          const o = (i - (n - 1) / 2) / ((n - 1) / 2) * spread;
          eTear(e.x, e.y - 12, Math.cos(a + o) * 175, Math.sin(a + o) * 175, { boss: true, color: '#9ac84a', src: e.name });
        }
        Sfx.play('spit');
      }
      if (e.t > 0.8) { e.state = 'walk'; e.t2 = fast ? rr(1.4, 2.2) : rr(2, 3); }
      return;
    }
    walkTo(e, p.x, p.y, fast ? 54 : 38);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t3 = (e.t3 || 0) - dt;
    if (e.t3 <= 0 && G.creeps.length < 40) { e.t3 = 0.4; G.creeps.push({ x: e.x + rr(-10, 10), y: e.y + 14, r: rr(18, 26), t: 5, max: 5, col: '#8ab83a', src: e.name }); }
    e.t2 -= dt;
    if (e.t2 <= 0) Object.assign(e, { state: 'spit', t: 0, shot: false });
  },
  // Gran Topo: bajo tierra persigue al jugador sin poder ser golpeado; marca en el suelo el punto donde estaba el
  // jugador y emerge allí (la erupción daña a quien siga encima y lanza un anillo de lágrimas); queda al descubierto
  // unos 2 s y vuelve a enterrarse. Bajo la mitad de vida es más rápido, avisa menos y el anillo es de 12 lágrimas
  gtopo(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.state === 'idle') Object.assign(e, { state: 'dig', t: 0 });
    e.t += dt;
    if (e.state === 'dig') {
      Object.assign(e, { untargetable: true, contact: false, flying: true });
      chase(e, fast ? 135 : 105, 0.15);
      if (dist(e, p) < 70) e.vx = e.vy = 0;
      if (e.t > (fast ? 1 : 1.5)) { Object.assign(e, { state: 'mark', t: 0, tx: p.x, ty: p.y, vx: 0, vy: 0 }); Sfx.play('charge'); }
      return;
    }
    if (e.state === 'mark') {
      e.vx = e.vy = 0;
      if (e.t > (fast ? 0.75 : 1)) {
        Object.assign(e, { x: e.tx, y: e.ty, flying: false, untargetable: false, contact: true, state: 'up', t: 0, shot: false });
        if (dist(e, p) < e.r + p.r + 14) hurtPlayer(dmgUnit(true), e.name);
        const n = fast ? 12 : 8, off = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y - 8, Math.cos(a) * 150, Math.sin(a) * 150, { boss: true, color: '#8a6a4a', src: e.name }); }
        G.shake = Math.max(G.shake, 0.25); Sfx.play('land');
        G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.5, r: 36 });
      }
      return;
    }
    e.vx = e.vy = 0;
    if (e.t > 0.9 && !e.shot) {
      e.shot = true;
      const a = angTo(e, p);
      for (const o of fast ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.25, 0, 0.25]) eTear(e.x, e.y - 8, Math.cos(a + o) * 185, Math.sin(a + o) * 185, { boss: true, color: '#8a6a4a', src: e.name });
      Sfx.play('eshoot');
    }
    if (e.t > (fast ? 1.5 : 2)) Object.assign(e, { state: 'dig', t: 0 });
  },
  // Coloso de Piedra: gigante lento que camina hacia el jugador. Cada 2–3 s lanza peñascos en arco (3, o 5 bajo la
  // mitad de vida) y marca en el suelo dónde caerán; si el jugador se acerca a menos de 120 px, pisa y suelta un anillo
  // de lágrimas (10, o 14). Bajo la mitad de vida camina más rápido y descansa menos
  coloso(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.marks) { for (const m of e.marks) m.t -= dt; e.marks = e.marks.filter(m => m.t > 0); }
    e.t3 = (e.t3 || 0) - dt;
    if (e.state === 'throw') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.5 && !e.shot) {
        e.shot = true;
        for (let i = 0; i < (fast ? 5 : 3); i++) {
          const tx = clamp(p.x + (i ? rr(-90, 90) : 0), X0 + 20, X1 - 20), ty = clamp(p.y + (i ? rr(-60, 60) : 0), Y0 + 20, Y1 - 20);
          const T2 = clamp(dist(e, { x: tx, y: ty }) / 170, 0.9, 1.5) + i * 0.15, g = 420, z0 = 30;
          eTear(e.x, e.y - 30, (tx - e.x) / T2, (ty - e.y) / T2, { vz: (g * T2 * T2 / 2 - z0) / T2, g, z: z0, r: 9, boss: true, color: '#8a8a82', src: e.name });
          (e.marks = e.marks || []).push({ x: tx, y: ty, t: T2, max: T2 });
        }
        Sfx.play('roar');
      }
      if (e.t > 1) { e.state = 'walk'; e.t2 = (fast ? rr(1.6, 2.2) : rr(2.2, 3)); }
      return;
    }
    if (e.state === 'stomp') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.55 && !e.shot) {
        e.shot = true;
        const n = fast ? 14 : 10, off = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y - 8, Math.cos(a) * 140, Math.sin(a) * 140, { boss: true, color: '#8a8a82', src: e.name }); }
        G.shake = Math.max(G.shake, 0.3); Sfx.play('land');
        G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.5, r: 44 });
      }
      if (e.t > 1) { e.state = 'walk'; e.t2 = rr(1.4, 2); }
      return;
    }
    walkTo(e, p.x, p.y, fast ? 42 : 30);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (dist(e, p) < 120 && e.t3 <= 0) { Object.assign(e, { state: 'stomp', t: 0, shot: false, t3: 3 }); Sfx.play('charge'); }
    else if (e.t2 <= 0) Object.assign(e, { state: 'throw', t: 0, shot: false });
  },
  // Rey Minero: se mantiene a 170–260 px del jugador y, cada 1,5–2,5 s, elige una acción: sembrar minas junto al jugador
  // (2, o 3 bajo la mitad de vida; nunca más de 7 en la sala), embestir en línea recta tras 0,7 s de aviso, o disparar
  // tres lágrimas. Bajo la mitad de vida embiste más rápido y descansa menos
  rey(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.state === 'dash') {
      e.t += dt;
      e.vx = e.dirx * (fast ? 330 : 280); e.vy = e.diry * (fast ? 330 : 280);
      if (e.hit || e.t > 0.9) {
        Object.assign(e, { state: 'walk', t2: fast ? rr(1, 1.6) : rr(1.4, 2.2), vx: 0, vy: 0 });
        if (e.hit) { G.shake = Math.max(G.shake, 0.2); Sfx.play('land'); }
      }
      return;
    }
    if (e.state === 'windup') {
      e.vx = e.vy = 0; e.t += dt;
      e.face = p.x < e.x ? -1 : 1;
      if (e.t > 0.7) { const a = angTo(e, p); Object.assign(e, { state: 'dash', t: 0, dirx: Math.cos(a), diry: Math.sin(a) }); Sfx.play('charge'); }
      return;
    }
    const d = dist(e, p), a = Math.atan2(p.y - e.y, p.x - e.x), s = d < 170 ? -1 : d > 260 ? 1 : 0;
    e.t -= dt; if (e.t <= 0) { e.t = rr(0.8, 1.6); e.side = Math.random() < 0.5 ? -1 : 1; }
    const ang = s === 0 ? a + Math.PI / 2 * (e.side || 1) : a, sp = s === 0 ? 40 : 62;
    e.vx = Math.cos(ang) * sp * (s < 0 ? -1 : 1); e.vy = Math.sin(ang) * sp * (s < 0 ? -1 : 1);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 > 0) return;
    const r = Math.random();
    if (r < 0.4 && countAlive(x => x.type === 'mine') < 7) {
      for (let i = 0; i < (fast ? 3 : 2); i++) {
        const c = clamp(txOf(p.x + rr(-120, 120)), 1, COLS - 2), rw = clamp(tyOf(p.y + rr(-80, 80)), 1, ROWS - 2);
        if (G.room.tiles[rw * COLS + c] !== T.EMPTY) continue;
        const m = spawnEnemy('mine', tcx(c), tcy(rw));
        Object.assign(m, { ignoreClear: true, contact: false, arm: 0.9, life: 14 });
      }
      e.shoot = 0.3; Sfx.play('land'); e.t2 = fast ? rr(1, 1.6) : rr(1.5, 2.2);
    } else if (r < 0.75) Object.assign(e, { state: 'windup', t: 0 });
    else {
      for (const o of [-0.25, 0, 0.25]) eTear(e.x, e.y - 8, Math.cos(a + o) * 190, Math.sin(a + o) * 190, { boss: true, color: '#c8a040', src: e.name });
      Sfx.play('eshoot'); e.shoot = 0.3; e.t2 = fast ? rr(1, 1.6) : rr(1.5, 2.2);
    }
  },
  // Carcelero: camina hacia el jugador (36) haciendo girar una bola de cadena a su alrededor, que daña al tocarla y que
  // no se puede dañar; la dirección de giro se invierte cada 4–6 s. Cada 2–3 s llama a dos sombras (nunca más de 4). Por
  // debajo de la mitad de vida gira una segunda bola, va a 44 y, la mitad de las veces, en lugar de llamar sombras
  // lanza las bolas hacia fuera durante 1,8 s
  carcelero(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (!e.balls) Object.assign(e, { balls: [], oa: 0, od: 1, rad: 88, t3: rr(4, 6) });
    while (e.balls.length < (fast ? 2 : 1)) {
      const b = makeEnemy('ball', e.x, e.y, { spawnT: 0 });
      Object.assign(b, { parent: e, boss: true, ignoreClear: true, noCollide: true, untargetable: true, kb: 0, name: e.name, k: e.balls.length });
      G.enemies.push(b); e.balls.push(b);
      if (e.balls.length === 2) Sfx.play('roar');
    }
    e.oa += dt * e.od * (fast ? 2.6 : 2) * (e.state === 'fling' ? 1.4 : 1);
    e.rad = 88 + (e.state === 'fling' ? 80 * Math.sin(Math.min(1, e.t / 1.8) * Math.PI) : 0);
    e.t3 -= dt; if (e.t3 <= 0) { e.od = -e.od; e.t3 = rr(4, 6); }
    if (e.state === 'guard') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.6 && !e.shot) {
        e.shot = true;
        if (countAlive(x => x.type === 'shade') < 4) for (let i = 0; i < 2; i++) spawnEnemy('shade', e.x + (i ? 18 : -18), e.y + 8);
        G.effects.push({ type: 'poof', x: e.x, y: e.y - 6, t: 0, max: 0.45, r: 30 }); Sfx.play('roar');
      }
      if (e.t > 1) { e.state = 'walk'; e.t2 = fast ? rr(2, 3) : rr(2.4, 3.4); }
      return;
    }
    if (e.state === 'fling') {
      e.t += dt; walkTo(e, p.x, p.y, 22);
      if (e.t > 1.8) { e.state = 'walk'; e.t2 = rr(2, 3); }
    } else {
      walkTo(e, p.x, p.y, fast ? 44 : 36);
      e.t2 -= dt;
      if (e.t2 <= 0) { if (fast && Math.random() < 0.5) Object.assign(e, { state: 'fling', t: 0 }); else Object.assign(e, { state: 'guard', t: 0, shot: false }); }
    }
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
  },
  ball(b) {
    const p = b.parent;
    if (!p || p.dead) { b.dead = true; return; }
    const a = p.oa + b.k * Math.PI, R = p.rad || 88;
    b.x = clamp(p.x + Math.cos(a) * R, X0 + b.r, X1 - b.r); b.y = clamp(p.y + Math.sin(a) * R * 0.85, Y0 + b.r, Y1 - b.r);
    b.vx = b.vy = 0; b.contact = true;
  },
  // Pira Viviente: hoguera con cara que se arrastra hacia el jugador (24). Cada 2–3 s elige entre encender fuegos en el
  // suelo (marca 3 casillas junto al jugador y a los 0,9 s se incendian; los fuegos dañan al tocarlos y se apagan a
  // tiros; nunca más de 8, ni cerca de las puertas), lanzar 3 brasas en arco con marca de caída, o —bajo la mitad
  // de vida— una nova de 12 lágrimas de fuego. Al morir se apagan los fuegos que dejó
  pira(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5, tiles = G.room.tiles;
    if (e.marks) { for (const m of e.marks) m.t -= dt; e.marks = e.marks.filter(m => m.t > 0); }
    if (e.state === 'ignite') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.9 && !e.shot) {
        e.shot = true;
        let live = (e.fires || []).filter(i => tiles[i] === T.FIRE).length;
        for (const m of e.fm) {
          const i = m.r * COLS + m.c;
          if (live >= 8 || tiles[i] !== T.EMPTY || (txOf(p.x) === m.c && tyOf(p.y) === m.r)) continue;
          tiles[i] = T.FIRE; G.room.thp[i] = 0; (e.fires = e.fires || []).push(i); live++;
        }
        e.fm = []; G.flowT = 0; Sfx.play('roar');
      }
      if (e.t > 1.3) { e.state = 'walk'; e.t2 = fast ? rr(1.6, 2.4) : rr(2.2, 3.2); }
      return;
    }
    if (e.state === 'ember') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.5 && !e.shot) {
        e.shot = true;
        for (let i = 0; i < 3; i++) {
          const tx = clamp(p.x + (i ? rr(-80, 80) : 0), X0 + 20, X1 - 20), ty = clamp(p.y + (i ? rr(-60, 60) : 0), Y0 + 20, Y1 - 20);
          const T2 = clamp(dist(e, { x: tx, y: ty }) / 170, 0.9, 1.5) + i * 0.15, g = 420, z0 = 24;
          eTear(e.x, e.y - 24, (tx - e.x) / T2, (ty - e.y) / T2, { vz: (g * T2 * T2 / 2 - z0) / T2, g, z: z0, r: 7, boss: true, color: '#ff9a3a', src: e.name });
          (e.marks = e.marks || []).push({ x: tx, y: ty, t: T2, max: T2 });
        }
        Sfx.play('eshoot');
      }
      if (e.t > 1) { e.state = 'walk'; e.t2 = fast ? rr(1.6, 2.4) : rr(2.2, 3.2); }
      return;
    }
    if (e.state === 'nova') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.6 && !e.shot) {
        e.shot = true;
        const off = Math.random() * TAU;
        for (let i = 0; i < 12; i++) { const a = off + i * TAU / 12; eTear(e.x, e.y - 12, Math.cos(a) * 155, Math.sin(a) * 155, { boss: true, color: '#ff7a30', src: e.name }); }
        G.shake = Math.max(G.shake, 0.2); Sfx.play('roar');
      }
      if (e.t > 1.1) { e.state = 'walk'; e.t2 = rr(1.6, 2.4); }
      return;
    }
    walkTo(e, p.x, p.y, fast ? 34 : 24);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 > 0) return;
    const live = (e.fires || []).filter(i => tiles[i] === T.FIRE).length, r = Math.random();
    if (r < 0.45 && live < 8) {
      const pc = txOf(p.x), pr = tyOf(p.y); e.fm = [];
      for (let k = 0; k < 16 && e.fm.length < (fast ? 4 : 3); k++) {
        const c = pc + ri(-3, 3), rw = pr + ri(-2, 2);
        if (!inGrid(c, rw) || (c === pc && rw === pr) || tiles[rw * COLS + c] !== T.EMPTY || e.fm.some(m => m.c === c && m.r === rw)) continue;
        if (DIRNAMES.some(k2 => Math.abs(c - DIRS[k2].c) + Math.abs(rw - DIRS[k2].r) < 3)) continue;
        e.fm.push({ c, r: rw });
      }
      Object.assign(e, { state: e.fm.length ? 'ignite' : 'ember', t: 0, shot: false }); Sfx.play('charge');
    } else if (fast && r > 0.8) Object.assign(e, { state: 'nova', t: 0, shot: false });
    else Object.assign(e, { state: 'ember', t: 0, shot: false });
  },
  // Coágulo Mayor: rebota por la sala en saltos de 0,75 s hacia el jugador (en el aire no se le puede golpear). Al caer
  // suelta un anillo de lágrimas (6, o 8 bajo la mitad de vida) y deja un charco de sangre. Al bajar de dos tercios y de
  // un tercio de vida se divide: suelta dos coágulos (el enemigo normal)
  coagulo(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    const etapa = e.hp < e.maxHp / 3 ? 2 : e.hp < e.maxHp * 2 / 3 ? 1 : 0;
    if ((e.splits || 0) < etapa && e.state !== 'hop') {
      e.splits = (e.splits || 0) + 1;
      for (const s of [-1, 1]) spawnEnemy('clotty', e.x + s * 44, e.y + 10);
      G.effects.push({ type: 'poof', x: e.x, y: e.y - 8, t: 0, max: 0.5, r: 40 }); Sfx.play('roar');
      Object.assign(e, { state: 'rest', t2: 0.9 });
    }
    if (e.state === 'hop') {
      e.t += dt;
      const k = Math.min(1, e.t / 0.75);
      e.z = Math.sin(k * Math.PI) * 60; e.untargetable = e.z > 22; e.contact = e.z < 14;
      e.vx = e.dirx; e.vy = e.diry;
      if (k >= 1) {
        Object.assign(e, { state: 'rest', z: 0, vx: 0, vy: 0, untargetable: false, contact: true, flying: false, t2: fast ? 0.5 : 0.8 });
        const n = fast ? 8 : 6, off = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y - 8, Math.cos(a) * 130, Math.sin(a) * 130, { boss: true, color: '#b01820', src: e.name }); }
        if (G.creeps.length < 40) G.creeps.push({ x: e.x, y: e.y + 10, r: 32, t: 6, max: 6, col: '#a01820', src: e.name });
        G.shake = Math.max(G.shake, 0.25); Sfx.play('land');
      }
      return;
    }
    e.vx = e.vy = 0; e.t2 -= dt;
    if (e.t2 <= 0) {
      const d = Math.min(dist(e, p), 190), a = Math.atan2(p.y - e.y, p.x - e.x);
      Object.assign(e, { state: 'hop', t: 0, flying: true, dirx: Math.cos(a) * d / 0.75, diry: Math.sin(a) * d / 0.75 });
      Sfx.play('jump');
    }
  },
  // Placenta: órgano que apenas se mueve (14, o 20 bajo la mitad de vida). Cada 2,6–3,4 s late: tras 0,7 s de aviso suelta
  // un anillo de 14 lágrimas y, 0,5 s después, otro girado. Cada 8–11 s llama a una pareja de gemelos (nunca más de 4,
  // que se funden si se tocan). Bajo la mitad de vida, el 40 % de las veces en vez de latir gira una espiral de tres brazos
  // durante 2,2 s
  placenta(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    e.t3 = (e.t3 === undefined ? rr(3, 5) : e.t3) - dt;
    if (e.t3 <= 0) {
      e.t3 = fast ? rr(6, 8) : rr(8, 11);
      if (countAlive(x => x.type === 'merger') < 4) {
        for (const s of [-1, 1]) spawnEnemy('merger', e.x + s * 42, e.y + 12);
        G.effects.push({ type: 'poof', x: e.x, y: e.y - 6, t: 0, max: 0.45, r: 36 }); Sfx.play('burp');
      }
    }
    const ring = off => { for (let i = 0; i < 14; i++) { const a = off + i * TAU / 14; eTear(e.x, e.y - 10, Math.cos(a) * 110, Math.sin(a) * 110, { boss: true, color: '#c8505a', src: e.name }); } };
    if (e.state === 'pulse') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.shot === 0 && e.t > 0.7) { e.shot = 1; e.off = Math.random() * TAU; ring(e.off); Sfx.play('roar'); G.shake = Math.max(G.shake, 0.15); }
      else if (e.shot === 1 && e.t > 1.2) { e.shot = 2; ring(e.off + TAU / 28); Sfx.play('roar'); }
      if (e.t > 1.6) { e.state = 'drift'; e.t2 = fast ? rr(1.6, 2.4) : rr(2.6, 3.4); }
      return;
    }
    if (e.state === 'spiral') {
      e.vx = e.vy = 0; e.t += dt; e.st -= dt; e.sa += dt * 2.2;
      if (e.st <= 0 && G.etears.length < 140) {
        e.st = 0.12;
        for (let k = 0; k < 3; k++) { const a = e.sa + k * TAU / 3; eTear(e.x, e.y - 10, Math.cos(a) * 120, Math.sin(a) * 120, { boss: true, color: '#c8505a', src: e.name }); }
      }
      if (e.t > 2.2) { e.state = 'drift'; e.t2 = rr(1.8, 2.6); }
      return;
    }
    walkTo(e, p.x, p.y, fast ? 20 : 14);
    e.t2 -= dt;
    if (e.t2 <= 0) {
      if (fast && Math.random() < 0.4) Object.assign(e, { state: 'spiral', t: 0, st: 0, sa: Math.random() * TAU });
      else Object.assign(e, { state: 'pulse', t: 0, shot: 0 });
      Sfx.play('charge');
    }
  },
  // ----- Mini-jefes (bajo la mitad de vida pasan a "fase 2": más rápidos y con ataques más amplios) -----
  // Moscardón: vuela rebotando en diagonal (70, o 98) y cada 2,8–3,6 s dispara un abanico de 3 lágrimas (5 en fase 2);
  // la mitad de las veces además llama a dos moscas furiosas (nunca más de 4)
  mfly(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5, sp = fast ? 98 : 70;
    if (!e.dirx) { e.dirx = 0.82; e.diry = 0.57; }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    e.vx = e.dirx * sp; e.vy = e.diry * sp;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.t2 = rr(2.8, 3.6);
      const a = angTo(e, p), n = fast ? 5 : 3;
      for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.22; eTear(e.x, e.y - 8, Math.cos(a + o) * 175, Math.sin(a + o) * 175, { src: e.name }); }
      Sfx.play('eshoot'); e.shoot = 0.3;
      if (Math.random() < 0.5 && countAlive(x => x.type === 'afly') < 4) for (let i = 0; i < 2; i++) spawnEnemy('afly', e.x + (i ? 14 : -14), e.y);
    }
    if (e.shoot > 0) e.shoot -= dt;
  },
  // Gólem menor: camina hacia el jugador (34, o 44); si se acerca a menos de 100 px pisa tras 0,6 s de aviso y suelta un
  // anillo de 8 lágrimas (12 en fase 2); cada 3 s lanza un peñasco en arco al jugador con marca de caída (2 en fase 2)
  mgolem(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.marks) { for (const m of e.marks) m.t -= dt; e.marks = e.marks.filter(m => m.t > 0); }
    e.t3 = (e.t3 || 0) - dt;
    if (e.state === 'stomp') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.6 && !e.shot) {
        e.shot = true;
        const n = fast ? 12 : 8, off = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y - 6, Math.cos(a) * 130, Math.sin(a) * 130, { color: '#8a8a82', src: e.name }); }
        G.shake = Math.max(G.shake, 0.2); Sfx.play('land');
      }
      if (e.t > 1) { e.state = 0; e.t3 = 2.5; }
      return;
    }
    walkTo(e, p.x, p.y, fast ? 44 : 34);
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (dist(e, p) < 100 && e.t3 <= 0) { Object.assign(e, { state: 'stomp', t: 0, shot: false }); Sfx.play('charge'); return; }
    if (e.t2 <= 0) {
      e.t2 = rr(2.6, 3.4);
      for (let i = 0; i < (fast ? 2 : 1); i++) {
        const tx = clamp(p.x + (i ? rr(-70, 70) : 0), X0 + 20, X1 - 20), ty = clamp(p.y + (i ? rr(-50, 50) : 0), Y0 + 20, Y1 - 20);
        const T2 = clamp(dist(e, { x: tx, y: ty }) / 170, 0.9, 1.5) + i * 0.2, g = 420, z0 = 24;
        eTear(e.x, e.y - 20, (tx - e.x) / T2, (ty - e.y) / T2, { vz: (g * T2 * T2 / 2 - z0) / T2, g, z: z0, r: 8, color: '#8a8a82', src: e.name });
        (e.marks = e.marks || []).push({ x: tx, y: ty, t: T2, max: T2 });
      }
      Sfx.play('eshoot');
    }
  },
  // Chamán: aparece, lanza un anillo de 8 lágrimas (12 en fase 2) a los 0,7 s, se desvanece a los 1,6 s y reaparece 0,8 s
  // después a 120 px o más del jugador; desvanecido no se le puede dañar. En fase 2 el anillo se repite a los 1,2 s
  mshaman(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    e.vx = e.vy = 0;
    if (e.state === 'gone') {
      Object.assign(e, { invisible: true, untargetable: true, contact: false }); e.t2 -= dt;
      if (e.t2 > 0) return;
      for (let i = 0; i < 14; i++) {
        const c = ri(1, COLS - 2), r = ri(1, ROWS - 2);
        if (G.room.tiles[r * COLS + c] !== T.EMPTY || Math.hypot(tcx(c) - p.x, tcy(r) - p.y) < 120) continue;
        e.x = tcx(c); e.y = tcy(r); break;
      }
      Object.assign(e, { state: 0, invisible: false, untargetable: false, contact: true, t: 0, shot: 0 });
      G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 18 });
      return;
    }
    e.t += dt;
    const ring = n => { const off = Math.random() * TAU; for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y - 10, Math.cos(a) * 140, Math.sin(a) * 140, { color: '#58c8b8', src: e.name }); } Sfx.play('eshoot'); e.shoot = 0.3; };
    if (e.shot === 0 && e.t > 0.7) { e.shot = 1; ring(fast ? 12 : 8); }
    if (fast && e.shot === 1 && e.t > 1.2) { e.shot = 2; ring(12); }
    if (e.shoot > 0) e.shoot -= dt;
    if (e.t > 1.6) { G.effects.push({ type: 'poof', x: e.x, y: e.y, t: 0, max: 0.4, r: 18 }); Object.assign(e, { state: 'gone', t2: 0.8 }); }
  },
  // Cangrejo: se desplaza de lado para alinearse con el jugador en un eje, avisa 0,65 s (0,45 en fase 2) y embiste en
  // línea recta (300, o 340) hasta chocar con un muro u obstáculo; al chocar queda aturdido 1,4 s, inofensivo y expuesto
  mcrab(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5, dx = p.x - e.x, dy = p.y - e.y;
    e.t += dt;
    if (e.state === 'dash') {
      const sp = fast ? 340 : 300;
      e.vx = e.dirx * sp; e.vy = e.diry * sp; e.contact = true;
      if (e.hit) { Object.assign(e, { state: 'stun', t: 0, vx: 0, vy: 0, contact: false }); G.shake = Math.max(G.shake, 0.2); Sfx.play('land'); }
      else if (e.t > 1.3) Object.assign(e, { state: 'walk', t: 0, t2: rr(0.8, 1.4) });
      return;
    }
    if (e.state === 'stun') {
      e.vx = e.vy = 0; e.contact = false;
      if (e.t > 1.4) Object.assign(e, { state: 'walk', t: 0, t2: rr(0.8, 1.4), contact: true });
      return;
    }
    if (e.state === 'windup') {
      e.vx = e.vy = 0;
      if (e.t > (fast ? 0.45 : 0.65)) {
        const horiz = Math.abs(dx) > Math.abs(dy);
        Object.assign(e, { state: 'dash', t: 0, dirx: horiz ? Math.sign(dx) || 1 : 0, diry: horiz ? 0 : Math.sign(dy) || 1 });
        Sfx.play('charge');
      }
      return;
    }
    // desplazamiento lateral: reduce la menor de las dos distancias para quedar alineado en un eje
    if (Math.abs(dx) < Math.abs(dy)) { e.vx = Math.sign(dx) * 70; e.vy = 0; } else { e.vy = Math.sign(dy) * 70; e.vx = 0; }
    if (Math.abs(e.vx) > 5) e.face = e.vx < 0 ? -1 : 1;
    e.t2 -= dt;
    if (e.t2 <= 0 && (Math.min(Math.abs(dx), Math.abs(dy)) < 24 || e.t2 < -1.5)) Object.assign(e, { state: 'windup', t: 0 });
  },
  gusano(e, dt) {
    const sp = e.hp < e.maxHp * 0.5 ? 150 : 115;
    e.t2 -= dt;
    if (e.hit || e.t2 <= 0) {
      const p = G.player;
      let ch;
      if (Math.random() < 0.6) ch = e.dir.x ? [0, Math.sign(p.y - e.y) || 1] : [Math.sign(p.x - e.x) || 1, 0];
      else ch = pick(e.dir.x ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]);
      // evita girar contra el muro
      const nx = e.x + ch[0] * (e.r + 6), ny = e.y + ch[1] * (e.r + 6);
      if (nx < X0 + e.r || nx > X1 - e.r || ny < Y0 + e.r || ny > Y1 - e.r) { ch[0] = -ch[0]; ch[1] = -ch[1]; }
      e.dir = { x: ch[0], y: ch[1] }; e.t2 = rr(0.8, 1.6);
    }
    e.vx = e.dir.x * sp; e.vy = e.dir.y * sp;
    e.hist.unshift({ x: e.x, y: e.y });
    const spacing = 12, maxLen = spacing * (e.segs.length + 1) + 2;
    if (e.hist.length > maxLen) e.hist.length = maxLen;
    e.segs.forEach((s, i) => { const h = e.hist[Math.min(e.hist.length - 1, (i + 1) * spacing)]; s.x = h.x; s.y = h.y; });
    // Fase 2 (bajo el 50 % de vida): ya iba a 150 en vez de 115; además la cola dispara cada 1,2–2 s en 8 direcciones
    // en vez de cada 2,5–4 s en 4
    const fast = e.hp < e.maxHp * 0.5;
    e.t3 = (e.t3 || 2) - dt;
    if (e.t3 <= 0) {
      e.t3 = fast ? rr(1.2, 2) : rr(2.5, 4);
      const tail = e.segs[e.segs.length - 1];
      if (tail && !tail.dead) for (const d of fast ? [...N4, ...DIAG] : N4) eTear(tail.x, tail.y, d[0] * 140, d[1] * 140, { boss: true, src: e.name });
    }
  },
  masa(e, dt) {
    e.vx = e.vy = 0; e.t2 -= dt;
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.t2 <= 0) {
      const r = Math.random(); e.mouth = 0.5;
      if (r < 0.35) {
        const a = angTo(e, p), h = fast ? 3 : 2;   // fase 2: abanico de 7 lágrimas en vez de 5
        for (let i = -h; i <= h; i++) eTear(e.x, e.y + 10, Math.cos(a + i * 0.18) * 190, Math.sin(a + i * 0.18) * 190, { boss: true, src: e.name });
        Sfx.play('spit');
      } else if (r < 0.65) {
        const off = Math.random() * TAU, n = fast ? 14 : 10;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, { boss: true, src: e.name }); }
        Sfx.play('spit');
      } else if (r < 0.85 && countAlive(x => !x.boss) < 4) {
        for (let i = 0; i < (fast ? 3 : 2); i++) spawnEnemy('pooter', e.x + (i - (fast ? 1 : 0.5)) * 50, e.y + 20);   // fase 2: 3 escupemoscas
        Sfx.play('burp');
      } else {
        for (let i = 0; i < 9; i++) {
          const a = angTo(e, p) + rr(-0.9, 0.9), sp = rr(80, 210);
          eTear(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, { boss: true, z: 30, vz: rr(150, 260), g: 400, src: e.name });
        }
        Sfx.play('spit');
      }
      e.t2 = fast ? rr(0.9, 1.4) : rr(1.3, 2.0);
    }
    if (e.mouth > 0) e.mouth -= dt;
  },
  llorona(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.state === 'cry') {
      e.vx = e.vy = 0; e.t += dt;
      if (e.t > 0.4 && !e.shot) {
        e.shot = true;
        const n = fast ? 12 : 8, off = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y - 10, Math.cos(a) * 160, Math.sin(a) * 160, { boss: true, color: '#e8d24a', src: e.name }); }
        Sfx.play('spit');
      }
      if (e.t > 0.9) { e.state = 'walk'; e.t2 = rr(1.6, 2.6); }
      return;
    }
    walkTo(e, p.x, p.y, fast ? 60 : 45);
    e.t3 = (e.t3 || 0) - dt;
    if (e.t3 <= 0 && G.creeps.length < 40) { e.t3 = fast ? 0.3 : 0.45; G.creeps.push({ x: e.x + rr(-8, 8), y: e.y + 10, r: rr(16, 22), t: 5, max: 5, src: e.name }); }   // fase 2: más charcos
    e.t2 -= dt;
    if (e.t2 <= 0) {
      if (Math.random() < 0.6) { e.state = 'cry'; e.t = 0; e.shot = false; }
      else {
        const a = angTo(e, p);
        for (const o of fast ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.2, 0, 0.2]) eTear(e.x, e.y - 10, Math.cos(a + o) * 210, Math.sin(a + o) * 210, { boss: true, color: '#e8d24a', src: e.name });   // fase 2: abanico de 5
        Sfx.play('eshoot'); e.t2 = rr(1.2, 2);
      }
    }
  },
  mama(e, dt) {
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    e.vx = e.vy = 0;
    if (e.busy) {
      if (e.part && !e.part.dead) return;
      e.busy = false; e.part = null; e.t2 = fast ? rr(0.35, 0.7) : rr(0.8, 1.3);
    }
    e.t2 -= dt;
    if (e.t2 > 0) return;
    const r = Math.random();
    if (r < 0.55) {
      const f = makeEnemy('foot', p.x, p.y, { spawnT: 0 });
      Object.assign(f, { parent: e, boss: true, ignoreClear: true, kb: 0, r: 36, noCollide: true, flying: true, state: 'shadow', t: 0, z: 600, contact: false, untargetable: true, name: e.name });
      G.enemies.push(f); e.part = f; e.busy = true;
    } else if (r < 0.85) {
      const side = pick(DIRNAMES), D = DIRS[side];
      const ey = makeEnemy('eye', D.x - D.dx * 4, D.y - D.dy * 4, { spawnT: 0 });
      Object.assign(ey, { parent: e, boss: true, ignoreClear: true, kb: 0, r: 20, noCollide: true, side, t: 0, name: e.name });
      G.enemies.push(ey); e.part = ey; e.busy = true;
    } else {
      if (countAlive(x => !x.boss) < 4) {
        const D = DIRS[pick(DIRNAMES)];
        for (let i = 0; i < 2; i++) spawnEnemy(pick(['gaper', 'afly', 'hopper', 'spider']), D.x - D.dx * 50 + rr(-20, 20), D.y - D.dy * 50 + rr(-20, 20));
        G.effects.push({ type: 'poof', x: D.x - D.dx * 50, y: D.y - D.dy * 50, t: 0, max: 0.5, r: 24 });
        Sfx.play('roar');
      }
      e.t2 = 1.0;
    }
  },
  foot(e, dt) {
    const p = G.player;
    e.t += dt;
    if (e.state === 'shadow') {
      const k = Math.min(1, e.t / 1.0);
      if (e.t < 0.75) { e.x = lerp(e.x, p.x, Math.min(1, dt * 6)); e.y = lerp(e.y, p.y, Math.min(1, dt * 6)); }
      e.x = clamp(e.x, X0 + 30, X1 - 30); e.y = clamp(e.y, Y0 + 30, Y1 - 30);
      e.z = k < 0.8 ? 600 : 600 * (1 - (k - 0.8) / 0.2);
      if (k >= 1) {
        e.state = 'down'; e.t = 0; e.z = 0; e.contact = true; e.untargetable = false;
        G.shake = 0.4; Sfx.play('boom2');
        if (dist(e, p) < e.r + p.r) hurtPlayer(2, 'Mamá');
        if (e.parent.hp < e.parent.maxHp * 0.5) for (let i = 0; i < 8; i++) { const a = i * TAU / 8; eTear(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, { boss: true, src: 'Mamá' }); }
      }
    } else if (e.state === 'down') {
      if (e.t > 0.9) { e.state = 'up'; e.t = 0; e.contact = false; e.untargetable = true; }
    } else if (e.state === 'up') {
      e.z = e.t * 1500;
      if (e.t > 0.35) e.dead = true;
    }
  },
  eye(e, dt) {
    const p = G.player;
    e.t += dt;
    if ((e.t > 0.7 && !e.s1) || (e.t > 1.6 && !e.s2)) {
      if (!e.s1) e.s1 = true; else e.s2 = true;
      const a = angTo(e, p);
      for (const o of [-0.22, 0, 0.22]) eTear(e.x, e.y, Math.cos(a + o) * 190, Math.sin(a + o) * 190, { boss: true, src: 'Mamá' });
      Sfx.play('eshoot');
    }
    if (e.t > 2.4) e.dead = true;
  },
  corazon(e, dt) {
    e.vx = e.vy = 0;
    const p = G.player, ph = e.hp < e.maxHp * 0.5 ? 2 : 1;
    e.beat = (e.beat || 0) + dt * (ph === 2 ? 2.4 : 1.6);
    if (e.spiral > 0) {
      e.spiral -= dt; e.st = (e.st || 0) - dt;
      if (e.st <= 0) {
        e.st = 0.09; e.sa = (e.sa || 0) + 0.33;
        for (let k = 0; k < ph + 1; k++) { const a = e.sa + k * TAU / (ph + 1); eTear(e.x, e.y, Math.cos(a) * 140, Math.sin(a) * 140, { boss: true, src: e.name }); }
      }
      return;
    }
    e.t2 -= dt;
    if (e.t2 <= 0) {
      const r = Math.random();
      if (r < 0.3) {
        const n = ph === 2 ? 16 : 12, off = Math.random() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, { boss: true, src: e.name }); }
        Sfx.play('spit'); e.t2 = rr(1.0, 1.6) / ph;
      } else if (r < 0.55) { e.spiral = 2.2; e.t2 = 0.8; Sfx.play('roar'); }
      else if (r < 0.8) { e.burst = 3; e.bt = 0; e.t2 = 1.3; }
      else {
        if (countAlive(x => !x.boss) < 4) {
          for (let i = 0; i < 2; i++) spawnEnemy(pick(['globin', 'afly', 'leaper']), e.x + rr(-60, 60), e.y + rr(50, 80));
          Sfx.play('roar');
        }
        e.t2 = 1.2;
      }
    }
    if (e.burst > 0) {
      e.bt -= dt;
      if (e.bt <= 0) {
        e.bt = 0.25; e.burst--;
        const a = angTo(e, p);
        for (const o of [-0.3, -0.15, 0, 0.15, 0.3]) eTear(e.x, e.y, Math.cos(a + o) * 200, Math.sin(a + o) * 200, { boss: true, src: e.name });
        Sfx.play('eshoot');
      }
    }
  },
};

