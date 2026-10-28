'use strict';
/* =========================================================
   Sonido sintetizado con Web Audio (sin archivos externos)
   ========================================================= */
const Sfx = {
  ctx: null, master: null, sfx: null, mus: null, noiseBuf: null,
  muted: false, musicOn: true, last: {},
  music: { mode: null, step: 0, next: 0, timer: null },

  init() {
    if (this.ctx) { this.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.75; this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = this.musicOn ? 0.32 : 0; this.mus.connect(this.master);
      const len = this.ctx.sampleRate | 0;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.resume();
    } catch (e) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.9; },
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.value = on ? 0.32 : 0; },

  tone(f, dur, type = 'sine', vol = 0.2, f2 = 0, delay = 0, dest = null) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + Math.max(0, delay);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, vol = 0.2, freq = 1000, type = 'lowpass', delay = 0, f2 = 0, dest = null) {
    const c = this.ctx; if (!c || !this.noiseBuf) return;
    const t = c.currentTime + Math.max(0, delay);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  },

  play(n) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (this.last[n] && now - this.last[n] < 0.035) return;
    this.last[n] = now;
    switch (n) {
      case 'tear': this.tone(rr(480, 560), 0.07, 'sine', 0.09, 300); this.noise(0.04, 0.03, 3000, 'highpass'); break;
      case 'splash': this.noise(0.07, 0.05, 1800, 'bandpass'); break;
      case 'tink': this.tone(1400, 0.06, 'triangle', 0.06, 900); break;
      case 'hit': this.tone(rr(180, 230), 0.06, 'square', 0.04, 110); this.noise(0.05, 0.05, 900); break;
      case 'kill': this.noise(0.22, 0.22, 900, 'lowpass', 0, 200); this.tone(160, 0.18, 'sine', 0.15, 50); break;
      case 'hurt': this.tone(330, 0.28, 'sawtooth', 0.11, 130); this.noise(0.15, 0.12, 700); break;
      case 'door': this.noise(0.3, 0.2, 500, 'lowpass', 0, 120); this.tone(85, 0.2, 'square', 0.05, 60); break;
      case 'doorclose': this.noise(0.25, 0.25, 400, 'lowpass', 0, 90); this.tone(70, 0.25, 'square', 0.06, 45); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.06); this.tone(1319, 0.2, 'square', 0.06, 0, 0.07); break;
      case 'heart': this.tone(440, 0.12, 'sine', 0.15, 660); this.tone(660, 0.16, 'sine', 0.12, 880, 0.08); break;
      case 'key': this.tone(1200, 0.06, 'triangle', 0.1); this.tone(1600, 0.12, 'triangle', 0.1, 0, 0.06); break;
      case 'pickup': this.tone(600, 0.08, 'triangle', 0.1, 900); break;
      case 'bombput': this.tone(300, 0.05, 'square', 0.05); this.noise(0.05, 0.05, 2500, 'highpass'); break;
      case 'boom': this.noise(0.7, 0.55, 700, 'lowpass', 0, 60); this.tone(90, 0.5, 'sine', 0.4, 25); break;
      case 'boom2': this.noise(0.45, 0.4, 400, 'lowpass', 0, 50); this.tone(70, 0.4, 'sine', 0.35, 25); break;
      case 'item': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, 0, i * 0.08)); this.tone(262, 0.6, 'sine', 0.1, 0, 0.32); break;
      case 'pill': this.tone(300, 0.3, 'sine', 0.12, 900); break;
      case 'active': this.tone(200, 0.25, 'square', 0.06, 800); this.noise(0.2, 0.08, 2000, 'bandpass'); break;
      case 'charged': this.tone(880, 0.08, 'square', 0.05); this.tone(1175, 0.15, 'square', 0.05, 0, 0.08); break;
      case 'nope': this.tone(150, 0.12, 'square', 0.05, 110); break;
      case 'eshoot': this.tone(260, 0.1, 'sine', 0.08, 160); break;
      case 'spit': this.noise(0.25, 0.18, 600, 'bandpass', 0, 200); this.tone(140, 0.2, 'sawtooth', 0.05, 70); break;
      case 'burp': this.tone(110, 0.3, 'sawtooth', 0.08, 60); this.noise(0.25, 0.08, 400); break;
      case 'roar': this.tone(90, 0.7, 'sawtooth', 0.12, 45); this.noise(0.6, 0.15, 300, 'lowpass', 0, 80); break;
      case 'jump': this.tone(150, 0.3, 'sine', 0.12, 400); break;
      case 'land': this.noise(0.18, 0.15, 300); this.tone(80, 0.15, 'sine', 0.15, 40); break;
      case 'charge': this.tone(200, 0.2, 'sawtooth', 0.06, 500); break;
      case 'laser': this.tone(1800, 0.09, 'sawtooth', 0.04, 600); break;
      case 'brim': this.tone(110, 0.5, 'sawtooth', 0.12, 70); this.noise(0.5, 0.18, 900, 'lowpass', 0, 200); break;
      case 'secret': [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.1, 0, i * 0.1)); break;
      case 'devil': this.tone(65, 1.2, 'sawtooth', 0.12, 50); this.tone(98, 1.2, 'sawtooth', 0.06, 70); break;
      case 'buy': this.tone(1319, 0.08, 'square', 0.06); this.tone(1760, 0.18, 'square', 0.06, 0, 0.08); break;
      case 'unlock': this.tone(700, 0.05, 'square', 0.06); this.noise(0.12, 0.1, 1500, 'bandpass', 0.04); break;
      case 'bossdie': this.noise(1.2, 0.4, 600, 'lowpass', 0, 60); this.tone(120, 1.0, 'sawtooth', 0.12, 30); break;
      case 'die': [400, 300, 220, 150].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.12, f * 0.8, i * 0.18)); break;
      case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, 0, i * 0.13)); break;
      case 'fall': this.tone(500, 0.8, 'sine', 0.12, 80); break;
      case 'select': this.tone(660, 0.06, 'square', 0.05); break;
      case 'swing': this.noise(0.12, 0.12, 2500, 'bandpass', 0, 600); break;
    }
  },

  // ---------- Música procedural ----------
  startMusic(mode) {
    if (!this.ctx) return;
    if (this.music.mode === mode) return;
    this.music.mode = mode; this.music.step = 0;
    this.music.next = this.ctx.currentTime + 0.15;
    if (!this.music.timer) this.music.timer = setInterval(() => this.tick(), 60);
  },
  stopMusic() { this.music.mode = null; },
  tick() {
    const c = this.ctx, m = this.music;
    if (!c || !m.mode) return;
    if (c.state !== 'running') { m.next = c.currentTime + 0.1; return; }
    if (m.next < c.currentTime - 0.5) m.next = c.currentTime + 0.05;
    while (m.next < c.currentTime + 0.3) {
      this.playStep(m.step, m.next - c.currentTime);
      const bpm = m.mode === 'boss' ? 148 : m.mode === 'menu' ? 80 : 92;
      m.next += 60 / bpm / 2; m.step++;
    }
  },
  playStep(s, d) {
    const dest = this.mus, mode = this.music.mode;
    if (mode === 'boss') {
      const bass = [41.2, 41.2, 82.4, 41.2, 49, 41.2, 58.3, 55, 41.2, 41.2, 82.4, 41.2, 61.7, 58.3, 55, 49];
      const f = bass[s % 16];
      this.tone(f, 0.22, 'sawtooth', 0.16, 0, d, dest);
      this.tone(f * 2, 0.12, 'square', 0.04, 0, d, dest);
      if (s % 4 === 0) { this.tone(70, 0.18, 'sine', 0.35, 35, d, dest); }
      if (s % 4 === 2) this.noise(0.08, 0.08, 4000, 'highpass', d, 0, dest);
      if (s % 32 === 16 || s % 32 === 24) [329.6, 311.1, 293.7].forEach((n, i) => this.tone(n, 0.3, 'triangle', 0.05, 0, d + i * 0.2, dest));
    } else {
      const bass = [55, 0, 55, 65.4, 0, 55, 0, 49, 43.65, 0, 43.65, 55, 0, 41.2, 0, 49];
      const f = bass[s % 16];
      if (f) this.tone(f, 0.45, 'triangle', 0.22, 0, d, dest);
      if (s % 8 === 0) this.tone(62, 0.25, 'sine', 0.28, 38, d, dest);
      if (s % 8 === 3) this.tone(58, 0.2, 'sine', 0.16, 36, d, dest);
      if (s % 4 === 2 && Math.random() < 0.6) {
        const scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];
        this.tone(pick(scale), 1.4, 'sine', 0.05, 0, d, dest);
      }
      if (s % 64 === 32) this.tone(110, 3, 'triangle', 0.06, 0, d, dest);
    }
  },
};
