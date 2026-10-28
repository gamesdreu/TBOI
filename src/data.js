'use strict';
/* =========================================================
   Datos: personajes, pisos, enemigos, jefes, objetos y píldoras
   ========================================================= */
const THEMES = {
  basement: { floor: '#5e412d', floor2: '#4b3222', floor3: '#6e4e37', wall: '#3b291d', wall2: '#2a1c13', wall3: '#4a3526', rock: '#7d6b59', rock2: '#5b4b3d', rock3: '#9a8774', vig: 0.55 },
  caves:    { floor: '#5d564b', floor2: '#4a443b', floor3: '#6c6457', wall: '#39332c', wall2: '#28231e', wall3: '#4a4339', rock: '#8a8173', rock2: '#625a4f', rock3: '#a59c8c', vig: 0.6 },
  depths:   { floor: '#3f4049', floor2: '#33343c', floor3: '#4b4c57', wall: '#27282e', wall2: '#1a1b20', wall3: '#33343d', rock: '#6f717c', rock2: '#4b4d57', rock3: '#8a8c98', vig: 0.68 },
  womb:     { floor: '#7d2f2c', floor2: '#672523', floor3: '#8f3b37', wall: '#511918', wall2: '#3a0f0f', wall3: '#652220', rock: '#a65049', rock2: '#7d332e', rock3: '#c06a62', vig: 0.62 },
};

const FLOORS = [
  { name: 'Sótano I', theme: 'basement', bosses: ['gloton', 'zumbido', 'gusano'] },
  { name: 'Sótano II', theme: 'basement', bosses: ['gloton', 'zumbido', 'gusano'] },
  { name: 'Cuevas I', theme: 'caves', bosses: ['masa', 'llorona', 'gusano', 'gloton'] },
  { name: 'Cuevas II', theme: 'caves', bosses: ['masa', 'llorona', 'zumbido', 'gloton'] },
  { name: 'Profundidades I', theme: 'depths', bosses: ['masa', 'llorona', 'gloton', 'gusano'] },
  { name: 'Profundidades II', theme: 'depths', bosses: ['mama'] },
  { name: 'Útero I', theme: 'womb', bosses: ['masa', 'llorona', 'zumbido', 'gusano'] },
  { name: 'Útero II', theme: 'womb', bosses: ['corazon'] },
];

const ENEMY_POOLS = {
  basement: [['fly', 3], ['afly', 3], ['pooter', 2], ['gaper', 3], ['horf', 2], ['clotty', 2], ['spider', 2], ['charger', 1], ['hopper', 2]],
  caves: [['afly', 2], ['pooter', 2], ['gaper', 2], ['spider', 2], ['charger', 2], ['hopper', 2], ['boomfly', 2], ['host', 2], ['fatty', 1], ['mulligan', 2], ['bigspider', 1], ['clotty', 1]],
  depths: [['gaper', 2], ['host', 3], ['fatty', 2], ['mulligan', 2], ['globin', 3], ['bigspider', 2], ['hive', 2], ['boomfly', 2], ['leaper', 2], ['clotty', 2], ['charger', 1]],
  womb: [['globin', 3], ['leaper', 3], ['hive', 2], ['host', 3], ['fatty', 2], ['boomfly', 2], ['afly', 3], ['bigspider', 2], ['clotty', 2], ['charger', 2]],
};

// hp base, radio, velocidad, coste en "puntos de dificultad", vuela
const EN = {
  fly:       { name: 'Mosca', hp: 3, r: 7, speed: 55, cost: 0.45, fly: true },
  afly:      { name: 'Mosca furiosa', hp: 5, r: 8, speed: 85, cost: 0.6, fly: true },
  pooter:    { name: 'Escupemoscas', hp: 8, r: 10, speed: 35, cost: 1, fly: true },
  gaper:     { name: 'Boquiabierto', hp: 10, r: 13, speed: 72, cost: 1 },
  horf:      { name: 'Cabeza flotante', hp: 10, r: 12, speed: 0, cost: 1 },
  clotty:    { name: 'Coágulo', hp: 12, r: 12, speed: 60, cost: 1.2 },
  spider:    { name: 'Araña', hp: 6, r: 8, speed: 170, cost: 0.7 },
  charger:   { name: 'Gusano embestidor', hp: 12, r: 10, speed: 55, cost: 1 },
  hopper:    { name: 'Saltarín', hp: 10, r: 10, speed: 0, cost: 1 },
  boomfly:   { name: 'Mosca bomba', hp: 12, r: 11, speed: 75, cost: 1.2, fly: true },
  host:      { name: 'Calavera', hp: 14, r: 13, speed: 0, cost: 1.3 },
  fatty:     { name: 'Gordinflón', hp: 32, r: 17, speed: 38, cost: 1.6 },
  mulligan:  { name: 'Hinchado', hp: 16, r: 13, speed: 50, cost: 1.4 },
  globin:    { name: 'Carnoso', hp: 16, r: 13, speed: 68, cost: 1.5 },
  bigspider: { name: 'Araña gigante', hp: 16, r: 12, speed: 150, cost: 1.5 },
  hive:      { name: 'Colmena', hp: 24, r: 15, speed: 20, cost: 2 },
  leaper:    { name: 'Brincador', hp: 18, r: 12, speed: 0, cost: 1.5 },
};

const BOSSES = {
  gloton:  { name: 'Glotón', hp: 250, r: 34 },
  zumbido: { name: 'Señor Zumbido', hp: 160, r: 30, fly: true },
  gusano:  { name: 'Gusano Gemelo', hp: 170, r: 15 },
  masa:    { name: 'La Masa', hp: 420, r: 44 },
  llorona: { name: 'La Llorona', hp: 340, r: 30 },
  mama:    { name: 'Mamá', hp: 640, r: 1 },
  corazon: { name: 'El Corazón', hp: 1100, r: 40 },
};

/* ---------- Píldoras ---------- */
const PILL_COLORS = [
  ['#f4f4f4', '#3a63e0'], ['#ffd34a', '#f4f4f4'], ['#e84848', '#f4f4f4'], ['#4cc463', '#4cc463'],
  ['#ff86cf', '#f4f4f4'], ['#262626', '#f4f4f4'], ['#ff9b2f', '#ffd34a'], ['#8de2ff', '#f4f4f4'],
];
const PILL_EFFECTS = [
  { name: '¡Salud recuperada!', fn: p => { if (p.keeper || !p.noRed) p.red = p.maxRed * 2; } },
  { name: 'Bombas son llaves', fn: p => { const b = p.bombs; p.bombs = Math.min(99, p.keys); p.keys = Math.min(99, b); } },
  { name: 'Velocidad arriba', fn: p => { p.mods.spdAdd += 0.15; } },
  { name: 'Velocidad abajo', fn: p => { p.mods.spdAdd -= 0.1; } },
  { name: 'Lágrimas arriba', fn: p => { p.mods.tpsAdd += 0.35; } },
  { name: 'Lágrimas abajo', fn: p => { p.mods.tpsAdd -= 0.25; } },
  { name: 'Alcance arriba', fn: p => { p.mods.rangeAdd += 60; } },
  { name: 'Alcance abajo', fn: p => { p.mods.rangeAdd -= 50; } },
  { name: 'Suerte arriba', fn: p => { p.mods.luckAdd += 1; } },
  { name: 'Mal viaje', fn: p => { if (p.red + p.soul + p.black <= 2) p.red = p.maxRed * 2; else { p.iframes = 0; hurtPlayer(2, 'Una píldora'); } } },
  { name: '¡Energía!', fn: p => { if (p.active) p.active.charge = Math.max(p.active.charge, activeMax(p)); } },
  { name: 'Te sientes protegido', fn: p => { if (canAddSoul(p)) p.soul += 2; } },
  { name: 'Telepíldora', fn: () => { G.teleport('random'); } },
  { name: '¡Ojo de lince!', fn: () => { G.revealMap(); } },
  { name: 'Suerte abajo', fn: p => { p.mods.luckAdd -= 1; } },
  { name: 'Vida arriba', fn: p => { addHp(p, 'hpe', 1); } },
  { name: 'Vida abajo', fn: p => { if (p.maxRed > 1) { p.maxRed--; clampHearts(p); } } },
];
// Píldoras malas y su equivalente bueno (para PHD / PHD falso)
const PILL_BAD = new Set([3, 5, 7, 9, 14, 16]);
const PILL_GOOD_OF = { 3: 2, 5: 4, 7: 6, 9: 0, 14: 8, 16: 15 };
const PILL_BAD_OF = { 2: 3, 4: 5, 6: 7, 0: 9, 8: 14, 15: 16 };
