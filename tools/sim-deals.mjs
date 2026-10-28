// Simula partidas completas para medir los tratos del diablo y las salas del ángel con las reglas de `dealChance`
// (src/gen.js, ver docs/TRATOS.md): cuántos tratos salen por partida, en qué pisos y cómo se reparten entre
// ángel y diablo, según el estilo del jugador. Las salas especiales por piso salen de pisos generados de verdad.
//
// Uso: node tools/sim-deals.mjs [partidas, por defecto 5000] [--pasivos=devil,angel,...] [--semilla=N]
//   Pasivos que cambian los tratos: devil, angel, devil100, eucharist, duality.
//   Ejemplo: node tools/sim-deals.mjs 20000 --pasivos=angel
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const args = process.argv.slice(2);
const opt = (nombre, def) => { const a = args.find(x => x.startsWith(`--${nombre}=`)); return a ? a.split('=')[1] : def; };
const RUNS = +args.find(a => /^\d+$/.test(a)) || 5000;
const PASIVOS = new Set(opt('pasivos', '').split(',').filter(Boolean));
const SEED = +opt('semilla', 1);
const PASIVOS_VALIDOS = ['devil', 'angel', 'devil100', 'eucharist', 'duality'];
for (const p of PASIVOS) if (!PASIVOS_VALIDOS.includes(p)) { console.error(`Pasivo desconocido "${p}". Válidos: ${PASIVOS_VALIDOS.join(', ')}`); process.exit(2); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(root, 'src', f + '.js'), 'utf8');
const stubs = `
const ITEMS = new Proxy({}, { get: () => ({ pools: { treasure: 1, boss: 1, shop: 1, secret: 1, devil: 1, angel: 1 }, q: 1 }) });
const CARDS = [['carta']];
const G = { run: { pool: new Set(['1', '2', '3']), bossesUsed: [] }, player: null, floorIdx: 0 };`;
const ctx = vm.createContext({ console, Math, Uint8Array, Int16Array, Set, Map, Array, Object });
vm.runInContext(['util', 'data'].map(src).join('\n') + stubs + ['rooms', 'gen'].map(src).join('\n'), ctx);
const get = expr => vm.runInContext(expr, ctx);
const NFLOORS = get('FLOORS.length'), ESPECIALES = get('DEAL_SPECIAL_TYPES');
const dealChance = get('dealChance');

// salas especiales por piso: se muestrean pisos reales una sola vez y luego se reparten al azar
const MUESTRA = 300, especiales = [];
for (let fi = 0; fi < NFLOORS; fi++) {
  const cuentas = [];
  for (let s = 1; s <= MUESTRA; s++) {
    get('G').run.bossesUsed = [];
    ctx.__fi = fi; ctx.__seed = s * 7919 + fi;
    const floor = vm.runInContext('generateFloor(__fi, __seed)', ctx);
    cuentas.push(floor.rooms.filter(r => ESPECIALES.includes(r.type)).length);
  }
  especiales.push(cuentas);
}

function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Estilos de jugador: probabilidad de recibir daño en un piso, de visitar cada sala especial y de aceptar un trato
const PERFILES = [
  { nombre: 'Novato', daño: 0.7, visita: 0.6, acepta: 0.5 },
  { nombre: 'Cuidadoso', daño: 0.25, visita: 0.8, acepta: 0.7 },
  { nombre: 'Experto', daño: 0.05, visita: 0.4, acepta: 0.9 },
  { nombre: 'Experto que lo recoge todo', daño: 0.05, visita: 1, acepta: 1 },
];

const has = id => PASIVOS.has(id);
const pct = v => (v * 100).toFixed(1).padStart(5) + ' %';
const errores = [];

function simular(perfil, rng) {
  const t = { oportunidades: 0, tratos: 0, angel: 0, diablo: 0, dobles: 0, aceptadosAngel: 0, aceptadosDiablo: 0, porPiso: Array(NFLOORS).fill(0), tratosPorPartida: {}, sumaChance: 0 };
  for (let n = 0; n < RUNS; n++) {
    const run = { floorHit: false, noHitStreak: 0, dealsTaken: 0, devilDeals: 0, angelDeals: 0 };
    let tratosPartida = 0;
    for (let fi = 0; fi < NFLOORS - 1; fi++) {
      run.floorHit = rng() < perfil.daño;
      const cuentas = especiales[fi], total = cuentas[Math.floor(rng() * cuentas.length)];
      let vistas = 0;
      for (let k = 0; k < total; k++) if (rng() < perfil.visita) vistas++;
      const estado = Object.assign({}, run, { noHitStreak: run.floorHit ? 0 : run.noHitStreak + 1, specialsSeen: vistas });
      run.noHitStreak = estado.noHitStreak;
      if (fi < 1) continue;                                   // sin tratos en el primer piso
      const d = dealChance(estado, has);
      if (!(d.chance >= 0.05 - 1e-9 && d.chance <= 1) || !(d.angelShare >= 0 && d.angelShare <= 1)) errores.push(`probabilidad fuera de rango en piso ${fi + 1}: ${JSON.stringify(d)}`);
      if (!has('devil100') && !has('eucharist') && d.chance > 0.95 + 1e-9) errores.push(`chance ${d.chance} supera el 95 %`);
      t.oportunidades++; t.sumaChance += d.chance;
      if (rng() >= d.chance) continue;
      const puertas = d.both ? [true, false] : [rng() < d.angelShare];
      t.tratos++; tratosPartida++; t.porPiso[fi]++;
      if (d.both) t.dobles++;
      for (const angel of puertas) angel ? t.angel++ : t.diablo++;
      if (rng() < perfil.acepta) {                           // se queda con un objeto de una sala
        const angel = d.both ? rng() < 0.5 : puertas[0];     // con dos puertas solo se entra en una
        run.dealsTaken++;
        if (angel) { run.angelDeals++; t.aceptadosAngel++; } else { run.devilDeals++; t.aceptadosDiablo++; }
      }
    }
    t.tratosPorPartida[tratosPartida] = (t.tratosPorPartida[tratosPartida] || 0) + 1;
  }
  return t;
}

console.log(`${RUNS} partidas por estilo · semilla ${SEED} · pasivos: ${PASIVOS.size ? [...PASIVOS].join(', ') : 'ninguno'}`);
console.log(`Salas especiales por piso (media de ${MUESTRA} pisos): ${especiales.map((c, i) => `${i + 1}:${(c.reduce((a, b) => a + b, 0) / c.length).toFixed(1)}`).join('  ')}`);
for (const perfil of PERFILES) {
  const t = simular(perfil, mulberry32(SEED * 1000 + PERFILES.indexOf(perfil)));
  console.log(`\n== ${perfil.nombre} (daño ${perfil.daño * 100} %/piso, visita ${perfil.visita * 100} % de las especiales, acepta ${perfil.acepta * 100} % de los tratos)`);
  console.log(`  Probabilidad media de trato por jefe:  ${pct(t.sumaChance / t.oportunidades)}   (con trato: ${pct(t.tratos / t.oportunidades)})`);
  console.log(`  Tratos por partida: ${(t.tratos / RUNS).toFixed(2)}   · de ángel ${pct(t.angel / Math.max(1, t.angel + t.diablo))}, de diablo ${pct(t.diablo / Math.max(1, t.angel + t.diablo))}${t.dobles ? `   · con las dos puertas a la vez: ${(t.dobles / RUNS).toFixed(2)} por partida` : ''}`);
  console.log(`  Aceptados por partida: ${(t.aceptadosDiablo / RUNS).toFixed(2)} del diablo, ${(t.aceptadosAngel / RUNS).toFixed(2)} del ángel`);
  console.log(`  Tratos en cada piso (2→7): ${t.porPiso.slice(1, NFLOORS - 1).map(v => pct(v / RUNS).trim()).join('  ')}`);
  const dist = Object.keys(t.tratosPorPartida).map(Number).sort((a, b) => a - b).map(k => `${k}: ${pct(t.tratosPorPartida[k] / RUNS).trim()}`).join('  ');
  console.log(`  Partidas según nº de tratos →  ${dist}`);
}
if (errores.length) { console.log(`\n✗ ${errores.length} problemas, p. ej.:`); [...new Set(errores)].slice(0, 8).forEach(e => console.log('  ' + e)); process.exit(1); }
console.log('\n0 problemas');
