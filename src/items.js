'use strict';
/* =========================================================
   Objetos: interpreta los efectos de items_db.js
   ========================================================= */
const POOL_KEYS = { t: 'treasure', b: 'boss', s: 'shop', d: 'devil', a: 'angel', x: 'secret' };
const QW = [10, 9, 7, 4, 2];
const ITEMS = {};
const ITEM_IDS = [];
const CHANCE_EVT = { hurt: 0.33, kill: 0.25, enter: 0.5, clear: 0.5, floor: 1, shoot: 0.06 };
// Efectos de lágrima que se pueden sortear (Billete de 3 dólares, Pastel de frutas...)
const RAND_TEAR = ['homing', 'pierce', 'spectral', 'poison', 'slow', 'fear', 'charm', 'confuse', 'freeze', 'burn', 'bounce', 'split', 'electric', 'knock', 'big'];

const STAT_NAMES = { dmg: 'Daño', tps: 'Lágrimas', spd: 'Velocidad', rng: 'Alcance', sht: 'Vel. disparo', lck: 'Suerte' };
const FLAG_NAMES = {
  homing: 'lágrimas teledirigidas', pierce: 'lágrimas perforantes', spectral: 'lágrimas espectrales', bounce: 'lágrimas que rebotan',
  flight: 'vuelo', magnet: 'atrae recursos', big: 'lágrimas grandes', poison: 'veneno', slow: 'ralentiza', fear: 'miedo', charm: 'enamora',
  confuse: 'confunde', freeze: 'petrifica', burn: 'quema', bleed: 'sangrado', split: 'lágrimas que se dividen', quad: 'lágrimas que estallan en 4',
  bones: 'astillas de hueso', burst: 'lágrimas que estallan', proptosis: 'más daño de cerca', coal: 'más daño de lejos', continuum: 'atraviesan paredes',
  creephit: 'charcos al impactar', holy: 'rayos de luz', electric: 'descargas eléctricas', knock: 'gran empuje', shieldtears: 'destruyen proyectiles',
  teeth: 'dientes de daño triple', needle: 'agujas letales', x2: 'disparo doble', x3: 'disparo triple', x4: 'disparo cuádruple', wiz: 'disparo diagonal doble',
  loki: 'disparo en cruz', back: 'disparo trasero', sore: 'lágrimas extra al azar', analog: 'disparo en cualquier ángulo', randtear: 'efectos de lágrima al azar',
  multihit: 'golpes múltiples', orbitear: 'lágrimas en órbita', compass: 'revela salas especiales', map: 'revela el mapa', bluemap: 'revela la sala secreta',
  xray: 'abre las salas secretas', mind: 'revela todo el mapa', mantle: 'escudo en cada sala', wafer: 'el daño recibido es siempre medio corazón',
  battery: 'sobrecarga del activo', carbattery: 'el activo se usa dos veces', volt9: 'el activo carga más rápido', sale: 'tienda a mitad de precio',
  devil: 'más pactos del diablo', devil100: 'siempre hay pacto del diablo', angel: 'más salas del ángel', eucharist: 'siempre hay sala del ángel', duality: 'diablo y ángel a la vez',
  moneypower: 'daño por cada moneda', whore: 'daño y velocidad con poca vida', bloodylust: 'daño al recibir golpes', lustyblood: 'daño al matar',
  ecoli: 'convierte enemigos en caca', midas: 'convierte enemigos en oro', viruscontact: 'envenena al tocar', leaf: 'invencible si te quedas quieto',
  regen: 'regenera vida', skatole: 'las moscas son inofensivas', spiderfriend: 'las arañas son inofensivas', explosionimmune: 'inmune a explosiones',
  fireimmune: 'inmune al fuego', ladder: 'cruza fosos', leo: 'rompe rocas al pisarlas', pony: 'velocidad mínima alta', taurus: 'velocidad creciente',
  aries: 'embestida dañina', humble: 'recursos dobles', bogo: 'bombas dobles', momkey: 'cofres con más premios', guppytail: 'más cofres',
  contract: 'recompensas dobles', champions: 'más campeones', options: 'elige entre dos objetos del jefe', moreoptions: 'dos objetos en el tesoro',
  restock: 'la tienda se repone', paytoplay: 'las puertas se abren con monedas', deeppockets: 'hasta 999 monedas', keeperhead: 'lágrimas que dan monedas',
  greed: 'lágrimas de oro', tarotcloth: 'cartas dobles', deck: 'las píldoras son cartas', baggy: 'las cartas son píldoras', phd: 'píldoras buenas',
  falsephd: 'píldoras malas pero útiles', mitre: 'corazones de alma', scapular: 'alma con poca vida', maggybow: 'curación doble',
  deadeye: 'daño por aciertos seguidos', epiphora: 'cadencia creciente', darkcrown: 'mejoras con un solo corazón', adrenaline: 'daño con contenedores vacíos',
  crown: 'daño doble con vida llena', emptyvessel: 'vuelo y escudo sin corazones rojos', purity: 'aura de mejora', libra: 'equilibra estadísticas',
  randomstats: 'estadísticas al azar', rockbottom: 'tus estadísticas nunca bajan', paschal: 'cadencia por salas sin daño', soullocket: 'mejoras con corazones de alma',
  candyheart: 'mejoras al curarte', consolation: 'mejora tu peor estadística', bingeeater: 'come y crece', glitchcrown: 'los objetos cambian sin parar',
  sacredorb: 'solo objetos buenos', redemption: 'premio por rechazar pactos', poundflesh: 'la tienda cuesta vida', camo: 'camuflaje', modem: 'congela al azar',
  jumper: 'carga al matar', volt45: 'carga al hacer daño', sharpplug: 'carga a cambio de vida', gullet: 'vida por monedas', isaacheart: 'un corazón te protege',
  repel: 'aura que repele', cone: 'puede ignorar daño', infamy: 'bloquea proyectiles', trinity: 'escudo frontal', reflect: 'refleja proyectiles', pencil: 'ráfagas de lágrimas',
  kidney: 'ráfaga acumulada', deadtooth: 'aura venenosa', evileye: 'ojos que disparan', missingno: 'cambia tus objetos cada piso', zodiac: 'mejora del zodiaco',
  cambion: 'familiares demoníacos', immaculate: 'familiares angelicales', tmtrainer: 'objetos con efectos extra', schoolbag: 'dos objetos activos', contagion: 'contagio',
  jar: 'guarda corazones', jarflies: 'guarda moscas', vampire: 'cura al matar', blanket: 'escudo en la sala del jefe', toothnail: 'piel de piedra', bellyjelly: 'los enemigos rebotan',
  emptyheart: 'contenedor extra si tienes poca vida', heartbreak: 'corazón roto', brittle: 'huesos frágiles', bloodoath: 'juramento de sangre', azazelrage: 'furia de azufre',
  revelation: 'rayo sagrado cargado', numbertwo: 'bombas al disparar', flatstone: 'lágrimas saltarinas', dirtymind: 'moscas de caca', pokego: 'aliados al entrar',
  deathlist: 'premios por cazar', hpbars: 'barras de vida', glyph: 'premios de campeones', sol: 'bendición del jefe', mercurius: 'puertas siempre abiertas', jupiter: 'gases',
  membercard: 'tienda ampliada', keepersack: 'mejoras al comprar', chaos: 'reservas caóticas', auratear: 'lágrimas con aura', socks: 'inmune a pinchos y charcos',
  stickybomb: 'lágrimas explosivas pegajosas', firepepper: 'disparo de fuego', acid: 'lágrimas ácidas', rift: 'grietas', apple: 'cuchillas', yellow: 'lágrimas amarillas',
  blood: 'lágrimas de sangre', birthright: 'primogenitura', redstew: 'gran daño que se desvanece', none: 'sin efecto',
};
const MODE_NAMES = {
  laser: 'láser', brim: 'rayo de azufre', knife: 'cuchillo arrojadizo', fetus: 'bombas en lugar de lágrimas', epic: 'misiles teledirigidos',
  ludo: 'lágrima controlable', techx: 'anillos láser', choco: 'disparo cargado', lung: 'ráfaga cargada', cursed: 'ráfaga en fila', sword: 'espada',
  club: 'garrote', tech2: 'láser continuo', ipecac: 'lágrimas explosivas', maw: 'anillo del vacío', haemo: 'lágrimas que estallan al caer',
};

function parseSpec(spec) {
  const s = { ops: [], pools: {}, q: 2, charge: null, once: false, start0: false, onPickup: false, use: null, fams: [], notes: [] };
  for (const tok of spec.split(/\s+/)) {
    if (!tok) continue;
    let m;
    if (tok[0] === '@') { const k = POOL_KEYS[tok[1]]; if (k) s.pools[k] = true; else s.pools.none = true; continue; }
    if ((m = tok.match(/^q(\d)$/))) { s.q = +m[1]; continue; }
    if ((m = tok.match(/^c(\d+)$/))) { s.charge = +m[1]; continue; }
    if (tok === 'once') { s.once = true; continue; }
    if (tok === 'once:pickup') { s.onPickup = true; continue; }
    if (tok === 'start0') { s.start0 = true; continue; }
    if (tok.startsWith('use:')) { s.use = tok.slice(4).split(','); continue; }
    if ((m = tok.match(/^(dmg|tps|spd|rng|sht|lck)([+\-*])(-?[\d.]+)$/))) { s.ops.push({ t: 'stat', k: m[1], op: m[2], v: +m[3] }); continue; }
    if ((m = tok.match(/^(hp|hpe|soul|black|bone|coin|bomb|key)\+(\d+)$/))) { s.ops.push({ t: 'res', k: m[1], v: +m[2] }); continue; }
    if (tok === 'heal') { s.ops.push({ t: 'heal', v: 99 }); continue; }
    if ((m = tok.match(/^heal\+(\d+)$/))) { s.ops.push({ t: 'heal', v: +m[1] }); continue; }
    if ((m = tok.match(/^setmax:(\d+)$/))) { s.ops.push({ t: 'setmax', v: +m[1] }); continue; }
    if (tok.startsWith('drop:')) { s.ops.push({ t: 'drop', list: tok.slice(5).split(',') }); continue; }
    if ((m = tok.match(/^size(\+|-|--)$/))) { s.ops.push({ t: 'size', v: m[1] === '+' ? 0.15 : m[1] === '-' ? -0.12 : -0.3 }); continue; }
    if (tok.startsWith('M:')) { s.ops.push({ t: 'mode', k: tok.slice(2) }); continue; }
    if (tok.startsWith('fam:')) { s.fams.push(tok.slice(4)); continue; }
    if (tok.startsWith('revive:')) { s.ops.push({ t: 'revive', k: tok.slice(7) }); continue; }
    if ((m = tok.match(/^on:(hurt|kill|enter|clear|floor|shoot)(\?)?:(.+)$/))) { s.ops.push({ t: 'event', e: m[1], chance: !!m[2], fx: m[3].split(',') }); continue; }
    if (tok[0] === '+') {
      let k = tok.slice(1), chance = false;
      if (k.endsWith('?')) { chance = true; k = k.slice(0, -1); }
      const [name, arg] = k.split(':');
      if (name === 'bomb') s.ops.push({ t: 'bombfx', k: arg });
      else if (name === 'aura' || name === 'trail') s.ops.push({ t: name, k: arg });
      else if (name === 'contact') s.ops.push({ t: 'contact', v: +arg });
      else s.ops.push({ t: 'flag', k: name, chance });
      continue;
    }
    s.notes.push(tok);
  }
  return s;
}

const EFX_NAMES = {
  heal: 'cura', soul: 'corazones de alma', black: 'corazón negro', hp: 'contenedor', nuke: 'daño a toda la sala', nukex: 'daño a toda la sala',
  nukeboss: 'daño a los jefes', freeze: 'petrifica a todos', fear: 'asusta a todos', charm: 'enamora a todos', confuse: 'confunde a todos',
  slow: 'ralentiza a todos', poisonall: 'envenena a todos', shield: 'escudo', rdmg: 'daño extra en la sala', rtps: 'lágrimas extra en la sala',
  rflight: 'vuelo en la sala', rhoming: 'lágrimas teledirigidas en la sala', rbrim: 'azufre en la sala', tele: 'teletransporte', reroll: 'cambia los objetos',
  reroll25: 'cambia los objetos (pueden desaparecer)', rerollpk: 'cambia los recursos', spindown: 'objetos con número menor', d4: 'cambia tus objetos',
  d7: 'reinicia la sala', d8: 'estadísticas al azar', d10: 'cambia los enemigos', d12: 'cambia las rocas', d1: 'duplica un recurso',
  dinfinity: 'un dado al azar', dupe: 'duplica objetos y recursos', crooked: 'duplica o destruye', void: 'absorbe objetos', abyss: 'objetos en langostas',
  drop: 'suelta recursos', dropitem: 'suelta un objeto', pill: 'suelta una píldora', card: 'suelta una carta', flies: 'moscas azules', spiders: 'arañas azules',
  kami: 'explota (te hiere)', boom: 'explosión', megabomb: 'bomba gigante', troll: 'bombas trampa', tnt: 'barril explosivo', ring: 'anillo de lágrimas',
  ringat: 'anillo de lágrimas', krampus: 'azufre en cruz', shoop: 'láser gigante', megablast: 'mega láser', light: 'rayos de luz', creep: 'charco ácido',
  gas: 'gas venenoso', poop: 'caca', hurt: 'te hiere', trapdoor: 'trampilla al siguiente piso', doors: 'abre puertas', map: 'revela el mapa',
  refloor: 'reinicia el piso', rkey: 'vuelve al primer piso', dash: 'embestida', jump: 'salto', unicorn: 'invencible y veloz', convert: 'alma en contenedor',
  paw: 'contenedor en almas', ivbag: 'vida por monedas', slot: 'tragaperras', nickel: 'monedas', fingers: 'monedas por daño', goldrazor: 'monedas por daño',
  jar: 'suelta los corazones guardados', jarflies: 'suelta las moscas guardadas', blankcard: 'repite la carta', placebo: 'repite la píldora',
  planc: 'mata a todos... y a ti', mamamega: 'gran explosión', eraser: 'borra un enemigo', halfhp: 'divide la vida de los enemigos', flush: 'enemigos en caca',
  breakrocks: 'rompe rocas', tempfam: 'aliado temporal', turret: 'torreta', wisp: 'llama aliada', boneorbit: 'huesos orbitales', monstro: 'aplasta a un enemigo',
  missile: 'misil', bobhead: 'bomba venenosa', decoy: 'señuelo explosivo', flame: 'llamarada', redflame: 'fuego', boomerang: 'búmeran', blackhole: 'agujero negro',
  sprinkler: 'aspersor', glasscannon: 'disparo de cristal', coupon: 'un objeto gratis', keeperbox: 'objeto en venta', telekinesis: 'atrapa proyectiles',
  pushback: 'empuja a los enemigos', lownuke: 'daño a todos con poca vida', lowshield: 'escudo con poca vida', deadbird: 'un pájaro ataca', bestbud: 'mosca protectora',
  charge: 'carga el activo', trail: 'rastro de sangre', athame: 'anillo oscuro', gust: 'velocidad y lágrimas', datamine: 'estadística al azar', clicker: 'cambia de personaje',
  peeler: 'contenedor por daño', metronome: 'efecto al azar', magicskin: 'vida por objetos', craft: 'fabrica un objeto', sumpt: 'coágulos aliados', flip: 'cambia de forma',
  fakehurt: 'finge un golpe', saturn: 'lágrimas en órbita', scream: 'grito', orbit: 'orbital', randomact: 'efecto activo al azar', dupfam: 'duplica familiares',
  detonate: 'detona tus bombas', detonatetears: 'detona tus lágrimas', movingbox: 'guarda recursos', altar: 'sacrifica familiares', throwrock: 'lanza una roca',
  fortune: 'fortuna', pandora: 'regalos del piso', rspd: 'velocidad en la sala',
};

function itemDesc(id) {
  const it = ITEMS[id], s = it.spec, parts = [];
  for (const o of s.ops) {
    if (o.t === 'stat') parts.push(`${STAT_NAMES[o.k]} ${o.op === '*' ? '×' + o.v : (o.op === '-' || o.v < 0 ? '' : '+') + (o.op === '-' ? '-' : '') + o.v}`);
    else if (o.t === 'res') parts.push({ hp: `+${o.v} contenedor${o.v > 1 ? 'es' : ''}`, hpe: `+${o.v} contenedor${o.v > 1 ? 'es' : ''} vacío${o.v > 1 ? 's' : ''}`, soul: `+${o.v} corazón${o.v > 1 ? 'es' : ''} de alma`, black: `+${o.v} corazón${o.v > 1 ? 'es' : ''} negro${o.v > 1 ? 's' : ''}`, bone: `+${o.v} corazón de hueso`, coin: `+${o.v} monedas`, bomb: `+${o.v} bombas`, key: `+${o.v} llaves` }[o.k]);
    else if (o.t === 'heal') parts.push(o.v >= 99 ? 'cura toda la vida' : 'cura');
    else if (o.t === 'flag') { if (o.k !== 'none' && o.k !== 'yellow') parts.push((FLAG_NAMES[o.k] || o.k) + (o.chance ? ' (a veces)' : '')); }
    else if (o.t === 'mode') parts.push(MODE_NAMES[o.k] || o.k);
    else if (o.t === 'bombfx') parts.push('bombas mejoradas');
    else if (o.t === 'aura') parts.push('aura');
    else if (o.t === 'trail') parts.push('deja un rastro');
    else if (o.t === 'contact') parts.push('daño por contacto');
    else if (o.t === 'revive') parts.push('vida extra');
    else if (o.t === 'drop') parts.push('suelta recursos');
    else if (o.t === 'setmax') parts.push('cambia tus contenedores');
    else if (o.t === 'event') parts.push({ hurt: 'al recibir daño', kill: 'al matar', enter: 'al entrar en una sala', clear: 'al limpiar una sala', floor: 'en cada piso', shoot: 'al disparar' }[o.e] + ': ' + o.fx.map(e => EFX_NAMES[e.split(':')[0]] || e).join(', '));
  }
  if (s.fams.length) {
    const kinds = { shoot: 'que dispara contigo', abel: 'que dispara en espejo', twin: 'que te acompaña', auto: 'que dispara solo', bounce: 'que rebota por la sala',
      charge: 'que embiste', chase: 'que persigue enemigos', orbit: 'orbital', follow: 'que te sigue', stomp: 'que pisotea enemigos', aura: 'con aura',
      spear: 'lanza frontal', finger: 'que señala enemigos', chain: 'bola y cadena', pilot: 'que mueves al disparar', brim: 'con azufre', drop: 'que suelta recursos' };
    const f = FAMS[s.fams[0]];
    parts.push((s.fams.length > 1 ? `${s.fams.length} familiares ` : 'familiar ') + (f ? kinds[f.k] || '' : ''));
  }
  if (s.use) parts.unshift((s.charge ? `Activo (${s.charge} carga${s.charge > 1 ? 's' : ''})` : s.once ? 'Activo de un solo uso' : 'Activo') + ': ' + s.use.map(e => EFX_NAMES[e.split(':')[0]] || e).join(', '));
  let d = parts.join(' · ');
  if (it.note) d = d ? d + '. ' + it.note : it.note;
  return d.charAt(0).toUpperCase() + d.slice(1);
}

// ---------- Registro ----------
for (const [key, name, kind, spec, note] of ITEM_DB) {
  const s = parseSpec(spec);
  const active = kind === 'a' || s.charge != null || (s.use && !s.onPickup);
  const w = QW[s.q] || 7;
  const pools = {};
  for (const k in s.pools) if (k !== 'none') pools[k] = w;
  if (!Object.keys(pools).length && !s.pools.none) pools.treasure = w;
  ITEMS[key] = {
    key, name, kind: active ? 'a' : 'p', spec: s, note, pools, q: s.q,
    charge: active ? (s.charge != null ? s.charge : (s.once ? 1 : 3)) : null,
    once: s.once, start0: s.start0,
    apply: p => applySpec(p, s, {}),
    use: p => runEffects(p, s.use || [], {}),
  };
  ITEM_IDS.push(key);
}
for (const k of ITEM_IDS) ITEMS[k].desc = itemDesc(k);

// ---------- Aplicar a un jugador ----------
function addHp(p, kind, n) {
  if (p.lost) return;
  if (kind === 'hp' || kind === 'hpe' || kind === 'bone') {
    if (p.noRed) { p.soul += n * 2; clampHearts(p); return; }
    const cap = p.keeper ? 4 : MAX_HEARTS;
    const add = Math.max(0, Math.min(n, cap - p.maxRed));
    p.maxRed += add;
    if (kind !== 'hpe') p.red += add * 2;
  } else if (kind === 'soul') { if (!p.keeper) p.soul += n * 2; }
  else if (kind === 'black') { if (!p.keeper) p.black += n * 2; }
  clampHearts(p);
}

function applySpec(p, s, ctx) {
  const rebuild = !!ctx.rebuild;
  for (const o of s.ops) {
    switch (o.t) {
      case 'stat': {
        const map = { dmg: ['dmgAdd', 'dmgMult'], tps: ['tpsAdd', 'tpsMult'], spd: ['spdAdd'], rng: ['rangeAdd'], sht: ['shotAdd'], lck: ['luckAdd'] }[o.k];
        if (o.op === '*') { if (map[1]) p.mods[map[1]] *= o.v; }
        else p.mods[map[0]] += (o.op === '-' ? -o.v : o.v) * (o.k === 'rng' ? 40 : 1);
        break;
      }
      case 'res':
        if (rebuild) break;
        if (o.k === 'coin') p.coins = Math.min(coinCap(p), p.coins + o.v);
        else if (o.k === 'bomb') p.bombs = Math.min(99, p.bombs + o.v);
        else if (o.k === 'key') p.keys = Math.min(99, p.keys + o.v);
        else addHp(p, o.k, o.v);
        break;
      case 'heal': if (!rebuild) healRed(p, o.v); break;
      case 'setmax':
        if (rebuild || p.lost) break;
        if (o.v === 0) { p.black += p.maxRed * 2; p.maxRed = 0; p.red = 0; }
        else { p.maxRed = Math.min(p.maxRed, o.v); }
        clampHearts(p);
        break;
      case 'drop': if (!rebuild && G.room) for (const d of o.list) dropKind(d, p.x, p.y); break;
      case 'size': p.size = clamp((p.size || 1) + o.v, 0.6, 1.5); break;
      case 'mode': p.modes.add(o.k); break;
      case 'revive': if (!rebuild) p.revives.push(o.k); break;
      case 'event': p.events[o.e].push({ chance: o.chance, fx: o.fx }); break;
      case 'bombfx': p.bombFx.add(o.k); break;
      case 'aura': p.auras.add(o.k); break;
      case 'trail': p.trails.add(o.k); break;
      case 'contact': p.contactDmg = Math.max(p.contactDmg || 0, o.v); break;
      case 'flag': {
        const k = o.k;
        if (TEAR_FLAGS.has(k)) { if (o.chance) p.fxc[k] = true; else p.fx[k] = true; }
        else if (k === 'x2') p.multishot = Math.max(p.multishot, 2);
        else if (k === 'x3') p.multishot = Math.max(p.multishot, 3);
        else if (k === 'x4') p.multishot = Math.max(p.multishot, 4);
        else if (k === 'flight') p.flags.flight = true;
        else if (k === 'magnet') p.flags.magnet = true;
        else {
          p.passive.add(k);
          if (o.chance) p.passive.add(k + '?');
          if (!rebuild) onPassivePickup(p, k);
        }
        break;
      }
    }
  }
  for (const f of s.fams) addFamiliar(f);
  if (s.onPickup && s.use && !rebuild) runEffects(p, s.use, {});
}

const TEAR_FLAGS = new Set(['homing', 'pierce', 'spectral', 'bounce', 'big', 'poison', 'slow', 'fear', 'charm', 'confuse', 'freeze', 'burn', 'bleed', 'split', 'quad', 'bones', 'burst',
  'proptosis', 'coal', 'continuum', 'creephit', 'holy', 'electric', 'knock', 'shieldtears', 'teeth', 'needle', 'wiz', 'loki', 'back', 'sore', 'analog', 'randtear', 'multihit',
  'orbitear', 'stickybomb', 'firepepper', 'acid', 'rift', 'apple', 'yellow', 'blood', 'auratear', 'tech5', 'kidney', 'evileye']);

function onPassivePickup(p, k) {
  switch (k) {
    case 'map': case 'compass': case 'bluemap': case 'mind': case 'xray': revealFlags(p); break;
    case 'randomstats': for (const s of ['spdAdd', 'tpsAdd', 'dmgAdd', 'luckAdd']) p.mods[s] += pick([-0.3, -0.15, 0.2, 0.35, 0.5]) * (s === 'luckAdd' ? 2 : 1); break;
    case 'consolation': {
      const n = { spd: p.speed / 1, tps: p.tps / 2.73, dmg: p.dmg / 3.5, rng: p.range / 260 };
      const low = Object.keys(n).sort((a, b) => n[a] - n[b])[0];
      if (low === 'spd') p.mods.spdAdd += 0.2; else if (low === 'tps') p.mods.tpsAdd += 0.5; else if (low === 'dmg') p.mods.dmgAdd += 1; else p.mods.rangeAdd += 60;
      dropKind(pick(['coin*3', 'bomb', 'key']), p.x, p.y);
      break;
    }
    case 'heartbreak': p.revives.push('heartbreak'); p.revives.push('heartbreak'); break;
    case 'brittle': if (!p.lost && !p.noRed) { p.maxRed = Math.max(p.maxRed, 6); p.red = Math.min(p.red, 2); } break;
    case 'missingno': rerollPassives(p); break;
    case 'redstew': p.redstew = 21.6; break;
    case 'deeppockets': break;
    case 'schoolbag': break;
    case 'birthright': birthright(p); break;
    case 'jar': p.jar = p.jar || 0; break;
  }
}

function revealFlags(p) {
  const fl = G.floor; if (!fl) return;
  const P = p.passive;
  for (const r of fl.rooms) {
    if (P.has('mind') || P.has('map')) { if (r.type !== 'secret' || P.has('mind')) r.seen = true; }
    if ((P.has('compass') || P.has('mind')) && r.type !== 'normal' && r.type !== 'secret') r.seen = true;
    if ((P.has('bluemap') || P.has('xray') || P.has('mind')) && r.type === 'secret') r.seen = true;
    if (P.has('sol') && r.type === 'boss') r.seen = true;
    if (P.has('xray') && r.type === 'secret') for (const k in r.doors) r.doors[k].hidden = false;
  }
}

function birthright(p) {
  const id = p.char.id.replace(/^t_/, '');
  const B = {
    isaac: () => p.passive.add('moreoptions'), magdalena: () => addHp(p, 'hp', 2), cain: () => p.passive.add('options'), judas: () => { p.mods.dmgAdd += 1; },
    bluebaby: () => { p.flags.flight = true; }, eve: () => p.passive.add('whore'), samson: () => { p.mods.dmgAdd += 1; }, azazel: () => { p.brimShort = false; },
    lazarus: () => p.revives.push('self'), eden: () => dropItemNear(p, 'treasure'), lost: () => { p.fx.spectral = true; p.mods.dmgAdd += 1; },
    lilith: () => addFamiliar('incubus'), keeper: () => addHp(p, 'hp', 1), apollyon: () => dropItemNear(p, 'treasure'), forgotten: () => { p.mods.dmgAdd += 1.5; },
    bethany: () => addHp(p, 'soul', 2), jacob: () => addFamiliar('twisted'),
  };
  (B[id] || (() => { p.mods.dmgAdd += 1; }))();
}

function giveItemTo(p, id, silent) {
  const it = ITEMS[id];
  if (!it) return null;
  let old = null;
  if (it.kind === 'a') {
    if (p.active && p.passive.has('schoolbag') && !p.active2) p.active2 = p.active;
    else if (p.active) old = p.active.id;
    p.active = { id, charge: it.start0 ? 0 : it.charge };
  } else {
    p.items.push(id);
    it.apply(p);
    if (p.passive.has('tmtrainer')) { const f = pick(RAND_TEAR); p.fx[f] = true; }
  }
  clampHearts(p); recalc(p);
  return old;
}

// Reconstruye las mejoras del jugador a partir de su personaje y sus objetos (tras perder o cambiar objetos)
function rebuildPlayer(p) {
  const keep = { maxRed: p.maxRed, red: p.red, soul: p.soul, black: p.black, coins: p.coins, bombs: p.bombs, keys: p.keys, revives: p.revives };
  resetPlayerMods(p);
  G.familiars = G.familiars.filter(f => f.temp);
  applyCharTraits(p, p.char, true);
  for (const id of p.items) applySpec(p, ITEMS[id].spec, { rebuild: true });
  Object.assign(p, keep);
  clampHearts(p); recalc(p);
}

function rerollPassives(p) {
  const list = ITEM_IDS.filter(k => ITEMS[k].kind === 'p' && Object.keys(ITEMS[k].pools).length);
  p.items = p.items.map(() => pick(list));
  rebuildPlayer(p);
}

// ---------- Eventos ----------
function fireEvent(evt, ctx = {}) {
  const p = G.player;
  if (!p || p.dead) return;
  const list = p.events[evt];
  if (!list || !list.length) return;
  for (const ev of list) {
    if (ev.chance && Math.random() > clamp(CHANCE_EVT[evt] + p.luck * 0.03, 0.02, 1)) continue;
    runEffects(p, ev.fx, ctx);
  }
}

// ---------- Efectos (activos, cartas, eventos) ----------
function runEffects(p, list, ctx) {
  let ok = false;
  for (const raw of list) {
    let [name, ...args] = raw.split(':');
    let times = 1;
    const last = args.length ? args[args.length - 1] : name;
    const mm = last.match(/^(.*)\*(\d+)$/);
    if (mm) { times = +mm[2]; if (args.length) args[args.length - 1] = mm[1]; else name = mm[1]; }
    const fn = EFX[name];
    if (!fn) continue;
    for (let i = 0; i < times; i++) if (fn(p, args, ctx) !== false) ok = true;
  }
  recalc(p);
  return ok;
}

function liveEnemies(boss) { return G.enemies.filter(e => !e.dead && !e.invisible && (boss == null || !!e.boss === boss)); }
function statusAll(k, s) {
  let n = 0;
  for (const e of G.enemies) if (!e.dead && !e.invisible) { applyStatus(e, k, s); n++; }
  return n > 0 || G.enemies.length === 0 ? true : true;
}
function roomMod(p, k, v) { p.roomMods[k] = (p.roomMods[k] || 0) + v; }
function dropItemNear(p, pool) {
  const s = G.freeSpot(p.x + rr(-50, 50), p.y + rr(-40, 40));
  G.room.pickups.push(mkPickup('item', s.x, s.y, { item: pickItem(pool || G.poolForRoom()) }));
}
function pedestals() { return G.room.pickups.filter(pk => pk.kind === 'item' && pk.item); }

const EFX = {
  heal: (p, a) => { if (!canHealRed(p) && !p.keeper) return false; healRed(p, +(a[0] || 99)); Sfx.play('heart'); },
  soul: (p, a) => { addHp(p, 'soul', +(a[0] || 1)); Sfx.play('heart'); },
  black: (p, a) => { addHp(p, 'black', +(a[0] || 1)); },
  hp: (p, a) => { addHp(p, 'hp', +(a[0] || 1)); Sfx.play('heart'); },
  nuke: (p, a) => { G.damageAll(+(a[0] || 40)); G.shake = Math.max(G.shake, 0.3); },
  nukex: (p, a) => { G.damageAll(p.dmg * +(a[0] || 1)); },
  nukeboss: (p, a) => { for (const e of liveEnemies(true)) damageEnemy(e, +a[0], null, false, true); },
  freeze: (p, a) => statusAll('freeze', +(a[0] || 3)),
  fear: (p, a) => statusAll('fear', +(a[0] || 4)),
  charm: (p, a) => statusAll('charm', +(a[0] || 4)),
  confuse: (p, a) => statusAll('confuse', +(a[0] || 4)),
  slow: (p, a) => { G.slowTime = Math.max(G.slowTime, +(a[0] || 6)); },
  poisonall: (p) => { for (const e of liveEnemies()) applyStatus(e, 'poison', 3, p.dmg * 0.6); },
  shield: (p, a) => { p.shield = Math.max(p.shield, +(a[0] || 3)); },
  rdmg: (p, a) => roomMod(p, 'dmg', +a[0]),
  rtps: (p, a) => roomMod(p, 'tps', +a[0]),
  rspd: (p, a) => roomMod(p, 'spd', +a[0]),
  rflight: (p) => { p.roomMods.flight = 1; },
  rhoming: (p) => { p.roomMods.homing = 1; },
  rbrim: (p) => { p.roomMods.brim = 1; },
  tele: (p, a) => G.teleport(a[0] || 'random'),
  reroll: () => { const ps = pedestals(); if (!ps.length) return false; for (const pk of ps) { pk.item = pickItem(G.poolForRoom()); poofAt(pk.x, pk.y - 20); } },
  reroll25: () => { const ps = pedestals(); if (!ps.length) return false; for (const pk of ps) { if (Math.random() < 0.25) { pk.gone = true; } else pk.item = pickItem(G.poolForRoom()); poofAt(pk.x, pk.y - 20); } },
  spindown: () => {
    const ps = pedestals(); if (!ps.length) return false;
    for (const pk of ps) { const i = ITEM_IDS.indexOf(pk.item); pk.item = ITEM_IDS[(i - 1 + ITEM_IDS.length) % ITEM_IDS.length]; poofAt(pk.x, pk.y - 20); }
  },
  rerollpk: () => { let n = 0; for (const pk of G.room.pickups) if (pk.kind !== 'item' && pk.kind !== 'trophy' && pk.price == null) { pk.kind = randomBasicKind(); pk.r = PK_R[pk.kind] || 9; if (pk.kind === 'pill') pk.pill = ri(0, PILL_COLORS.length - 1); if (pk.kind === 'card') pk.card = ri(0, CARDS.length - 1); n++; } if (!n) return false; },
  d4: (p) => { if (!p.items.length) return false; rerollPassives(p); G.showBanner('¡Objetos cambiados!', '', 1.5); },
  d7: () => { G.restartRoom(); },
  d8: (p) => { for (const k of ['dmgMult', 'tpsMult']) p.mods[k] *= rr(0.5, 2); p.mods.spdAdd += rr(-0.2, 0.2); p.mods.rangeAdd += rr(-60, 60); },
  d10: () => { const L = liveEnemies(false); if (!L.length) return false; const pool = ENEMY_POOLS[FLOORS[G.floorIdx].theme]; for (const e of L) { e.dead = true; spawnEnemy(weighted(pool), e.x, e.y); } },
  d12: () => { const t = G.room.tiles; for (let i = 0; i < t.length; i++) if (t[i] === T.ROCK || t[i] === T.POOP || t[i] === T.TINTED) t[i] = pick([T.ROCK, T.POOP, T.TINTED, T.TNT, T.FIRE]); },
  d1: () => { const L = G.room.pickups.filter(pk => pk.kind !== 'item' && pk.kind !== 'trophy' && pk.price == null); if (!L.length) return false; const c = pick(L); spawnPickup(c.kind, c.x, c.y, { pill: c.pill, card: c.card }); },
  dinfinity: (p) => runEffects(p, [pick(['reroll', 'rerollpk', 'd4', 'd7', 'd8', 'd10', 'd12', 'd1', 'reroll25', 'spindown'])], {}),
  dupe: () => { const L = G.room.pickups.filter(pk => pk.kind !== 'trophy'); if (!L.length) return false; for (const pk of L) { const s = G.freeSpot(pk.x + 40, pk.y); G.room.pickups.push(mkPickup(pk.kind, s.x, s.y, { item: pk.item, price: pk.price, hprice: pk.hprice, pill: pk.pill, card: pk.card, shop: pk.shop })); } },
  crooked: () => { if (Math.random() < 0.5) return EFX.dupe(); for (const pk of G.room.pickups) if (pk.kind !== 'trophy') pk.gone = true; spawnPickup('coin', G.player.x, G.player.y); },
  void: (p) => {
    const ps = pedestals(); if (!ps.length) return false;
    for (const pk of ps) { const it = ITEMS[pk.item]; if (it.kind === 'p') { p.mods[pick(['dmgAdd', 'tpsAdd', 'spdAdd'])] += pick([0.3, 0.5, 1]) * 0.5; } else p.voidActs.push(pk.item); pk.gone = true; poofAt(pk.x, pk.y - 20); }
    for (const a of p.voidActs) runEffects(p, ITEMS[a].spec.use || [], {});
  },
  abyss: (p) => { const ps = pedestals(); if (!ps.length) return false; for (const pk of ps) { pk.gone = true; addFamiliar('locust'); poofAt(pk.x, pk.y - 20); } },
  drop: (p, a) => { dropKind(a[0] || 'random', p.x, p.y); },
  dropitem: (p, a) => { dropItemNear(p, POOL_KEYS[a[0]] || null); },
  pill: (p) => { dropKind('pill', p.x, p.y); },
  card: (p) => { dropKind('card', p.x, p.y); },
  flies: (p, a) => { for (let i = 0; i < +(a[0] || 2); i++) G.blueflies.push({ x: p.x, y: p.y, a: Math.random() * TAU, life: 20, kind: 'fly' }); },
  spiders: (p, a, c) => { const x = c.e ? c.e.x : p.x, y = c.e ? c.e.y : p.y; for (let i = 0; i < +(a[0] || 2); i++) G.blueflies.push({ x, y, a: Math.random() * TAU, life: 20, kind: 'spider' }); },
  kami: (p) => { explode(p.x, p.y, 85, 40, false); p.iframes = 0; if (!G.run.god) { hurtPlayer(1, 'Kamikaze'); } },
  boom: (p, a, c) => { const x = c.e ? c.e.x : p.x, y = c.e ? c.e.y : p.y; explode(x, y, +(a[0] || 70), +(a[1] || 40), false); },
  megabomb: (p) => { G.bombs.push({ x: p.x, y: p.y + 2, r: 13, t: 1.6, free: false, mega: true, fx: new Set(['big']) }); Sfx.play('bombput'); },
  troll: (p, a) => { for (let i = 0; i < +(a[0] || 3); i++) { const s = G.freeSpot(rr(X0 + 40, X1 - 40), rr(Y0 + 40, Y1 - 40)); G.bombs.push({ x: s.x, y: s.y, r: 10, t: rr(1.2, 2.2), free: true, troll: true, fx: new Set() }); } },
  tnt: (p) => { const c = txOf(p.x + Input.lastDir.x * 40), r = tyOf(p.y + Input.lastDir.y * 40); if (!inGrid(c, r) || G.room.tiles[r * COLS + c]) return false; G.room.tiles[r * COLS + c] = T.TNT; G.flowT = 0; },
  ring: (p, a) => { tearRing(p.x, p.y, +(a[0] || 8), p, 1); },
  ringat: (p, a, c) => { if (c.e) tearRing(c.e.x, c.e.y, +(a[0] || 6), p, 0.6); },
  krampus: (p) => { for (const d of N4) G.beams.push({ dx: d[0], dy: d[1], t: 0.6, tick: 0, dmg: p.dmg * 1.2 + 3, w: 14, fixed: { x: p.x, y: p.y } }); Sfx.play('brim'); },
  shoop: (p) => { const d = Input.lastDir; G.beams.push({ dx: d.x, dy: d.y, t: 0.9, tick: 0, dmg: 4.5, w: 22, color: 'shoop' }); Sfx.play('brim'); },
  megablast: (p) => { const d = Input.lastDir; G.beams.push({ dx: d.x, dy: d.y, t: 12, tick: 0, dmg: 6, w: 30, color: 'mega', follow: true }); Sfx.play('brim'); },
  light: (p, a) => { const L = liveEnemies(); for (let i = 0; i < +(a[0] || 3); i++) { const e = L.length ? pick(L) : null; G.lights.push({ x: e ? e.x : rr(X0 + 30, X1 - 30), y: e ? e.y : rr(Y0 + 30, Y1 - 30), t: 0.7, dmg: Math.max(p.dmg * 1.5, 8), tick: 0 }); } Sfx.play('secret'); },
  creep: (p, a) => { G.pcreeps.push({ x: p.x, y: p.y + 4, r: a[0] === 'big' ? 70 : 38, t: 5, max: 5, dmg: 6, kind: 'dmg' }); },
  gas: (p) => { G.pcreeps.push({ x: p.x, y: p.y, r: 55, t: 3, max: 3, dmg: 0, kind: 'gas' }); for (const e of liveEnemies()) if (dist(e, p) < 80) applyStatus(e, 'poison', 3, p.dmg * 0.6); Sfx.play('spit'); },
  poop: (p) => { const c = txOf(p.x), r = tyOf(p.y); if (inGrid(c, r) && !G.room.tiles[r * COLS + c]) { G.room.tiles[r * COLS + c] = T.POOP; G.room.thp[r * COLS + c] = 0; G.flowT = 0; } for (const e of liveEnemies()) if (dist(e, p) < 70) { e.kx += (e.x - p.x) * 4; e.ky += (e.y - p.y) * 4; } },
  hurt: (p, a) => { p.iframes = 0; const was = p.shield; p.shield = 0; hurtPlayer(+(a[0] || 1), 'Tu propio objeto'); p.shield = was; },
  trapdoor: () => { if (G.room.trapdoor) return false; const s = G.freeSpot(G.player.x, G.player.y + 50); G.room.trapdoor = { x: s.x, y: s.y, t: 0, armed: false }; },
  doors: () => { for (const k in G.room.doors) { const d = G.room.doors[k]; d.locked = false; d.hidden = false; } Sfx.play('unlock'); },
  map: () => { for (const r of G.floor.rooms) r.seen = true; },
  refloor: () => { G.startFade(1, () => G.loadFloor(true)); },
  rkey: () => { G.startFade(1.2, () => { G.floorIdx = 0; G.loadFloor(); }); },
  dash: (p) => { const d = Input.move.x || Input.move.y ? { x: Input.move.x, y: Input.move.y } : Input.lastDir; const l = Math.hypot(d.x, d.y) || 1; p.dash = { x: d.x / l, y: d.y / l, t: 0.35 }; p.invuln = 0.45; },
  jump: (p) => { p.jump = 0.5; p.invuln = 0.5; },
  unicorn: (p, a) => { p.unicorn = +(a[0] || 6); p.invuln = p.unicorn; },
  convert: (p) => { if (p.soul < 4) return false; p.soul -= 4; addHp(p, 'hpe', 1); },
  paw: (p) => { if (p.maxRed < 1) return false; p.maxRed--; clampHearts(p); p.soul += 6; clampHearts(p); },
  ivbag: (p) => { p.iframes = 0; hurtPlayer(1, 'La bolsa de sangre'); dropKind(pick(['coin*2', 'coin*3', 'nickel']), p.x, p.y); },
  slot: (p) => { if (p.coins < 1) return false; p.coins--; if (Math.random() < 0.4 + p.luck * 0.03) dropKind(pick(['coin*3', 'heart', 'bomb', 'key', 'pill', 'soul']), p.x, p.y + 30); },
  nickel: (p) => { if (Math.random() < 0.59) dropKind(pick(['coin', 'coin', 'nickel', 'coin*2']), p.x, p.y); },
  fingers: (p) => { if (p.coins < 1) return false; p.coins--; G.damageAll(p.dmg * 2); },
  goldrazor: (p) => { if (p.coins < 5) return false; p.coins -= 5; roomMod(p, 'dmg', 1.2); },
  jar: (p) => { if (!p.jar) return false; for (let i = 0; i < p.jar; i++) dropKind('heart', p.x, p.y); p.jar = 0; },
  jarflies: (p) => { if (!p.jarFlies) return false; EFX.flies(p, [p.jarFlies]); p.jarFlies = 0; },
  blankcard: (p) => { if (!p.pocket || p.pocket.k !== 'card') return false; runEffects(p, CARDS[p.pocket.v][1].split(','), {}); },
  placebo: (p) => { if (!p.pocket || p.pocket.k !== 'pill') return false; applyPill(p, p.pocket.v); },
  planc: (p) => { for (const e of liveEnemies()) { e.hp = 0; killEnemy(e); if (!e.dead) killEnemy(e); } p.doomT = 3; },
  mamamega: (p) => { EFX.nuke(p, [200]); EFX.breakrocks(); EFX.doors(); Sfx.play('boom'); G.shake = 1; },
  eraser: (p) => { const e = nearestEnemy(p.x, p.y, 999); if (!e || e.boss) return false; e.hp = 0; killEnemy(e); if (!e.dead) killEnemy(e); },
  halfhp: () => { for (const e of liveEnemies()) e.hp *= 0.5; },
  flush: () => { for (const e of liveEnemies(false)) { e.hp = 0; killEnemy(e); if (!e.dead) killEnemy(e); const c = txOf(e.x), r = tyOf(e.y); if (inGrid(c, r) && !G.room.tiles[r * COLS + c]) G.room.tiles[r * COLS + c] = T.POOP; } G.flowT = 0; },
  breakrocks: () => { const t = G.room.tiles; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (t[r * COLS + c] === T.ROCK || t[r * COLS + c] === T.TINTED || t[r * COLS + c] === T.POOP) destroyTile(c, r); },
  tempfam: (p, a) => { addFamiliar(a[0] || 'chubby', true); },
  turret: (p) => { addFamiliar('turret', true, { x: p.x, y: p.y }); },
  wisp: (p) => { if (G.familiars.filter(f => f.name === 'wisp').length < 8) addFamiliar('wisp'); },
  boneorbit: (p, a) => { for (let i = 0; i < +(a[0] || 1); i++) addFamiliar('boneorb', true); },
  monstro: (p) => { const L = liveEnemies(); const e = L.length ? pick(L) : null; const x = e ? e.x : p.x, y = e ? e.y : p.y; G.missiles.push({ x, y, t: 0.9, max: 0.9, dmg: 120, r: 60, kind: 'monstro', hurts: !e }); },
  missile: (p) => { const e = nearestEnemy(p.x, p.y, 999); const x = e ? e.x : p.x + Input.lastDir.x * 100, y = e ? e.y : p.y + Input.lastDir.y * 100; G.missiles.push({ x, y, t: 1.2, max: 1.2, dmg: 100, r: 75, kind: 'missile' }); },
  bobhead: (p) => { const e = nearestEnemy(p.x, p.y, 999); const x = e ? e.x : p.x + Input.lastDir.x * 90, y = e ? e.y : p.y + Input.lastDir.y * 90; explode(x, y, 70, 40, false); for (const en of liveEnemies()) if (Math.hypot(en.x - x, en.y - y) < 80) applyStatus(en, 'poison', 4, 6); },
  decoy: (p) => { G.bombs.push({ x: p.x, y: p.y + 2, r: 12, t: 2.5, free: false, decoy: true, fx: new Set(['big']) }); },
  flame: (p) => { const d = Input.lastDir; G.tears.push(makeTear(p.x, p.y, d.x * 260, d.y * 260, p, 18, { plain: true, flame: true, range: 300, color: '#ff8a2a' })); },
  redflame: (p) => { const d = Input.lastDir; G.tears.push(makeTear(p.x, p.y, d.x * 200, d.y * 200, p, 23, { plain: true, flame: true, range: 360, color: '#ff4a2a' })); },
  boomerang: (p) => { const d = Input.lastDir; const t = makeTear(p.x, p.y, d.x * 380, d.y * 380, p, p.dmg * 2, { plain: true, range: 600, color: '#c8a060' }); t.boomer = true; t.fx.freeze = true; t.fx.pierce = true; t.fx.spectral = true; G.tears.push(t); },
  blackhole: (p) => { const d = Input.lastDir; G.holes.push({ x: p.x + d.x * 80, y: p.y + d.y * 80, t: 4, tick: 0 }); },
  sprinkler: (p) => { addFamiliar('sprinkler', true, { x: p.x, y: p.y }); },
  glasscannon: (p) => { const d = Input.lastDir; const t = makeTear(p.x, p.y, d.x * 420, d.y * 420, p, p.dmg * 10, { range: 700 }); t.fx.pierce = true; t.fx.spectral = true; t.r = 14; G.tears.push(t); if (p.red > 1 && !G.run.god) { p.red = Math.max(1, p.red - 4); } },
  coupon: () => { const L = G.room.pickups.filter(pk => pk.price != null || pk.hprice); if (!L.length) return false; const pk = pick(L); pk.price = null; pk.hprice = null; poofAt(pk.x, pk.y); },
  keeperbox: (p) => { const s = G.freeSpot(p.x + 40, p.y); if (Math.random() < 0.4) G.room.pickups.push(mkPickup('item', s.x, s.y, { item: pickItem('shop'), price: 15, shop: true })); else G.room.pickups.push(mkPickup(pick(['heart', 'bomb', 'key', 'soul']), s.x, s.y, { price: 5, shop: true })); },
  telekinesis: (p) => { for (const t of G.etears) { const a = Math.atan2(t.y - p.y, t.x - p.x); const sp = Math.hypot(t.vx, t.vy); G.tears.push(makeTear(t.x, t.y, Math.cos(a) * sp, Math.sin(a) * sp, p, 5, { plain: true, range: 300 })); t.dead = true; } },
  pushback: (p) => { for (const e of liveEnemies()) { const d = dist(e, p) || 1; if (d < 110) { e.kx += (e.x - p.x) / d * 500; e.ky += (e.y - p.y) / d * 500; } } for (const t of G.etears) if (dist(t, p) < 110) t.dead = true; G.pcreeps.push({ x: p.x, y: p.y, r: 50, t: 1, max: 1, dmg: 0, kind: 'gas' }); },
  lownuke: (p) => { if (p.red + p.soul + p.black <= 2) G.damageAll(40 + p.dmg * 2); },
  lowshield: (p) => { if (p.red + p.soul + p.black <= 2) p.shield = Math.max(p.shield, 6); },
  deadbird: () => addFamiliar('deadbird', true),
  bestbud: () => addFamiliar('foreveralone', true),
  charge: (p) => { if (!p.active) return false; const max = activeMax(p); if (p.active.charge >= max) return false; p.active.charge = Math.min(max * (p.passive.has('battery') ? 2 : 1), p.active.charge + (max >= 99 ? 0 : 1)); },
  trail: (p) => { p.roomTrail = 'red'; },
  athame: (p) => { G.rings.push({ x: p.x, y: p.y, t: 1, r: 60, dmg: p.dmg * 1.5, follow: true }); },
  gust: (p) => { p.gust = Math.min(10, (p.gust || 0) + 1); },
  datamine: (p) => { const ks = ['spdAdd', 'tpsAdd', 'dmgAdd', 'rangeAdd', 'luckAdd']; const up = pick(ks), dn = pick(ks.filter(k => k !== up)); p.mods[up] += up === 'rangeAdd' ? 40 : 0.4; p.mods[dn] -= dn === 'rangeAdd' ? 20 : 0.2; },
  clicker: (p) => { const ch = pick(CHARS.filter(c => c !== p.char)); if (p.items.length) p.items.pop(); p.char = ch; rebuildPlayer(p); G.showBanner(ch.name, '', 1.5); },
  peeler: (p) => { if (p.maxRed < 1) return false; p.maxRed--; clampHearts(p); p.mods.dmgAdd += 0.2; p.mods.rangeAdd += 10; addFamiliar('cube'); },
  metronome: (p) => { const L = ITEM_IDS.filter(k => ITEMS[k].kind === 'p'); const id = pick(L); p.roomItems.push(id); applySpec(p, ITEMS[id].spec, { rebuild: true }); G.showBanner(ITEMS[id].name, 'durante esta sala', 1.6); },
  magicskin: (p) => { if (p.maxRed > 0) { p.maxRed--; clampHearts(p); } else if (p.soul >= 4) p.soul -= 4; else return false; dropItemNear(p, null); },
  craft: (p) => { const L = G.room.pickups.filter(pk => pk.kind !== 'item' && pk.kind !== 'trophy' && pk.price == null); if (L.length < 3) return false; for (const pk of L.slice(0, 8)) pk.gone = true; dropItemNear(p, pick(['treasure', 'shop', 'boss', 'angel', 'devil'])); },
  sumpt: (p) => { if (p.red > 2) { p.red -= 2; addFamiliar('clot', true); } else if (p.soul > 1) { p.soul -= 2; addFamiliar('clot', true); } else return false; },
  flip: (p) => { p.flipped = !p.flipped; const alt = p.char.alt; if (alt) { const keep = p.char; p.char = Object.assign({}, alt, { alt: keep }); rebuildPlayer(p); } },
  fakehurt: (p) => { fireEvent('hurt', {}); },
  saturn: (p) => { for (let i = 0; i < 7; i++) { const t = makeTear(p.x, p.y, 0, 0, p, p.dmg, { range: 9999 }); t.orbit = { a: i * TAU / 7, r: 40, life: 7 }; t.life = t.max = 7; G.tears.push(t); } },
  scream: (p) => { for (const e of liveEnemies()) { const d = dist(e, p) || 1; if (d < 110) { damageEnemy(e, 15 + p.dmg * 2, { vx: e.x - p.x, vy: e.y - p.y }); e.kx += (e.x - p.x) / d * 400; e.ky += (e.y - p.y) / d * 400; } } G.rings.push({ x: p.x, y: p.y, t: 0.4, r: 110, dmg: 0, follow: true }); },
  orbit: () => addFamiliar('leprosy', false),
  randomact: (p) => { const L = ITEM_IDS.filter(k => ITEMS[k].kind === 'a' && ITEMS[k].spec.use && !ITEMS[k].spec.use.includes('randomact')); const id = pick(L); G.showBanner(ITEMS[id].name, '', 1.2); runEffects(p, ITEMS[id].spec.use, {}); },
  dupfam: () => { const L = G.familiars.filter(f => !f.temp); if (!L.length) { addFamiliar('bobby', true); return; } for (const f of L) addFamiliar(f.name, true); },
  detonate: () => { if (!G.bombs.length) return false; for (const b of G.bombs) b.t = 0; },
  detonatetears: (p) => { const L = G.tears.filter(t => !t.dead && !t.ludo); if (!L.length) return false; for (const t of L) { t.dead = true; tearRing(t.x, t.y, 6, p, 0.6); } },
  movingbox: (p) => { if (p.box && p.box.length) { for (const k of p.box) dropKind(k, p.x, p.y); p.box = []; return; } const L = G.room.pickups.filter(pk => pk.kind !== 'item' && pk.kind !== 'trophy' && pk.price == null); if (!L.length) return false; p.box = L.map(pk => pk.kind); for (const pk of L) pk.gone = true; },
  altar: (p) => { const L = G.familiars.filter(f => !f.temp).slice(0, 2); if (!L.length) return false; for (const f of L) { G.familiars.splice(G.familiars.indexOf(f), 1); dropItemNear(p, 'devil'); } },
  throwrock: (p) => { const t = G.room.tiles; let best = null, bd = 99; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (t[r * COLS + c] === T.ROCK || t[r * COLS + c] === T.POOP) { const d = Math.hypot(tcx(c) - p.x, tcy(r) - p.y); if (d < bd) { bd = d; best = [c, r]; } } if (!best || bd > 90) return false; destroyTile(best[0], best[1]); const d = Input.lastDir; const tr = makeTear(p.x, p.y, d.x * 380, d.y * 380, p, p.dmg * 3 + 10, { plain: true, range: 400, color: '#8a7a6a' }); tr.r = 12; G.tears.push(tr); },
  fortune: (p) => { dropKind(pick(['soul', 'card', 'random', 'coin*2']), p.x, p.y); G.showBanner(pick(['Te espera algo bueno', 'Cuidado con la próxima sala', 'Sigue llorando', 'La suerte sonríe al valiente']), '', 2); },
  pandora: (p) => { const f = G.floorIdx; if (f < 2) { dropKind('coin*2', p.x, p.y); dropKind('soul*2', p.x, p.y); } else if (f < 4) { dropKind('bomb2*2', p.x, p.y); dropKind('soul*2', p.x, p.y); } else dropItemNear(p, pick(['boss', 'treasure'])); },
};

function poofAt(x, y) { G.effects.push({ type: 'poof', x, y, t: 0, max: 0.5, r: 18 }); }

function dropKind(spec, x, y) {
  let [k, n] = spec.split('*'); n = +(n || 1);
  for (let i = 0; i < n; i++) {
    let kind = k === 'random' ? randomBasicKind() : k;
    if (kind === 'eternal') kind = 'soul';
    if (kind === 'item') { dropItemNear(G.player, null); continue; }
    spawnPickup(kind, x, y);
  }
}

function tearRing(x, y, n, p, mult) {
  for (let i = 0; i < n; i++) {
    const a = i * TAU / n;
    G.tears.push(makeTear(x, y, Math.cos(a) * 300 * p.shot, Math.sin(a) * 300 * p.shot, p, p.dmg * mult, {}));
  }
  Sfx.play('tear');
}

function activeMax(p) {
  const it = ITEMS[p.active.id];
  if (!it || !it.charge) return 0;
  return p.passive.has('volt9') ? Math.max(1, it.charge - 1) : it.charge;
}

// ---------- Cartas del tarot ----------
const CARDS = [
  ['0 - El Loco', 'tele:start'], ['I - El Mago', 'rhoming'], ['II - La Sacerdotisa', 'monstro'], ['III - La Emperatriz', 'rdmg:1.5,rspd:0.3'],
  ['IV - El Emperador', 'tele:boss'], ['V - El Hierofante', 'drop:soul*2'], ['VI - Los Enamorados', 'drop:heart*2'], ['VII - El Carro', 'unicorn:6'],
  ['VIII - La Justicia', 'drop:coin,drop:bomb,drop:key,drop:heart'], ['IX - El Ermitaño', 'tele:shop'], ['X - La Rueda de la Fortuna', 'drop:coin*4'],
  ['XI - La Fuerza', 'rdmg:1,rspd:0.3'], ['XII - El Colgado', 'rflight'], ['XIII - La Muerte', 'nuke:40'], ['XIV - La Templanza', 'drop:pill,drop:coin*2'],
  ['XV - El Diablo', 'rdmg:2'], ['XVI - La Torre', 'troll:6'], ['XVII - La Estrella', 'tele:treasure'], ['XVIII - La Luna', 'tele:secret'],
  ['XIX - El Sol', 'heal,map,nuke:100'], ['XX - El Juicio', 'drop:random*2'], ['XXI - El Mundo', 'map'],
];

function applyPill(p, col) {
  let idx = G.run.pillMap[col];
  let eff = PILL_EFFECTS[idx];
  const bad = PILL_BAD.has(idx);
  if (bad && (p.passive.has('phd') || p.passive.has('virgo'))) { eff = PILL_EFFECTS[PILL_GOOD_OF[idx] != null ? PILL_GOOD_OF[idx] : 0]; }
  if (!bad && p.passive.has('falsephd') && PILL_BAD_OF[idx] != null) { eff = PILL_EFFECTS[PILL_BAD_OF[idx]]; p.mods.dmgAdd += 0.6; }
  G.run.pillKnown[col] = true;
  eff.fn(p);
  clampHearts(p); recalc(p);
  G.showBanner(eff.name, '', 2);
  Sfx.play('pill');
}
