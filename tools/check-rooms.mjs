// Comprueba las plantillas de src/rooms.js: tamaño, símbolos y puertas conectadas en las 4 orientaciones.
// Uso: node tools/check-rooms.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = ['util', 'data', 'rooms', 'gen'].map(f => readFileSync(join(root, 'src', f + '.js'), 'utf8')).join('\n');
const ctx = vm.createContext({ console, Math, Uint8Array, Set, Map, Array, Object });
vm.runInContext(code + '\nthis.__x = { ROOM_TEMPLATES, ROOM_SPAWNS, BOSS_ROOMS, SPECIAL_ROOMS, BOSSES, FLOORS, ROOM_SYM, EN, COLS, ROWS, T, DIRNAMES, DIRS, clearDoors, connectedDoors };', ctx);
const { ROOM_TEMPLATES, ROOM_SPAWNS, BOSS_ROOMS, SPECIAL_ROOMS, BOSSES, FLOORS, ROOM_SYM, EN, COLS, ROWS, DIRNAMES, DIRS, clearDoors, connectedDoors } = ctx.__x;

let bad = 0;
const ids = new Set();
for (const t of ROOM_TEMPLATES) {
  const err = [];
  if (ids.has(t.id)) err.push('id repetido');
  ids.add(t.id);
  if (t.rows.length !== ROWS) err.push(`${t.rows.length} filas`);
  t.rows.forEach((row, i) => {
    if (row.length !== COLS) err.push(`fila ${i}: ${row.length} columnas`);
    for (const ch of row) if (!(ch in ROOM_SYM)) err.push(`fila ${i}: símbolo "${ch}"`);
  });
  if (!err.length) {
    for (const fh of [0, 1]) for (const fv of [0, 1]) {
      const tiles = new Uint8Array(COLS * ROWS);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
        tiles[r * COLS + c] = ROOM_SYM[t.rows[fv ? ROWS - 1 - r : r][fh ? COLS - 1 - c : c]];
      clearDoors(tiles);
      if (!connectedDoors(tiles)) err.push(`puertas aisladas (flipH=${fh}, flipV=${fv})`);
    }
  }
  // enemigos fijos: casilla libre (o foso si vuela), dentro de la sala y a 3+ casillas de toda puerta
  for (const [type, c, r] of ROOM_SPAWNS[t.id] || []) {
    const tag = `${type}@${c},${r}`;
    if (type !== 'pool' && !EN[type]) { err.push(`${tag}: enemigo desconocido`); continue; }
    const ch = t.rows[r] && t.rows[r][c];
    const flies = type !== 'pool' && EN[type].fly;
    if (ch !== '.' && !(flies && ch === 'O')) err.push(`${tag}: casilla "${ch}" no válida`);
    if (DIRNAMES.some(k => Math.abs(c - DIRS[k].c) + Math.abs(r - DIRS[k].r) < 3)) err.push(`${tag}: demasiado cerca de una puerta`);
  }
  if (err.length) { bad++; console.log(`✗ ${t.id}: ${err.join('; ')}`); }
}
for (const id of Object.keys(ROOM_SPAWNS)) if (!ids.has(id)) { bad++; console.log(`✗ ROOM_SPAWNS tiene "${id}" sin plantilla`); }

// Salas de jefe: mismas comprobaciones de forma y puertas, y la zona de aparición del jefe despejada.
// [col, fila] donde puede nacer el jefe según la puerta de entrada (bossPos en entities.js); la Masa nace más lejos.
const BOSS_CLEAR = [[6, 1], [6, 3], [6, 5], [3, 3], [9, 3]];
const BOSS_CLEAR_EXTRA = { masa: [[2, 3], [10, 3]] };
let bossLayouts = 0;
const used = new Set(FLOORS.flatMap(f => f.bosses));
for (const id of Object.keys(BOSS_ROOMS)) if (!BOSSES[id]) { bad++; console.log(`✗ BOSS_ROOMS "${id}": jefe desconocido`); }
for (const id of used) if (!BOSS_ROOMS[id]) console.log(`aviso: el jefe "${id}" no tiene sala propia`);
for (const [id, list] of Object.entries(BOSS_ROOMS)) {
  list.forEach((rows, n) => {
    bossLayouts++;
    const err = [];
    if (rows.length !== ROWS) err.push(`${rows.length} filas`);
    rows.forEach((row, i) => {
      if (row.length !== COLS) err.push(`fila ${i}: ${row.length} columnas`);
      for (const ch of row) if (!(ch in ROOM_SYM)) err.push(`fila ${i}: símbolo "${ch}"`);
    });
    if (!err.length) {
      for (const [c, r] of [...BOSS_CLEAR, ...(BOSS_CLEAR_EXTRA[id] || [])]) if (rows[r][c] !== '.') err.push(`casilla ${c},${r} ocupada (zona del jefe)`);
      for (const fh of [0, 1]) for (const fv of [0, 1]) {
        const tiles = new Uint8Array(COLS * ROWS);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
          tiles[r * COLS + c] = ROOM_SYM[rows[fv ? ROWS - 1 - r : r][fh ? COLS - 1 - c : c]];
        clearDoors(tiles);
        if (!connectedDoors(tiles)) err.push(`puertas aisladas (flipH=${fh}, flipV=${fv})`);
      }
    }
    if (err.length) { bad++; console.log(`✗ jefe ${id} #${n + 1}: ${err.join('; ')}`); }
  });
}

// Salas especiales: casillas que usan los objetos de la biblioteca y el minijefe, y puertas conectadas
const SPECIAL_CLEAR = { library: [[3, 2], [5, 2], [7, 2], [9, 2]], miniboss: [[6, 3]] };
let specialLayouts = 0;
for (const [type, list] of Object.entries(SPECIAL_ROOMS)) {
  list.forEach((rows, n) => {
    specialLayouts++;
    const err = [];
    if (rows.length !== ROWS) err.push(`${rows.length} filas`);
    rows.forEach((row, i) => {
      if (row.length !== COLS) err.push(`fila ${i}: ${row.length} columnas`);
      for (const ch of row) if (!(ch in ROOM_SYM)) err.push(`fila ${i}: símbolo "${ch}"`);
    });
    if (!err.length) {
      for (const [c, r] of SPECIAL_CLEAR[type] || []) if (rows[r][c] !== '.') err.push(`casilla ${c},${r} ocupada`);
      for (const fh of [0, 1]) for (const fv of [0, 1]) {
        const tiles = new Uint8Array(COLS * ROWS);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
          tiles[r * COLS + c] = ROOM_SYM[rows[fv ? ROWS - 1 - r : r][fh ? COLS - 1 - c : c]];
        clearDoors(tiles);
        if (!connectedDoors(tiles)) err.push(`puertas aisladas (flipH=${fh}, flipV=${fv})`);
      }
    }
    if (err.length) { bad++; console.log(`✗ sala ${type} #${n + 1}: ${err.join('; ')}`); }
  });
}
// los multiplicadores por tema deben nombrar plantillas que existen
const TB = vm.runInContext('THEME_TEMPLATE_BIAS', ctx);
for (const [theme, m] of Object.entries(TB)) for (const id of Object.keys(m)) if (!ids.has(id)) { bad++; console.log(`✗ THEME_TEMPLATE_BIAS ${theme}: plantilla "${id}" no existe`); }
console.log(`${ROOM_TEMPLATES.length} plantillas, ${bossLayouts} salas de jefe y ${specialLayouts} especiales, ${bad} con errores`);
process.exit(bad ? 1 : 0);
