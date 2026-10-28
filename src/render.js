'use strict';
/* =========================================================
   Dibujo: todo el arte se genera con código (sin imágenes)
   ========================================================= */
const OL = '#1b100b';
const FONT = '"Patrick Hand", "Comic Sans MS", "Chalkboard SE", cursive';
const FONT_TITLE = '"Rubik Wet Paint", "Patrick Hand", Impact, fantasy';

function circ(ctx, x, y, r, fill, lw = 0, stroke = OL) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function ell(ctx, x, y, rx, ry, fill, lw = 0, stroke = OL, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, fill, lw = 0, stroke = OL) {
  rrect(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function line(ctx, x0, y0, x1, y1, col, lw = 1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
function shadow(ctx, x, y, rx, ry, a = 0.32) { ell(ctx, x, y, rx, ry, `rgba(0,0,0,${a})`); }
function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.95);
  ctx.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.95, y - s * 1.0, x, y - s * 0.38);
  ctx.bezierCurveTo(x + s * 0.95, y - s * 1.0, x + s * 1.25, y + s * 0.1, x, y + s * 0.95);
  ctx.closePath();
}
function txt(ctx, s, x, y, size, col = '#f4ead8', align = 'center', outline = '#120a06', font = FONT) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (outline) { ctx.lineWidth = Math.max(2, size / 6); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}

// ---------- Fondo de sala ----------
function buildRoomBg(room, S) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(WW * S); cv.height = Math.ceil(WH * S);
  const c = cv.getContext('2d');
  c.scale(S, S);
  const th = THEMES[FLOORS[G.floorIdx].theme];
  const rnd = mulberry32(room.seed);
  const devil = room.type === 'devil';

  // muros
  c.fillStyle = devil ? '#1c0c0c' : th.wall2; c.fillRect(0, 0, WW, WH);
  for (let i = 0; i < 170 * room.cells.length; i++) {
    const x = rnd() * WW, y = rnd() * WH;
    if (x > X0 - 4 && x < X1 + 4 && y > Y0 - 4 && y < Y1 + 4) continue;
    c.globalAlpha = 0.45 + rnd() * 0.5;
    fillRR(c, x - 10, y - 6, 12 + rnd() * 18, 8 + rnd() * 9, 3, devil ? '#2e1414' : (rnd() < 0.5 ? th.wall : th.wall3));
  }
  c.globalAlpha = 1;
  const grad = (x0, y0, x1, y1, a) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; };
  c.fillStyle = grad(0, 0, 0, Y0, 0.6); c.fillRect(0, 0, WW, Y0);
  c.fillStyle = grad(0, WH, 0, Y1, 0.6); c.fillRect(0, Y1, WW, WH - Y1);
  c.fillStyle = grad(0, 0, X0, 0, 0.6); c.fillRect(0, 0, X0, WH);
  c.fillStyle = grad(WW, 0, X1, 0, 0.6); c.fillRect(X1, 0, WW - X1, WH);
  // reborde del muro
  c.fillStyle = devil ? '#3a1818' : th.wall3;
  c.fillRect(X0 - 7, Y0 - 7, X1 - X0 + 14, 7); c.fillRect(X0 - 7, Y1, X1 - X0 + 14, 7);
  c.fillRect(X0 - 7, Y0 - 7, 7, Y1 - Y0 + 14); c.fillRect(X1, Y0 - 7, 7, Y1 - Y0 + 14);

  // suelo
  c.fillStyle = devil ? '#2a1212' : th.floor;
  c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  c.save(); c.beginPath(); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.clip();
  const theme = FLOORS[G.floorIdx].theme;
  if (theme === 'depths' && !devil) {
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5;
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      if (rnd() < 0.7) { c.strokeRect(X0 + col * TILE + 1, Y0 + r * TILE + 1, TILE - 2, TILE - 2); }
    }
  }
  for (let i = 0; i < 70; i++) {
    c.globalAlpha = 0.18 + rnd() * 0.3;
    ell(c, X0 + rnd() * (X1 - X0), Y0 + rnd() * (Y1 - Y0), 8 + rnd() * 40, 5 + rnd() * 22, devil ? '#3a1a1a' : (rnd() < 0.6 ? th.floor2 : th.floor3), 0, OL, rnd() * 3);
  }
  c.globalAlpha = 1;
  if (theme === 'womb' && !devil) {
    c.strokeStyle = 'rgba(60,8,8,0.45)'; c.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      c.beginPath(); let x = X0 + rnd() * (X1 - X0), y = Y0 + rnd() * (Y1 - Y0); c.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += rr(-30, 30); y += rr(-20, 20); c.quadraticCurveTo(x + rr(-15, 15), y + rr(-15, 15), x, y); }
      c.stroke();
    }
  }
  if (!devil) paintThemeDecor(c, theme, rnd, room.cells.length);
  // grietas y piedrecitas
  c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    c.beginPath(); let x = X0 + rnd() * (X1 - X0), y = Y0 + rnd() * (Y1 - Y0); c.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 30; y += (rnd() - 0.5) * 20; c.lineTo(x, y); }
    c.stroke();
  }
  for (let i = 0; i < 40; i++) { c.globalAlpha = 0.5; circ(c, X0 + rnd() * (X1 - X0), Y0 + rnd() * (Y1 - Y0), 0.8 + rnd() * 1.8, rnd() < 0.5 ? th.floor2 : th.floor3); }
  c.globalAlpha = 1;
  // sombra que proyecta el muro
  c.fillStyle = grad(0, Y0, 0, Y0 + 26, 0.42); c.fillRect(X0, Y0, X1 - X0, 26);
  c.fillStyle = grad(X0, 0, X0 + 18, 0, 0.32); c.fillRect(X0, Y0, 18, Y1 - Y0);
  c.fillStyle = grad(X1, 0, X1 - 18, 0, 0.32); c.fillRect(X1 - 18, Y0, 18, Y1 - Y0);
  c.fillStyle = grad(0, Y1, 0, Y1 - 10, 0.25); c.fillRect(X0, Y1 - 10, X1 - X0, 10);
  if (devil) {
    // pentagrama en el suelo
    c.globalAlpha = 0.35; c.strokeStyle = '#a01818'; c.lineWidth = 3;
    c.beginPath(); c.arc(CX, CY + 10, 70, 0, TAU); c.stroke();
    c.beginPath();
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; const x = CX + Math.cos(a) * 70, y = CY + 10 + Math.sin(a) * 70; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.globalAlpha = 1;
  }
  for (const d of room.decals) paintDecal(c, d);
  // hueco de una sala en L: muro macizo con reborde donde toca el suelo
  const wallAt = (col, r) => inGrid(col, r) && room.tiles[r * COLS + col] === T.WALL;
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    if (!wallAt(col, r)) continue;
    const x = X0 + col * TILE, y = Y0 + r * TILE;
    c.fillStyle = th.wall2; c.fillRect(x, y, TILE, TILE);
    c.fillStyle = th.wall3;
    if (!wallAt(col, r - 1)) c.fillRect(x, y, TILE, 7);
    if (!wallAt(col, r + 1)) c.fillRect(x, y + TILE - 7, TILE, 7);
    if (!wallAt(col - 1, r)) c.fillRect(x, y, 7, TILE);
    if (!wallAt(col + 1, r)) c.fillRect(x + TILE - 7, y, 7, TILE);
  }
  c.restore();
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 2; c.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
  return cv;
}

// Detalles de suelo de cada tema, repartidos con el azar de la sala (n = celdas que ocupa):
// sótano con manchas de humedad y huesecillos, cuevas con charcos y guijarros,
// profundidades con calaveras, huesos y cadenas, útero con sangre y bultos de carne
function paintThemeDecor(c, theme, rnd, n) {
  const px = () => X0 + 10 + rnd() * (X1 - X0 - 20), py = () => Y0 + 10 + rnd() * (Y1 - Y0 - 20);
  const bone = (x, y, a, len, col) => {
    const dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
    line(c, x - dx, y - dy, x + dx, y + dy, col, 2.2);
    for (const s of [-1, 1]) { circ(c, x + dx * s - dy * 0.15, y + dy * s + dx * 0.15, 1.9, col); circ(c, x + dx * s + dy * 0.15, y + dy * s - dx * 0.15, 1.9, col); }
  };
  switch (theme) {
    case 'basement':
      for (let i = 0; i < 5 * n; i++) { c.globalAlpha = 0.22 + rnd() * 0.1; ell(c, px(), py(), 10 + rnd() * 18, 5 + rnd() * 8, '#2c1a10', 0, OL, rnd() * 3); }
      for (let i = 0; i < 3 * n; i++) { c.globalAlpha = 0.5; bone(px(), py(), rnd() * TAU, 9 + rnd() * 5, '#cdbd9c'); }
      break;
    case 'caves':
      for (let i = 0; i < 2 * n; i++) {
        const x = px(), y = py(), w = 14 + rnd() * 18;
        c.globalAlpha = 0.4; ell(c, x, y, w, w * 0.5, '#33444d', 0, OL, rnd() * 0.6 - 0.3);
        c.globalAlpha = 0.25; ell(c, x - w * 0.2, y - w * 0.12, w * 0.45, w * 0.14, '#9ec2d0');
      }
      for (let i = 0; i < 5 * n; i++) {
        const x = px(), y = py();
        c.globalAlpha = 0.6;
        for (let k = 0; k < 3; k++) circ(c, x + rnd() * 12 - 6, y + rnd() * 8 - 4, 1.4 + rnd() * 2.2, rnd() < 0.5 ? '#8a8173' : '#625a4f');
      }
      break;
    case 'depths':
      for (let i = 0; i < 2 * n; i++) {
        const x = px(), y = py();
        c.globalAlpha = 0.5; circ(c, x, y, 5.5, '#bdb7a8'); fillRR(c, x - 3.5, y + 3, 7, 4, 1.5, '#bdb7a8');
        circ(c, x - 2, y, 1.4, '#1a1a1e'); circ(c, x + 2, y, 1.4, '#1a1a1e');
      }
      for (let i = 0; i < 3 * n; i++) { c.globalAlpha = 0.45; bone(px(), py(), rnd() * TAU, 10 + rnd() * 6, '#a8a498'); }
      for (let i = 0; i < n; i++) {
        let x = px(), y = py(); const a = rnd() * TAU;
        c.globalAlpha = 0.4;
        for (let k = 0; k < 5; k++) { ell(c, x, y, 3.2, 1.8, '#3a3b44', 1, '#15151a', a + (k % 2) * Math.PI / 2); x += Math.cos(a) * 6; y += Math.sin(a) * 6; }
      }
      break;
    case 'womb':
      for (let i = 0; i < 4 * n; i++) { c.globalAlpha = 0.3 + rnd() * 0.1; ell(c, px(), py(), 9 + rnd() * 20, 5 + rnd() * 9, '#4a0e0e', 0, OL, rnd() * 3); }
      for (let i = 0; i < 3 * n; i++) {
        const x = px(), y = py(), r = 3 + rnd() * 3.5;
        c.globalAlpha = 0.55; circ(c, x, y, r, '#a65049', 1, '#5a1a18'); circ(c, x - r * 0.3, y - r * 0.3, r * 0.3, '#d98a82');
      }
      break;
  }
  c.globalAlpha = 1;
}

function paintDecal(c, d) {
  c.save();
  c.beginPath(); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.clip();
  switch (d.type) {
    case 'blood':
      c.globalAlpha = 0.75;
      ell(c, d.x, d.y, d.r, d.r * 0.6, '#5e0a0c', 0, OL, d.rot);
      for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, rr2 = d.r * rr(0.7, 1.4); circ(c, d.x + Math.cos(a) * rr2, d.y + Math.sin(a) * rr2 * 0.6, rr(1, d.r * 0.25), '#6a0c0f'); }
      break;
    case 'drop': c.globalAlpha = 0.65; circ(c, d.x, d.y, d.r, d.color); break;
    case 'scorch': {
      const g = c.createRadialGradient(d.x, d.y, 2, d.x, d.y, d.r);
      g.addColorStop(0, 'rgba(10,6,4,0.75)'); g.addColorStop(1, 'rgba(10,6,4,0)');
      c.fillStyle = g; c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill();
      break;
    }
    case 'rubble':
      c.globalAlpha = 0.9;
      for (let i = 0; i < 6; i++) circ(c, d.x + rr(-12, 12), d.y + rr(-8, 10), rr(1.5, 3.5), d.col || '#555', 0.8);
      break;
    case 'poop': c.globalAlpha = 0.5; ell(c, d.x, d.y + 4, d.r, d.r * 0.55, '#4a2c14', 0, OL, d.rot); break;
    case 'burnt':
      c.globalAlpha = 0.85; ell(c, d.x, d.y + 6, 13, 6, '#151010');
      line(c, d.x - 10, d.y + 4, d.x + 8, d.y + 9, '#2a2020', 3); line(c, d.x - 8, d.y + 9, d.x + 10, d.y + 3, '#2a2020', 3);
      break;
  }
  c.restore();
}

function buildVignette(a) {
  const cv = document.createElement('canvas'); cv.width = 300; cv.height = 180;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(150, 95, 40, 150, 90, 185);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.25})`); g.addColorStop(1, `rgba(0,0,0,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, 300, 180);
  return cv;
}

// ---------- Puertas ----------
function drawDoor(ctx, room, k, d, open) {
  const D = DIRS[k];
  ctx.save(); ctx.translate(D.x, D.y); ctx.rotate(D.rot);
  if (d.hidden) {
    if (room.cracks[k]) {
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-4, -12); ctx.lineTo(-7, -20); ctx.moveTo(-4, -12); ctx.lineTo(4, -15); ctx.lineTo(9, -24); ctx.moveTo(4, -15); ctx.lineTo(8, -6); ctx.stroke();
    }
    ctx.restore(); return;
  }
  if (d.type === 'secret') {
    ctx.fillStyle = '#080404';
    ctx.beginPath();
    const pts = [[-17, 3], [-19, -12], [-12, -26], [-3, -31], [7, -28], [15, -20], [19, -8], [16, 3]];
    pts.forEach((pp, i) => i ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1]));
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) circ(ctx, -16 + i * 8, 4 + (i % 2) * 2, 3, '#4a3a30', 1);
    ctx.restore(); return;
  }
  const frames = { normal: ['#6a4428', '#3d2414'], shop: ['#6a4428', '#3d2414'], treasure: ['#e2b23a', '#8a6214'], boss: ['#6a1010', '#2a0404'], devil: ['#3a0808', '#120000'], angel: ['#f4f0e0', '#a89c70'] };
  const [fc, fd] = frames[d.type] || frames.normal;
  // hueco
  fillRR(ctx, -16, -36, 32, 39, 5, '#090504');
  if (open) {
    const g = ctx.createLinearGradient(0, -36, 0, 3); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,230,190,0.07)');
    ctx.fillStyle = g; ctx.fillRect(-16, -36, 32, 39);
  }
  if (!open) {
    const leaf = d.type === 'treasure' ? '#a87a20' : d.type === 'boss' ? '#3a0a0a' : '#4a2c18';
    fillRR(ctx, -15, -34, 15, 36, 2, leaf, 1.2);
    fillRR(ctx, 0, -34, 15, 36, 2, leaf, 1.2);
    for (let i = -10; i <= 10; i += 10) line(ctx, i < 0 ? -15 : 0, -24 + i, i < 0 ? 0 : 15, -24 + i, 'rgba(0,0,0,0.35)', 1);
    if (d.locked) {
      fillRR(ctx, -6, -14, 12, 10, 2, '#e2b23a', 1.4);
      ctx.beginPath(); ctx.arc(0, -15, 4, Math.PI, 0); ctx.strokeStyle = '#e2b23a'; ctx.lineWidth = 2.5; ctx.stroke();
      circ(ctx, 0, -9.5, 1.6, '#3a2a10');
    }
  }
  // marco
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-20, 5); ctx.lineTo(-20, -33); ctx.quadraticCurveTo(0, -44, 20, -33); ctx.lineTo(20, 5);
  ctx.strokeStyle = fd; ctx.lineWidth = 10; ctx.stroke();
  ctx.strokeStyle = fc; ctx.lineWidth = 6; ctx.stroke();
  ctx.lineCap = 'butt';
  if (d.type === 'boss') {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 18, -30); ctx.quadraticCurveTo(s * 32, -36, s * 30, -50); ctx.quadraticCurveTo(s * 26, -38, s * 14, -36); ctx.closePath(); ctx.fillStyle = '#d8ccb0'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); }
    circ(ctx, 0, -40, 7, '#d8ccb0', 1.2); circ(ctx, -2.5, -41, 1.8, '#1a0a0a'); circ(ctx, 2.5, -41, 1.8, '#1a0a0a');
  }
  if (d.type === 'treasure') { circ(ctx, 0, -40, 4, '#ffe27a', 1); }
  if (d.type === 'angel') {
    const g = ctx.createRadialGradient(0, -16, 2, 0, -16, 32); g.addColorStop(0, 'rgba(255,250,220,0.5)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; ctx.fillRect(-32, -48, 64, 52);
    ctx.beginPath(); ctx.ellipse(0, -42, 8, 2.5, 0, 0, TAU); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (d.type === 'devil') {
    const g = ctx.createRadialGradient(0, -16, 2, 0, -16, 30); g.addColorStop(0, 'rgba(255,40,20,0.35)'); g.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-30, -46, 60, 50);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -40); ctx.quadraticCurveTo(s * 22, -46, s * 20, -56); ctx.quadraticCurveTo(s * 14, -46, s * 4, -42); ctx.closePath(); ctx.fillStyle = '#1a0606'; ctx.fill(); }
  }
  ctx.restore();
}

function drawTrapdoor(ctx, td) {
  const k = Math.min(1, td.t / 0.5);
  ctx.save(); ctx.translate(td.x, td.y);
  fillRR(ctx, -20, -18, 40, 36, 6, '#2a1a10', 1.5);
  fillRR(ctx, -16 * k, -14 * k, 32 * k, 28 * k, 4, '#050202');
  if (k < 1) { fillRR(ctx, -16, -14, 32, 28 * (1 - k), 3, '#5a3a22', 1); }
  ctx.restore();
}

// ---------- Casillas ----------
function drawRock(ctx, x, y, seed, th, tinted) {
  const rnd = mulberry32(seed);
  shadow(ctx, x + 2, y + 13, 18, 6, 0.3);
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, rad = 14.5 + rnd() * 4.5;
    const px = x + Math.cos(a) * rad, py = y + 2 + Math.sin(a) * rad * 0.82;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = tinted ? '#7e8ea8' : th.rock; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = OL; ctx.stroke();
  ell(ctx, x + 3, y + 8, 12, 5, 'rgba(0,0,0,0.2)');
  ell(ctx, x - 3, y - 5, 9, 5, tinted ? '#aab8cc' : th.rock3, 0, OL, -0.3);
  line(ctx, x + 2, y - 2, x + 7, y + 3, 'rgba(0,0,0,0.35)', 1);
  if (tinted) { line(ctx, x - 6, y - 1, x + 2, y + 7, '#2a3c6a', 2); line(ctx, x + 2, y - 1, x - 6, y + 7, '#2a3c6a', 2); }
}
function drawPoop(ctx, x, y, stage) {
  const s = 1 - stage * 0.2;
  shadow(ctx, x, y + 12, 15 * s, 5 * s, 0.3);
  ell(ctx, x, y + 6, 15 * s, 8 * s, '#6b4423', 1.4);
  ell(ctx, x, y - 1, 11 * s, 6.5 * s, '#7a4e28', 1.4);
  ell(ctx, x, y - 7 * s, 7 * s, 4.5 * s, '#86572d', 1.4);
  ctx.beginPath(); ctx.moveTo(x - 2, y - 10 * s); ctx.quadraticCurveTo(x + 3, y - 15 * s, x + 1, y - 12 * s); ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.stroke();
  ell(ctx, x - 5 * s, y + 3, 3 * s, 1.5 * s, 'rgba(255,220,180,0.25)');
}
function drawPit(ctx, x, y) {
  const g = ctx.createLinearGradient(0, y - 20, 0, y + 20);
  g.addColorStop(0, '#000000'); g.addColorStop(1, '#1a100a');
  ctx.fillStyle = g; ctx.fillRect(x - 20, y - 20, 40, 40);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 20, y - 20, 40, 5);
}
function drawSpike(ctx, x, y) {
  fillRR(ctx, x - 17, y - 17, 34, 34, 4, '#2a2624', 1.2);
  for (const [dx, dy] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) {
    ctx.beginPath(); ctx.moveTo(x + dx - 5, y + dy + 5); ctx.lineTo(x + dx, y + dy - 7); ctx.lineTo(x + dx + 5, y + dy + 5); ctx.closePath();
    ctx.fillStyle = '#c9c4be'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
    line(ctx, x + dx, y + dy - 6, x + dx + 2, y + dy + 4, 'rgba(255,255,255,0.5)', 1);
  }
}
function drawFire(ctx, x, y, stage, t, seed) {
  const s = 1 - stage * 0.22;
  shadow(ctx, x, y + 13, 16, 5, 0.3);
  fillRR(ctx, x - 15, y + 4, 30, 8, 3, '#5a3418', 1.2);
  ctx.save(); ctx.translate(x, y + 8); ctx.rotate(0.4); fillRR(ctx, -14, -3, 28, 6, 3, '#6e4220', 1.2); ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y - 4, 2, x, y - 4, 42 * s);
  g.addColorStop(0, 'rgba(255,140,40,0.35)'); g.addColorStop(1, 'rgba(255,90,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 45, y - 50, 90, 90);
  ctx.restore();
  const fl = Math.sin(t * 18 + seed) * 0.12, fl2 = Math.sin(t * 27 + seed * 2) * 0.1;
  const flame = (h, w, col) => {
    ctx.beginPath(); ctx.moveTo(x - w, y + 4);
    ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + w * fl * 3, y - h);
    ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y + 4); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  };
  flame(30 * s * (1 + fl), 12 * s, '#ff6a14');
  flame(22 * s * (1 + fl2), 8 * s, '#ffb02a');
  flame(13 * s, 4.5 * s, '#fff2a8');
}
function drawMetal(ctx, x, y) {
  shadow(ctx, x + 2, y + 15, 18, 5, 0.3);
  fillRR(ctx, x - 17, y - 17, 34, 34, 3, '#6d6f78', 1.5);
  ctx.fillStyle = '#9a9ca6'; ctx.fillRect(x - 15, y - 15, 30, 4); ctx.fillRect(x - 15, y - 15, 4, 30);
  ctx.fillStyle = '#44464d'; ctx.fillRect(x - 15, y + 11, 30, 4); ctx.fillRect(x + 11, y - 15, 4, 30);
  for (const [dx, dy] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) circ(ctx, x + dx, y + dy, 1.8, '#c0c2ca', 0.8);
}
function drawTNT(ctx, x, y, stage) {
  shadow(ctx, x, y + 14, 14, 5, 0.3);
  fillRR(ctx, x - 13, y - 14, 26, 28, 6, stage ? '#9a2a22' : '#b8322a', 1.5);
  ctx.fillStyle = '#3a1a14'; ctx.fillRect(x - 13, y - 8, 26, 3); ctx.fillRect(x - 13, y + 6, 26, 3);
  ell(ctx, x, y - 13, 12, 3, '#d04a3e', 1);
  txt(ctx, 'TNT', x, y - 1, 9, '#ffe9c8', 'center', '#3a1a14');
}

// ---------- Jugador ----------
function playerCostume(p) {
  const c = { horns: false, halo: false };
  if (p.modes && (p.modes.has('brim') || p.passive.has('devil') || p.passive.has('devil100'))) c.horns = true;
  if (p.items) for (const id of p.items) { const it = ITEMS[id]; if (it && it.pools.angel && !it.pools.devil) { c.halo = true; break; } }
  return c;
}

function drawPlayer(ctx, p, x, y, s = 1) {
  const ch = p.char, L = ch.look || {}, skin = L.skin || ch.skin || '#f0d2c2', dark = L.line || '#3a2418';
  const S = s * (p.size || 1);
  const cos = p.passive ? playerCostume(p) : {};
  ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
  if (L.ghost) ctx.globalAlpha *= 0.72;
  if (s === 1) shadow(ctx, 0, 11, 11, 4, 0.35);
  const fly = p.flags && (p.flags.flight || (p.roomMods && p.roomMods.flight));
  if (L.wings || fly) {
    const bat = L.wings === 'bat' || (fly && cos.horns);
    const fl = Math.sin((G.time || 0) * 10) * 0.2;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 6, -6); ctx.rotate(sd * (0.5 + fl));
      if (bat) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * 20, -8); ctx.lineTo(sd * 16, 0); ctx.lineTo(sd * 20, 6); ctx.lineTo(sd * 8, 4); ctx.closePath();
        ctx.fillStyle = '#1e1418'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
      } else {
        ell(ctx, sd * 10, -4, 11, 6, '#f6f2ff', 1.2, '#7a7090');
        ell(ctx, sd * 13, -2, 6, 3, '#dcd6f0');
      }
      ctx.restore();
    }
  }
  const moving = Math.hypot(p.vx, p.vy) > 25;
  const step = moving ? Math.sin(p.walkT) * 2.4 : 0;
  ell(ctx, -4, 9 + step * 0.5, 3, 3.5, skin, 1.2, dark);
  ell(ctx, 4, 9 - step * 0.5, 3, 3.5, skin, 1.2, dark);
  ell(ctx, 0, 2.5, 7.5, 7, skin, 1.4, dark);
  if (L.skull) { line(ctx, -4, 0, 4, 0, 'rgba(0,0,0,0.25)', 1); line(ctx, -4, 3, 4, 3, 'rgba(0,0,0,0.25)', 1); }
  if (p.holdT > 0) {
    line(ctx, -6, 0, -9, -14, dark, 4.2); line(ctx, -6, 0, -9, -14, skin, 2.6);
    line(ctx, 6, 0, 9, -14, dark, 4.2); line(ctx, 6, 0, 9, -14, skin, 2.6);
  } else {
    ell(ctx, -7.5, 3 - step * 0.3, 2.6, 3.2, skin, 1.1, dark);
    ell(ctx, 7.5, 3 + step * 0.3, 2.6, 3.2, skin, 1.1, dark);
  }
  // cabeza
  const sq = p.shootAnim > 0 ? 0.9 : 1;
  ctx.save(); ctx.translate(0, -13); ctx.scale(2 - sq, sq);
  const hair = L.hair, hc = hair ? hair.c : null;
  if (hair && (hair.s === 'long' || hair.s === 'braid')) ell(ctx, 0, 4, 15, 13, hc, 1.4, dark);
  if (hair && hair.s === 'braid') { ell(ctx, 13, 12, 4, 6, hc, 1.2, dark); ell(ctx, 15, 19, 3, 4, hc, 1.2, dark); }
  if (L.hood) { ell(ctx, 0, 1, 16, 15, '#2a2a34', 1.4, '#000'); }
  if (L.horns || cos.horns) {
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 5, -10); ctx.quadraticCurveTo(sd * 12, -16, sd * 11, -22); ctx.quadraticCurveTo(sd * 8, -15, sd * 1, -12); ctx.closePath(); ctx.fillStyle = L.horns ? '#140c0c' : '#2a1414'; ctx.fill(); }
  }
  circ(ctx, 0, 0, 13, skin, 1.6, dark);
  if (L.skull) { ell(ctx, 0, 8, 7, 4, 'rgba(0,0,0,0.08)'); line(ctx, -2, 10, 2, 10, 'rgba(0,0,0,0.4)', 1); }
  if (hair) {
    ctx.fillStyle = hc;
    if (hair.s === 'short') { ctx.beginPath(); ctx.arc(0, -1, 13, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(0, -6, -12.5, -4); ctx.fill(); }
    else if (hair.s === 'spiky') { ctx.beginPath(); ctx.moveTo(-12, -4); for (let i = 0; i <= 6; i++) ctx.lineTo(-12 + i * 4, i % 2 ? -18 : -9); ctx.lineTo(12, -4); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, -2, 13, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
  }
  if (L.hood) { ctx.beginPath(); ctx.arc(0, -1, 14, Math.PI * 1.02, Math.PI * 1.98); ctx.fillStyle = '#2a2a34'; ctx.fill(); }
  drawFace(ctx, p.faceDir, p.shootAnim > 0, ch, (p.fx && p.fx.blood) || (p.modes && p.modes.has('brim')) ? '#d8343a' : '#7ec0ff');
  if (L.fez) { fillRR(ctx, -7, -20, 14, 9, 2, '#b8202a', 1.2, '#3a0a0a'); line(ctx, 3, -20, 8, -14, '#1a1a1a', 1.4); }
  if (L.rope) { ctx.beginPath(); ctx.arc(0, 2, 13.5, 0.3, Math.PI - 0.3); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.2; ctx.stroke(); line(ctx, 0, -13, 0, -24, '#8a6a3a', 2); }
  if (L.bandage) { ctx.beginPath(); ctx.arc(0, -2, 13, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = '#f0e8d8'; ctx.lineWidth = 3.5; ctx.stroke(); }
  if (cos.halo) { ctx.beginPath(); ctx.ellipse(0, -18, 9, 3, 0, 0, TAU); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
  if (p.leafOn || (p.invuln > 0 && p.passive && p.passive.has('toothnail'))) { circ(ctx, 0, -6, 18, 'rgba(140,140,150,0.45)', 1.5, '#555'); }
  if (p.unicorn > 0) { ctx.globalAlpha = 0.35 + Math.sin(G.time * 20) * 0.15; circ(ctx, 0, -6, 20, `hsl(${(G.time * 400) % 360},90%,65%)`); ctx.globalAlpha = 1; }
  if (p.holdT > 0 && p.holdItem) {
    ctx.save(); ctx.globalAlpha = Math.min(1, p.holdT * 3);
    const g = ctx.createRadialGradient(0, -40, 2, 0, -40, 20); g.addColorStop(0, 'rgba(255,240,180,0.6)'); g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g; ctx.fillRect(-20, -60, 40, 40);
    drawIcon(ctx, p.holdItem, 0, -40, 0.9);
    ctx.restore();
  }
  if (p.mantleUp) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(0, -6, 20, 0, TAU); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1; }
  if (p.shield > 0) {
    ctx.globalAlpha = p.shield < 1.5 && Math.floor(p.shield * 8) % 2 ? 0.15 : 0.35;
    circ(ctx, 0, -6, 22, '#cfe6ff', 2, '#ffffff');
    ctx.globalAlpha = 1;
  }
  if (p.modes) {
    const mode = activeMode(p);
    const ct = mode === 'brim' ? Math.min(1, p.charge / chargeTime(p, 'brim')) : (mode === 'techx' || mode === 'choco' || mode === 'lung' || mode === 'cursed') ? p.charge : mode === 'knife' && p.knife ? p.knife.charge : 0;
    if (ct > 0) {
      ctx.beginPath(); ctx.arc(0, -13, 17, -Math.PI / 2, -Math.PI / 2 + ct * TAU);
      ctx.strokeStyle = ct >= 1 && Math.floor(G.time * 12) % 2 ? '#ffffff' : mode === 'brim' ? '#d01818' : '#e8e0d0'; ctx.lineWidth = 3; ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFace(ctx, dir, crying, ch, tearCol) {
  const L = (ch && ch.look) || {};
  if (dir === 'up') {
    ctx.beginPath(); ctx.arc(-1, -2, 4, 0.5, 2.5); ctx.strokeStyle = 'rgba(90,50,40,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    ell(ctx, -12, 1, 2, 3.5, 'rgba(0,0,0,0.12)'); ell(ctx, 12, 1, 2, 3.5, 'rgba(0,0,0,0.12)');
    return;
  }
  const off = dir === 'left' ? -4 : dir === 'right' ? 4 : 0;
  const eyes = [-5 + off, 5 + off];
  const tainted = ch && ch.tainted;
  if (L.blindfold) {
    fillRR(ctx, -13, -5, 26, 7, 2, '#2a1a1a');
    line(ctx, 11, -2, 16, 4, '#2a1a1a', 2);
  }
  eyes.forEach((ex, i) => {
    if (L.blindfold) return;
    if (L.patch && i === 1) {
      ell(ctx, ex, -1, 4, 4, '#151010');
      line(ctx, ex - 4, -3, -12, -7, '#151010', 1.6); line(ctx, ex + 4, -3, 12, -6, '#151010', 1.6);
      return;
    }
    if (L.ghost) { ell(ctx, ex, -1, 3.2, 4.2, '#2a2a3a'); return; }
    ell(ctx, ex, -1, 2.9, 3.7, '#120a08');
    circ(ctx, ex - 0.9, -2.3, 1.05, tainted ? '#d0c0c0' : '#ffffff');
    line(ctx, ex - 3, -6.5 + (i ? 1 : 0) * -1, ex + 2.5, -7.5 + (i ? 1 : 0) * 1.5, 'rgba(60,30,20,0.6)', 1.2);
    if (tainted) line(ctx, ex, 2, ex + (i ? 1 : -1), 9, '#1a0808', 1.6);
    else if (crying) ell(ctx, ex, 5, 1.5, 2.4, tearCol);
  });
  ctx.beginPath(); ctx.arc(off, 9.5, 3.2, Math.PI * 1.15, Math.PI * 1.85); ctx.strokeStyle = L.ghost ? '#4a4a5a' : '#3a1a10'; ctx.lineWidth = 1.4; ctx.stroke();
}

// ---------- Enemigos ----------
function drawEnemy(ctx, e) {
  if (e.invisible) return;
  const F = e.flash > 0;
  const C = c => F ? '#ffffff' : e.freeze > 0 ? '#a8b0bc' : c;
  const a = e.anim;
  let sc = 1;
  if (e.spawnT > 0 && !e.boss) sc = 1 - Math.min(1, e.spawnT / 0.5) * 0.7;
  ctx.save(); ctx.translate(e.x, e.y);
  if (sc !== 1) { ctx.scale(sc, sc); ctx.globalAlpha = 0.4 + 0.6 * sc; }
  const champ = e.champ === 'tough';   // solo el campeón resistente tiñe el cuerpo de rojo; los demás llevan aura
  const fx = e.face < 0 ? -1 : 1;
  switch (e.type) {
    case 'fly': case 'afly': {
      const bob = Math.sin(a * 12) * 2, hy = -12 + bob, w = Math.abs(Math.sin(a * 40));
      shadow(ctx, 0, 6, 6, 2.5, 0.22);
      ell(ctx, -6, hy - 5, 6, 2.5 + w * 3, 'rgba(220,220,235,0.75)', 1, 'rgba(0,0,0,0.45)', -0.5);
      ell(ctx, 6, hy - 5, 6, 2.5 + w * 3, 'rgba(220,220,235,0.75)', 1, 'rgba(0,0,0,0.45)', 0.5);
      circ(ctx, 0, hy, e.type === 'afly' ? 7.5 : 6.5, C(champ ? '#8a1010' : e.type === 'afly' ? '#3a1414' : '#1c1c1c'), 1.3);
      if (e.type === 'afly') { circ(ctx, -2.6, hy - 1, 1.8, '#ff3030'); circ(ctx, 2.6, hy - 1, 1.8, '#ff3030'); }
      else { circ(ctx, -1.5, hy - 2, 1, '#555'); }
      break;
    }
    case 'healer': {   // Sanador: cuerpo rosa pálido con una cruz verde; al concentrarse tiende un hilo verde hasta su objetivo
      const bob = Math.sin(a * 4) * 2, heal = e.heal > 0, o = heal && e.target && !e.target.dead ? e.target : null;
      if (o) {
        ctx.save(); ctx.globalAlpha = 0.45 + 0.4 * Math.sin(a * 30) ** 2; ctx.strokeStyle = '#7be07b'; ctx.lineWidth = 2.2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -a * 40;
        ctx.beginPath(); ctx.moveTo(0, -8 + bob); ctx.lineTo(o.x - e.x, o.y - e.y - 6); ctx.stroke(); ctx.restore();
      }
      shadow(ctx, 0, 10, 11, 3.5, 0.25);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 7, -2 + bob); ctx.quadraticCurveTo(s * 17, 2 + bob + Math.sin(a * 5 + s) * 2, s * 13, 11); ctx.strokeStyle = '#d9a8a8'; ctx.lineWidth = 3; ctx.stroke(); }
      circ(ctx, 0, -6 + bob, 11.5, C(champ ? '#c05a6a' : '#f0c8c8'), 1.6);
      const gl = heal ? '#a8ffa8' : '#4cc463';
      fillRR(ctx, -1.8, -17 + bob, 3.6, 9, 1, gl, 0.8); fillRR(ctx, -4.5, -14.5 + bob, 9, 3.6, 1, gl, 0.8);
      circ(ctx, -4, -4 + bob, 1.6, '#3a2020'); circ(ctx, 4, -4 + bob, 1.6, '#3a2020');
      line(ctx, -3, 2 + bob, 3, 2 + bob, OL, 1.3);
      break;
    }
    case 'relentless': {   // Imparable: mole acorazada de carne con placas y patas cortas
      const step = Math.sin(a * 5) * 1.6;
      shadow(ctx, 0, 12, 17, 5, 0.33);
      for (const s of [-1, 1]) fillRR(ctx, s * 9 - 4, 5 + (s > 0 ? step : -step), 8, 9, 3, C('#5a1a1a'), 1.4);
      ell(ctx, 0, -3, 15.5, 13.5, C(champ ? '#a05050' : '#7a2a2a'), 1.8);
      for (const [x, y, r] of [[-7, -9, 4], [3, -12, 4.5], [9, -6, 4], [-10, -1, 3.6], [6, 2, 4]]) { circ(ctx, x, y, r, C('#9a4a44'), 1.3); }
      for (const s of [-1, 1]) { line(ctx, s * 9, -6, s * 3, -3.5, '#1a0505', 2.2); circ(ctx, s * 5, -2.5, 1.9, '#ffe0a0'); circ(ctx, s * 5, -2.5, 0.9, '#111'); }
      line(ctx, -5, 5, 5, 5, '#1a0505', 2);
      break;
    }
    case 'spiral': {   // Espiral: bulbo con un remolino que gira más rápido mientras dispara
      const spin = e.state === 'spin', rot = a * (spin ? 7 : 1.5);
      shadow(ctx, 0, 10, 11, 3.5, 0.25);
      circ(ctx, 0, -5, 11.5, C(champ ? '#b05a7a' : '#a86ac0'), 1.6);
      ctx.save(); ctx.translate(0, -5); ctx.rotate(rot); ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const t = i / 40, ang = t * TAU * 1.6, r = t * 9; i ? ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : ctx.moveTo(0, 0); }
      ctx.strokeStyle = C('#f0dcff'); ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
      circ(ctx, 0, -5, spin ? 3.2 : 2.2, spin ? '#fff' : '#2a1030', 1);
      break;
    }
    case 'merger': case 'fused': {   // Gemelo: gota azul con un ojo; los gemelos fundidos son un ocho con dos ojos
      const fu = e.type === 'fused', wob = Math.sin(a * 9) * 0.07 + (e.mt > 0 ? Math.sin(a * 40) * 0.1 : 0);
      shadow(ctx, 0, fu ? 12 : 8, fu ? 17 : 9, fu ? 5 : 3, 0.28);
      ctx.save(); ctx.scale(1 + wob, 1 - wob);
      if (fu) {
        ell(ctx, -7, -2, 11, 11.5, C(champ ? '#b05a6a' : '#4a86c8'), 1.7); ell(ctx, 7, -2, 11, 11.5, C(champ ? '#b05a6a' : '#4a86c8'), 1.7);
        ell(ctx, 0, -2, 9, 9, C(champ ? '#b05a6a' : '#4a86c8'));
        for (const s of [-1, 1]) { circ(ctx, s * 7, -5, 3.6, '#f4f8ff', 1); circ(ctx, s * 7 + fx, -5, 1.8, '#10203a'); }
        line(ctx, -5, 3, 5, 3, OL, 1.6);
        if (e.shoot > 0) ell(ctx, 0, 3, 4, 3, '#10203a');
      } else {
        ell(ctx, 0, -2, 8.5, 9.5, C(champ ? '#b05a6a' : '#5a96d8'), 1.5);
        ell(ctx, -2.5, -6, 2.6, 1.6, 'rgba(255,255,255,0.5)');
        circ(ctx, 0, -2, 3.4, '#f4f8ff', 1); circ(ctx, fx, -2, 1.6, '#10203a');
      }
      ctx.restore();
      break;
    }
    case 'summoner': {   // Invocador: figura encapuchada con ojos brillantes; al conjurar dibuja un círculo en el suelo
      const bob = Math.sin(a * 3) * 2, cast = e.cast > 0;
      shadow(ctx, 0, 10, 12, 4, 0.3);
      if (cast) {
        ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#a060e0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 8, 22, 9, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 8, 13, 5, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(-10, 9); ctx.quadraticCurveTo(-13, -8 + bob, 0, -19 + bob); ctx.quadraticCurveTo(13, -8 + bob, 10, 9); ctx.closePath();
      ctx.fillStyle = C(champ ? '#7a2a3a' : '#3a2a4a'); ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OL; ctx.stroke();
      ell(ctx, 0, -9 + bob, 6, 6.5, '#120a1c', 1);
      circ(ctx, -2.6, -9.5 + bob, 1.5, cast ? '#ff9bf0' : '#c8a0ff'); circ(ctx, 2.6, -9.5 + bob, 1.5, cast ? '#ff9bf0' : '#c8a0ff');
      line(ctx, 11 * fx, 9, 11 * fx, -16 + bob, '#6a5030', 2); circ(ctx, 11 * fx, -18 + bob, 3, cast ? '#ff9bf0' : '#a060e0', 1);
      break;
    }
    case 'shade': {   // Sombra: pequeña mancha oscura con ojos rojos que flota
      const bob = Math.sin(a * 9) * 1.6;
      shadow(ctx, 0, 6, 6, 2, 0.2);
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(-6, 3 + bob); ctx.quadraticCurveTo(-7, -9 + bob, 0, -10 + bob); ctx.quadraticCurveTo(7, -9 + bob, 6, 3 + bob);
      ctx.lineTo(3, 0 + bob); ctx.lineTo(0, 4 + bob); ctx.lineTo(-3, 0 + bob); ctx.closePath();
      ctx.fillStyle = C('#1c1424'); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OL; ctx.stroke();
      ctx.globalAlpha = 1;
      circ(ctx, -2.2, -4 + bob, 1.3, '#ff3030'); circ(ctx, 2.2, -4 + bob, 1.3, '#ff3030');
      break;
    }
    case 'laser': {   // Vigía: ojo grande sobre un pedestal de piedra; el rayo se dibuja desde el ojo
      const aim = e.state === 'aim', fire = e.state === 'fire';
      if ((aim || fire) && e.len) {
        const c0 = Math.cos(e.ang), s0 = Math.sin(e.ang), ex = c0 * e.len, ey = s0 * e.len - 4;
        ctx.save(); ctx.lineCap = 'round';
        if (aim) { ctx.globalAlpha = 0.25 + 0.5 * Math.min(1, e.t / 0.9); ctx.strokeStyle = '#ff4030'; ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(ex, ey); ctx.stroke(); }
        else {
          const k = 1 - e.t / 0.5;
          ctx.strokeStyle = 'rgba(255,60,40,0.55)'; ctx.lineWidth = 12 * (0.5 + k); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.strokeStyle = '#fff2e0'; ctx.lineWidth = 4 * (0.5 + k); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(ex, ey); ctx.stroke();
        }
        ctx.restore();
      }
      shadow(ctx, 0, 11, 14, 4.5, 0.3);
      fillRR(ctx, -10, 1, 20, 11, 4, C(champ ? '#8a5a4a' : '#6e6a64'), 1.5);
      circ(ctx, 0, -5, 11, C(champ ? '#b05a4a' : '#8a867e'), 1.6);
      ell(ctx, 0, -5, 8, fire ? 7.5 : aim ? 6.5 : 5.2, '#f4ecdc', 1.2);
      circ(ctx, aim || fire ? Math.cos(e.ang) * 3 : 0, -5 + (aim || fire ? Math.sin(e.ang) * 2.5 : 0), 3.4, fire ? '#ff3020' : aim ? '#d04030' : '#2a1a1a');
      break;
    }
    case 'enrager': {   // Furioso: bola de carne con cejas; al quedarse solo se pone roja y echa vapor
      const rage = e.enraged, bob = Math.sin(a * (rage ? 24 : 8)) * (rage ? 2 : 1.2), k = rage ? 1.08 : 1;
      shadow(ctx, 0, 9, 12 * k, 4, 0.3);
      if (rage) { ctx.globalAlpha = 0.5; for (let i = 0; i < 3; i++) circ(ctx, -7 + i * 7, -17 - ((a * 40 + i * 5) % 9), 2.6, '#ffd0c0'); ctx.globalAlpha = 1; }
      ell(ctx, 0, -3 + bob, 11.5 * k, 11 * k, C(rage ? '#d03a28' : champ ? '#b05a4a' : '#c88a58'), 1.6);
      ell(ctx, 0, 2 + bob, 6.5, 4.5, C(rage ? '#e86a50' : '#dcb088'));
      line(ctx, -7, -9 + bob, -2, -6.5 + bob, '#1a0a05', 2); line(ctx, 7, -9 + bob, 2, -6.5 + bob, '#1a0a05', 2);
      circ(ctx, -4, -5 + bob, 1.7, rage ? '#fff' : '#111'); circ(ctx, 4, -5 + bob, 1.7, rage ? '#fff' : '#111');
      line(ctx, -4, 4 + bob, 4, 4 + bob, OL, 1.6);
      break;
    }
    case 'phaser': {   // Espectro: gárgola traslúcida; fundida con una roca se ve apenas
      const bob = Math.sin(a * 5) * 2.2, f = e.fused;
      shadow(ctx, 0, 10, 10, 3, f ? 0.05 : 0.2);
      ctx.globalAlpha = f ? 0.3 : 0.88;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -8 + bob); ctx.quadraticCurveTo(s * 20, -20 + bob, s * 17, -3 + bob); ctx.quadraticCurveTo(s * 11, -6 + bob, s * 6, -2 + bob); ctx.closePath(); ctx.fillStyle = C('#8a96a4'); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OL; ctx.stroke(); }
      ell(ctx, 0, -2 + bob, 9, 11, C(champ ? '#9a6a6a' : '#a8b2be'), 1.5);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 4, -12 + bob); ctx.lineTo(s * 8, -19 + bob); ctx.lineTo(s * 7, -11 + bob); ctx.closePath(); ctx.fillStyle = C('#6e7886'); ctx.fill(); ctx.stroke(); }
      circ(ctx, -3.2, -4 + bob, 1.7, '#e8f4ff'); circ(ctx, 3.2, -4 + bob, 1.7, '#e8f4ff');
      line(ctx, -3, 3 + bob, 3, 3 + bob, OL, 1.2);
      ctx.globalAlpha = 1;
      break;
    }
    case 'shell': {   // Escarabajo: caparazón alargado hacia donde mira, con una placa metálica al frente
      const w = Math.sin(a * 9) * 1.4;
      shadow(ctx, 0, 9, 15, 4.5, 0.3);
      ctx.save(); ctx.translate(0, -3); ctx.rotate(e.hd);
      for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) line(ctx, k * 5, s * 8, k * 5 + 3 + w * s, s * 13, '#2a2e36', 1.6);
      ell(ctx, -1, 0, 14, 10.5, C(champ ? '#8a3a3a' : '#59626f'), 1.6);
      line(ctx, -9, 0, 8, 0, 'rgba(0,0,0,0.35)', 1.2);
      for (const k of [-5, 1]) line(ctx, k, -8, k, 8, 'rgba(0,0,0,0.25)', 1);
      ell(ctx, 12, 0, 5, 4.5, C('#3a3f48'), 1.2);
      circ(ctx, 14, -2, 1.1, '#e8e0c0'); circ(ctx, 14, 2, 1.1, '#e8e0c0');
      ctx.beginPath(); ctx.arc(0, 0, 14.5, -1.15, 1.15); ctx.strokeStyle = C('#aab4c0'); ctx.lineWidth = 3.5; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'miner': {   // Minero: figurilla con casco amarillo y lámpara; se agacha al soltar una mina
      const bob = Math.sin(a * 8) * 1.2, dip = e.shoot > 0 ? 3 : 0;
      shadow(ctx, 0, 9, 10, 3.5, 0.28);
      ctx.save(); ctx.scale(fx, 1); ctx.translate(0, dip);
      ell(ctx, 0, -3 + bob, 9, 9.5, C(champ ? '#a05040' : '#8a6a4a'), 1.5);
      circ(ctx, 0, -12 + bob, 7, C('#d9b9a0'), 1.4);
      ctx.beginPath(); ctx.arc(0, -13 + bob, 7.5, Math.PI, 0); ctx.closePath(); ctx.fillStyle = C('#e2b23a'); ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OL; ctx.stroke();
      circ(ctx, 5, -15 + bob, 2, '#fff7c0', 1);
      circ(ctx, -2.5, -11 + bob, 1.2, '#111'); circ(ctx, 2.5, -11 + bob, 1.2, '#111');
      ell(ctx, -9, -2 + bob, 3.5, 4.5, C('#5a4630'), 1.2);
      ctx.restore();
      break;
    }
    case 'mine': {    // Mina: disco con púas; parpadea en rojo al armarse
      const armed = e.arm <= 0, on = armed ? Math.floor(a * 6) % 2 === 0 : Math.floor(a * 14) % 2 === 0;
      shadow(ctx, 0, 6, 9, 3, 0.3);
      for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; line(ctx, Math.cos(t) * 6, Math.sin(t) * 3.6 - 2, Math.cos(t) * 10, Math.sin(t) * 6 - 2, '#2a2a30', 2); }
      ell(ctx, 0, -2, 8, 5.5, C('#3a3a42'), 1.5);
      circ(ctx, 0, -3.5, 2.2, on ? (armed ? '#ff3030' : '#ffb030') : '#5a1a1a', 0.8);
      break;
    }
    case 'blinker': {   // Parpadeo: llama etérea con un ojo, flota y deja chispas
      const bob = Math.sin(a * 4) * 3, hy = -12 + bob, fl = 0.75 + Math.sin(a * 17) * 0.2;
      shadow(ctx, 0, 9, 8, 2.8, 0.15);
      for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.18 * fl; circ(ctx, Math.sin(a * 3 + k * 2) * 7, hy + 9 + k * 4, 5 - k, '#9a7ae0'); }
      ctx.globalAlpha = 0.92 * fl;
      ctx.beginPath(); ctx.moveTo(-8, hy + 6); ctx.quadraticCurveTo(-11, hy - 6, 0, hy - 17); ctx.quadraticCurveTo(11, hy - 6, 8, hy + 6);
      ctx.quadraticCurveTo(0, hy + 12, -8, hy + 6); ctx.closePath();
      ctx.fillStyle = C(champ ? '#c05a7a' : '#8a6ad0'); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OL; ctx.stroke();
      ctx.globalAlpha = 1;
      ell(ctx, 0, hy - 1, 4.5, e.shoot > 0 ? 5 : 3.6, '#f4ecff', 1); circ(ctx, 0, hy - 0.5, 2, '#1a0f33');
      break;
    }
    case 'mortar': {   // Mortero: barrilete de piedra con un tubo; las marcas del suelo indican dónde caerán los proyectiles
      shadow(ctx, 0, 10, 13, 4, 0.3);
      if (e.marks) for (const m of e.marks) {
        const k = 1 - m.t / m.max;
        ctx.save(); ctx.translate(m.x - e.x, m.y - e.y);
        ctx.globalAlpha = 0.25 + 0.4 * k; ctx.strokeStyle = '#d04030'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(0, 0, 14 - 6 * k, 8 - 3.5 * k, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      fillRR(ctx, -11, -10, 22, 20, 5, C(champ ? '#8a5a4a' : '#7a756c'), 1.6);
      for (const k of [-4, 3]) line(ctx, -9, k, 9, k, 'rgba(0,0,0,0.25)', 1);
      fillRR(ctx, -4.5, -20 - (e.shoot > 0 ? 1.5 : 0), 9, 13, 3, C('#3d3a36'), 1.5);
      ell(ctx, 0, -20 - (e.shoot > 0 ? 1.5 : 0), 4.5, 2.2, '#111');
      if (e.shoot > 0) circ(ctx, 0, -24, 4 + e.shoot * 8, 'rgba(255,200,90,0.7)');
      break;
    }
    case 'cross': {   // Aspa: cuerpo claro con cuatro brazos; los brazos giran a diagonal cuando toca la volea diagonal
      const bob = Math.sin(a * 5) * 1.5, flash = e.shoot > 0;
      shadow(ctx, 0, 9, 11, 3.5, 0.28);
      ctx.save(); ctx.translate(0, -6 + bob); ctx.rotate(e.diag ? Math.PI / 4 : 0);
      for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(k * Math.PI / 2); ell(ctx, 0, -12 - (flash ? 3 : 0), 4, 5, C(champ ? '#8a2020' : '#9c8c6c'), 1.3); ctx.restore(); }
      ctx.restore();
      circ(ctx, 0, -6 + bob, 9.5, C(champ ? '#a03030' : '#c8b896'), 1.5);
      ell(ctx, 0, -7 + bob, 4.5, 4, '#f4ecdc', 1); circ(ctx, 0, -6.5 + bob, 2, '#1a1010');
      break;
    }
    case 'jelly': case 'jellet': {   // Gelatina: masa translúcida que se aplasta al andar
      const k = e.type === 'jellet' ? 0.62 : 1, sq = Math.sin(a * 7) * 0.08;
      shadow(ctx, 0, 9 * k + 1, 13 * k, 4 * k, 0.28);
      ctx.save(); ctx.scale(1 + sq, 1 - sq);
      ell(ctx, 0, -4 * k, 14 * k, 11 * k, C(champ ? '#b0463c' : 'rgba(110,190,160,0.9)'), 1.5);
      ell(ctx, -4.5 * k, -9 * k, 4 * k, 2.4 * k, 'rgba(255,255,255,0.5)');
      circ(ctx, -4 * k * fx, -4 * k, 2 * k + 0.4, '#16302a'); circ(ctx, 4 * k * fx, -4 * k, 2 * k + 0.4, '#16302a');
      ctx.restore();
      break;
    }
    case 'mole': {   // Topo: bajo tierra es un montículo que avanza; arriba asoma de su agujero
      if (e.state !== 'up') {
        shadow(ctx, 0, 6, 12, 4, 0.25);
        ell(ctx, 0, 2, 12, 6.5 + Math.sin(a * 10), '#5b4130', 1.3);
        ell(ctx, -3, 0, 6, 3, '#7a5a42');
        for (const s of [-1, 1]) circ(ctx, s * (10 + Math.sin(a * 9 + s) * 2), 5 + (s > 0 ? 1 : 0), 1.6, '#6a4c36');
        break;
      }
      const up = Math.min(1, e.t / 0.18);
      shadow(ctx, 0, 8, 12, 4, 0.3);
      ell(ctx, 0, 6, 13, 6, '#2a1a10', 1.2);
      ctx.save(); ctx.translate(0, 6 - 14 * up);
      ell(ctx, 0, 0, 10.5, 11, C(champ ? '#a04030' : '#7a5a44'), 1.5);
      ell(ctx, 0, 3, 6, 5, C('#a88868'));
      circ(ctx, 0, 0.5, 3.2, C('#d98a86'), 1);
      circ(ctx, -4.5, -4, 1.5, '#111'); circ(ctx, 4.5, -4, 1.5, '#111');
      for (const s of [-1, 1]) ell(ctx, s * 11, 5, 3.5, 2.2, C('#d9b9a0'), 1.1);
      ctx.restore();
      break;
    }
    case 'slug': {   // Baboso: babosa verdosa con dos ojos en tallos y rastro brillante
      const w = Math.sin(a * 5) * 1.6;
      shadow(ctx, 0, 9, 14, 4, 0.28);
      ctx.save(); ctx.scale(fx, 1);
      ell(ctx, 1, 5.5, 11, 2.6, 'rgba(210,225,120,0.55)');
      ell(ctx, -6, 2, 9, 6, C(champ ? '#a85040' : '#7d8a3a'), 1.3);
      ell(ctx, 3, w * 0.3, 10, 8, C(champ ? '#b86050' : '#9aa84a'), 1.5);
      for (const k of [-1, 1]) { line(ctx, 8, -6, 11 + k, -13 + k * w, '#586028', 1.4); circ(ctx, 11 + k, -13 + k * w, 2, '#f0ecd0', 1); circ(ctx, 11.5 + k, -13 + k * w, 0.9, '#111'); }
      ctx.restore();
      break;
    }
    case 'pooter': {
      const bob = Math.sin(a * 6) * 2, hy = -14 + bob, w = Math.abs(Math.sin(a * 36));
      shadow(ctx, 0, 8, 9, 3, 0.25);
      ell(ctx, -8, hy - 7, 7, 3 + w * 3, 'rgba(220,220,235,0.7)', 1, 'rgba(0,0,0,0.4)', -0.6);
      ell(ctx, 8, hy - 7, 7, 3 + w * 3, 'rgba(220,220,235,0.7)', 1, 'rgba(0,0,0,0.4)', 0.6);
      circ(ctx, 0, hy, 10, C(champ ? '#8a2020' : '#4f3d3a'), 1.5);
      ell(ctx, -3.5 * fx, hy - 3, 3, 3.4, '#f0e6d8', 1); ell(ctx, 3.5 * fx, hy - 3, 3, 3.4, '#f0e6d8', 1);
      circ(ctx, -3 * fx + fx, hy - 2.5, 1.5, '#111'); circ(ctx, 4 * fx, hy - 2.5, 1.5, '#111');
      if (e.shoot > 0) ell(ctx, fx * 1, hy + 4, 3.5, 3.5, '#2a0505'); else line(ctx, -3, hy + 4, 3, hy + 4, OL, 1.2);
      break;
    }
    case 'gaper': case 'globin': case 'fatty': {
      if (e.type === 'globin' && e.state === 'goo') {
        const pl = 1 + Math.sin(a * 6) * 0.08;
        ell(ctx, 0, 2, 14 * pl, 7 * pl, C('#8a1a1a'), 1.2);
        circ(ctx, -4, 0, 2.5 + Math.sin(a * 9) * 1, '#b8302a'); circ(ctx, 5, 3, 2, '#b8302a');
        break;
      }
      const fat = e.type === 'fatty';
      const skin = C(champ ? '#d07070' : e.type === 'globin' ? '#b0362e' : fat ? '#d8bca4' : '#cbb5a3');
      const st = Math.sin(a * 9) * 2;
      shadow(ctx, 0, 10, fat ? 17 : 11, fat ? 5 : 4, 0.32);
      ell(ctx, -4, 9 + st * 0.5, 3, 3.5, skin, 1.2); ell(ctx, 4, 9 - st * 0.5, 3, 3.5, skin, 1.2);
      if (fat) {
        ell(ctx, 0, -6, 17, 15, skin, 1.6);
        ctx.beginPath(); ctx.arc(0, -2, 10, 0.3, Math.PI - 0.3); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.2; ctx.stroke();
        circ(ctx, 0, -22, 8.5, skin, 1.4);
        circ(ctx, -3, -23, 1.6, '#111'); circ(ctx, 3, -23, 1.6, '#111'); ell(ctx, 0, -18.5, 2, 1.5, '#2a0a0a');
      } else {
        ell(ctx, 0, 2, 8, 8.5, skin, 1.4);
        circ(ctx, 0, -13, 12, skin, 1.6);
        ell(ctx, -4.5 + fx, -15, 3.2, 4.2, '#0e0606'); ell(ctx, 4.5 + fx, -15, 3.2, 4.2, '#0e0606');
        ell(ctx, fx, -6, 4, 4.8, '#1a0404');
        line(ctx, fx + 1, -2, fx + 1, 2 + Math.sin(a * 3) * 1, '#8a0e0e', 1.6);
        if (e.type === 'globin') { circ(ctx, -7, -8, 2, 'rgba(255,255,255,0.15)'); }
      }
      break;
    }
    case 'horf': {
      const sh = Math.sin(a * 50) * 1;
      shadow(ctx, 0, 6, 9, 3, 0.22);
      circ(ctx, sh, -12, 12, C(champ ? '#d07070' : '#c9ad98'), 1.6);
      line(ctx, -7 + sh, -15, -2 + sh, -14, '#111', 2.2); line(ctx, 2 + sh, -14, 7 + sh, -15, '#111', 2.2);
      ell(ctx, sh, -6, e.shoot > 0 ? 5 : 3.5, e.shoot > 0 ? 5 : 3, '#2a0505');
      break;
    }
    case 'clotty': {
      const w = Math.sin(a * 5) * 1.5;
      shadow(ctx, 0, 7, 12, 4, 0.28);
      const col = C(champ ? '#e04a4a' : '#8e1c1c');
      circ(ctx, -6, -6 + w, 7, col, 1.3); circ(ctx, 6, -5 - w, 7, col, 1.3); circ(ctx, 0, -10, 9, col, 1.3); circ(ctx, 0, -2, 8, col, 0);
      circ(ctx, -3.5, -11, 2.5, '#f0e0d0', 0.8); circ(ctx, 3.5, -11, 2.5, '#f0e0d0', 0.8);
      circ(ctx, -3.5, -10.5, 1.2, '#111'); circ(ctx, 3.5, -10.5, 1.2, '#111');
      if (e.shoot > 0) ell(ctx, 0, -4, 3, 2.5, '#2a0303');
      break;
    }
    case 'spider': case 'bigspider': {
      const big = e.type === 'bigspider' ? 1.5 : 1;
      ctx.scale(big, big);
      shadow(ctx, 0, 4, 9, 3, 0.25);
      const lw = e.state ? Math.sin(a * 30) * 0.4 : 0;
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
        const ang = (-0.9 + i * 0.6) + (i % 2 ? lw : -lw);
        ctx.beginPath(); ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(sd * Math.cos(ang) * 8, -4 + Math.sin(ang) * 6 - 5, sd * Math.cos(ang) * 11, -4 + Math.sin(ang) * 8 + 4);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      ell(ctx, 0, -4, 6, 5, C(champ ? '#7a1414' : '#1a1414'), 1, '#000');
      circ(ctx, -2, -6, 1.2, '#ff3a3a'); circ(ctx, 2, -6, 1.2, '#ff3a3a');
      break;
    }
    case 'charger': {
      const dx = e.dirx || 1, dy = e.diry || 0;
      shadow(ctx, 0, 5, 11, 4, 0.25);
      const wig = Math.sin(a * 14) * 1.5;
      const col = C(champ ? '#e08080' : '#e6d8c0');
      for (let i = 3; i >= 1; i--) circ(ctx, -dx * i * 5.5 - dy * wig * (i % 2 ? 1 : -1), -4 - dy * i * 5.5 + dx * wig * (i % 2 ? 1 : -1) * 0.4, 7 - i * 0.8, col, 1.2);
      circ(ctx, dx * 2, -4 + dy * 2, 7.5, C(champ ? '#c05050' : '#d8a898'), 1.3);
      circ(ctx, dx * 5 - dy * 3, -5 + dy * 5 + dx * 0, 1.5, '#111'); circ(ctx, dx * 5 + dy * 3, -5 + dy * 5 - dx * 3, 1.5, '#111');
      break;
    }
    case 'hopper': case 'leaper': {
      const big = e.type === 'leaper' ? 1.25 : 1;
      shadow(ctx, 0, 8, 10 * big * (1 - Math.min(0.6, e.z / 140)), 3.5 * big, 0.3);
      ctx.translate(0, -e.z);
      ctx.scale(big, big);
      const skin = C(champ ? '#d07070' : e.type === 'leaper' ? '#c7a48a' : '#d9bfa6');
      const tuck = e.z > 2 ? 3 : 0;
      ell(ctx, -6, 6 - tuck, 4, 3, skin, 1.2); ell(ctx, 6, 6 - tuck, 4, 3, skin, 1.2);
      ell(ctx, 0, -4, 9, 9, skin, 1.5);
      circ(ctx, -3, -6, 1.8, '#111'); circ(ctx, 3, -6, 1.8, '#111');
      line(ctx, -3, -1, 3, -1, '#3a1a10', 1.2);
      break;
    }
    case 'boomfly': {
      const bob = Math.sin(a * 8) * 2, hy = -14 + bob, w = Math.abs(Math.sin(a * 38));
      shadow(ctx, 0, 6, 9, 3, 0.25);
      ell(ctx, -8, hy - 7, 7, 3 + w * 3, 'rgba(230,220,220,0.7)', 1, 'rgba(0,0,0,0.4)', -0.6);
      ell(ctx, 8, hy - 7, 7, 3 + w * 3, 'rgba(230,220,220,0.7)', 1, 'rgba(0,0,0,0.4)', 0.6);
      circ(ctx, 0, hy, 10, C(champ ? '#e04a1a' : '#c8501e'), 1.5);
      ell(ctx, 0, hy + 1, 6, 5.5, '#f0e2c8');
      circ(ctx, -2.3, hy, 1.7, '#3a0a0a'); circ(ctx, 2.3, hy, 1.7, '#3a0a0a');
      line(ctx, -2, hy + 4, 2, hy + 4, '#3a0a0a', 1);
      break;
    }
    case 'host': {
      const up = e.state === 1 ? Math.min(1, e.t / 0.2) * (e.t > 1.15 ? Math.max(0, 1 - (e.t - 1.15) / 0.2) : 1) : 0;
      const h = up * 14;
      shadow(ctx, 0, 8, 13, 4, 0.3);
      if (h > 0.5) {
        fillRR(ctx, -7, -6 - h, 14, h + 6, 5, C('#c06656'), 1.2);
        circ(ctx, 0, -6 - h * 0.4, 5.5, C('#d07a68'), 1.2);
        circ(ctx, -2, -7 - h * 0.4, 1.3, '#111'); circ(ctx, 2, -7 - h * 0.4, 1.3, '#111');
        ell(ctx, 0, -3 - h * 0.4, 2, 1.6, '#2a0505');
      }
      ctx.save(); ctx.translate(0, -h);
      ctx.beginPath(); ctx.arc(0, -4, 13, Math.PI, 0); ctx.lineTo(13, 3); ctx.quadraticCurveTo(0, 7, -13, 3); ctx.closePath();
      ctx.fillStyle = C(champ ? '#e8b0a0' : '#e6dcc4'); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
      ell(ctx, -5, -6, 3.5, 4, '#1a1210'); ell(ctx, 5, -6, 3.5, 4, '#1a1210');
      ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(0, -3); ctx.lineTo(1.5, 0); ctx.fillStyle = '#1a1210'; ctx.fill();
      ctx.restore();
      break;
    }
    case 'mulligan': {
      shadow(ctx, 0, 9, 12, 4, 0.3);
      const pl = 1 + Math.sin(a * 4) * 0.04;
      const st = Math.sin(a * 9) * 2;
      ell(ctx, -4, 9 + st * 0.5, 3, 3.5, C('#c9a8b8'), 1.2); ell(ctx, 4, 9 - st * 0.5, 3, 3.5, C('#c9a8b8'), 1.2);
      ell(ctx, 0, -8, 13 * pl, 14 * pl, C(champ ? '#d07070' : '#cba7b6'), 1.6);
      for (const [dx, dy] of [[-6, -2], [5, -10], [3, 1], [-3, -14], [7, -3]]) circ(ctx, dx, dy, 1.8, '#3a2030');
      circ(ctx, -3, -15, 1.4, '#111'); circ(ctx, 3, -15, 1.4, '#111');
      ell(ctx, 0, -10, 2.5, 2, '#3a0a0a');
      break;
    }
    case 'hive': {
      shadow(ctx, 0, 8, 14, 4, 0.3);
      ell(ctx, 0, -10, 14, 16, C(champ ? '#a05040' : '#6e4c2c'), 1.6);
      for (const [dx, dy] of [[-5, -14], [4, -8], [-3, -3], [6, -17]]) ell(ctx, dx, dy, 2.6, 2, '#1a0c06');
      for (let i = 0; i < 2; i++) { const an = a * 5 + i * Math.PI; circ(ctx, Math.cos(an) * 18, -12 + Math.sin(an) * 8, 2, '#111'); }
      break;
    }
    case 'seg': case 'gusano': {
      const head = e.type === 'gusano';
      shadow(ctx, 0, 8, 13, 4, 0.3);
      const col = C(head ? '#c47c64' : '#b8725c');
      circ(ctx, 0, -6, head ? 15 : 13, col, 1.6);
      ctx.beginPath(); ctx.arc(0, -6, head ? 10 : 8, 0.2, Math.PI - 0.2); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.2; ctx.stroke();
      if (head) {
        const dx = e.dir ? e.dir.x : 0, dy = e.dir ? e.dir.y : 1;
        circ(ctx, -4 + dx * 4, -9 + dy * 3, 2.4, '#111'); circ(ctx, 4 + dx * 4, -9 + dy * 3, 2.4, '#111');
        ell(ctx, dx * 6, -2 + dy * 4, 4, 3, '#2a0505');
      }
      break;
    }
    case 'babosa': {   // Reina Babosa: babosa enorme con dos ojos en tallos; abre la boca al escupir y se hincha al parir
      const spit = e.state === 'spit' && e.t > 0.2, birth = e.state === 'birth', crawl = Math.sin(a * 4) * 2;
      shadow(ctx, 0, 12, 46, 12, 0.35);
      ctx.save(); ctx.scale(fx, 1);
      if (birth) { ctx.globalAlpha = 0.35; ell(ctx, 4, -18, 40 + Math.sin(a * 30) * 3, 31, '#d8f070'); ctx.globalAlpha = 1; }
      ell(ctx, -4, 9, 50, 6, 'rgba(210,230,120,0.5)');
      ell(ctx, -28, -6, 25, 16, C('#6f8a2e'), 2);
      ell(ctx, 6, -18 + crawl * 0.3, 35, 27, C('#8ea83a'), 2);
      for (const k of [-16, -4, 8]) { ctx.beginPath(); ctx.arc(k, -16, 24, -2.3, -0.9); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2; ctx.stroke(); }
      ell(ctx, 10, -28, 14, 6, 'rgba(255,255,255,0.18)');
      for (const s of [-1, 1]) {
        const ex = 26 + s * 13, ey = -58 + crawl * s;
        line(ctx, 22 + s * 7, -36, ex, ey, '#586028', 3.2);
        circ(ctx, ex, ey, 6.5, '#f6f0d0', 1.5); circ(ctx, ex + 2, ey, 2.8, '#111');
      }
      if (spit) { ell(ctx, 33, -13, 9, 11, '#241008', 1.6); for (let i = -1; i <= 1; i++) line(ctx, 30 + i * 3, -21, 30 + i * 3, -17, '#f0e8d0', 1.6); }
      else ctx.beginPath(), ctx.moveTo(22, -12), ctx.quadraticCurveTo(31, -8, 40, -12), ctx.strokeStyle = '#2a1a08', ctx.lineWidth = 2.4, ctx.stroke();
      ctx.restore();
      break;
    }
    case 'gtopo': {   // Gran Topo: bajo tierra es un montículo; el aviso es un anillo en el suelo; arriba asoma de su agujero
      if (e.state === 'mark') {
        const k = Math.min(1, e.t / 0.9);
        ctx.save(); ctx.translate(e.tx - e.x, e.ty - e.y);
        ctx.globalAlpha = 0.2 + 0.2 * k; ell(ctx, 0, 6, 44, 18, '#d04030');
        ctx.globalAlpha = 0.5 + 0.4 * k; ctx.strokeStyle = '#ff5a40'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(0, 6, 46 - 14 * k, 19 - 6 * k, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      if (e.state === 'dig' || e.state === 'mark') {
        shadow(ctx, 0, 8, 34, 10, 0.28);
        ell(ctx, 0, 2, 40, 17 + Math.sin(a * 9) * 1.5, '#5b4130', 2);
        ell(ctx, -8, -2, 22, 8, '#7a5a42');
        for (const s of [-1, 1]) for (let i = 0; i < 2; i++) circ(ctx, s * (34 + i * 8 + Math.sin(a * 8 + s + i) * 3), 8 + i * 3, 2.4 - i * 0.6, '#6a4c36');
        break;
      }
      const up = Math.min(1, e.t / 0.25);
      shadow(ctx, 0, 12, 38, 11, 0.38);
      ell(ctx, 0, 9, 42, 14, '#2a1a10', 1.6);
      ctx.save(); ctx.translate(0, 9 - 34 * up);
      for (const s of [-1, 1]) { ell(ctx, s * 32, 4, 13, 9, C('#d9b9a0'), 1.8); for (let i = -1; i <= 1; i++) line(ctx, s * (32 + i * 4), 10, s * (35 + i * 5), 17, '#3a2a20', 2.2); }
      ell(ctx, 0, -8, 31, 33, C('#7a5a44'), 2.2);
      ell(ctx, 0, 2, 19, 19, C('#a88868'));
      circ(ctx, 0, -6, 8.5, C('#d98a86'), 1.6);
      for (const s of [-1, 1]) { circ(ctx, s * 12, -20, 3.2, '#111'); line(ctx, s * 19, -27, s * 6, -23, '#2a1a10', 2.6); }
      ctx.restore();
      break;
    }
    case 'mfly': {   // Moscardón: mosca enorme de alas verdosas; abre las mandíbulas al disparar
      const bob = Math.sin(a * 5) * 3, w = Math.abs(Math.sin(a * 38));
      shadow(ctx, 0, 10, 20, 6, 0.28);
      ctx.translate(0, -24 + bob);
      ell(ctx, -20, -12, 16, 7 + w * 8, 'rgba(190,230,200,0.65)', 1.2, 'rgba(0,0,0,0.4)', -0.5);
      ell(ctx, 20, -12, 16, 7 + w * 8, 'rgba(190,230,200,0.65)', 1.2, 'rgba(0,0,0,0.4)', 0.5);
      ell(ctx, 0, 6, 12, 14, C('#2a3a22'), 1.8);
      for (const k of [-3, 4, 11]) line(ctx, -10, k, 10, k, 'rgba(120,200,90,0.4)', 1.6);
      ell(ctx, 0, -6, 17, 15, C(champ ? '#8a3030' : '#3a4c2a'), 2);
      ell(ctx, -8, -10, 7, 8, '#c82020', 1.4); ell(ctx, 8, -10, 7, 8, '#c82020', 1.4);
      circ(ctx, -9, -12, 2, 'rgba(255,255,255,0.6)'); circ(ctx, 7, -12, 2, 'rgba(255,255,255,0.6)');
      if (e.shoot > 0) { line(ctx, -3, 2, -6, 9, '#e8e0c0', 2.2); line(ctx, 3, 2, 6, 9, '#e8e0c0', 2.2); } else { line(ctx, -2, 2, -2, 6, '#e8e0c0', 2); line(ctx, 2, 2, 2, 6, '#e8e0c0', 2); }
      break;
    }
    case 'mgolem': {   // Gólem menor: bloque de roca con ojos de brasa; se agacha al pisar y marca dónde caen los peñascos
      const st = e.state === 'stomp', sq = st ? Math.min(1, e.t / 0.5) * 7 : 0;
      if (e.marks) for (const m of e.marks) {
        const k = 1 - m.t / m.max;
        ctx.save(); ctx.translate(m.x - e.x, m.y - e.y); ctx.globalAlpha = 0.25 + 0.45 * k; ctx.strokeStyle = '#e0502e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 20 - 7 * k, 11 - 4 * k, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ctx.globalAlpha = 1;
      shadow(ctx, 0, 11, 28, 8, 0.34);
      ctx.translate(0, sq);
      const sw = Math.sin(a * 3) * 1.2;
      for (const s of [-1, 1]) ell(ctx, s * 27, -14 + sw * s - (st ? 8 : 0), 9, 12, C('#7a7a72'), 1.8);
      ell(ctx, -9, 4, 10, 8, C('#6e6e66'), 1.8); ell(ctx, 9, 4, 10, 8, C('#6e6e66'), 1.8);
      ell(ctx, 0, -18, 24, 24, C(champ ? '#9a6a60' : '#8c8c84'), 2.2);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-4, -20); ctx.lineTo(-10, -30); ctx.stroke();
      ell(ctx, 0, -34, 12, 10, C('#9a9a92'), 1.8);
      circ(ctx, -4, -34, 2.8, st ? '#ffb040' : '#ff7a30'); circ(ctx, 4, -34, 2.8, st ? '#ffb040' : '#ff7a30');
      line(ctx, -8, -39, -2, -37, '#1a1a18', 2); line(ctx, 8, -39, 2, -37, '#1a1a18', 2);
      break;
    }
    case 'mshaman': {   // Chamán: máscara tribal flotante con plumas y un báculo de hueso; el aro se enciende al lanzar
      const bob = Math.sin(a * 4) * 2.4, cast = e.shoot > 0 || (e.t > 0.5 && e.t < 0.8);
      shadow(ctx, 0, 10, 14, 4, 0.2);
      ctx.translate(0, -10 + bob);
      ctx.beginPath(); ctx.moveTo(-11, 8); ctx.quadraticCurveTo(-14, -6, 0, -14); ctx.quadraticCurveTo(14, -6, 11, 8); ctx.quadraticCurveTo(0, 16, -11, 8); ctx.closePath();
      ctx.fillStyle = C(champ ? '#8a3a4a' : '#2f6a62'); ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = OL; ctx.stroke();
      for (const [x, y, c2] of [[-8, -15, '#e8c050'], [0, -19, '#d8503a'], [8, -15, '#e8c050']]) { ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x + (x > 0 ? 5 : x < 0 ? -5 : 0), y - 6, x, y - 11); ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.stroke(); }
      ell(ctx, 0, -2, 9, 11, C('#e8dcc0'), 1.6);
      ell(ctx, -3.5, -4, 2.6, 3.6, '#1a1a18'); ell(ctx, 3.5, -4, 2.6, 3.6, '#1a1a18');
      line(ctx, -3, 4, 3, 4, '#1a1a18', 1.6); for (const k of [-2, 0, 2]) line(ctx, k, 3, k, 6, '#1a1a18', 1);
      line(ctx, 15, 14, 15, -18, '#d8d0b0', 2.6);
      circ(ctx, 15, -21, 5, cast ? '#7affea' : '#58c8b8', 1.4);
      if (cast) { ctx.globalAlpha = 0.3; circ(ctx, 15, -21, 11, '#7affea'); ctx.globalAlpha = 1; }
      break;
    }
    case 'mcrab': {   // Cangrejo: caparazón rojo con dos pinzas; las alza al avisar, las lleva al frente al embestir y marea al chocar
      const wind = e.state === 'windup', dash = e.state === 'dash', stun = e.state === 'stun';
      shadow(ctx, 0, 10, 24, 7, 0.3);
      const leg = Math.sin(a * 14) * 2;
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(ctx, s * (10 + k * 3), 2, s * (20 + k * 3), 8 + (k % 2 ? leg : -leg), '#6a1a12', 2.2);
      for (const s of [-1, 1]) {
        const cx = s * 24, cy = -8 - (wind ? 14 : 0) + (dash ? 10 : 0);
        line(ctx, s * 12, -4, cx, cy, '#9a2a1c', 4);
        ell(ctx, cx, cy - 4, 9, 7, C(champ ? '#b05a4a' : '#c8402c'), 1.8);
        ctx.beginPath(); ctx.moveTo(cx - 4 * s, cy - 8); ctx.lineTo(cx + 3 * s, cy - 15); ctx.lineTo(cx + 4 * s, cy - 8); ctx.closePath(); ctx.fillStyle = C('#e0583c'); ctx.fill(); ctx.stroke();
      }
      ell(ctx, 0, -8, 21, 15, C(champ ? '#a85040' : '#c8402c'), 2.2);
      ell(ctx, -4, -13, 12, 5, 'rgba(255,255,255,0.22)');
      for (const s of [-1, 1]) { line(ctx, s * 6, -18, s * 8, -26, '#6a1a12', 2); circ(ctx, s * 8, -28, 4, '#f6f0d0', 1.3); circ(ctx, s * 8 + (stun ? Math.sin(a * 12) * 1.4 : 0), -28, 1.7, '#111'); }
      if (stun) for (let i = 0; i < 3; i++) { const t = a * 6 + i * 2.1; circ(ctx, Math.cos(t) * 14, -38 + Math.sin(t) * 3, 2.2, '#ffe060'); }
      break;
    }
    case 'coagulo': {   // Coágulo Mayor: masa de sangre brillante que se aplasta al caer y se estira al saltar
      const hop = e.state === 'hop', air = Math.min(1, (e.z || 0) / 60);
      const sq = hop ? 1 - air * 0.12 : 1 + Math.sin(a * 6) * 0.04;
      shadow(ctx, 0, 12, 40 * (1 - air * 0.35), 12 * (1 - air * 0.35), 0.38 - air * 0.15);
      ctx.translate(0, -(e.z || 0));
      ctx.scale(1 / sq, sq);
      ell(ctx, 0, -22, 40, 34, C(champ ? '#c03040' : '#8a1620'), 2.4);
      ell(ctx, -8, -28, 30, 22, C('#a82230'));
      ell(ctx, -16, -42, 12, 6, 'rgba(255,255,255,0.35)'); ell(ctx, 12, -38, 5, 3, 'rgba(255,255,255,0.22)');
      for (const [x, y, r] of [[-30, -6, 7], [28, -4, 6], [-12, 8, 6]]) circ(ctx, x, y, r, C('#8a1620'), 1.6);
      ell(ctx, -13, -26, 5.5, 6.5, '#f4e8e0', 1.3); ell(ctx, 13, -26, 5.5, 6.5, '#f4e8e0', 1.3);
      circ(ctx, -12, -25, 2.6, '#1a0606'); circ(ctx, 14, -25, 2.6, '#1a0606');
      line(ctx, -22, -35, -8, -31, '#200406', 2.6); line(ctx, 22, -35, 8, -31, '#200406', 2.6);
      if (hop) ell(ctx, 0, -12, 11, 8 + air * 4, '#2a0408', 1.4); else { ctx.beginPath(); ctx.moveTo(-12, -12); ctx.quadraticCurveTo(0, -5, 12, -12); ctx.strokeStyle = '#200406'; ctx.lineWidth = 2.6; ctx.stroke(); }
      if (!hop) for (const x of [-18, 6]) { ctx.beginPath(); ctx.moveTo(x, -4); ctx.quadraticCurveTo(x + 2, 4 + Math.sin(a * 3 + x) * 2, x, 9); ctx.strokeStyle = '#8a1620'; ctx.lineWidth = 3; ctx.stroke(); }
      break;
    }
    case 'placenta': {   // Placenta: órgano lleno de venas que late; brilla y se hincha antes de soltar las oleadas
      const pulse = e.state === 'pulse', spiral = e.state === 'spiral';
      const warn = pulse && e.t < 0.7 ? e.t / 0.7 : 0, beat = 1 + Math.sin(a * (spiral ? 9 : 3)) * 0.035 + warn * 0.07;
      shadow(ctx, 0, 12, 42, 12, 0.36);
      if (warn) { ctx.globalAlpha = 0.25 * warn; circ(ctx, 0, -22, 54 + 10 * warn, '#ff7a8a'); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(0, -22); ctx.scale(beat, beat); ctx.translate(0, 22);
      ell(ctx, 0, -22, 40, 33, C(champ ? '#b04a5a' : '#b0586a'), 2.4);
      ell(ctx, -10, -30, 28, 20, C('#c4707e'));
      for (const [x, y, r] of [[-32, -14, 9], [30, -10, 8], [-22, 2, 8], [20, 4, 9], [0, 8, 8]]) circ(ctx, x, y, r, C('#9a4a5a'), 1.8);
      ctx.strokeStyle = 'rgba(70,10,30,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-28, -30); ctx.quadraticCurveTo(-12, -22, -4, -40); ctx.moveTo(26, -28); ctx.quadraticCurveTo(14, -16, 22, -2); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(2, -12, 14, -10); ctx.stroke();
      const eyes = warn > 0 || spiral ? 1 : 0.55;
      ell(ctx, -11, -28, 6, 7 * eyes + 1, '#f6e8e8', 1.3); ell(ctx, 11, -28, 6, 7 * eyes + 1, '#f6e8e8', 1.3);
      circ(ctx, -11, -27, 2.8, '#2a0612'); circ(ctx, 11, -27, 2.8, '#2a0612');
      if (pulse || spiral) ell(ctx, 0, -12, 7, 5 + (spiral ? 2 : warn * 4), '#2a0612', 1.2); else line(ctx, -7, -12, 7, -12, '#2a0612', 2.2);
      ctx.restore();
      // cordón enrollado
      ctx.beginPath(); ctx.moveTo(26, 4); ctx.quadraticCurveTo(46, 10, 40, -2); ctx.quadraticCurveTo(34, -10, 42, -16);
      ctx.strokeStyle = '#d8a0a8'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#8a3a4a'; ctx.lineWidth = 1.4; ctx.stroke();
      break;
    }
    case 'carcelero': {   // Carcelero: corpulento con máscara de hierro, grilletes y un manojo de llaves; alza los brazos al llamar
      const guard = e.state === 'guard', bob = Math.sin(a * 4) * 1.5;
      shadow(ctx, 0, 12, 40, 12, 0.36);
      ctx.save(); ctx.scale(fx, 1);
      ell(ctx, 0, -20 + bob, 30, 32, C('#4a4e58'), 2.4);
      ell(ctx, 0, -12 + bob, 20, 20, C('#5c616c'));
      for (const k of [-14, 0, 14]) line(ctx, k, -34 + bob, k * 0.8, -4 + bob, 'rgba(0,0,0,0.3)', 2);
      for (const s of [-1, 1]) {
        const up = guard ? 14 : 0;
        ell(ctx, s * 33, -18 - up + bob, 11, 14, C('#3e424c'), 2);
        circ(ctx, s * 36, -4 - up + bob, 6, C('#7a7e88'), 1.8);            // grillete
        for (let i = 0; i < 3; i++) circ(ctx, s * (30 + i * 4), 4 - up * 0.5 + bob + i * 3, 2.4, '#9a9ea8', 0.8);
      }
      ell(ctx, -12, 6, 12, 8, C('#33363e'), 1.8); ell(ctx, 12, 6, 12, 8, C('#33363e'), 1.8);
      circ(ctx, -16, -8 + bob, 3, '#d8b040', 1); line(ctx, -16, -8 + bob, -16, -2 + bob, '#d8b040', 1.6);   // llaves al cinto
      circ(ctx, 0, -46 + bob, 15, C('#8a8e98'), 2.2);
      ell(ctx, 0, -46 + bob, 11, 4, '#16181c');
      circ(ctx, -5, -46 + bob, 1.8, guard ? '#ff6a50' : '#ffd070'); circ(ctx, 5, -46 + bob, 1.8, guard ? '#ff6a50' : '#ffd070');
      for (const k of [-6, 0, 6]) line(ctx, k, -38 + bob, k, -33 + bob, '#16181c', 1.8);
      ctx.restore();
      break;
    }
    case 'ball': {   // Bola de cadena del Carcelero: bola de hierro con púas y una cadena hasta su dueño
      const par = e.parent;
      if (par) {
        const dx = par.x - e.x, dy = par.y - e.y - 20, n = 8;
        for (let i = 1; i < n; i++) { const t = i / n; ell(ctx, dx * t, dy * t - 6 * (1 - t) * t, 3.2, 2.2, '#8a8e98', 1, '#202226', Math.atan2(dy, dx) + (i % 2) * 1.57); }
      }
      shadow(ctx, 0, 8, 12, 4, 0.3);
      const fl = par && par.state === 'fling';
      for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4 + a * 2; line(ctx, Math.cos(t) * 12, -8 + Math.sin(t) * 12, Math.cos(t) * 19, -8 + Math.sin(t) * 19, '#2a2c32', 3); }
      circ(ctx, 0, -8, 13, fl ? '#a04a40' : '#4e525c', 2);
      circ(ctx, -4, -12, 4, 'rgba(255,255,255,0.25)');
      break;
    }
    case 'pira': {   // Pira Viviente: hoguera con cara; marca en el suelo las casillas que va a incendiar y dónde caen las brasas
      if (e.fm && e.state === 'ignite') for (const m of e.fm) {
        const k = Math.min(1, e.t / 0.9);
        ctx.save(); ctx.translate(tcx(m.c) - e.x, tcy(m.r) - e.y);
        ctx.globalAlpha = 0.25 + 0.4 * k; ctx.fillStyle = '#ff7a30'; ctx.fillRect(-18, -18, 36, 36);
        ctx.globalAlpha = 0.5 + 0.4 * k; ctx.strokeStyle = '#ffb040'; ctx.lineWidth = 2; ctx.strokeRect(-17 + 4 * k, -17 + 4 * k, 34 - 8 * k, 34 - 8 * k);
        ctx.restore();
      }
      if (e.marks) for (const m of e.marks) {
        const k = 1 - m.t / m.max;
        ctx.save(); ctx.translate(m.x - e.x, m.y - e.y); ctx.globalAlpha = 0.25 + 0.45 * k; ctx.strokeStyle = '#ff8030'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 20 - 7 * k, 11 - 4 * k, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ctx.globalAlpha = 1;
      const open = e.state === 'ember' || e.state === 'nova' || e.state === 'ignite', fl = a * 9;
      shadow(ctx, 0, 12, 34, 10, 0.35);
      ctx.save(); ctx.rotate(-0.3); fillRR(ctx, -26, 2, 52, 11, 4, C('#4a2e1a'), 2); ctx.restore();
      ctx.save(); ctx.rotate(0.3); fillRR(ctx, -26, 2, 52, 11, 4, C('#5a3820'), 2); ctx.restore();
      const flame = (w, h, col, off) => {
        ctx.beginPath(); ctx.moveTo(-w, 6);
        ctx.quadraticCurveTo(-w * 1.15, -h * 0.5, -w * 0.4 + Math.sin(fl + off) * 3, -h * 0.85);
        ctx.quadraticCurveTo(-w * 0.1, -h * 1.0 - Math.sin(fl * 1.3 + off) * 5, 0, -h - 6 + Math.sin(fl + off) * 4);
        ctx.quadraticCurveTo(w * 0.3 + Math.sin(fl * 0.9 + off) * 3, -h * 0.85, w * 0.4, -h * 0.7);
        ctx.quadraticCurveTo(w * 1.15, -h * 0.4, w, 6); ctx.quadraticCurveTo(0, 14, -w, 6); ctx.closePath();
        ctx.fillStyle = col; ctx.fill();
      };
      flame(30, 52, C(champ ? '#c03030' : '#e8501e'), 0); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      flame(21, 38, C('#ff9a30'), 1.7); flame(11, 22, C('#ffe27a'), 3.1);
      circ(ctx, -8, -16, 3.6, '#fff4d8'); circ(ctx, 8, -16, 3.6, '#fff4d8'); circ(ctx, -7, -15, 1.7, '#2a0a05'); circ(ctx, 9, -15, 1.7, '#2a0a05');
      line(ctx, -13, -23, -4, -19, '#3a0a05', 2.4); line(ctx, 13, -23, 4, -19, '#3a0a05', 2.4);
      if (open) ell(ctx, 0, -5, 7, 7, '#3a0a05', 1.2); else line(ctx, -6, -5, 6, -5, '#3a0a05', 2.2);
      break;
    }
    case 'coloso': {   // Coloso de Piedra: gigante de rocas con ojos de brasa; alza los brazos al lanzar y se agacha al pisar
      const throwing = e.state === 'throw', stomp = e.state === 'stomp', rise = throwing ? Math.min(1, e.t / 0.4) : 0, squat = stomp ? Math.min(1, e.t / 0.5) * 8 : 0;
      if (e.marks) for (const m of e.marks) {
        const k = 1 - m.t / m.max;
        ctx.save(); ctx.translate(m.x - e.x, m.y - e.y);
        ctx.globalAlpha = 0.25 + 0.45 * k; ctx.strokeStyle = '#e0502e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 24 - 8 * k, 13 - 4 * k, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      shadow(ctx, 0, 12, 46, 13, 0.38);
      const sway = Math.sin(a * 3) * 1.5;
      ctx.translate(0, squat);
      for (const s of [-1, 1]) {      // brazos de roca
        const ax = s * 44, ay = -22 - rise * 26 + sway * s;
        ell(ctx, s * 30, -26 - rise * 12, 12, 16, C('#7a7a72'), 2);
        ell(ctx, ax, ay, 15 - rise, 15, C('#8a8a82'), 2);
        line(ctx, ax - 5, ay - 4, ax + 3, ay + 5, 'rgba(0,0,0,0.3)', 1.6);
      }
      ell(ctx, -14, 4, 15, 12, C('#6e6e66'), 2); ell(ctx, 14, 4, 15, 12, C('#6e6e66'), 2);
      ell(ctx, 0, -26, 36, 36, C('#8c8c84'), 2.4);
      ell(ctx, -10, -36, 14, 8, 'rgba(255,255,255,0.12)');
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-18, -14); ctx.lineTo(-8, -26); ctx.lineTo(-14, -40); ctx.moveTo(14, -10); ctx.lineTo(20, -24); ctx.lineTo(10, -34); ctx.stroke();
      ell(ctx, 0, -50, 17, 14, C('#9a9a92'), 2);
      const glow = throwing || stomp ? '#ffb040' : '#ff7a30';
      circ(ctx, -6, -50, 3.6, glow); circ(ctx, 6, -50, 3.6, glow);
      line(ctx, -11, -57, -3, -54, '#1a1a18', 2.4); line(ctx, 11, -57, 3, -54, '#1a1a18', 2.4);
      if (throwing || stomp) ell(ctx, 0, -42, 6, 4, '#2a0a05', 1.2); else line(ctx, -5, -42, 5, -42, '#1a1a18', 2);
      break;
    }
    case 'rey': {   // Rey Minero: corpulento, casco amarillo con corona de púas y lámpara, y un pico enorme
      const dash = e.state === 'dash', wind = e.state === 'windup', lean = dash ? 0.25 : 0, bob = dash ? 0 : Math.sin(a * 5) * 1.5;
      shadow(ctx, 0, 11, 34, 10, 0.35);
      if (dash) for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.18; ell(ctx, -fx * i * 14, 4, 12, 5, '#a89a80'); }
      ctx.globalAlpha = 1;
      ctx.save(); ctx.scale(fx, 1); ctx.rotate(lean);
      ell(ctx, 0, -14 + bob, 24, 25, C('#7a5a3a'), 2.2);
      ell(ctx, 0, -6 + bob, 14, 14, C('#a8845a'));
      for (const k of [-8, 8]) line(ctx, k, -24 + bob, k * 0.6, -2 + bob, '#3a2a18', 2.2);
      ell(ctx, -9, 8, 9, 7, C('#4a3220'), 1.6); ell(ctx, 9, 8, 9, 7, C('#4a3220'), 1.6);
      circ(ctx, 0, -40 + bob, 13, C('#d9b9a0'), 2);
      ctx.beginPath(); ctx.arc(0, -42 + bob, 14.5, Math.PI, 0); ctx.closePath(); ctx.fillStyle = C('#e2b23a'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      for (const k of [-9, 0, 9]) { ctx.beginPath(); ctx.moveTo(k - 3.5, -55 + bob); ctx.lineTo(k, -64 + bob); ctx.lineTo(k + 3.5, -55 + bob); ctx.closePath(); ctx.fillStyle = C('#f2c43a'); ctx.fill(); ctx.stroke(); }
      circ(ctx, 9, -48 + bob, 3.6, '#fff7c0', 1.2);
      circ(ctx, -4, -39 + bob, 1.8, '#111'); circ(ctx, 5, -39 + bob, 1.8, '#111');
      line(ctx, -8, -44 + bob, -2, -42 + bob, '#2a1a10', 2); line(ctx, 9, -44 + bob, 3, -42 + bob, '#2a1a10', 2);
      if (e.shoot > 0) ell(ctx, 0, -32 + bob, 4, 3, '#2a0a05', 1);
      // pico
      ctx.save(); ctx.translate(24, -14 + bob); ctx.rotate(wind ? -1.1 - Math.sin(a * 30) * 0.05 : dash ? 0.4 : -0.4);
      line(ctx, 0, 6, 0, -30, '#6a4a2a', 4.5);
      ctx.beginPath(); ctx.moveTo(-18, -30); ctx.quadraticCurveTo(0, -42, 18, -30); ctx.quadraticCurveTo(0, -35, -18, -30); ctx.closePath();
      ctx.fillStyle = wind ? '#ffd0a0' : C('#a8b0bc'); ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = OL; ctx.stroke();
      ctx.restore();
      ctx.restore();
      break;
    }
    case 'gloton': {
      const air = Math.min(1, e.z / 300);
      shadow(ctx, 0, 8, 36 * (1 - air * 0.4), 12 * (1 - air * 0.4), 0.38);
      ctx.translate(0, -e.z);
      const sq = e.state === 'idle' ? 1 + Math.sin(a * 5) * 0.03 : 1;
      ctx.scale(1 / sq, sq);
      const body = C('#bda1a0');
      ell(ctx, 0, -24, 38, 32, body, 2);
      ell(ctx, 0, -14, 26, 16, C('#d4bcb8'));
      line(ctx, -22, -46, -8, -41, '#2a1010', 2.5); line(ctx, 22, -46, 8, -41, '#2a1010', 2.5);
      circ(ctx, -13, -38, 3.5, '#111'); circ(ctx, 13, -38, 3.5, '#111');
      if (e.state === 'spit' && e.t > 0.2) {
        ell(ctx, 0, -16, 20, 15, '#2a0505', 1.5);
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 5 - 2.5, -29); ctx.lineTo(i * 5, -24); ctx.lineTo(i * 5 + 2.5, -29); ctx.fillStyle = '#f0e8d8'; ctx.fill(); }
      } else {
        ctx.beginPath(); ctx.moveTo(-20, -18); ctx.quadraticCurveTo(0, -6, 20, -18); ctx.strokeStyle = '#2a1010'; ctx.lineWidth = 2.5; ctx.stroke();
        for (let i = -2; i <= 2; i++) line(ctx, i * 7, -15 + Math.abs(i) * -1.5, i * 7, -11 + Math.abs(i) * -1.5, '#f0e8d8', 2);
      }
      break;
    }
    case 'zumbido': {
      const bob = Math.sin(a * 4) * 3, w = Math.abs(Math.sin(a * 30));
      shadow(ctx, 0, 10, 26, 8, 0.3);
      ctx.translate(0, -26 + bob);
      ell(ctx, -26, -14, 20, 8 + w * 8, 'rgba(225,225,240,0.6)', 1.2, 'rgba(0,0,0,0.4)', -0.5);
      ell(ctx, 26, -14, 20, 8 + w * 8, 'rgba(225,225,240,0.6)', 1.2, 'rgba(0,0,0,0.4)', 0.5);
      ell(ctx, 0, 0, 30, 26, C('#5c4232'), 2);
      ell(ctx, 0, 6, 20, 14, C('#6e5240'));
      for (let i = -1; i <= 1; i++) line(ctx, -18, 6 + i * 7, 18, 6 + i * 7, 'rgba(0,0,0,0.25)', 1.5);
      ell(ctx, -9, -9, 5, 6, '#f0e6d8', 1.2); ell(ctx, 9, -9, 5, 6, '#f0e6d8', 1.2);
      circ(ctx, -8, -8, 2.6, '#111'); circ(ctx, 8, -8, 2.6, '#111');
      line(ctx, -15, -17, -4, -13, '#1a0a05', 2.4); line(ctx, 15, -17, 4, -13, '#1a0a05', 2.4);
      if (e.burp > 0) ell(ctx, 0, 6, 9, 8, '#200404', 1.2); else line(ctx, -8, 6, 8, 6, '#1a0a05', 2);
      break;
    }
    case 'masa': {
      shadow(ctx, 0, 6, 46, 12, 0.35);
      const pl = 1 + Math.sin(a * 2.5) * 0.025;
      ctx.scale(pl, 2 - pl);
      ell(ctx, 0, -20, 48, 34, C('#c18e7e'), 2);
      ell(ctx, -20, -8, 18, 12, C('#b07c6c')); ell(ctx, 22, -10, 16, 11, C('#b07c6c'));
      ctx.beginPath(); ctx.arc(0, -16, 30, 0.4, Math.PI - 0.4); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
      circ(ctx, -14, -34, 4, '#111'); circ(ctx, 14, -34, 4, '#111');
      line(ctx, -22, -42, -9, -38, '#2a1010', 2.5); line(ctx, 22, -42, 9, -38, '#2a1010', 2.5);
      if (e.mouth > 0) ell(ctx, 0, -18, 14, 11, '#200404', 1.5); else { ctx.beginPath(); ctx.moveTo(-14, -18); ctx.quadraticCurveTo(0, -24, 14, -18); ctx.strokeStyle = '#2a1010'; ctx.lineWidth = 2.5; ctx.stroke(); }
      break;
    }
    case 'llorona': {
      shadow(ctx, 0, 8, 28, 8, 0.35);
      const st = Math.sin(a * 6) * 2;
      ell(ctx, -10, 6 + st, 6, 5, C('#cfb460'), 1.4); ell(ctx, 10, 6 - st, 6, 5, C('#cfb460'), 1.4);
      ell(ctx, 0, -22, 30, 29, C('#d8bf62'), 2);
      ell(ctx, -11, -30, 6, 7, '#f6f0e0', 1.2); ell(ctx, 11, -30, 6, 7, '#f6f0e0', 1.2);
      circ(ctx, -11, -29, 3, '#111'); circ(ctx, 11, -29, 3, '#111');
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 11, -23); ctx.quadraticCurveTo(sd * 13, -12, sd * 10, -2 + Math.sin(a * 8) * 2); ctx.strokeStyle = '#f2e27a'; ctx.lineWidth = 3; ctx.stroke(); }
      ell(ctx, 0, -12, e.state === 'cry' ? 8 : 5, e.state === 'cry' ? 9 : 4, '#2a0a05', 1.2);
      break;
    }
    case 'foot': {
      const k = e.state === 'shadow' ? Math.min(1, e.t / 1.0) : 1;
      shadow(ctx, 0, 4, 38 * (0.35 + 0.65 * k), 18 * (0.35 + 0.65 * k), 0.25 + 0.25 * k);
      if (e.z < 420) {
        ctx.translate(0, -e.z);
        fillRR(ctx, -20, -380, 40, 360, 12, C('#e0ad94'), 2);
        ell(ctx, 0, -6, 30, 26, C('#e8b8a0'), 2);
        for (let i = 0; i < 5; i++) circ(ctx, -18 + i * 9, -30 - Math.abs(i - 1.5) * -1.5 + (i === 0 ? 3 : 0), i === 0 ? 7 : 5.5, C('#e8b8a0'), 1.6);
        ell(ctx, 0, 0, 16, 10, 'rgba(0,0,0,0.12)');
      }
      break;
    }
    case 'eye': {
      const open = Math.min(1, e.t / 0.3) * (e.t > 2.1 ? Math.max(0, 1 - (e.t - 2.1) / 0.3) : 1);
      ctx.rotate(DIRS[e.side].rot);
      fillRR(ctx, -18, -26, 36, 34, 6, '#090504');
      ell(ctx, 0, -6, 18, 13 * open + 0.5, C('#f2eadc'), 2);
      if (open > 0.3) {
        for (let i = 0; i < 4; i++) line(ctx, -16 + i * 3, -6 + (i % 2 ? 4 : -4), -9 + i * 2, -6, '#c03030', 1);
        const p = G.player || { x: e.x, y: e.y + 1 };   // sin jugador (bestiario desde el título) mira hacia abajo
        const la = Math.atan2(p.y - e.y, p.x - e.x) - DIRS[e.side].rot;
        circ(ctx, Math.cos(la) * 6, -6 + Math.sin(la) * 4 * open, 7 * open, '#5a3a20');
        circ(ctx, Math.cos(la) * 6, -6 + Math.sin(la) * 4 * open, 3.5 * open, '#0a0505');
      }
      ctx.beginPath(); ctx.ellipse(0, -6, 19, 14 * open + 1, 0, Math.PI, 0); ctx.strokeStyle = '#a07060'; ctx.lineWidth = 3; ctx.stroke();
      break;
    }
    case 'corazon': {
      const s = 1 + Math.sin((e.beat || 0) * TAU) * 0.07;
      shadow(ctx, 0, 10, 44, 12, 0.35);
      for (const [dx, w] of [[-14, 9], [0, 11], [14, 8]]) fillRR(ctx, dx - w / 2, -110, w, 70, 4, C('#7a1418'), 1.6);
      heartPath(ctx, 0, -22, 44 * s);
      ctx.fillStyle = C('#a3161c'); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = 'rgba(40,0,0,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, -40); ctx.quadraticCurveTo(-10, -20, -22, 0); ctx.moveTo(15, -42); ctx.quadraticCurveTo(5, -18, 12, 8); ctx.stroke();
      ell(ctx, -18, -36, 9, 6, 'rgba(255,160,160,0.3)', 0, OL, -0.5);
      break;
    }
    default:
      circ(ctx, 0, -8, e.r, C('#888'), 1.5);
  }
  // aura de fase 2 de un jefe: brillo rojo y anillo en el suelo; más intensa durante el segundo de protección
  if (e.boss && e.phase2 && !e.parent) {
    const k = e.p2T > 0 ? e.p2T : 0, pulse = 0.5 + 0.5 * Math.sin(a * 6), R = e.r + 8;
    ctx.save();
    ctx.globalAlpha = 0.1 + 0.08 * pulse + k * 0.3; circ(ctx, 0, -e.r * 0.6, R + 6 + k * 18, '#ff3a20');
    ctx.globalAlpha = 0.45 + 0.35 * pulse; ctx.strokeStyle = '#ff4a30'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.ellipse(0, e.r * 0.28, R, R * 0.36, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  // aura de campeón: anillo en el suelo, brillo y una marca propia de cada variante
  if (e.champ && CHAMPIONS[e.champ]) {
    const col = CHAMPIONS[e.champ].color, pulse = 0.5 + 0.5 * Math.sin(a * (e.champ === 'volatile' ? 14 : 4)), R = e.r + 5;
    ctx.save();
    ctx.globalAlpha = 0.1 + 0.1 * pulse; circ(ctx, 0, -4, R + 4, col);
    ctx.globalAlpha = 0.4 + 0.3 * pulse; ctx.strokeStyle = col; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 8, R, R * 0.4, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.85;
    if (e.champ === 'swift') for (let i = 0; i < 3; i++) { const y = -4 - i * 6, l = 8 + ((a * 60 + i * 7) % 8); line(ctx, -fx * (e.r + 4), y, -fx * (e.r + 4 + l), y, col, 1.6); }
    else if (e.champ === 'volatile') for (let i = 0; i < 3; i++) circ(ctx, Math.sin(a * 9 + i * 2.1) * (e.r * 0.8), -e.r - 4 - ((a * 30 + i * 4) % 8), 1.6, i % 2 ? '#ffe27a' : col);
    else if (e.champ === 'toxic') for (let i = 0; i < 3; i++) circ(ctx, Math.sin(a * 3 + i * 2) * (e.r * 0.7), -2 - ((a * 18 + i * 6) % 16), 1.8, col, 0.6, '#2a6a22');
    else if (e.champ === 'regen') for (let i = 0; i < 2; i++) { const x = (i ? 6 : -6), y = -e.r - 2 - ((a * 14 + i * 5) % 10); line(ctx, x - 2.4, y, x + 2.4, y, col, 1.8); line(ctx, x, y - 2.4, x, y + 2.4, col, 1.8); }
    ctx.restore();
  }
  // estados
  const top = -(e.r * 2 + 10) - (e.z || 0);
  if (e.charm > 0) drawHeartShape(ctx, 0, top, 4, 'red', 2);
  if (e.fear > 0) { ell(ctx, -3, top, 2, 3, '#7a4a9a'); ell(ctx, 3, top + 1, 2, 3, '#7a4a9a'); }
  if (e.confuse > 0) { ctx.beginPath(); ctx.arc(0, top, 4, a * 6, a * 6 + 4.5); ctx.strokeStyle = '#ffe060'; ctx.lineWidth = 1.5; ctx.stroke(); }
  if (e.poison > 0) circ(ctx, Math.sin(a * 5) * 5, top + 2, 2, '#5fcf5f');
  if (e.burn > 0) { ctx.beginPath(); ctx.moveTo(-3, top + 4); ctx.quadraticCurveTo(0, top - 6, 3, top + 4); ctx.fillStyle = '#ff8a2a'; ctx.fill(); }
  if (e.bleed > 0) circ(ctx, -4, top + 3, 1.8, '#c01818');
  if (G.player && G.player.passive && G.player.passive.has('hpbars') && !e.invisible) {
    const tg = e.parent || e, k = clamp(tg.hp / tg.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-12, 8, 24, 3); ctx.fillStyle = '#e04040'; ctx.fillRect(-12, 8, 24 * k, 3);
  }
  ctx.restore();
}

// ---------- Recogibles ----------
function drawPickup(ctx, pk) {
  const t = pk.t;
  ctx.save(); ctx.translate(pk.x, pk.y);
  const price = pk.price != null;
  if (price && pk.kind !== 'item') fillRR(ctx, -14, -8, 28, 20, 4, 'rgba(0,0,0,0.25)');
  switch (pk.kind) {
    case 'coin': case 'nickel': case 'dime': {
      shadow(ctx, 0, 6, 6, 2.2, 0.3);
      const sp = Math.abs(Math.cos(t * 3)), big = pk.kind !== 'coin';
      const fill = pk.kind === 'nickel' ? '#cfd2da' : pk.kind === 'dime' ? '#9ad0f0' : '#f2c43a';
      const edge = pk.kind === 'nickel' ? '#5a5d66' : pk.kind === 'dime' ? '#2a5a7a' : '#8a5a10';
      ell(ctx, 0, -2, (big ? 7.5 : 6.5) * (0.35 + 0.65 * sp), big ? 7.5 : 6.5, fill, 1.4, edge);
      ell(ctx, -1.5 * sp, -4, 1.5 * sp, 2.5, 'rgba(255,255,255,0.7)');
      break;
    }
    case 'heart': case 'half': case 'soul': case 'black': {
      shadow(ctx, 0, 7, 7, 2.5, 0.3);
      const b = 1 + Math.sin(t * 6) * 0.05;
      drawHeartShape(ctx, 0, -3, 8 * b, pk.kind === 'soul' ? 'soul' : pk.kind === 'black' ? 'black' : 'red', pk.kind === 'half' ? 1 : 2);
      break;
    }
    case 'battery':
      shadow(ctx, 0, 7, 6, 2.2, 0.3);
      drawBattery(ctx, 0, -3, 1);
      break;
    case 'card':
      shadow(ctx, 0, 7, 6, 2.2, 0.3);
      drawCard(ctx, 0, -4 + Math.sin(t * 3) * 1, 1);
      break;
    case 'bomb': case 'bomb2':
      shadow(ctx, 0, 7, 8, 3, 0.3);
      if (pk.kind === 'bomb2') { drawBombIcon(ctx, -5, -3, 0.85); drawBombIcon(ctx, 5, -1, 0.85); }
      else drawBombIcon(ctx, 0, -3, 1);
      break;
    case 'key':
      shadow(ctx, 0, 7, 7, 2.5, 0.3);
      drawKeyIcon(ctx, 0, -3, 1);
      break;
    case 'pill':
      shadow(ctx, 0, 6, 6, 2.2, 0.3);
      drawPill(ctx, pk.pill, 0, -3, 1);
      break;
    case 'chest': case 'gchest': {
      const gold = pk.kind === 'gchest';
      shadow(ctx, 0, 9, 14, 4, 0.35);
      fillRR(ctx, -13, -9, 26, 18, 3, gold ? '#e2b23a' : '#7a4a26', 1.5);
      fillRR(ctx, -13, -14, 26, 8, 3, gold ? '#f0c858' : '#8e5a30', 1.5);
      ctx.fillStyle = gold ? '#9a7018' : '#3a2412'; ctx.fillRect(-13, -7, 26, 2);
      fillRR(ctx, -3, -9, 6, 7, 1.5, gold ? '#8a6210' : '#c8c0b0', 1);
      break;
    }
    case 'item': {
      shadow(ctx, 0, 10, 15, 4, 0.35);
      fillRR(ctx, -14, -2, 28, 13, 3, '#6e6a72', 1.5);
      ctx.fillStyle = '#8c8892'; ctx.fillRect(-13, -1, 26, 4);
      if (pk.item) {
        const bob = Math.sin(t * 2.5) * 3;
        const g = ctx.createRadialGradient(0, -22 + bob, 2, 0, -22 + bob, 22);
        g.addColorStop(0, 'rgba(255,240,200,0.35)'); g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = g; ctx.fillRect(-24, -46 + bob, 48, 48);
        drawIcon(ctx, pk.item, 0, -22 + bob, 1);
      }
      break;
    }
    case 'trophy': {
      const g = ctx.createRadialGradient(0, -10, 4, 0, -10, 46);
      g.addColorStop(0, 'rgba(255,230,140,0.45)'); g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g; ctx.fillRect(-50, -60, 100, 100);
      shadow(ctx, 0, 14, 22, 6, 0.4);
      fillRR(ctx, -20, -14, 40, 28, 4, '#e2b23a', 2);
      fillRR(ctx, -20, -22, 40, 11, 4, '#f6d46a', 2);
      fillRR(ctx, -4, -12, 8, 9, 2, '#8a6210', 1.2);
      break;
    }
  }
  if (price) {
    const pr = G.player ? shopPrice(pk) : pk.price;
    const lab = G.player && G.player.passive.has('poundflesh') && pk.shop && pk.kind === 'item' ? '♥' : `${pr}¢`;
    if (pk.kind === 'item') txt(ctx, lab, 0, 22, 13, '#ffe27a');
    else txt(ctx, lab, 0, 17, 12, '#ffe27a');
  }
  if (pk.choice && pk.kind === 'item') { ctx.globalAlpha = 0.6; txt(ctx, 'elige uno', 0, 22, 10, '#e9dcc0'); ctx.globalAlpha = 1; }
  if (pk.hprice) {
    for (let i = 0; i < pk.hprice; i++) drawHeartShape(ctx, (i - (pk.hprice - 1) / 2) * 12, 22, 5, 'red', 2);
  }
  if (pk.sprice) {
    for (let i = 0; i < pk.sprice; i++) drawHeartShape(ctx, (i - (pk.sprice - 1) / 2) * 12, 22, 5, 'soul', 2);
  }
  if (pk.kprice) txt(ctx, pk.kprice + (pk.kprice > 1 ? ' llaves' : ' llave'), 0, 22, 11, '#ffe27a');
  ctx.restore();
}

function drawHeartShape(ctx, x, y, s, kind, fillHalves) {
  const col = kind === 'soul' ? '#6b8fe6' : kind === 'black' ? '#2e2434' : kind === 'coin' ? '#f2c43a' : '#d6232a';
  const dark = kind === 'soul' ? '#25356a' : kind === 'black' ? '#000000' : kind === 'coin' ? '#7a5210' : '#4a0808';
  heartPath(ctx, x, y, s);
  ctx.fillStyle = 'rgba(30,10,10,0.75)'; ctx.fill();
  if (fillHalves > 0) {
    ctx.save();
    if (fillHalves === 1) { ctx.beginPath(); ctx.rect(x - s * 1.4, y - s * 1.3, s * 1.4, s * 2.6); ctx.clip(); }
    heartPath(ctx, x, y, s); ctx.fillStyle = col; ctx.fill();
    ell(ctx, x - s * 0.45, y - s * 0.35, s * 0.3, s * 0.2, 'rgba(255,255,255,0.55)', 0, OL, -0.6);
    ctx.restore();
  }
  heartPath(ctx, x, y, s); ctx.lineWidth = Math.max(1, s * 0.22); ctx.strokeStyle = dark; ctx.stroke();
}
function drawBombIcon(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  circ(ctx, 0, 1, 7.5, '#2b2b30', 1.4, '#0a0a0a');
  circ(ctx, -2.5, -1.5, 2, 'rgba(255,255,255,0.35)');
  fillRR(ctx, -2, -8, 4, 3, 1, '#555', 1, '#111');
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(3, -12, 5, -10); ctx.strokeStyle = '#b8a070'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
}
function drawKeyIcon(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.6);
  ctx.strokeStyle = '#6a4a0a'; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.arc(-5, 0, 3.5, 0, TAU); ctx.moveTo(-1.5, 0); ctx.lineTo(8, 0); ctx.moveTo(5, 0); ctx.lineTo(5, 3.5); ctx.moveTo(8, 0); ctx.lineTo(8, 3.5); ctx.stroke();
  ctx.strokeStyle = '#f2c43a'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.restore();
}
function drawPill(ctx, ci, x, y, s) {
  const [a, b] = PILL_COLORS[ci] || PILL_COLORS[0];
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-4, -4); ctx.arc(-4, 0, 4, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(0, 4); ctx.closePath(); ctx.fillStyle = a; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, -4); ctx.arc(4, 0, 4, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, 4); ctx.closePath(); ctx.fillStyle = b; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, -4); ctx.arc(4, 0, 4, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-4, 4); ctx.arc(-4, 0, 4, Math.PI / 2, -Math.PI / 2);
  ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
  line(ctx, -5, -2, 2, -2, 'rgba(255,255,255,0.55)', 1.2);
  ctx.restore();
}

// ---------- Iconos de objetos ----------
function drawHandIcon(ctx, id, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineJoin = 'round';
  const L = 1.4;
  switch (id) {
    case 'cebolla':
      ctx.beginPath(); ctx.moveTo(-1, -6); ctx.quadraticCurveTo(-4, -12, -1, -14); ctx.moveTo(1, -6); ctx.quadraticCurveTo(5, -11, 3, -14); ctx.strokeStyle = '#4c9a3a'; ctx.lineWidth = 2; ctx.stroke();
      ell(ctx, 0, 2, 10, 9, '#ead8f2', L);
      line(ctx, -4, -5, -6, 8, 'rgba(150,90,170,0.5)', 1); line(ctx, 4, -5, 6, 8, 'rgba(150,90,170,0.5)', 1);
      circ(ctx, -3.5, 1, 1.4, '#111'); circ(ctx, 3.5, 1, 1.4, '#111');
      ell(ctx, -3.5, 5, 1.2, 2, '#6ab0ff');
      break;
    case 'hormonas':
      ctx.rotate(-0.7);
      fillRR(ctx, -3.5, -9, 7, 15, 1.5, '#e6f2ff', L);
      ctx.fillStyle = '#7ad06a'; ctx.fillRect(-2.2, -3, 4.4, 8);
      line(ctx, 0, 6, 0, 13, '#9aa', 1.4); line(ctx, -5, -10, 5, -10, OL, 2.2); line(ctx, 0, -10, 0, -13, OL, 1.6);
      break;
    case 'pentagrama': case 'libromaldito': {
      if (id === 'libromaldito') { fillRR(ctx, -9, -11, 18, 22, 2, '#8a1414', L); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(7, -10, 2, 20); ctx.scale(0.6, 0.6); }
      circ(ctx, 0, 0, 10, '', 2.2, '#e03030');
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; i ? ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10) : ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); }
      ctx.strokeStyle = '#e03030'; ctx.lineWidth = 1.8; ctx.stroke();
      break;
    }
    case 'almuerzo': case 'cena': case 'desayuno':
      ell(ctx, 0, 4, 12, 6, '#f2f2f2', L); ell(ctx, 0, 3, 8, 3.5, '#dcdcdc');
      if (id === 'almuerzo') { ell(ctx, -2, 1, 5, 3, '#b0602a', 1); ell(ctx, 4, 2, 3, 2, '#5ab040', 1); }
      if (id === 'cena') { ell(ctx, -1, 0, 6, 4, '#a85a24', 1, OL, -0.3); line(ctx, 4, -2, 9, -6, '#f2ead8', 2.5); }
      if (id === 'desayuno') { ell(ctx, 0, 2, 6, 3.5, '#ffffff', 1); circ(ctx, 0, 1.5, 2.2, '#ffc42a'); }
      break;
    case 'hamburguesa':
      ctx.beginPath(); ctx.arc(0, -1, 10, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#d8913c'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      ctx.fillStyle = '#5ab040'; ctx.fillRect(-10, -1, 20, 2.5);
      fillRR(ctx, -10, 1.5, 20, 4, 2, '#5a2e14', 1);
      fillRR(ctx, -10, 5.5, 20, 4, 2, '#d8913c', 1);
      circ(ctx, -3, -5, 0.8, '#fff'); circ(ctx, 3, -6, 0.8, '#fff');
      break;
    case 'zapatillas':
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-9, -6); ctx.lineTo(-2, -6); ctx.quadraticCurveTo(2, 0, 10, 1); ctx.lineTo(10, 5); ctx.closePath();
      ctx.fillStyle = '#d04040'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      fillRR(ctx, -11, 4, 22, 4, 2, '#f2f2f2', 1);
      line(ctx, -5, -4, -1, -1, '#fff', 1.2);
      break;
    case 'trimirada':
      for (const ex of [-7.5, 0, 7.5]) { ell(ctx, ex, 0, 3.6, 4.8, '#fff', 1.2); circ(ctx, ex, 0.6, 2.1, '#111'); }
      break;
    case 'arana':
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) line(ctx, 0, 0, sd * 11, -6 + i * 4, '#111', 1.4);
      ell(ctx, 0, 0, 6, 5, '#222', 1, '#000');
      for (const [dx, dy] of [[-2, -2], [2, -2], [-3, 0], [3, 0]]) circ(ctx, dx, dy, 1, '#ff3030');
      break;
    case 'buscadoras':
      ell(ctx, 0, 0, 11, 7, '#ffffff', L); circ(ctx, 0, 0, 5, '#9a5ae0'); circ(ctx, 0, 0, 2.3, '#111');
      ctx.beginPath(); ctx.arc(0, 0, 9, -0.4, 1.2); ctx.strokeStyle = 'rgba(154,90,224,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      break;
    case 'perforantes':
      line(ctx, -9, 9, 8, -8, '#8a5a2a', 2.4);
      ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(3, -8); ctx.lineTo(8, -3); ctx.closePath(); ctx.fillStyle = '#c8c8d0'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
      line(ctx, -9, 9, -12, 4, '#e04040', 2); line(ctx, -9, 9, -4, 12, '#e04040', 2);
      break;
    case 'fantasma':
      ctx.beginPath(); ctx.moveTo(-9, 10); ctx.lineTo(-9, -2); ctx.arc(0, -2, 9, Math.PI, 0); ctx.lineTo(9, 10);
      for (let i = 0; i < 3; i++) ctx.quadraticCurveTo(6 - i * 6, 6, 3 - i * 6, 10);
      ctx.closePath(); ctx.fillStyle = 'rgba(235,235,255,0.92)'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      ell(ctx, -3, -2, 1.8, 2.5, '#111'); ell(ctx, 3, -2, 1.8, 2.5, '#111');
      break;
    case 'goma':
      fillRR(ctx, -6, -4, 12, 15, 3, '#d8b860', L);
      fillRR(ctx, -4, -10, 8, 6, 1.5, '#6a4a2a', 1);
      ctx.fillStyle = '#f2ead0'; ctx.fillRect(-5, 1, 10, 5);
      break;
    case 'azufre':
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 3, -7); ctx.quadraticCurveTo(sd * 10, -11, sd * 9, -15); ctx.quadraticCurveTo(sd * 6, -9, sd * 1, -8); ctx.closePath(); ctx.fillStyle = '#2a1010'; ctx.fill(); }
      ell(ctx, 0, 2, 9, 9.5, '#b81616', L);
      ell(ctx, -3.5, 0, 2, 2.4, '#ffe0e0'); ell(ctx, 3.5, 0, 2, 2.4, '#ffe0e0');
      break;
    case 'laser':
      circ(ctx, 0, 0, 10, '#7a7a8a', L); circ(ctx, 0, 0, 6, '#2a2a30'); circ(ctx, 0, 0, 4, '#ff3030'); circ(ctx, -1.5, -1.5, 1.2, '#fff');
      line(ctx, -10, 0, -13, 0, '#555', 2); line(ctx, 10, 0, 13, 0, '#555', 2);
      break;
    case 'vomitivo': case 'toxicas':
      if (id === 'vomitivo') {
        fillRR(ctx, -6, -4, 12, 15, 3, '#5ab040', L); fillRR(ctx, -3, -11, 6, 7, 1, '#d8c8a0', 1);
        ctx.fillStyle = '#f2ead0'; ctx.fillRect(-5, 1, 10, 5);
      } else {
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(10, 2, 0, 10); ctx.quadraticCurveTo(-10, 2, 0, -11); ctx.fillStyle = '#5fcf5f'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
        circ(ctx, -2, 2, 1.4, '#1a3a1a'); circ(ctx, 2, 2, 1.4, '#1a3a1a'); line(ctx, -2, 6, 2, 6, '#1a3a1a', 1);
      }
      break;
    case 'ojogrande': case 'ojosangre':
      ell(ctx, 0, 0, 11, 8.5, '#f6f2ec', L);
      line(ctx, -9, -3, -5, -1, '#d03030', 1); line(ctx, 9, 3, 5, 1, '#d03030', 1);
      circ(ctx, 0, 0, 5.5, id === 'ojosangre' ? '#b01818' : '#3a6ad0'); circ(ctx, 0, 0, 2.6, '#111'); circ(ctx, -1.5, -1.5, 1, '#fff');
      if (id === 'ojosangre') line(ctx, 2, 7, 3, 13, '#b01818', 2);
      break;
    case 'hermanito': case 'bebedemonio': {
      const dm = id === 'bebedemonio';
      if (dm) for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 3, -7); ctx.lineTo(sd * 8, -13); ctx.lineTo(sd * 7, -6); ctx.closePath(); ctx.fillStyle = '#1a0a0a'; ctx.fill(); }
      circ(ctx, 0, 1, 9.5, dm ? '#3a2a3a' : '#f0d2c2', L);
      ell(ctx, -3.5, 0, 1.8, 2.4, dm ? '#ff3030' : '#111'); ell(ctx, 3.5, 0, 1.8, 2.4, dm ? '#ff3030' : '#111');
      if (!dm) ell(ctx, -3.5, 4.5, 1, 1.6, '#7ec0ff');
      break;
    }
    case 'moscaguardia':
      ell(ctx, 0, -11, 7, 2.5, '', 1.8, '#ffe27a');
      ell(ctx, -6, -3, 5, 3, 'rgba(230,230,240,0.8)', 1, 'rgba(0,0,0,0.4)', -0.5); ell(ctx, 6, -3, 5, 3, 'rgba(230,230,240,0.8)', 1, 'rgba(0,0,0,0.4)', 0.5);
      circ(ctx, 0, 1, 6, '#2a2a3a', L);
      break;
    case 'alas':
      for (const sd of [-1, 1]) { ell(ctx, sd * 6, 0, 8, 5, '#f6f2ff', 1.2, '#6a6080', sd * 0.6); ell(ctx, sd * 7, 3, 5, 3, '#dcd6f0', 0, OL, sd * 0.6); }
      break;
    case 'lupa':
      line(ctx, 4, 4, 11, 11, '#6a4a2a', 3.5);
      circ(ctx, -2, -2, 8, 'rgba(170,210,255,0.5)', 2.5, '#8a8a92');
      ell(ctx, -5, -5, 2.5, 1.5, 'rgba(255,255,255,0.7)', 0, OL, -0.7);
      break;
    case 'tirachinas':
      ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 1); ctx.lineTo(-7, -9); ctx.moveTo(0, 1); ctx.lineTo(7, -9); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(-7, -9); ctx.quadraticCurveTo(0, 0, 7, -9); ctx.strokeStyle = '#c04040'; ctx.lineWidth = 1.4; ctx.stroke();
      break;
    case 'trebol':
      for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) circ(ctx, dx, dy - 1, 5, '#4cae3a', 1.2);
      line(ctx, 0, 3, 3, 12, '#3a7a2a', 2);
      break;
    case 'llavemaestra':
      ctx.save(); ctx.scale(1.3, 1.3); drawKeyIcon(ctx, 0, 0, 1); ctx.restore();
      ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(240,235,220,0.75)'; ctx.fillRect(-14, -14, 28, 28); ctx.globalCompositeOperation = 'source-over';
      break;
    case 'polvora':
      ctx.beginPath(); ctx.moveTo(-9, 10); ctx.quadraticCurveTo(-12, -2, -4, -6); ctx.lineTo(4, -6); ctx.quadraticCurveTo(12, -2, 9, 10); ctx.closePath();
      ctx.fillStyle = '#9a7a4a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      drawBombIcon(ctx, 0, -6, 0.6);
      break;
    case 'rosario':
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; circ(ctx, Math.cos(a) * 8, -2 + Math.sin(a) * 7, 1.7, '#e6d6b0', 0.8); }
      line(ctx, 0, 5, 0, 13, '#e6d6b0', 2.2); line(ctx, -3, 8, 3, 8, '#e6d6b0', 2.2);
      break;
    case 'leche':
      fillRR(ctx, -7, -5, 14, 16, 1, '#f6f6f6', L);
      ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(0, -11); ctx.lineTo(7, -5); ctx.closePath(); ctx.fillStyle = '#e8e8e8'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a7ad8'; ctx.fillRect(-7, 1, 14, 4);
      break;
    case 'heladas':
      fillRR(ctx, -8, -8, 16, 16, 4, 'rgba(190,230,255,0.9)', L, '#4a7aa8');
      line(ctx, -4, -4, 0, -6, '#fff', 1.6);
      break;
    case 'cuerno':
      ctx.beginPath(); ctx.moveTo(-8, 10); ctx.quadraticCurveTo(-10, -6, 8, -11); ctx.quadraticCurveTo(-2, -2, -2, 10); ctx.closePath();
      ctx.fillStyle = '#5a3a28'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      line(ctx, -7, 4, -2, 4, 'rgba(255,255,255,0.25)', 1); line(ctx, -6, -1, 0, -2, 'rgba(255,255,255,0.25)', 1);
      break;
    case 'pacto':
      fillRR(ctx, -9, -9, 18, 18, 2, '#e8dcc0', L);
      for (let i = 0; i < 3; i++) line(ctx, -6, -5 + i * 4, 6, -5 + i * 4, '#8a7a60', 1);
      circ(ctx, 4, 6, 4, '#b01818', 1);
      break;
    case 'iman':
      ctx.beginPath(); ctx.arc(0, -1, 8, Math.PI, 0); ctx.strokeStyle = '#d02828'; ctx.lineWidth = 5; ctx.stroke();
      line(ctx, -8, -1, -8, 8, '#d02828', 5); line(ctx, 8, -1, 8, 8, '#d02828', 5);
      line(ctx, -8, 6, -8, 10, '#c8c8d0', 5); line(ctx, 8, 6, 8, 10, '#c8c8d0', 5);
      break;
    case 'hucha':
      ell(ctx, 0, 1, 11, 8, '#f2a0b8', L);
      circ(ctx, 10, 0, 3, '#e890a8', 1); ell(ctx, -4, -7, 2.5, 3, '#e890a8', 1);
      line(ctx, -2, -6, 3, -6, '#3a1a20', 1.6); circ(ctx, 5, -2, 1, '#111');
      line(ctx, -6, 8, -6, 11, OL, 2.4); line(ctx, 5, 8, 5, 11, OL, 2.4);
      break;
    case 'cafe':
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 4, -6); ctx.quadraticCurveTo(i * 4 + 3, -9, i * 4, -13); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke(); }
      fillRR(ctx, -8, -4, 14, 14, 3, '#f2f2f2', L);
      ctx.fillStyle = '#4a2a14'; ctx.fillRect(-7, -3, 12, 3);
      ctx.beginPath(); ctx.arc(7, 3, 3.5, -1.4, 1.4); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
      break;
    case 'mapa':
      ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-3, -6); ctx.lineTo(3, -8); ctx.lineTo(10, -6); ctx.lineTo(10, 8); ctx.lineTo(3, 6); ctx.lineTo(-3, 8); ctx.lineTo(-10, 6); ctx.closePath();
      ctx.fillStyle = '#e8dcb8'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      ctx.setLineDash([2, 2]); line(ctx, -7, 3, 1, -2, '#8a5a30', 1.2); ctx.setLineDash([]);
      line(ctx, 3, -4, 7, 0, '#c02020', 1.8); line(ctx, 7, -4, 3, 0, '#c02020', 1.8);
      break;
    case 'medallon':
      line(ctx, -6, -11, 0, -6, '#c8961e', 1.4); line(ctx, 6, -11, 0, -6, '#c8961e', 1.4);
      circ(ctx, 0, 2, 9, '#e2b23a', L); drawHeartShape(ctx, 0, 2, 5, 'soul', 2);
      break;
    case 'dado':
      fillRR(ctx, -10, -10, 20, 20, 4, '#f6f2ea', L);
      for (const [dx, dy] of [[-5, -5], [5, -5], [-5, 0], [5, 0], [-5, 5], [5, 5]]) circ(ctx, dx, dy, 1.8, '#c02020');
      break;
    case 'libro': case 'necro':
      fillRR(ctx, -9, -11, 18, 22, 2, id === 'necro' ? '#5a3a24' : '#3a2a4a', L);
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(7, -10, 2, 20);
      if (id === 'necro') { circ(ctx, -1, -1, 5, '#e6dcc4', 1); circ(ctx, -3, -2, 1.2, '#111'); circ(ctx, 1, -2, 1.2, '#111'); }
      else { circ(ctx, -1, -1, 4, '', 1.4, '#9a8ac8'); }
      break;
    case 'corazonsabroso':
      drawHeartShape(ctx, 0, 0, 10, 'red', 2);
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0.2, Math.PI - 0.2); ctx.strokeStyle = '#3a0505'; ctx.lineWidth = 1.4; ctx.stroke();
      circ(ctx, -3.5, -3, 1.2, '#3a0505'); circ(ctx, 3.5, -3, 1.2, '#3a0505');
      break;
    case 'reloj':
      line(ctx, -8, -11, 8, -11, '#7a4a22', 3); line(ctx, -8, 11, 8, 11, '#7a4a22', 3);
      ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(6, -10); ctx.lineTo(0, 0); ctx.lineTo(6, 10); ctx.lineTo(-6, 10); ctx.lineTo(0, 0); ctx.closePath();
      ctx.fillStyle = 'rgba(210,230,255,0.6)'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(4, 10); ctx.lineTo(0, 5); ctx.closePath(); ctx.fillStyle = '#e8c860'; ctx.fill();
      break;
    case 'boton':
      ell(ctx, 0, 5, 11, 5, '#6a6a72', L);
      ctx.beginPath(); ctx.ellipse(0, 3, 7.5, 9, 0, Math.PI, 0); ctx.fillStyle = '#e02828'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      ell(ctx, -2.5, -3, 2, 1.4, 'rgba(255,255,255,0.6)');
      break;
    case 'tarro':
      fillRR(ctx, -8, -7, 16, 18, 4, 'rgba(200,220,230,0.5)', L);
      fillRR(ctx, -7, -11, 14, 5, 1.5, '#8a6a3a', 1);
      for (const [dx, dy] of [[-3, 0], [3, 4], [0, -3], [-2, 6]]) circ(ctx, dx, dy, 1.6, '#3a5ad8');
      break;
    case 'teleporte':
      circ(ctx, 0, 0, 10, '#2a3a6a', L);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 3 + i * 2.5, i, i + 3.5); ctx.strokeStyle = '#8ad0ff'; ctx.lineWidth = 1.4; ctx.stroke(); }
      break;
    default:
      txt(ctx, '?', 0, 0, 16);
  }
  ctx.restore();
}

// ---------- Lágrimas y efectos ----------
function drawTear(ctx, t, enemy) {
  const y = t.y - Math.max(0, t.z);
  if (t.ring) {
    ctx.beginPath(); ctx.arc(t.x, y, t.r, 0, TAU); ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#ffd0d0'; ctx.lineWidth = 1; ctx.stroke();
    return;
  }
  shadow(ctx, t.x, t.y + 2, t.r * 0.8, t.r * 0.35, 0.25);
  if (t.flame) {
    ctx.beginPath(); ctx.moveTo(t.x - t.r, y + t.r * 0.6); ctx.quadraticCurveTo(t.x - t.r, y - t.r * 1.4, t.x, y - t.r * 2); ctx.quadraticCurveTo(t.x + t.r, y - t.r * 1.4, t.x + t.r, y + t.r * 0.6); ctx.closePath();
    ctx.fillStyle = t.color; ctx.fill(); circ(ctx, t.x, y, t.r * 0.5, '#fff2a8');
    return;
  }
  if (t.kind === 'fetus') { drawBombIcon(ctx, t.x, y, 0.8); return; }
  if (t.fx && (t.fx.teeth || t.fx.apple)) { ctx.save(); ctx.translate(t.x, y); ctx.rotate(Math.atan2(t.vy, t.vx)); fillRR(ctx, -t.r, -t.r * 0.5, t.r * 2, t.r, t.r * 0.4, t.color, 1.2); ctx.restore(); return; }
  circ(ctx, t.x, y, t.r, t.color, 1.2, enemy ? '#3a0505' : 'rgba(20,30,60,0.6)');
  circ(ctx, t.x - t.r * 0.35, y - t.r * 0.35, t.r * 0.32, 'rgba(255,255,255,0.75)');
}

function drawEffect(ctx, f) {
  const k = f.t / f.max;
  switch (f.type) {
    case 'splash': {
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.8 + k * 1.4), 0, TAU); ctx.strokeStyle = f.color; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.6; circ(ctx, f.x + Math.cos(a) * f.r * (1 + k * 2), f.y + Math.sin(a) * f.r * (1 + k * 2), f.r * 0.25 * (1 - k), f.color); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'boom': {
      ctx.globalAlpha = Math.max(0, 1 - k * 1.3);
      circ(ctx, f.x, f.y, f.r * (0.5 + k * 0.6), '#fff3c0');
      ctx.globalAlpha = Math.max(0, 0.8 - k);
      circ(ctx, f.x, f.y - 6, f.r * (0.4 + k * 0.7), '#ff9b2f');
      ctx.globalAlpha = Math.max(0, 0.6 - k * 0.6);
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6; circ(ctx, f.x + Math.cos(a) * f.r * 0.7 * (0.5 + k), f.y + Math.sin(a) * f.r * 0.5 * (0.5 + k) - k * 20, f.r * 0.25 * (1 + k), '#4a4040'); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'poof': {
      ctx.globalAlpha = (1 - k) * 0.7;
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circ(ctx, f.x + Math.cos(a) * f.r * k, f.y + Math.sin(a) * f.r * k * 0.6 - k * 10, f.r * 0.45 * (1 - k * 0.5), '#d8d0c8'); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'laser': {
      ctx.globalAlpha = 1 - k;
      line(ctx, f.x0, f.y0, f.x1, f.y1, f.color, f.w * 2.2);
      line(ctx, f.x0, f.y0, f.x1, f.y1, '#ffffff', f.w * 0.8);
      ctx.globalAlpha = 1;
      break;
    }
    case 'swing': {
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, f.a - 1.1 + k * 0.4, f.a + 1.1 + k * 0.4);
      ctx.strokeStyle = f.color; ctx.lineWidth = 10 * (1 - k) + 2; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.globalAlpha = 1;
      break;
    }
    case 'zap': {
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0);
      for (let i = 1; i < 5; i++) ctx.lineTo(lerp(f.x0, f.x1, i / 5) + rr(-5, 5), lerp(f.y0, f.y1, i / 5) + rr(-5, 5));
      ctx.lineTo(f.x1, f.y1); ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
  }
}

function drawBeam(ctx, b) {
  const pul = 1 + Math.sin(G.time * 50) * 0.12;
  const fade = Math.min(1, b.t / 0.1);
  const pal = b.color === 'holy' ? ['#c8b060', '#fff2b0', '#ffffff'] : b.color === 'shoop' ? ['#2a6a2a', '#7aff7a', '#e8ffe8'] : b.color === 'mega' ? ['#6a0606', '#ff3030', '#ffe0e0'] : ['#6a0606', '#d01818', '#ff9a8a'];
  const w = b.w / 13;
  ctx.save(); ctx.globalAlpha = 0.95 * fade; ctx.lineCap = 'round';
  line(ctx, b.x0, b.y0 - 14, b.x1, b.y1 - 14, pal[0], 22 * pul * w);
  line(ctx, b.x0, b.y0 - 14, b.x1, b.y1 - 14, pal[1], 15 * pul * w);
  line(ctx, b.x0, b.y0 - 14, b.x1, b.y1 - 14, pal[2], 5 * pul * w);
  circ(ctx, b.x1, b.y1 - 14, 14 * pul * w, pal[1]);
  ctx.restore();
}

// Elementos de juego dibujados sobre el suelo
function drawFloorExtras(ctx) {
  for (const c of G.pcreeps) {
    ctx.globalAlpha = Math.min(1, c.t / c.max * 2) * 0.55;
    const col = c.kind === 'gas' ? '#7ac850' : c.col === 'tar' || c.kind === 'slow' ? '#1a1a1e' : c.col === 'holy' ? '#9ad0ff' : c.col === 'black' ? '#141010' : c.col === 'red' ? '#a01818' : '#e8d24a';
    ell(ctx, c.x, c.y, c.r, c.r * (c.kind === 'gas' ? 0.9 : 0.6), col);
  }
  ctx.globalAlpha = 1;
  for (const h of G.holes) {
    const g = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, 46);
    g.addColorStop(0, '#000'); g.addColorStop(0.6, 'rgba(40,0,60,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, 46, 0, TAU); ctx.fill();
  }
  for (const m of G.missiles) {
    const k = 1 - m.t / m.max;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.5 * (0.6 + 0.4 * k), 0, TAU);
    ctx.strokeStyle = m.kind === 'missile' ? '#ff4040' : 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    if (m.kind === 'missile') { line(ctx, m.x - 8, m.y, m.x + 8, m.y, '#ff4040', 2); line(ctx, m.x, m.y - 8, m.x, m.y + 8, '#ff4040', 2); }
    else ell(ctx, m.x, m.y, m.r * k, m.r * k * 0.45, 'rgba(0,0,0,0.3)');
  }
  const p = G.player;
  if (p && p.epic && p.epic.on) {
    const E = p.epic;
    ctx.beginPath(); ctx.arc(E.x, E.y, 12, 0, TAU); ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 2; ctx.stroke();
    line(ctx, E.x - 16, E.y, E.x + 16, E.y, '#ff4040', 1.5); line(ctx, E.x, E.y - 16, E.x, E.y + 16, '#ff4040', 1.5);
  }
}

// Elementos dibujados por encima de las entidades
function drawAirExtras(ctx) {
  for (const m of G.missiles) {
    const k = 1 - m.t / m.max, y = m.y - (1 - k) * 300;
    if (m.kind === 'missile') {
      fillRR(ctx, m.x - 4, y - 18, 8, 18, 3, '#d8dce4', 1.2);
      ctx.beginPath(); ctx.moveTo(m.x - 4, y - 18); ctx.lineTo(m.x, y - 26); ctx.lineTo(m.x + 4, y - 18); ctx.fillStyle = '#d03030'; ctx.fill();
    } else if (m.kind === 'stomp') { ctx.globalAlpha = k; fillRR(ctx, m.x - 16, y - 40, 32, 36, 10, '#e0ad94', 1.5); ctx.globalAlpha = 1; }
    else { ctx.globalAlpha = k; ell(ctx, m.x, y - 20, 28, 24, '#bda1a0', 2); ctx.globalAlpha = 1; }
  }
  for (const l of G.lights) {
    ctx.globalAlpha = Math.min(1, l.t * 3) * 0.75;
    const g = ctx.createLinearGradient(l.x, l.y - 160, l.x, l.y);
    g.addColorStop(0, 'rgba(255,250,220,0)'); g.addColorStop(1, 'rgba(255,250,220,0.9)');
    ctx.fillStyle = g; ctx.fillRect(l.x - 12, l.y - 160, 24, 160);
    ell(ctx, l.x, l.y, 20, 8, 'rgba(255,250,210,0.8)');
    ctx.globalAlpha = 1;
  }
  for (const r of G.rings) {
    ctx.globalAlpha = Math.min(1, r.t * 3) * 0.7;
    ctx.beginPath(); ctx.arc(r.x, r.y - 6, r.r, 0, TAU);
    ctx.strokeStyle = r.dark ? '#1a0820' : r.dmg ? '#3a1050' : '#ffffff'; ctx.lineWidth = r.dark ? 8 : 3; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const e of G.eyes) { ell(ctx, e.x, e.y - 12, 7, 5, '#f6f2ec', 1.2); circ(ctx, e.x + e.dx * 2, e.y - 12 + e.dy * 2, 2.5, '#3a6ad0'); }
  const p = G.player;
  if (!p || p.dead) return;
  if (p.knife && activeMode(p) === 'knife') {
    const k = p.knife;
    ctx.save(); ctx.translate(k.x, k.y - 10); ctx.rotate(k.a + Math.PI / 2);
    fillRR(ctx, -3, -16, 6, 20, 2, '#d8dce4', 1.4); fillRR(ctx, -6, 3, 12, 3, 1, '#4a3a2a', 1); fillRR(ctx, -2.5, 5, 5, 9, 1, '#2a1a12', 1);
    ctx.restore();
  }
  if (p.ludo && activeMode(p) === 'ludo') {
    const L = p.ludo;
    shadow(ctx, L.x, L.y + 4, L.r * 0.8, L.r * 0.35, 0.25);
    circ(ctx, L.x, L.y - 14, L.r, tearColor(p.fx, p), 1.5, 'rgba(20,30,60,0.6)');
    circ(ctx, L.x - L.r * 0.35, L.y - 14 - L.r * 0.35, L.r * 0.3, 'rgba(255,255,255,0.75)');
  }
}

function drawFamiliar(ctx, f) {
  if (f.def.look === 'none') return;
  shadow(ctx, f.x, f.y + 4, 7, 2.5, 0.25);
  drawFamSprite(ctx, f.def, f.x, f.y - 9, 0.9, G.time + f.a);
}


// ---------- HUD ----------
function drawHUD(ctx) {
  const p = G.player;
  // objeto activo
  ctx.save();
  fillRR(ctx, 5, 5, 32, 32, 6, 'rgba(0,0,0,0.45)', 1.2, 'rgba(255,255,255,0.15)');
  if (p.active) {
    const max = activeMax(p);
    const full = !max || p.active.charge >= max;
    if (full) { const g = ctx.createRadialGradient(21, 21, 2, 21, 21, 18); g.addColorStop(0, 'rgba(255,240,170,0.45)'); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.fillRect(4, 4, 34, 34); }
    drawIcon(ctx, p.active.id, 21, 21, 0.95);
    if (max) {
      fillRR(ctx, 38, 6, 5, 30, 2, '#1a1010', 1, '#000');
      const h = 28 * Math.min(1, p.active.charge / max);
      ctx.fillStyle = full ? '#ffe27a' : '#e8e0d0'; ctx.fillRect(39, 35 - h, 3, h);
      if (p.active.charge > max) { const h2 = 28 * Math.min(1, (p.active.charge - max) / max); ctx.fillStyle = '#7be07b'; ctx.fillRect(39, 35 - h2, 3, h2); }
      if (max <= 12) for (let i = 1; i < max; i++) { const yy = 35 - 28 * i / max; line(ctx, 38, yy, 43, yy, '#1a1010', 1); }
    }
  }
  if (p.active2) { fillRR(ctx, 44, 28, 14, 14, 3, 'rgba(0,0,0,0.45)'); drawIcon(ctx, p.active2.id, 51, 35, 0.42); }
  ctx.restore();
  // corazones
  let i = 0;
  const hx = 54, hy = 11;
  for (let k = 0; k < p.maxRed; k++, i++) drawHeartShape(ctx, hx + (i % 6) * 13, hy + Math.floor(i / 6) * 12, 5.6, p.keeper ? 'coin' : 'red', clamp(p.red - k * 2, 0, 2));
  for (let k = 0; k < Math.ceil(p.soul / 2); k++, i++) drawHeartShape(ctx, hx + (i % 6) * 13, hy + Math.floor(i / 6) * 12, 5.6, 'soul', clamp(p.soul - k * 2, 0, 2));
  for (let k = 0; k < Math.ceil(p.black / 2); k++, i++) drawHeartShape(ctx, hx + (i % 6) * 13, hy + Math.floor(i / 6) * 12, 5.6, 'black', clamp(p.black - k * 2, 0, 2));
  if (p.lost) { ctx.globalAlpha = 0.5; drawHeartShape(ctx, hx, hy, 5.6, 'soul', 0); ctx.globalAlpha = 1; }
  // contadores
  const cy0 = 50;
  ell(ctx, 11, cy0, 4.2, 4.2, '#f2c43a', 1.1, '#8a5a10');
  txt(ctx, String(p.coins).padStart(2, '0'), 25, cy0, 12, '#f4ead8', 'center');
  drawBombIcon(ctx, 11, cy0 + 15, 0.6);
  txt(ctx, String(p.bombs).padStart(2, '0'), 25, cy0 + 15, 12, '#f4ead8', 'center');
  drawKeyIcon(ctx, 11, cy0 + 30, 0.62);
  txt(ctx, String(p.keys).padStart(2, '0'), 25, cy0 + 30, 12, '#f4ead8', 'center');
  if (Store.data.stats !== false && !(G.portrait && G.touchUI)) drawStatsColumn(ctx, p);
  if (G.run && (G.run.god || G.run.dmgx)) txt(ctx, [G.run.god ? 'INVENCIBLE' : '', G.run.dmgx ? 'DAÑO ×5' : ''].filter(Boolean).join(' · '), RW / 2, RH - 34, 10, '#ffe27a');
  // bolsillo (píldora o carta)
  if (p.pocket) {
    fillRR(ctx, RW - 37, RH - 37, 32, 32, 6, 'rgba(0,0,0,0.45)', 1.2, 'rgba(255,255,255,0.15)');
    if (p.pocket.k === 'pill') drawPill(ctx, p.pocket.v, RW - 21, RH - 21, 1.4); else drawCard(ctx, RW - 21, RH - 21, 1.3);
    if (!Input.touchMode) txt(ctx, 'Q', RW - 9, RH - 9, 9, '#cfc6b4');
  }
  drawMinimap(ctx);
  // barra del jefe
  const bosses = G.enemies.filter(e => e.boss && !e.parent && !e.dead);
  if (bosses.length && G.state !== 'bossintro') {
    let hp = 0, max = 0; for (const b of bosses) { hp += Math.max(0, b.hp); max += b.maxHp; }
    const w = 220, x = RW / 2 - w / 2, y = RH - 22;
    fillRR(ctx, x - 2, y - 2, w + 4, 12, 4, 'rgba(0,0,0,0.7)');
    fillRR(ctx, x, y, w * hp / max, 8, 3, '#c41a1a');
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 2, y + 1, Math.max(0, w * hp / max - 4), 2);
    circ(ctx, x - 10, y + 4, 7, '#e6dcc4', 1.2); circ(ctx, x - 12.5, y + 3, 1.6, '#111'); circ(ctx, x - 7.5, y + 3, 1.6, '#111');
  }
}

// ---------- Estadísticas ----------
function drawStatIcon(ctx, k, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (k) {
    case 'speed': drawIcon(ctx, 'zapatillas', 0, 0, 0.42); break;
    case 'tps':
      ctx.beginPath(); ctx.moveTo(0, -5.5); ctx.quadraticCurveTo(5, 1, 0, 4.5); ctx.quadraticCurveTo(-5, 1, 0, -5.5);
      ctx.fillStyle = '#7ec0ff'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'dmg':
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 2 : 5.2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fillStyle = '#e03a3a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'range': drawIcon(ctx, 'lupa', 0, 0, 0.42); break;
    case 'shot': drawIcon(ctx, 'perforantes', 0, 0, 0.42); break;
    case 'luck': drawIcon(ctx, 'trebol', 0, 0, 0.42); break;
  }
  ctx.restore();
}
function statRows(p) {
  return [['speed', p.speed.toFixed(2)], ['tps', p.tps.toFixed(2)], ['dmg', p.dmg.toFixed(2)],
    ['range', (p.range / 40).toFixed(2)], ['shot', p.shot.toFixed(2)], ['luck', String(p.luck)]];
}
function statDelta(p, k) {
  const fx = p.statFx && p.statFx[k];
  if (!fx || fx.t <= 0) return null;
  const d = k === 'range' ? fx.d / 40 : fx.d;
  return { text: (d > 0 ? '+' : '') + (k === 'luck' ? d.toFixed(0) : d.toFixed(2)), col: d > 0 ? '#7be07b' : '#ff6a5a', a: Math.min(1, fx.t) };
}
function drawStatsColumn(ctx, p) {
  const rows = statRows(p), y0 = 97, lh = 11.5;
  fillRR(ctx, 2, y0 - 7, 37, rows.length * lh + 3, 4, 'rgba(0,0,0,0.38)');
  rows.forEach(([k, v], i) => {
    const y = y0 + i * lh;
    drawStatIcon(ctx, k, 8.5, y);
    txt(ctx, v, 15.5, y + 0.5, 10.5, '#f4ead8', 'left', '#120a06');
    const dd = statDelta(p, k);
    if (dd) { ctx.globalAlpha = dd.a; txt(ctx, dd.text, 42, y + 0.5, 10, dd.col, 'left', '#120a06'); ctx.globalAlpha = 1; }
  });
}

function drawMinimap(ctx) {
  const fl = G.floor; if (!fl) return;
  const rooms = fl.rooms.filter(r => r.seen || r.visited);
  if (!rooms.length) return;
  let minx = 99, maxx = -1, miny = 99, maxy = -1;
  for (const r of rooms) for (const [gx, gy] of r.cells) { minx = Math.min(minx, gx); maxx = Math.max(maxx, gx); miny = Math.min(miny, gy); maxy = Math.max(maxy, gy); }
  const cw = 11, chh = 8, gap = 2;
  const w = (maxx - minx + 1) * (cw + gap) + gap + 4, h = (maxy - miny + 1) * (chh + gap) + gap + 4;
  const x0 = RW - 6 - w, y0 = 6;
  fillRR(ctx, x0, y0, w, h, 4, 'rgba(0,0,0,0.5)');
  for (const r of rooms) {
    const cur = r === G.room || (G.room.type === 'devil' && r.type === 'boss');
    const col = cur ? '#f4f0e8' : r.visited ? '#9a948a' : '#3e3a36';
    const line = r.visited || cur ? 'rgba(0,0,0,0.6)' : '#77706a';
    const at = ([gx, gy]) => [x0 + 3 + gap + (gx - minx) * (cw + gap), y0 + 3 + gap + (gy - miny) * (chh + gap)];
    // las celdas de una sala grande se dibujan unidas por el hueco que las separa
    for (const a of r.cells) for (const b of r.cells) {
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1 || a[0] > b[0] || a[1] > b[1]) continue;
      const [ax, ay] = at(a), [bx, by] = at(b);
      ctx.fillStyle = col; ctx.fillRect(Math.min(ax, bx) + (b[0] > a[0] ? cw - 1 : 0), Math.min(ay, by) + (b[1] > a[1] ? chh - 1 : 0), b[0] > a[0] ? gap + 2 : cw, b[1] > a[1] ? gap + 2 : chh);
    }
    for (const cell of r.cells) { const [cx, cy] = at(cell); fillRR(ctx, cx, cy, cw, chh, 2, col, 1, line); }
    const [rx, ry] = at(r.cells[0]);
    const ix = rx + cw / 2, iy = ry + chh / 2;
    if (r.type === 'boss') { circ(ctx, ix, iy, 3, '#c41a1a'); }
    else if (r.type === 'treasure') { ctx.beginPath(); ctx.moveTo(ix - 3.5, iy + 2.5); ctx.lineTo(ix - 3.5, iy - 2); ctx.lineTo(ix - 1.5, iy); ctx.lineTo(ix, iy - 3); ctx.lineTo(ix + 1.5, iy); ctx.lineTo(ix + 3.5, iy - 2); ctx.lineTo(ix + 3.5, iy + 2.5); ctx.closePath(); ctx.fillStyle = '#f2c43a'; ctx.fill(); }
    else if (r.type === 'shop') { circ(ctx, ix, iy, 2.8, '#f2c43a', 0.8, '#6a4a0a'); }
    else if (r.type === 'secret') { txt(ctx, '?', ix, iy + 0.5, 8, '#cfc6b4', 'center', ''); }
    else if (r.type === 'library') { circ(ctx, ix, iy, 2.6, '#6aa8ff', 0.8, '#1c3d70'); }
    else if (r.type === 'sacrifice') { txt(ctx, '+', ix, iy + 0.5, 11, '#e0453a', 'center', ''); }
    else if (r.type === 'challenge') { circ(ctx, ix, iy, 2.6, '#ff9b2f', 0.8, '#6a3a0a'); }
    else if (r.type === 'miniboss') { circ(ctx, ix, iy, 3, '#c41a1a', 0.8, '#f2c43a'); }
  }
}

function drawPaperBanner(ctx, x, y, title, sub, alpha, size = 24) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `${size}px ${FONT}`;
  const w = Math.max(ctx.measureText(title).width, sub ? ctx.measureText(sub).width * 0.7 : 0) + 50;
  const h = sub ? size + 30 : size + 16;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2 + 3);
  for (let i = 0; i <= 10; i++) ctx.lineTo(x - w / 2 + w * i / 10, y - h / 2 + (i % 2 ? 0 : 4));
  ctx.lineTo(x + w / 2 - 4, y + h / 2 - 2);
  for (let i = 10; i >= 0; i--) ctx.lineTo(x - w / 2 + w * i / 10, y + h / 2 - (i % 2 ? 0 : 4));
  ctx.closePath();
  ctx.fillStyle = '#e9dcc0'; ctx.fill();
  ctx.strokeStyle = '#6a5034'; ctx.lineWidth = 1.5; ctx.stroke();
  txt(ctx, title, x, sub ? y - 8 : y, size, '#2a1a10', 'center', '');
  if (sub) txt(ctx, sub, x, y + size * 0.55, size * 0.62, '#5a4030', 'center', '');
  ctx.restore();
}

// ---------- Iconos de los objetos de la wiki ----------
// Objetos que comparten icono dibujado a mano
const ICON_ALIAS = {
  1: 'cebolla', 2: 'trimirada', 3: 'buscadoras', 7: 'ojosangre', 8: 'hermanito', 17: 'llavemaestra', 20: 'alas', 22: 'almuerzo', 23: 'cena', 25: 'desayuno',
  28: 'zapatillas', 34: 'libromaldito', 35: 'necro', 40: 'boton', 44: 'teleporte', 45: 'corazonsabroso', 46: 'trebol', 48: 'perforantes', 51: 'pentagrama',
  53: 'iman', 54: 'mapa', 58: 'libro', 66: 'reloj', 68: 'laser', 70: 'hormonas', 72: 'rosario', 80: 'pacto', 89: 'heladas', 103: 'toxicas', 105: 'dado',
  112: 'moscaguardia', 113: 'bebedemonio', 115: 'fantasma', 118: 'azufre', 149: 'vomitivo', 153: 'arana', 169: 'ojogrande', 179: 'alas', 184: 'alas',
  190: 'polvora', 215: 'cuerno', 221: 'goma', 227: 'hucha', 330: 'leche', 434: 'tarro', 707: 'hamburguesa',
};
const ICON_CACHE = {};

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function iconInfo(id) {
  if (ICON_CACHE[id]) return ICON_CACHE[id];
  const it = ITEMS[id], sp = it.spec, h = hashStr(it.name);
  const info = { kind: 'rune', hue: h % 360, h };
  const ops = sp.ops, has = t => ops.find(o => o.t === t);
  const mode = has('mode');
  const flag = re => ops.find(o => o.t === 'flag' && re.test(o.k));
  const res = re => ops.find(o => o.t === 'res' && re.test(o.k));
  if (it.kind === 'a') {
    const u = (sp.use || []).join(',');
    if (/reroll|d4|d7|d8|d10|d12|d1|dinfinity|spindown|crooked/.test(u)) info.kind = 'die';
    else if (/heal|soul|hp:|black/.test(u)) info.kind = 'aheart';
    else if (/tele/.test(u)) info.kind = 'swirl';
    else if (/flies|spiders|jar|wisp|tempfam|turret/.test(u)) info.kind = 'jar';
    else if (/kami|megabomb|troll|tnt|boom|missile|bobhead|decoy|detonate/.test(u)) info.kind = 'bomb';
    else if (/card|pill|placebo|blank/.test(u)) info.kind = 'card';
    else if (/light|shoop|megablast|krampus|brim|flame/.test(u)) info.kind = 'beam';
    else if (/drop|coin|slot|nickel|fingers|keeperbox|coupon|pandora|fortune|craft|dropitem|dupe/.test(u)) info.kind = 'bag';
    else if (/shield|unicorn|dash|jump/.test(u)) info.kind = 'shoe';
    else if (/map|doors|trapdoor|refloor|rkey/.test(u)) info.kind = 'key';
    else info.kind = 'book';
  } else if (mode) info.kind = 'mode:' + mode.k;
  else if (sp.fams.length) { info.kind = 'fam'; info.fam = sp.fams[0]; }
  else if (has('revive')) info.kind = 'ankh';
  else if (flag(/^flight$/)) info.kind = 'wings';
  else if (res(/^(hp|hpe|bone)$/)) info.kind = 'food';
  else if (res(/^(soul|black)$/)) { info.kind = 'heart'; info.black = !!res(/^black$/); }
  else if (res(/^coin$/)) info.kind = 'coin';
  else if (res(/^bomb$/) || has('bombfx')) info.kind = 'bombp';
  else if (res(/^key$/)) info.kind = 'key';
  else if (ops.some(o => o.t === 'flag' && TEAR_FLAGS.has(o.k))) {
    const f = ops.find(o => o.t === 'flag' && TEAR_FLAGS.has(o.k)), fx = {};
    fx[f.k] = true;
    info.kind = 'eye'; info.col = tearColor(fx, null); info.multi = !!flag(/^(x[234]|wiz|loki)$/);
  }
  else if (flag(/^x[234]$/)) { info.kind = 'eye'; info.multi = true; info.col = '#a8cdf5'; }
  else if (has('aura') || has('trail')) info.kind = 'aura';
  else if (flag(/map|compass|mind|xray|bluemap/)) info.kind = 'map';
  else if (has('stat') && !has('event')) info.kind = 'stat:' + has('stat').k;
  ICON_CACHE[id] = info;
  return info;
}

function drawIcon(ctx, id, x, y, s = 1) {
  const a = ICON_ALIAS[id];
  if (a) return drawHandIcon(ctx, a, x, y, s);
  if (!ITEMS[id]) return drawHandIcon(ctx, id, x, y, s);
  const I = iconInfo(id), c1 = `hsl(${I.hue},55%,55%)`, c2 = `hsl(${(I.hue + 40) % 360},45%,35%)`;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const L = 1.4;
  switch (I.kind) {
    case 'die':
      fillRR(ctx, -10, -10, 20, 20, 4, `hsl(${I.hue},30%,88%)`, L);
      for (const [dx, dy] of [[-5, -5], [5, 5], [0, 0], [5, -5], [-5, 5]].slice(0, 2 + I.h % 4)) circ(ctx, dx, dy, 1.8, c2);
      break;
    case 'aheart': drawHeartShape(ctx, 0, 1, 9, I.h % 3 ? 'red' : 'soul', 2); line(ctx, -3, 1, 3, 1, '#fff', 2); line(ctx, 0, -2, 0, 4, '#fff', 2); break;
    case 'swirl':
      circ(ctx, 0, 0, 10, c2, L);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 3 + i * 2.5, i, i + 3.5); ctx.strokeStyle = c1; ctx.lineWidth = 1.5; ctx.stroke(); }
      break;
    case 'jar':
      fillRR(ctx, -8, -7, 16, 18, 4, 'rgba(200,220,230,0.5)', L); fillRR(ctx, -7, -11, 14, 5, 1.5, c2, 1);
      for (let i = 0; i < 4; i++) circ(ctx, -4 + (i % 2) * 7, -1 + Math.floor(i / 2) * 6, 1.6, c1);
      break;
    case 'bomb': drawBombIcon(ctx, 0, 1, 1.25); circ(ctx, 4, -3, 2.5, c1); break;
    case 'card': ctx.rotate(-0.2); drawCard(ctx, 0, 0, 1.6); break;
    case 'beam': fillRR(ctx, -4, -12, 8, 24, 3, c1, 1); fillRR(ctx, -1.5, -12, 3, 24, 1, '#fff6e0'); break;
    case 'bag':
      ctx.beginPath(); ctx.moveTo(-9, 10); ctx.quadraticCurveTo(-12, -2, -4, -6); ctx.lineTo(4, -6); ctx.quadraticCurveTo(12, -2, 9, 10); ctx.closePath();
      ctx.fillStyle = c2; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke(); circ(ctx, 0, 3, 3, '#f2c43a', 1);
      break;
    case 'shoe':
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-9, -6); ctx.lineTo(-2, -6); ctx.quadraticCurveTo(2, 0, 10, 1); ctx.lineTo(10, 5); ctx.closePath();
      ctx.fillStyle = c1; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke(); fillRR(ctx, -11, 4, 22, 4, 2, '#f2f2f2', 1);
      break;
    case 'key': drawKeyIcon(ctx, 0, 0, 1.4); break;
    case 'book': fillRR(ctx, -9, -11, 18, 22, 2, c2, L); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(7, -10, 2, 20); circ(ctx, -1, -1, 4, '', 1.4, c1); break;
    case 'fam': drawFamSprite(ctx, FAMS[I.fam] || FAMS.bobby, 0, 2, 1.15, 0); break;
    case 'ankh':
      ctx.strokeStyle = '#e2b23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -5, 4, 5, 0, 0, TAU);
      ctx.moveTo(0, 0); ctx.lineTo(0, 11); ctx.moveTo(-6, 2); ctx.lineTo(6, 2); ctx.stroke();
      break;
    case 'wings': for (const sd of [-1, 1]) ell(ctx, sd * 6, 0, 8, 5, `hsl(${I.hue},40%,90%)`, 1.2, '#6a6080', sd * 0.6); break;
    case 'food': ell(ctx, 0, 4, 12, 6, '#f2f2f2', L); ell(ctx, 0, 1, 7, 4, c1, 1); ell(ctx, -2, -1, 2.5, 1.5, 'rgba(255,255,255,0.5)'); break;
    case 'heart': drawHeartShape(ctx, 0, 0, 10, I.black ? 'black' : 'soul', 2); break;
    case 'coin': ell(ctx, 0, 0, 9, 9, '#f2c43a', L, '#8a5a10'); txt(ctx, '¢', 0, 1, 12, '#8a5a10', 'center', ''); break;
    case 'bombp': drawBombIcon(ctx, -3, 2, 1); drawBombIcon(ctx, 5, 0, 0.75); break;
    case 'eye':
      if (I.multi) { for (const ex of [-7, 0, 7]) { ell(ctx, ex, 0, 3.4, 4.6, '#fff', 1.1); circ(ctx, ex, 0.5, 2, I.col); } }
      else { ell(ctx, 0, 0, 11, 7.5, '#f6f2ec', L); circ(ctx, 0, 0, 5, I.col); circ(ctx, 0, 0, 2.2, '#111'); circ(ctx, -1.5, -1.5, 1, '#fff'); }
      break;
    case 'aura': circ(ctx, 0, 0, 11, `hsla(${I.hue},70%,60%,0.3)`, 1.5, `hsl(${I.hue},70%,60%)`); circ(ctx, 0, 0, 5, `hsl(${I.hue},70%,70%)`); break;
    case 'map': drawHandIcon(ctx, 'mapa', 0, 0, 1); break;
    case 'stat:dmg':
      ctx.rotate(-0.7); fillRR(ctx, -3.5, -9, 7, 15, 1.5, '#f0e8e8', L);
      ctx.fillStyle = `hsl(${I.hue % 40},75%,50%)`; ctx.fillRect(-2.2, -3, 4.4, 8);
      line(ctx, 0, 6, 0, 13, '#9aa', 1.4); line(ctx, -5, -10, 5, -10, OL, 2.2);
      break;
    case 'stat:tps':
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(10, 2, 0, 10); ctx.quadraticCurveTo(-10, 2, 0, -11);
      ctx.fillStyle = `hsl(${200 + I.hue % 40},70%,65%)`; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      circ(ctx, -3, -1, 2, 'rgba(255,255,255,0.7)');
      break;
    case 'stat:spd': drawHandIcon(ctx, 'zapatillas', 0, 0, 1); break;
    case 'stat:rng': drawHandIcon(ctx, 'lupa', 0, 0, 1); break;
    case 'stat:sht': drawHandIcon(ctx, 'perforantes', 0, 0, 1); break;
    case 'stat:lck': drawHandIcon(ctx, 'trebol', 0, 0, 1); break;
    case 'mode:brim': drawHandIcon(ctx, 'azufre', 0, 0, 1); break;
    case 'mode:laser': case 'mode:tech2': drawHandIcon(ctx, 'laser', 0, 0, 1); break;
    case 'mode:knife': case 'mode:sword': case 'mode:club':
      ctx.rotate(-0.8); fillRR(ctx, -2.5, -12, 5, 16, 1, I.kind === 'mode:club' ? '#ece4d2' : '#d8dce4', L);
      fillRR(ctx, -6, 3, 12, 3, 1, '#6a4a2a', 1); fillRR(ctx, -2, 5, 4, 7, 1, '#4a2a1a', 1);
      break;
    case 'mode:fetus': case 'mode:epic':
      circ(ctx, 0, 0, 10, '#f0d2c2', L); circ(ctx, -3, -1, 1.6, '#111'); circ(ctx, 3, -1, 1.6, '#111'); drawBombIcon(ctx, 6, 6, 0.55);
      break;
    case 'mode:ludo': circ(ctx, 0, 0, 10, '#a8cdf5', L, '#2a3a6a'); circ(ctx, -3, -3, 3, 'rgba(255,255,255,0.7)'); break;
    case 'mode:techx': circ(ctx, 0, 0, 9, '', 3, '#ff4040'); circ(ctx, 0, 0, 4, '', 2, '#ffa0a0'); break;
    case 'mode:choco':
      fillRR(ctx, -7, -5, 14, 16, 1, '#8a5a3a', L);
      ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(0, -11); ctx.lineTo(7, -5); ctx.closePath(); ctx.fillStyle = '#7a4a2a'; ctx.fill(); ctx.stroke();
      break;
    case 'mode:lung': case 'mode:haemo': ell(ctx, -4, 0, 6, 9, '#c86a6a', L); ell(ctx, 4, 0, 6, 9, '#c86a6a', L); break;
    case 'mode:cursed': ell(ctx, 0, 0, 11, 7.5, '#f6f2ec', L); circ(ctx, 0, 0, 5, '#6a2a8a'); circ(ctx, 0, 0, 2.2, '#111'); line(ctx, -9, -8, 9, -8, '#3a1a3a', 2); break;
    case 'mode:ipecac': drawHandIcon(ctx, 'vomitivo', 0, 0, 1); break;
    case 'mode:maw': circ(ctx, 0, 0, 10, '#1a1020', 3, '#000'); circ(ctx, 0, 0, 5, '#3a1a4a'); break;
    default: {
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(9, -3); ctx.lineTo(7, 9); ctx.lineTo(-7, 9); ctx.lineTo(-9, -3); ctx.closePath();
      ctx.fillStyle = `hsl(${I.hue},18%,62%)`; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = L; ctx.stroke();
      ctx.strokeStyle = `hsl(${I.hue},70%,35%)`; ctx.lineWidth = 1.8; ctx.beginPath();
      const g = I.h % 4;
      if (g === 0) { ctx.moveTo(-3, -4); ctx.lineTo(3, 4); ctx.moveTo(3, -4); ctx.lineTo(-3, 4); }
      else if (g === 1) { ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-4, -1); ctx.lineTo(4, -1); }
      else if (g === 2) { ctx.arc(0, 0, 4, 0, TAU); }
      else { ctx.moveTo(-4, 5); ctx.lineTo(0, -5); ctx.lineTo(4, 5); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBattery(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fillRR(ctx, -5, -8, 10, 16, 2, '#2a2a30', 1.2, '#000');
  ctx.fillStyle = '#f2c43a'; ctx.fillRect(-4, -1, 8, 8);
  fillRR(ctx, -2, -10, 4, 2.5, 1, '#c0c0c8', 0.8, '#000');
  line(ctx, -1, 1, 1, 4, '#2a2a30', 1.4);
  ctx.restore();
}
function drawCard(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fillRR(ctx, -5, -7, 10, 14, 1.5, '#f2ead8', 1.2, '#5a4030');
  ctx.strokeStyle = '#b8343a'; ctx.lineWidth = 1; ctx.strokeRect(-3.5, -5.5, 7, 11);
  circ(ctx, 0, 0, 2, '#b8343a');
  ctx.restore();
}

// ---------- Familiares ----------
function drawFamSprite(ctx, d, x, y, s, t) {
  const look = d.look || 'baby', col = d.col || '#f0d2c2';
  const k = s * (d.big ? 1.4 : d.small ? 0.7 : 1);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const flap = Math.abs(Math.sin((t || 0) * 30));
  switch (look) {
    case 'baby': case 'angel': case 'demon': {
      if (look === 'angel') { ell(ctx, -8, -2, 6, 3, '#fff', 1, '#aaa', -0.4); ell(ctx, 8, -2, 6, 3, '#fff', 1, '#aaa', 0.4); }
      if (d.horns || look === 'demon') for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 3, -7); ctx.lineTo(sd * 8, -13); ctx.lineTo(sd * 7, -6); ctx.closePath(); ctx.fillStyle = '#1a0a0a'; ctx.fill(); }
      if (d.hair) ell(ctx, 0, 2, 10, 9, d.hair, 1, OL);
      circ(ctx, 0, 1, 8.5, col, 1.4);
      if (d.hair) { ctx.beginPath(); ctx.arc(0, -1, 8.5, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = d.hair; ctx.fill(); }
      ell(ctx, -3, 0, 1.6, 2.2, d.horns ? '#e03030' : '#111'); ell(ctx, 3, 0, 1.6, 2.2, d.horns ? '#e03030' : '#111');
      if (look === 'angel') { ctx.beginPath(); ctx.ellipse(0, -10, 6, 2, 0, 0, TAU); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (d.crown) { ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-6, -12); ctx.lineTo(-3, -8); ctx.lineTo(0, -13); ctx.lineTo(3, -8); ctx.lineTo(6, -12); ctx.lineTo(6, -6); ctx.closePath(); ctx.fillStyle = '#f2c43a'; ctx.fill(); }
      break;
    }
    case 'ghost':
      ctx.globalAlpha *= 0.75;
      ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-8, 0); ctx.arc(0, 0, 8, Math.PI, 0); ctx.lineTo(8, 8); ctx.quadraticCurveTo(4, 4, 0, 8); ctx.quadraticCurveTo(-4, 4, -8, 8);
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); circ(ctx, -3, 0, 1.6, '#111'); circ(ctx, 3, 0, 1.6, '#111');
      break;
    case 'fly':
      ell(ctx, -5, -4, 5, 2 + flap * 2, 'rgba(230,230,240,0.75)', 1, 'rgba(0,0,0,0.4)', -0.5); ell(ctx, 5, -4, 5, 2 + flap * 2, 'rgba(230,230,240,0.75)', 1, 'rgba(0,0,0,0.4)', 0.5);
      circ(ctx, 0, 0, 5.5, col, 1.2);
      break;
    case 'eye': ell(ctx, 0, 0, 8, 6, col, 1.4); circ(ctx, 1, 0, 3.2, '#3a6ad0'); circ(ctx, 1, 0, 1.5, '#111'); break;
    case 'blob': circ(ctx, -4, 1, 6, col, 1.2); circ(ctx, 4, 2, 6, col, 1.2); circ(ctx, 0, -3, 7, col, 1.2); circ(ctx, -2, -4, 1.4, '#111'); circ(ctx, 2, -4, 1.4, '#111'); break;
    case 'orb': circ(ctx, 0, 0, 7, col, 1.3); circ(ctx, -2, -2, 2, 'rgba(255,255,255,0.7)'); break;
    case 'sack':
      ctx.beginPath(); ctx.moveTo(-7, 8); ctx.quadraticCurveTo(-10, -2, -3, -5); ctx.lineTo(3, -5); ctx.quadraticCurveTo(10, -2, 7, 8); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke(); line(ctx, -3, -5, 3, -5, '#3a2a1a', 2);
      break;
    case 'blade': ctx.rotate((t || 0) * 6); fillRR(ctx, -2, -10, 4, 14, 1, col, 1); fillRR(ctx, -5, 3, 10, 2.5, 1, '#6a4a2a', 1); break;
    case 'bone':
      ctx.rotate(0.6); fillRR(ctx, -2, -8, 4, 16, 2, col, 1);
      for (const [dx, dy] of [[-2, -8], [2, -8], [-2, 8], [2, 8]]) circ(ctx, dx, dy, 2.5, col, 1);
      break;
    case 'meat': fillRR(ctx, -7, -7, 14, 14, 3, col, 1.3); line(ctx, -4, -2, 4, 2, 'rgba(0,0,0,0.3)', 1.2); circ(ctx, -2, -1, 1.2, '#111'); circ(ctx, 3, -1, 1.2, '#111'); break;
    case 'bandage': circ(ctx, 0, 0, 7.5, col, 1.3); line(ctx, -6, -3, 6, 3, '#c8b8a0', 1.5); line(ctx, -6, 3, 6, -3, '#c8b8a0', 1.5); break;
    case 'robot':
      fillRR(ctx, -7, -7, 14, 13, 3, col, 1.3); circ(ctx, -3, -1, 1.8, '#ff3030'); circ(ctx, 3, -1, 1.8, '#ff3030');
      line(ctx, 0, -7, 0, -11, '#555', 1.5); circ(ctx, 0, -11, 1.5, '#ff3030');
      break;
    case 'spider':
      for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) line(ctx, 0, 0, sd * 9, -4 + i * 4, '#111', 1.2);
      ell(ctx, 0, 0, 5, 4, col, 1, '#000'); circ(ctx, -1.5, -1.5, 1, '#ff3a3a'); circ(ctx, 1.5, -1.5, 1, '#ff3a3a');
      break;
    case 'worm': for (let i = 2; i >= 0; i--) circ(ctx, -i * 4, Math.sin((t || 0) * 8 + i) * 1.5, 5 - i * 0.6, col, 1); circ(ctx, 2, -1, 1, '#111'); break;
    case 'dog': ell(ctx, 0, 2, 8, 6, col, 1.3); circ(ctx, 6, -3, 5, col, 1.2); ell(ctx, 4, -8, 2, 3, col, 1); circ(ctx, 7, -4, 1.2, '#111'); break;
    case 'cube': fillRR(ctx, -7, -7, 14, 14, 2, 'rgba(190,230,255,0.85)', 1.3, '#4a7aa8'); circ(ctx, -2, -1, 1.3, '#111'); circ(ctx, 3, -1, 1.3, '#111'); break;
    case 'poop': ell(ctx, 0, 4, 8, 4.5, col, 1.2); ell(ctx, 0, 0, 6, 3.5, col, 1.2); ell(ctx, 0, -4, 3.5, 2.5, col, 1.2); break;
    case 'bag': fillRR(ctx, -5, -10, 10, 18, 4, col, 1.3); line(ctx, 0, -10, 0, -14, '#555', 1.5); break;
    case 'brain':
      circ(ctx, 0, 0, 7, col, 1.3); line(ctx, 0, -6, 0, 6, 'rgba(0,0,0,0.3)', 1);
      ctx.beginPath(); ctx.arc(-3, 0, 3, 0.5, 2.6); ctx.arc(3, 0, 3, 0.5, 2.6); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
      break;
    case 'box': fillRR(ctx, -7, -6, 14, 12, 2, col, 1.3); line(ctx, -7, -2, 7, -2, 'rgba(0,0,0,0.35)', 1.2); break;
    case 'egg': ell(ctx, 0, 0, 6.5, 8.5, col, 1.3); circ(ctx, -2, -3, 1.5, 'rgba(255,255,255,0.7)'); break;
    case 'flame':
      ctx.beginPath(); ctx.moveTo(-5, 5); ctx.quadraticCurveTo(-6, -4, 0, -10 - flap * 2); ctx.quadraticCurveTo(6, -4, 5, 5); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); circ(ctx, 0, 1, 3, '#fff6c0');
      break;
    case 'star':
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.5 : 9; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'finger': fillRR(ctx, -3, -10, 6, 16, 3, col, 1.2); ell(ctx, 0, -8, 2, 1.5, '#f0e8e0'); break;
    case 'ball': circ(ctx, 0, 0, 8, col, 1.5, '#000'); circ(ctx, -2.5, -2.5, 2.2, 'rgba(255,255,255,0.4)'); break;
    case 'none': break;
    default: circ(ctx, 0, 0, 7, col, 1.3);
  }
  ctx.restore();
}
