// Une los datos de la wiki (tools/wiki/items.json) con los efectos (tools/itemspecs.txt)
// y genera src/items_db.js. Uso: node tools/gen-items.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wiki = JSON.parse(readFileSync(join(root, 'tools', 'wiki', 'items.json'), 'utf8'));
const specs = new Map();
for (const raw of readFileSync(join(root, 'tools', 'itemspecs.txt'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [body, note = ''] = line.split(/\s#\s/);
  const sp = body.indexOf(' ');
  const key = body.slice(0, sp), spec = body.slice(sp + 1).trim();
  if (specs.has(key)) throw new Error('Clave repetida en itemspecs: ' + key);
  specs.set(key, { spec, note: note.trim() });
}

// Objetos reales que no aparecen en las tablas de la wiki
const EXTRA = [
  { key: '93', id: 93, name: 'El Gamekid', kind: 'a' },
  { key: '114', id: 114, name: 'Cuchillo de Mamá', kind: 'p' },
];
for (const e of EXTRA) if (!wiki.some(w => w.key === e.key)) wiki.push(e);
wiki.sort((a, b) => a.id - b.id || a.key.localeCompare(b.key));

const out = [], missing = [];
for (const w of wiki) {
  const s = specs.get(w.key);
  if (!s) { missing.push(w.key + ' ' + w.name); continue; }
  out.push([w.key, w.name, w.kind, s.spec, s.note]);
  specs.delete(w.key);
}
if (missing.length) throw new Error('Objetos sin efecto: ' + missing.join(', '));
if (specs.size) console.warn('Efectos sin objeto en la wiki:', [...specs.keys()].join(', '));

const js = `'use strict';
// Generado por tools/gen-items.mjs a partir de la wiki de Fandom (nombres) y tools/itemspecs.txt (efectos).
// [clave, nombre, tipo (p pasivo / a activo), efectos, nota]
const ITEM_DB = [
${out.map(r => '  ' + JSON.stringify(r)).join(',\n')}
];
`;
writeFileSync(join(root, 'src', 'items_db.js'), js);
console.log(`OK  src/items_db.js (${out.length} objetos)`);
