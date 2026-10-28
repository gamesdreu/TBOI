// Genera muchos pisos y comprueba su estructura: salas grandes y en L, puertas emparejadas, todas las puertas
// de cada sala conectadas por dentro, enemigos en casillas libres y todas las salas alcanzables desde el inicio.
// Uso: node tools/check-floors.mjs [pisos por nivel, por defecto 100]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const N = +process.argv[2] || 100;
const src = f => readFileSync(join(root, 'src', f + '.js'), 'utf8');
// gen.js solo necesita de la partida unos pocos datos: se sustituyen por un G y un catálogo mínimos
const stubs = `
const ITEMS = new Proxy({}, { get: () => ({ pools: { treasure: 1, boss: 1, shop: 1, secret: 1, devil: 1, angel: 1 }, q: 1 }) });
const CARDS = [['carta']];
const G = { run: { pool: new Set(['1', '2', '3']), bossesUsed: [] }, player: null, floorIdx: 0 };`;
const ctx = vm.createContext({ console, Math, Uint8Array, Int16Array, Set, Map, Array, Object });
vm.runInContext(['util', 'data'].map(src).join('\n') + stubs + ['rooms', 'gen'].map(src).join('\n'), ctx);
const get = expr => vm.runInContext(expr, ctx);

const errs = [];
const forma = {};
let salas = 0, grandes = 0, puertas = 0;
for (let fi = 0; fi < get('FLOORS.length'); fi++) {
  for (let s = 1; s <= N; s++) {
    const tag = `piso ${fi + 1} semilla ${s}`;
    try {
      get('G').run.bossesUsed = [];
      ctx.__fi = fi; ctx.__seed = s * 7919 + fi;
      const floor = vm.runInContext('generateFloor(__fi, __seed)', ctx);
      const rooms = floor.rooms;
      salas += rooms.length;
      for (const r of rooms) {
        const big = r.cells.length > 1 || r.cw * r.ch > 1;
        if (big) { grandes++; const k = `${r.cw}x${r.ch} con ${r.cells.length} celdas`; forma[k] = (forma[k] || 0) + 1; }
        if (r.tiles.length !== r.cols * r.rows) errs.push(`${tag}: casillas de sala ${r.type} con tamaño erróneo`);
        ctx.__r = r; vm.runInContext('setRoomShape(__r)', ctx);
        const COLS = get('COLS');
        const reach = new Set(vm.runInContext('reachable(__r.tiles)', ctx).map(([c, rr]) => rr * COLS + c));
        for (const k of r.slotNames) {
          const D = get('DIRS')[k];
          if (!reach.has(D.r * COLS + D.c)) errs.push(`${tag}: puerta ${k} de sala ${r.type} ${r.cw}x${r.ch} aislada`);
        }
        for (const sp of r.spawns) {
          const v = r.tiles[sp.r * COLS + sp.c];
          if (v === undefined || v === 1 || v === 9) errs.push(`${tag}: enemigo ${sp.type} sobre casilla sólida en sala ${r.type}`);
        }
        for (const [k, d] of Object.entries(r.doors)) {
          puertas++;
          if (!r.slotNames.includes(k)) errs.push(`${tag}: puerta ${k} fuera de las ranuras de la sala ${r.type}`);
          const i = d.rooms[0] === r ? 0 : 1;
          if (!d.slots || d.slots[i] !== k || d.rooms[1 - i].doors[d.slots[1 - i]] !== d) errs.push(`${tag}: puerta ${k} de sala ${r.type} mal emparejada`);
        }
      }
      // todas las salas (menos la secreta, cuya puerta está oculta) se alcanzan desde el inicio
      const seen = new Set([floor.start]), q = [floor.start];
      for (let h = 0; h < q.length; h++) for (const d of Object.values(q[h].doors)) for (const o of d.rooms) if (!seen.has(o)) { seen.add(o); q.push(o); }
      if (seen.size !== rooms.length) errs.push(`${tag}: ${rooms.length - seen.size} salas inalcanzables`);
      // celdas del mapa sin solaparse
      const cells = new Set();
      for (const r of rooms) for (const [x, y] of r.cells) { const k = y * 9 + x; if (cells.has(k)) errs.push(`${tag}: celda ${x},${y} repetida`); cells.add(k); }
    } catch (e) { errs.push(`${tag}: ${e.message}`); }
  }
}
console.log(`${N} pisos por nivel · ${salas} salas · ${puertas} puertas · ${grandes} salas grandes`);
for (const [k, v] of Object.entries(forma)) console.log(`  ${k}: ${v}`);
if (errs.length) { console.log(`✗ ${errs.length} problemas, p. ej.:`); errs.slice(0, 15).forEach(e => console.log('  ' + e)); process.exit(1); }
console.log('0 problemas');
