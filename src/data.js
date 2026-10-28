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
  { name: 'Sótano I', theme: 'basement', bosses: ['gloton', 'zumbido', 'gusano', 'babosa', 'gtopo'] },
  { name: 'Sótano II', theme: 'basement', bosses: ['gloton', 'zumbido', 'gusano', 'babosa', 'gtopo'] },
  { name: 'Cuevas I', theme: 'caves', bosses: ['masa', 'llorona', 'gusano', 'gloton', 'coloso', 'rey'] },
  { name: 'Cuevas II', theme: 'caves', bosses: ['masa', 'llorona', 'zumbido', 'gloton', 'coloso', 'rey'] },
  { name: 'Profundidades I', theme: 'depths', bosses: ['masa', 'llorona', 'gloton', 'gusano', 'carcelero', 'pira'] },
  { name: 'Profundidades II', theme: 'depths', bosses: ['mama'] },
  { name: 'Útero I', theme: 'womb', bosses: ['masa', 'llorona', 'zumbido', 'gusano', 'coagulo', 'placenta'] },
  { name: 'Útero II', theme: 'womb', bosses: ['corazon'] },
];

const ENEMY_POOLS = {
  basement: [['fly', 3], ['afly', 3], ['pooter', 2], ['gaper', 3], ['horf', 2], ['clotty', 2], ['spider', 2], ['charger', 1], ['hopper', 2],
    ['cross', 1.5], ['jelly', 1.5], ['mole', 1.2], ['slug', 1.5]],
  caves: [['afly', 2], ['pooter', 2], ['gaper', 2], ['spider', 2], ['charger', 2], ['hopper', 2], ['boomfly', 2], ['host', 2], ['fatty', 1], ['mulligan', 2], ['bigspider', 1], ['clotty', 1],
    ['shell', 1.5], ['miner', 1.3], ['blinker', 1.2], ['mortar', 1.4]],
  depths: [['gaper', 2], ['host', 3], ['fatty', 2], ['mulligan', 2], ['globin', 3], ['bigspider', 2], ['hive', 2], ['boomfly', 2], ['leaper', 2], ['clotty', 2], ['charger', 1],
    ['summoner', 1.3], ['laser', 1.2], ['enrager', 1.5], ['phaser', 1.3]],
  womb: [['globin', 3], ['leaper', 3], ['hive', 2], ['host', 3], ['fatty', 2], ['boomfly', 2], ['afly', 3], ['bigspider', 2], ['clotty', 2], ['charger', 2],
    ['healer', 1.3], ['relentless', 1.2], ['spiral', 1.3], ['merger', 1.5]],
};

// Recompensas propias de cada jefe y mini-jefe (ver docs/JEFES.md): objetos extra que suelta al caer, además de lo común
// (el objeto de jefe, o los dos de Mamá, el corazón o alma y la trampilla; en los mini-jefes, el objeto de jefe y el corazón).
// Cada clave es un tipo de recogible de PK_R (gen.js): coin, nickel, heart, half, soul, black, bomb, bomb2, key, pill, card,
// battery, chest, gchest. El Corazón no entra: su recompensa es el trofeo.
const BOSS_DROPS = {
  gloton: ['heart', 'heart'], zumbido: ['coin', 'coin', 'coin', 'bomb'], gusano: ['key', 'key'], masa: ['soul', 'soul'],
  llorona: ['card', 'pill'], mama: ['soul', 'soul'],
  babosa: ['chest'], gtopo: ['bomb', 'bomb', 'coin'], coloso: ['gchest'], rey: ['bomb2', 'key'],
  carcelero: ['key', 'key', 'key'], pira: ['black', 'bomb'], coagulo: ['heart', 'heart', 'half'], placenta: ['chest', 'soul'],
  mfly: ['coin', 'coin'], mgolem: ['bomb2'], mshaman: ['card', 'pill'], mcrab: ['key', 'key'],
};

// Escala de dificultad (ver docs/DIFICULTAD.md y tools/difficulty.mjs). La vida de cada enemigo se multiplica por
// 1 + piso × hpPerFloor; el presupuesto de enemigos de una sala normal es (base + piso × perFloor + azar × spread) × celdas
// budgetFloorMul corrige el presupuesto de cada piso (1 = sin cambio) para que el tiempo de limpieza suba de forma
// pareja: las reservas de Profundidades I y Cuevas I tienen enemigos más duros y sin él darían un escalón
const DIFFICULTY = { hpPerFloor: 0.2, budgetBase: 2.2, budgetPerFloor: 0.75, budgetSpread: 1.8, budgetFloorMul: [1, 1, 0.94, 1, 0.87, 0.92, 1, 1] };
// Nivel de dificultad que elige el jugador al empezar la partida (run.diff es el índice). hp multiplica la vida de enemigos,
// mini-jefes y jefes; budget el presupuesto de enemigos de las salas normales (las plantillas con enemigos fijos solo cambian de vida).
// Normal es la escala de DIFFICULTY sin tocar. Fuera del juego (herramientas) no hay partida y vale 1.
const DIFF_LEVELS = [
  { id: 'easy', name: 'Fácil', hp: 0.8, budget: 0.85 },
  { id: 'normal', name: 'Normal', hp: 1, budget: 1 },
  { id: 'hard', name: 'Difícil', hp: 1.25, budget: 1.12 },
];
function diffMul(k) {
  const lv = typeof G !== 'undefined' && G && G.run && G.run.diff != null ? DIFF_LEVELS[G.run.diff] : null;
  return lv ? lv[k] : 1;
}

// Variantes de campeón (cualquier enemigo puede serlo). w = peso al sortear; hp y r multiplican la vida y el radio;
// speed multiplica la velocidad. Efectos propios: veloz (más rápido), explosivo (explota al morir), tóxico (deja
// charcos al morir) y regenerador (se cura si lleva 1,5 s sin recibir daño), en entities.js. color: aura en pantalla
const CHAMPIONS = {
  tough:    { name: 'Resistente', w: 3, hp: 2, r: 1.12, color: '#d83a40' },
  swift:    { name: 'Veloz', w: 2, hp: 1.4, r: 1.05, speed: 1.5, color: '#4cc4e8' },
  volatile: { name: 'Explosivo', w: 2, hp: 1.5, r: 1.12, color: '#ff9b2f' },
  toxic:    { name: 'Tóxico', w: 2, hp: 1.5, r: 1.12, color: '#6bd45a' },
  regen:    { name: 'Regenerador', w: 2, hp: 1.6, r: 1.1, color: '#ff86cf' },
};
function pickChampion() { return weighted(Object.keys(CHAMPIONS).map(k => [k, CHAMPIONS[k].w])); }

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
  // Sótano: dispara en cruz y alterna con diagonales / se divide al morir / se entierra y emerge a disparar / deja un rastro viscoso
  cross:     { name: 'Aspa', hp: 14, r: 11, speed: 28, cost: 1.2 },
  jelly:     { name: 'Gelatina', hp: 18, r: 14, speed: 40, cost: 2.2 },
  jellet:    { name: 'Gelatinita', hp: 5, r: 8, speed: 85, cost: 0.4 },
  mole:      { name: 'Topo', hp: 12, r: 11, speed: 95, cost: 1.8 },
  slug:      { name: 'Baboso', hp: 16, r: 12, speed: 34, cost: 1.4 },
  // Cuevas: acorazado (solo recibe lágrimas por detrás o los costados) / siembra minas / se desvanece y reaparece / lanza proyectiles en arco
  shell:     { name: 'Escarabajo', hp: 20, r: 13, speed: 42, cost: 2.3, armor: true },
  miner:     { name: 'Minero', hp: 14, r: 12, speed: 55, cost: 1.5 },
  mine:      { name: 'Mina', hp: 6, r: 8, speed: 0, cost: 0 },
  blinker:   { name: 'Parpadeo', hp: 12, r: 11, speed: 0, cost: 1.7 },
  mortar:    { name: 'Mortero', hp: 16, r: 12, speed: 0, cost: 1.5 },
  // Profundidades: invoca sombras / ojo de piedra con láser avisado / se enfurece al quedar solo / se funde con la roca
  summoner:  { name: 'Invocador', hp: 22, r: 13, speed: 34, cost: 2.6 },
  shade:     { name: 'Sombra', hp: 4, r: 7, speed: 95, cost: 0.3 },
  laser:     { name: 'Vigía', hp: 20, r: 13, speed: 0, cost: 1.7 },
  enrager:   { name: 'Furioso', hp: 18, r: 12, speed: 46, cost: 1.5 },
  phaser:    { name: 'Espectro', hp: 16, r: 12, speed: 52, cost: 1.6 },
  // Útero: cura a los demás / lento pero no se le puede empujar ni frenar / dispara espirales / dos se funden en uno más fuerte
  healer:    { name: 'Sanador', hp: 18, r: 12, speed: 38, cost: 2.2 },
  relentless: { name: 'Imparable', hp: 40, r: 15, speed: 26, cost: 3.3, kb: 0, immune: true },
  spiral:    { name: 'Espiral', hp: 20, r: 12, speed: 18, cost: 1.7 },
  merger:    { name: 'Gemelo', hp: 10, r: 9, speed: 64, cost: 0.9 },
  fused:     { name: 'Gemelos fundidos', hp: 24, r: 16, speed: 46, cost: 0 },
  ball:      { name: 'Bola de cadena', hp: 1, r: 14, speed: 0, cost: 0 },   // parte del Carcelero
  // Mini-jefes (mini: true): jefes pequeños de la sala de mini-jefe; se crean con boss = true (barra de vida, sin
  // empuje, contacto de jefe) y dejan la recompensa de la sala al caer. Vida de partida ×(1 + 0,2 por piso)
  mfly:      { name: 'Moscardón', hp: 100, r: 18, speed: 70, cost: 0, fly: true, mini: true },
  mgolem:    { name: 'Gólem menor', hp: 150, r: 22, speed: 34, cost: 0, mini: true },
  mshaman:   { name: 'Chamán', hp: 100, r: 16, speed: 0, cost: 0, mini: true },
  mcrab:     { name: 'Cangrejo', hp: 130, r: 20, speed: 70, cost: 0, mini: true },
};
// Qué mini-jefes pueden salir en cada tema
const MINIBOSS_POOLS = { basement: ['mfly', 'mcrab'], caves: ['mgolem', 'mcrab'], depths: ['mshaman', 'mcrab', 'mgolem'], womb: ['mfly', 'mshaman'] };

// title: epíteto que se muestra en la presentación del jefe (y en el bestiario)
const BOSSES = {
  gloton:  { name: 'Glotón', title: 'El que nunca se sacia', hp: 250, r: 34 },
  zumbido: { name: 'Señor Zumbido', title: 'Rey del enjambre', hp: 160, r: 30, fly: true },
  gusano:  { name: 'Gusano Gemelo', title: 'Dos cuerpos, un hambre', hp: 170, r: 15 },
  babosa:  { name: 'Reina Babosa', title: 'Soberana del légamo', hp: 210, r: 34 },
  gtopo:   { name: 'Gran Topo', title: 'Habitante del subsuelo', hp: 190, r: 28 },
  coloso:  { name: 'Coloso de Piedra', title: 'Montaña que camina', hp: 300, r: 38 },
  rey:     { name: 'Rey Minero', title: 'Señor de las galerías', hp: 260, r: 30 },
  carcelero: { name: 'Carcelero', title: 'Guardián de las cadenas', hp: 320, r: 32 },
  pira:    { name: 'Pira Viviente', title: 'Hoguera sin fin', hp: 280, r: 30 },
  coagulo: { name: 'Coágulo Mayor', title: 'Sangre que rebota', hp: 330, r: 36 },
  placenta: { name: 'Placenta', title: 'Órgano que late', hp: 300, r: 34 },
  masa:    { name: 'La Masa', title: 'Carne sin forma', hp: 420, r: 44 },
  llorona: { name: 'La Llorona', title: 'Lamento eterno', hp: 340, r: 30 },
  mama:    { name: 'Mamá', title: 'Ojo que todo lo ve', hp: 640, r: 1 },
  corazon: { name: 'El Corazón', title: 'Latido final', hp: 1100, r: 40 },
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
