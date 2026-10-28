// Comprueba que cada enemigo del juego está completo: datos (EN), comportamiento (BEHAV en enemigos.js), dibujo
// (drawEnemy en render.js), y que las reservas de enemigos de cada tema nombran enemigos que existen.
// Uso: node tools/check-enemies.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(root, 'src', f + '.js'), 'utf8');
const ctx = vm.createContext({ console, Math, Uint8Array, Int16Array, Set, Map, Array, Object });
vm.runInContext(['util', 'data', 'enemies'].map(src).join('\n') + '\nthis.__x = { EN, ENEMY_POOLS, BOSSES, FLOORS, BEHAV, THEMES };', ctx);
const { EN, ENEMY_POOLS, BOSSES, FLOORS, BEHAV } = ctx.__x;

// casos de dibujo: se leen del texto de drawEnemy (hasta la siguiente función de primer nivel)
const render = src('render');
const ini = render.indexOf('function drawEnemy(');
const fin = render.indexOf('\nfunction ', ini + 10);
const cuerpo = render.slice(ini, fin);
const dibujados = new Set([...cuerpo.matchAll(/case '([a-z0-9_]+)':/g)].map(m => m[1]));

const errs = [];
// los que dibuja o controla otro código (partes de jefes y similares) no cuentan como enemigo normal
for (const [id, d] of Object.entries(EN)) {
  if (typeof BEHAV[id] !== 'function') errs.push(`${id}: sin comportamiento en BEHAV`);
  if (!dibujados.has(id)) errs.push(`${id}: sin dibujo en drawEnemy`);
  for (const k of ['name', 'hp', 'r', 'speed', 'cost']) if (d[k] === undefined) errs.push(`${id}: falta ${k}`);
  if (!(d.hp > 0 && d.r > 0 && d.cost >= 0)) errs.push(`${id}: valores fuera de rango`);
}
// jefes invisibles que se dibujan con sus partes (Mamá: el pie y el ojo)
const POR_PARTES = { mama: ['foot', 'eye'] };
for (const id of Object.keys(BOSSES)) {
  if (typeof BEHAV[id] !== 'function') errs.push(`jefe ${id}: sin comportamiento en BEHAV`);
  const cuales = POR_PARTES[id] || [id];
  for (const c of cuales) if (!dibujados.has(c)) errs.push(`jefe ${id}: sin dibujo "${c}" en drawEnemy`);
  for (const c of POR_PARTES[id] || []) if (typeof BEHAV[c] !== 'function') errs.push(`jefe ${id}: la parte "${c}" no tiene comportamiento`);
}
const usados = new Set();
for (const [tema, lista] of Object.entries(ENEMY_POOLS)) {
  const vistos = new Set();
  for (const [id, w] of lista) {
    usados.add(id);
    if (!EN[id]) errs.push(`reserva ${tema}: enemigo "${id}" no existe`);
    if (!(w > 0)) errs.push(`reserva ${tema}: peso de "${id}" inválido`);
    if (vistos.has(id)) errs.push(`reserva ${tema}: "${id}" repetido`);
    vistos.add(id);
  }
}
for (const f of FLOORS) if (!ENEMY_POOLS[f.theme]) errs.push(`piso ${f.name}: tema ${f.theme} sin reserva de enemigos`);

// recompensas propias: cada jefe (salvo El Corazón, que da el trofeo) y cada mini-jefe tiene la suya, con recogibles que existen
const DROPS = vm.runInContext('BOSS_DROPS', ctx);
const TIPOS = Object.fromEntries([...(src('gen').match(/const PK_R = \{([^}]*)\}/)[1]).matchAll(/(\w+):/g)].map(m => [m[1], true]));   // claves de PK_R
for (const id of [...Object.keys(BOSSES).filter(b => b !== 'corazon'), ...Object.keys(EN).filter(k => EN[k].mini)]) if (!DROPS[id] || !DROPS[id].length) errs.push(`${id}: sin recompensa propia en BOSS_DROPS`);
for (const [id, lista] of Object.entries(DROPS)) {
  if (!BOSSES[id] && !(EN[id] && EN[id].mini)) errs.push(`BOSS_DROPS: "${id}" no es un jefe ni un mini-jefe`);
  for (const k of lista) if (!(k in TIPOS)) errs.push(`BOSS_DROPS ${id}: recogible "${k}" desconocido`);
}
console.log(`recompensas propias: ${Object.keys(DROPS).length} (promedio ${(Object.values(DROPS).reduce((s, l) => s + l.length, 0) / Object.keys(DROPS).length).toFixed(1)} recogibles)`);

// mini-jefes: cada tema solo nombra enemigos marcados mini, y todos los mini salen en algún tema
const MP = vm.runInContext('MINIBOSS_POOLS', ctx), minis = Object.keys(EN).filter(k => EN[k].mini);
for (const [tema, lista] of Object.entries(MP)) for (const id of lista) if (!EN[id] || !EN[id].mini) errs.push(`mini-jefes ${tema}: "${id}" no es un mini-jefe`);
for (const id of minis) if (!Object.values(MP).some(l => l.includes(id))) errs.push(`mini-jefe ${id}: no sale en ningún tema`);
for (const f of FLOORS) if (!MP[f.theme]) errs.push(`tema ${f.theme}: sin mini-jefes`);
console.log(`${minis.length} mini-jefes: ${Object.entries(MP).map(([t, l]) => `${t} ${l.map(i => EN[i].name).join('/')}`).join(' · ')}`);

// campeones: datos válidos, y las variantes con efecto propio están tratadas en entities.js y dibujadas en render.js
const CH = vm.runInContext('CHAMPIONS', ctx), entidades = src('entities');
for (const [k, c] of Object.entries(CH)) {
  if (!(c.w > 0 && c.hp >= 1 && c.r >= 1 && /^#[0-9a-f]{6}$/i.test(c.color) && c.name)) errs.push(`campeón ${k}: datos inválidos`);
  if (k !== 'tough' && k !== 'swift' && !entidades.includes(`'${k}'`)) errs.push(`campeón ${k}: sin efecto en entities.js`);
  if (!cuerpo.includes(`'${k}'`) && k !== 'tough') errs.push(`campeón ${k}: sin marca de aura en drawEnemy`);
}
const pesos = Object.values(CH).reduce((s, c) => s + c.w, 0);
console.log(`${Object.keys(CH).length} variantes de campeón: ${Object.entries(CH).map(([k, c]) => `${c.name} ${(c.w / pesos * 100).toFixed(0)} %`).join(', ')}`);

// enemigos que no salen en ninguna reserva: normales si los crea otro enemigo (p. ej. las gelatinitas), si no, aviso
const huerfanos = Object.keys(EN).filter(id => !usados.has(id));
console.log(`${Object.keys(EN).length} enemigos y ${Object.keys(BOSSES).length} jefes revisados`);
for (const [tema, lista] of Object.entries(ENEMY_POOLS)) console.log(`  ${tema}: ${lista.length} enemigos en la reserva`);
if (huerfanos.length) console.log(`  sin reserva (los crea otro enemigo o un jefe): ${huerfanos.join(', ')}`);
if (errs.length) { console.log(`✗ ${errs.length} problemas:`); errs.forEach(e => console.log('  ' + e)); process.exit(1); }
console.log('0 problemas');
