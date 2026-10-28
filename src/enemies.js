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

  // ----- Jefes -----
  gloton(e, dt) {
    const p = G.player;
    e.vx = e.vy = 0;
    switch (e.state) {
      case 'idle':
        e.t2 -= dt; e.z = 0; e.contact = true; e.untargetable = false;
        if (e.t2 <= 0) {
          const r = Math.random();
          if (r < 0.45) {
            e.state = 'hop'; e.t = 0;
            const d = Math.min(dist(e, p), 110), a = angTo(e, p);
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
        if (k >= 1) { e.state = 'idle'; e.z = 0; e.t2 = rr(0.25, 0.6); G.shake = Math.max(G.shake, 0.08); Sfx.play('land'); }
        break;
      }
      case 'spit':
        e.t += dt;
        if (e.t > 0.45 && !e.shot) {
          e.shot = true;
          const a = angTo(e, p);
          for (let i = 0; i < 13; i++) {
            const aa = a + rr(-0.45, 0.45), sp = rr(130, 260);
            eTear(e.x, e.y - 10, Math.cos(aa) * sp, Math.sin(aa) * sp, { boss: true, z: 20, vz: rr(60, 200), g: 380, life: 4, src: e.name });
          }
          Sfx.play('spit');
        }
        if (e.t > 1.0) { e.state = 'idle'; e.t2 = rr(0.4, 0.9); }
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
          for (let i = 0; i < 10; i++) { const aa = i * TAU / 10; eTear(e.x, e.y, Math.cos(aa) * 170, Math.sin(aa) * 170, { boss: true, src: e.name }); }
          e.state = 'idle'; e.t2 = 0.9;
        }
        break;
    }
  },
  zumbido(e, dt) {
    if (!e.dirx) { e.dirx = 45; e.diry = 35; }
    if (e.hit) { if (e.hit.hx) e.dirx *= -1; if (e.hit.hy) e.diry *= -1; }
    e.vx = e.dirx; e.vy = e.diry;
    e.t2 -= dt;
    if (e.t2 <= 0) {
      const mine = G.enemies.filter(f => !f.dead && f.orbit === e);
      const total = countAlive(f => f.type === 'afly' || f.type === 'fly');
      if (mine.length >= 3 || (total >= 8 && mine.length)) { for (const f of mine) f.orbit = null; Sfx.play('roar'); }
      else if (total < 10) {
        for (let i = 0; i < 3; i++) {
          const f = makeEnemy('afly', e.x, e.y, { spawnT: 0.05 });
          f.orbit = e; f.oa = i * TAU / 3 + Math.random(); f.orad = e.r + 22;
          G.enemies.push(f);
        }
        Sfx.play('burp');
      }
      e.burp = 0.4; e.t2 = e.hp < e.maxHp * 0.5 ? rr(1.6, 2.4) : rr(2.2, 3.2);
    }
    if (e.burp > 0) e.burp -= dt;
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
    e.t3 = (e.t3 || 2) - dt;
    if (e.t3 <= 0) {
      e.t3 = rr(2.5, 4);
      const tail = e.segs[e.segs.length - 1];
      if (tail && !tail.dead) for (const d of N4) eTear(tail.x, tail.y, d[0] * 140, d[1] * 140, { boss: true, src: e.name });
    }
  },
  masa(e, dt) {
    e.vx = e.vy = 0; e.t2 -= dt;
    const p = G.player, fast = e.hp < e.maxHp * 0.5;
    if (e.t2 <= 0) {
      const r = Math.random(); e.mouth = 0.5;
      if (r < 0.35) {
        const a = angTo(e, p);
        for (let i = -2; i <= 2; i++) eTear(e.x, e.y + 10, Math.cos(a + i * 0.18) * 190, Math.sin(a + i * 0.18) * 190, { boss: true, src: e.name });
        Sfx.play('spit');
      } else if (r < 0.65) {
        const off = Math.random() * TAU, n = fast ? 14 : 10;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; eTear(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, { boss: true, src: e.name }); }
        Sfx.play('spit');
      } else if (r < 0.85 && countAlive(x => !x.boss) < 4) {
        for (let i = 0; i < 2; i++) spawnEnemy('pooter', e.x + (i ? 50 : -50), e.y + 20);
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
    if (e.t3 <= 0 && G.creeps.length < 40) { e.t3 = 0.45; G.creeps.push({ x: e.x + rr(-8, 8), y: e.y + 10, r: rr(16, 22), t: 5, max: 5, src: e.name }); }
    e.t2 -= dt;
    if (e.t2 <= 0) {
      if (Math.random() < 0.6) { e.state = 'cry'; e.t = 0; e.shot = false; }
      else {
        const a = angTo(e, p);
        for (const o of [-0.2, 0, 0.2]) eTear(e.x, e.y - 10, Math.cos(a + o) * 210, Math.sin(a + o) * 210, { boss: true, color: '#e8d24a', src: e.name });
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

