'use strict';
/* =========================================================
   Entrada: teclado, pantalla táctil (doble joystick) y mando
   ========================================================= */
const KEYMAP = {
  KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right',
  ArrowUp: 'fup', ArrowDown: 'fdown', ArrowLeft: 'fleft', ArrowRight: 'fright',
  KeyE: 'bomb', Space: 'active', KeyQ: 'pill', KeyP: 'pause', Escape: 'pause',
  KeyM: 'mute', Enter: 'confirm', NumpadEnter: 'confirm', KeyR: 'restart',
  KeyT: 'cheats', Backquote: 'cheats', KeyF: 'swap', ControlLeft: 'swap',
};
const FIRE_KEYS = { fup: [0, -1], fdown: [0, 1], fleft: [-1, 0], fright: [1, 0] };
const STICK_R = 52;

const Input = {
  keys: new Set(), fireOrder: [], edges: new Set(),
  move: { x: 0, y: 0 }, fire: { x: 0, y: 0 }, fireVec: { x: 0, y: 0 }, lastDir: { x: 0, y: 1 },
  touchMode: false, sticksEnabled: false,
  sticks: { move: null, fire: null },
  buttons: [], btnTouches: new Map(),
  taps: [], gpPrev: [], gpFire: null,

  init(el) {
    window.addEventListener('keydown', e => {
      Sfx.init();
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      this.touchMode = false;
      if (!e.repeat) this.edges.add(a);
      this.keys.add(a);
      if (FIRE_KEYS[a]) { this.fireOrder = this.fireOrder.filter(k => k !== a); this.fireOrder.push(a); }
    });
    window.addEventListener('keyup', e => {
      const a = KEYMAP[e.code];
      if (!a) return;
      this.keys.delete(a);
      this.fireOrder = this.fireOrder.filter(k => k !== a);
    });
    window.addEventListener('blur', () => { this.keys.clear(); this.fireOrder = []; this.sticks.move = this.sticks.fire = null; });

    const opt = { passive: false };
    el.addEventListener('touchstart', e => { e.preventDefault(); Sfx.init(); for (const t of e.changedTouches) this.tStart(t); }, opt);
    el.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) this.tMove(t); }, opt);
    const end = e => { e.preventDefault(); Sfx.resume(); for (const t of e.changedTouches) this.tEnd(t); };
    el.addEventListener('touchend', end, opt);
    el.addEventListener('touchcancel', end, opt);
    el.addEventListener('mousedown', e => {
      Sfx.init();
      try { el.focus({ preventScroll: true }); } catch (err) { /* sin foco */ }
      for (const b of this.buttons) {
        if (Math.hypot(e.clientX - b.x, e.clientY - b.y) < b.r) { this.edges.add(b.id); return; }
      }
      this.taps.push({ x: e.clientX, y: e.clientY });
    });
    el.addEventListener('contextmenu', e => e.preventDefault());
  },

  tStart(t) {
    const x = t.clientX, y = t.clientY;
    this.touchMode = true;
    for (const b of this.buttons) {
      if (Math.hypot(x - b.x, y - b.y) < b.r * 1.2) {
        this.edges.add(b.id); this.btnTouches.set(t.identifier, b.id); return;
      }
    }
    this.taps.push({ x, y });
    if (!this.sticksEnabled) return;
    const s = { id: t.identifier, ox: x, oy: y, x, y };
    if (x < window.innerWidth / 2) { if (!this.sticks.move) this.sticks.move = s; }
    else if (!this.sticks.fire) this.sticks.fire = s;
  },
  tMove(t) {
    for (const k of ['move', 'fire']) {
      const s = this.sticks[k];
      if (!s || s.id !== t.identifier) continue;
      s.x = t.clientX; s.y = t.clientY;
      const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), max = STICK_R * 1.25;
      if (d > max) { s.ox = s.x - dx / d * max; s.oy = s.y - dy / d * max; }   // el joystick sigue al dedo
    }
  },
  tEnd(t) {
    this.btnTouches.delete(t.identifier);
    for (const k of ['move', 'fire']) if (this.sticks[k] && this.sticks[k].id === t.identifier) this.sticks[k] = null;
  },

  take(a) { if (this.edges.has(a)) { this.edges.delete(a); return true; } return false; },
  any() { for (const a of ['confirm', 'active', 'bomb', 'pill', 'fire_any']) if (this.edges.has(a)) return true; return false; },
  clearEdges() { this.edges.clear(); this.taps.length = 0; },
  btnHeld(id) { for (const v of this.btnTouches.values()) if (v === id) return true; return false; },

  update() {
    let mx = 0, my = 0;
    if (this.keys.has('up')) my -= 1;
    if (this.keys.has('down')) my += 1;
    if (this.keys.has('left')) mx -= 1;
    if (this.keys.has('right')) mx += 1;
    let fx = 0, fy = 0, vx = 0, vy = 0;
    const last = this.fireOrder[this.fireOrder.length - 1];
    if (last) { fx = FIRE_KEYS[last][0]; fy = FIRE_KEYS[last][1]; }
    for (const k of this.fireOrder) { vx += FIRE_KEYS[k][0]; vy += FIRE_KEYS[k][1]; }

    const sm = this.sticks.move;
    if (sm) {
      let dx = (sm.x - sm.ox) / STICK_R, dy = (sm.y - sm.oy) / STICK_R;
      const l = Math.hypot(dx, dy);
      if (l < 0.15) { dx = dy = 0; } else if (l > 1) { dx /= l; dy /= l; }
      mx = dx; my = dy;
    }
    const sf = this.sticks.fire;
    if (sf) {
      const dx = sf.x - sf.ox, dy = sf.y - sf.oy;
      if (Math.hypot(dx, dy) > 14) {
        if (Math.abs(dx) > Math.abs(dy)) { fx = Math.sign(dx); fy = 0; } else { fx = 0; fy = Math.sign(dy); }
        vx = dx; vy = dy;
      }
    }
    this.pollGamepad(v => { mx = v.mx; my = v.my; }, v => { fx = v.fx; fy = v.fy; vx = v.vx || v.fx; vy = v.vy || v.fy; });

    const l = Math.hypot(mx, my);
    if (l > 1) { mx /= l; my /= l; }
    this.move.x = mx; this.move.y = my;
    if ((fx || fy) && !(this.fire.x || this.fire.y)) this.edges.add('fire_any');
    this.fire.x = fx; this.fire.y = fy;
    if (!fx && !fy) { vx = 0; vy = 0; }
    this.fireVec.x = vx; this.fireVec.y = vy;
  },

  pollGamepad(setMove, setFire) {
    if (!navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const ax = gp.axes, b = gp.buttons;
      const pr = i => !!(b[i] && b[i].pressed);
      let mx = ax[0] || 0, my = ax[1] || 0;
      if (pr(12)) my = -1; if (pr(13)) my = 1; if (pr(14)) mx = -1; if (pr(15)) mx = 1;
      if (Math.hypot(mx, my) > 0.2) { setMove({ mx, my }); this.touchMode = false; }
      let fx = 0, fy = 0;
      const rx = ax[2] || 0, ry = ax[3] || 0;
      if (Math.hypot(rx, ry) > 0.45) { if (Math.abs(rx) > Math.abs(ry)) fx = Math.sign(rx); else fy = Math.sign(ry); }
      if (pr(3)) fy = -1; else if (pr(0)) fy = 1; else if (pr(2)) fx = -1; else if (pr(1)) fx = 1;
      if (fx || fy) setFire({ fx, fy, vx: Math.hypot(rx, ry) > 0.45 ? rx : fx, vy: Math.hypot(rx, ry) > 0.45 ? ry : fy });
      const map = { 4: 'bomb', 5: 'active', 6: 'pill', 7: 'swap', 9: 'pause', 8: 'mute' };
      for (const i in map) {
        const now = pr(+i);
        if (now && !this.gpPrev[i]) this.edges.add(map[i]);
        this.gpPrev[i] = now;
      }
      // A/Start también sirven para confirmar en menús
      if (pr(0) && !this.gpPrev.a) this.edges.add('confirm');
      this.gpPrev.a = pr(0);
      const dy = my < -0.6 ? -1 : my > 0.6 ? 1 : 0, dx = mx < -0.6 ? -1 : mx > 0.6 ? 1 : 0;
      if (dy !== (this.gpPrev.dy || 0) && dy) this.edges.add(dy < 0 ? 'up' : 'down');
      if (dx !== (this.gpPrev.dx || 0) && dx) this.edges.add(dx < 0 ? 'left' : 'right');
      this.gpPrev.dy = dy; this.gpPrev.dx = dx;
      break;
    }
  },
};
