// Tabla de dificultad: mide cuánto pesa cada enemigo frente a su coste y cuánto "pesa" una sala normal en cada piso.
// Todo sale del código real (EN, CHAMPIONS, DIFFICULTY, pisos generados); lo único supuesto es el daño por segundo del
// jugador y la vida efectiva de los enemigos con mecánicas especiales (tabla EFECTIVA). Método en docs/DIFICULTAD.md.
//
// Uso: node tools/difficulty.mjs [pisos por nivel, por defecto 150] [--crecimiento=0.25] [--sala=3]
//   --crecimiento: cuánto sube el daño por segundo del jugador por piso (0,25 = +25 % por piso)
//   --sala: segundos fijos por sala (moverse, esquivar) que se suman al tiempo de limpieza
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find(x => x.startsWith(`--${n}=`)); return a ? +a.split('=')[1] : d; };
const N = +args.find(a => /^\d+$/.test(a)) || 150;
const CRECE = opt('crecimiento', 0.25), SALA = opt('sala', 3);
// curva objetivo del tiempo de limpieza de una sala normal: empieza en `base` s y sube `paso` s por piso (lineal)
const OBJ_BASE = opt('base', 7), OBJ_PASO = opt('paso', 1.5), TOLERANCIA = opt('tolerancia', 0.1);
const objetivo = fi => OBJ_BASE + OBJ_PASO * fi;
const DPS0 = 3.5 * 2.73;                                   // Isaac sin objetos: daño × lágrimas por segundo
const dps = fi => DPS0 * (1 + CRECE * fi);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(root, 'src', f + '.js'), 'utf8');
const stubs = `
const ITEMS = new Proxy({}, { get: () => ({ pools: { treasure: 1, boss: 1, shop: 1, secret: 1, devil: 1, angel: 1 }, q: 1 }) });
const CARDS = [['carta']];
const G = { run: { pool: new Set(['1', '2', '3']), bossesUsed: [] }, player: null, floorIdx: 0 };`;
const ctx = vm.createContext({ console, Math, Uint8Array, Int16Array, Set, Map, Array, Object });
vm.runInContext(['util', 'data'].map(src).join('\n') + stubs + ['rooms', 'gen'].map(src).join('\n'), ctx);
const get = e => vm.runInContext(e, ctx);
const EN = get('EN'), FLOORS = get('FLOORS'), CH = get('CHAMPIONS'), D = get('DIFFICULTY');

// Vida efectiva = vida × mul (parte del tiempo que no se le puede dañar o que se protege) + vida de las crías que deja o llama.
// Son estimaciones razonadas, no medidas: `mul` es 1 / (fracción del ciclo en que se le puede golpear).
const EFECTIVA = {
  host:      { mul: 1.5 },                                  // escudo ~35 % del tiempo
  leaper:    { mul: 1.4 },                                  // en el aire ~30 % del ciclo
  globin:    { extra: 7 },                                  // resucita una vez con 7 de vida
  mulligan:  { hijos: { afly: 3 } },
  bigspider: { hijos: { spider: 2 } },
  hive:      { hijos: { afly: 3 } },
  jelly:     { hijos: { jellet: 2 } },
  summoner:  { hijos: { shade: 3 } },                       // ~3 sombras se matan durante el combate
  mole:      { mul: 1.8 },                                  // sobre tierra ~48 % del ciclo
  blinker:   { mul: 1.7 },                                  // visible ~59 % del ciclo
  shell:     { mul: 1.5 },                                  // armadura frontal
  phaser:    { mul: 1.15 },                                 // fundido ~12 % del tiempo
  relentless: { mul: 1.1 },                                 // no se le puede empujar ni frenar
  healer:    { mul: 1.2 },                                  // apoyo: cura a los demás, así que cuenta como un 20 % más
};
// los 17 enemigos de la versión original sirven de referencia: su coste por vida efectiva marca la escala
const ORIGINALES = ['fly', 'afly', 'pooter', 'gaper', 'horf', 'clotty', 'spider', 'charger', 'hopper', 'boomfly', 'host', 'fatty', 'mulligan', 'globin', 'bigspider', 'hive', 'leaper'];

function ehp(id, fi = 0) {
  const e = EFECTIVA[id] || {}, sc = 1 + fi * D.hpPerFloor;
  let v = EN[id].hp * sc * (e.mul || 1) + (e.extra || 0) * sc;
  for (const [h, n] of Object.entries(e.hijos || {})) v += EN[h].hp * sc * n;
  return v;
}
const mediana = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// ---------- Tabla 1: por enemigo (piso 1) ----------
const pool = get('ENEMY_POOLS');
const temaDe = {};
for (const [t, l] of Object.entries(pool)) for (const [id] of l) (temaDe[id] = temaDe[id] || []).push(t);
const ref = mediana(ORIGINALES.map(id => EN[id].cost / ehp(id)));
console.log(`TABLA 1 · enemigos (piso 1). Referencia: ${(ref * 100).toFixed(1)} de coste por cada 100 de vida efectiva (mediana de los 17 originales)`);
console.log('enemigo'.padEnd(18) + 'vida'.padStart(5) + 'v.efec'.padStart(8) + 'coste'.padStart(7) + 'coste/100'.padStart(10) + 'esperado'.padStart(10) + 'desvío'.padStart(8) + '  tema(s)');
const fuera = [];
for (const id of Object.keys(EN)) {
  const c = EN[id], e = ehp(id), cr = c.cost / e, esperado = ref * e, dev = c.cost > 0 ? c.cost / esperado - 1 : 0;
  const marca = c.cost === 0 ? '' : Math.abs(dev) > 0.3 ? (dev > 0 ? ' ▲' : ' ▼') : '';
  if (marca && !ORIGINALES.includes(id)) fuera.push([id, dev]);
  console.log(`${id.padEnd(18)}${String(c.hp).padStart(5)}${e.toFixed(1).padStart(8)}${c.cost.toFixed(2).padStart(7)}${(cr * 100).toFixed(1).padStart(10)}${esperado.toFixed(2).padStart(10)}${(c.cost > 0 ? (dev * 100).toFixed(0) + ' %' : '-').padStart(8)}${marca}  ${(temaDe[id] || ['(crías)']).join(',')}${ORIGINALES.includes(id) ? '' : '  *nuevo*'}`);
}

// ---------- Tabla 2: por piso, con pisos generados ----------
const filas = [];
for (let fi = 0; fi < FLOORS.length; fi++) {
  let salas = 0, conEnem = 0, enem = 0, vidaBruta = 0, vidaEf = 0, coste = 0, camp = 0;
  const peso = {};
  for (let s = 1; s <= N; s++) {
    get('G').run.bossesUsed = []; ctx.__fi = fi; ctx.__seed = s * 7919 + fi;
    const floor = vm.runInContext('generateFloor(__fi, __seed)', ctx);
    for (const r of floor.rooms) {
      if (r.type !== 'normal') continue;
      salas++;
      if (!r.spawns.length) continue;
      conEnem++;
      for (const sp of r.spawns) {
        const c = sp.champ ? 1.7 : 1;                       // los campeones tienen de 1,4 a 2 veces más vida
        const e = ehp(sp.type, fi) * c;
        enem++; vidaBruta += EN[sp.type].hp * (1 + fi * D.hpPerFloor) * c; vidaEf += e; coste += EN[sp.type].cost; if (sp.champ) camp++;
        peso[sp.type] = (peso[sp.type] || 0) + e;
      }
    }
  }
  const porSala = v => v / conEnem;
  const t = porSala(vidaEf) / dps(fi) + SALA;
  filas.push({ fi, salas, conEnem, enem: porSala(enem), vidaBruta: porSala(vidaBruta), vidaEf: porSala(vidaEf), coste: porSala(coste), camp: camp / enem, t, peso });
}
console.log(`\nTABLA 2 · salas normales con enemigos por piso (${N} pisos por nivel; daño por segundo inicial ${DPS0.toFixed(1)}, +${(CRECE * 100).toFixed(0)} % por piso, ${SALA} s fijos por sala)`);
console.log('piso'.padEnd(20) + '%salas'.padStart(7) + 'enem.'.padStart(7) + 'vida'.padStart(8) + 'v.efec'.padStart(8) + 'coste'.padStart(7) + 'camp.'.padStart(7) + 'dps'.padStart(7) + 'tiempo'.padStart(8) + 'objetivo'.padStart(10) + 'desvío'.padStart(8));
for (const f of filas) {
  const dev = f.t / objetivo(f.fi) - 1;
  console.log(`${(f.fi + 1 + ' ' + FLOORS[f.fi].name).padEnd(20)}${(f.conEnem / f.salas * 100).toFixed(0).padStart(6)}%${f.enem.toFixed(1).padStart(7)}${f.vidaBruta.toFixed(0).padStart(8)}${f.vidaEf.toFixed(0).padStart(8)}${f.coste.toFixed(1).padStart(7)}${(f.camp * 100).toFixed(1).padStart(6)}%${dps(f.fi).toFixed(1).padStart(7)}${(f.t.toFixed(1) + ' s').padStart(8)}${(objetivo(f.fi).toFixed(1) + ' s').padStart(10)}${((dev >= 0 ? '+' : '') + (dev * 100).toFixed(0) + ' %').padStart(8)}${Math.abs(dev) > TOLERANCIA ? ' ◄' : ''}`);
}
console.log(`(objetivo: ${OBJ_BASE} s en el primer piso y +${OBJ_PASO} s por piso; ◄ = fuera de ±${(TOLERANCIA * 100).toFixed(0)} %)`);

// quién pesa más en cada tema (piso 1 de cada par)
console.log('\nQuién más pesa en cada tema (parte de la vida efectiva total de sus salas, 2 pisos juntos):');
for (let i = 0; i < FLOORS.length; i += 2) {
  const tot = {}; for (const f of [filas[i], filas[i + 1]]) if (f) for (const [k, v] of Object.entries(f.peso)) tot[k] = (tot[k] || 0) + v;
  const suma = Object.values(tot).reduce((a, b) => a + b, 0);
  console.log('  ' + FLOORS[i].theme.padEnd(9) + Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${EN[k].name} ${(v / suma * 100).toFixed(0)} %`).join(' · '));
}

// ---------- Avisos ----------
const avisos = [];
for (let i = 1; i < filas.length; i++) if (filas[i].t < filas[i - 1].t - 0.05) avisos.push(`el tiempo de limpieza baja del piso ${i} (${filas[i - 1].t.toFixed(1)} s) al ${i + 1} (${filas[i].t.toFixed(1)} s)`);
for (const f of filas) { const dev = f.t / objetivo(f.fi) - 1; if (Math.abs(dev) > TOLERANCIA) avisos.push(`piso ${f.fi + 1} (${FLOORS[f.fi].name}): ${f.t.toFixed(1)} s, un ${(dev * 100).toFixed(0)} % ${dev > 0 ? 'por encima' : 'por debajo'} del objetivo de ${objetivo(f.fi).toFixed(1)} s`); }
const crec = filas[filas.length - 1].t / filas[0].t;
if (crec > 3.2) avisos.push(`el último piso exige ×${crec.toFixed(1)} el tiempo del primero (demasiada subida)`);
if (crec < 1.6) avisos.push(`el último piso exige solo ×${crec.toFixed(1)} el tiempo del primero (poca subida)`);
for (const [id, dev] of fuera) avisos.push(`${id}: su coste se desvía un ${(dev * 100).toFixed(0)} % de lo esperado por su vida efectiva`);
console.log('\n' + (avisos.length ? `Avisos (${avisos.length}):\n  - ` + avisos.join('\n  - ') : 'Sin avisos'));
