'use strict';
/* =========================================================
   Plantillas de sala hechas a mano (13 columnas x 7 filas)
   Símbolos: . vacío  R roca  P mierda  O foso  S pinchos
             F fuego  M metal  X roca marcada  T barril explosivo
   Las casillas junto a las puertas se despejan al usarlas, y la
   plantilla se descarta si alguna puerta queda aislada.
   ========================================================= */
const ROOM_SYM = { '.': T.EMPTY, R: T.ROCK, P: T.POOP, O: T.PIT, S: T.SPIKE, F: T.FIRE, M: T.METAL, X: T.TINTED, T: T.TNT };
// Probabilidad de que una sala normal use una plantilla en vez del generador por estilos
const ROOM_TEMPLATE_CHANCE = 0.6;

// id, peso, piso mínimo, piso máximo (0 = Sótano I ... 7 = Útero II), filas
function tpl(id, w, min, max, rows) { return { id, w, min, max, rows }; }

const ROOM_TEMPLATES = [
  tpl('islas', 3, 0, 7, [
    '.............',
    '.RR.......RR.',
    '.RR.......RR.',
    '.............',
    '.RR.......RR.',
    '.RR.......RR.',
    '.............']),
  tpl('pasillos', 2, 0, 7, [
    '.............',
    '.RRRRR.RRRRR.',
    '.............',
    '.............',
    '.............',
    '.RRRRR.RRRRR.',
    '.............']),
  tpl('damero', 2, 0, 7, [
    '.............',
    '..R.R.R.R.R..',
    '.............',
    '..R.R.R.R.R..',
    '.............',
    '..R.R.R.R.R..',
    '.............']),
  tpl('foso-central', 2, 1, 7, [
    '.............',
    '.............',
    '...OOOOOOO...',
    '...OOOOOOO...',
    '...OOOOOOO...',
    '.............',
    '.............']),
  tpl('puente', 2, 1, 7, [
    '.............',
    '.............',
    '...OOO.OOO...',
    '...OOO.OOO...',
    '...OOO.OOO...',
    '.............',
    '.............']),
  tpl('cuatro-pilares', 3, 0, 7, [
    '.............',
    '.............',
    '..RR.....RR..',
    '.............',
    '..RR.....RR..',
    '.............',
    '.............']),
  tpl('arco', 2, 0, 7, [
    '.............',
    '.RRRRRRRRRRR.',
    '.R.........R.',
    '.R.........R.',
    '.R.........R.',
    '.............',
    '.............']),
  tpl('pinchos-pares', 2, 1, 7, [
    '.............',
    '..SSS...SSS..',
    '.............',
    '.............',
    '.............',
    '..SSS...SSS..',
    '.............']),
  tpl('campo-de-fuego', 2, 1, 7, [
    '.............',
    '.F.........F.',
    '.............',
    '.....F.F.....',
    '.............',
    '.F.........F.',
    '.............']),
  tpl('esquinas-sucias', 2, 0, 7, [
    '.............',
    '.PP.......PP.',
    '.P.........P.',
    '.............',
    '.P.........P.',
    '.PP.......PP.',
    '.............']),
  tpl('muros-verticales', 2, 0, 7, [
    '...R.....R...',
    '...R.....R...',
    '...R.....R...',
    '.............',
    '...R.....R...',
    '...R.....R...',
    '...R.....R...']),
  tpl('columnas', 3, 0, 7, [
    '.............',
    '..R..R.R..R..',
    '.............',
    '.............',
    '.............',
    '..R..R.R..R..',
    '.............']),
  tpl('diamante', 2, 0, 7, [
    '.............',
    '.....R.R.....',
    '....R...R....',
    '...R..R..R...',
    '....R...R....',
    '.....R.R.....',
    '.............']),
  tpl('barriles', 1, 1, 7, [
    '.............',
    '.RRR.....RRR.',
    '.R.T.....T.R.',
    '.............',
    '.R.T.....T.R.',
    '.RRR.....RRR.',
    '.............']),
  tpl('metal', 1, 1, 7, [
    '.............',
    '.............',
    '...M.....M...',
    '.............',
    '...M.....M...',
    '.............',
    '.............']),
  tpl('roca-y-mierda', 2, 0, 7, [
    '.............',
    '.R.P.....P.R.',
    '.............',
    '..P.......P..',
    '.............',
    '.R.P.....P.R.',
    '.............']),
  tpl('rejilla', 2, 0, 7, [
    '.............',
    '.R.R.....R.R.',
    '.............',
    '.............',
    '.............',
    '.R.R.....R.R.',
    '.............']),
  tpl('anillo-de-fosos', 2, 1, 7, [
    '.............',
    '.OOOOOOOOOOO.',
    '.O.........O.',
    '.O....R....O.',
    '.O.........O.',
    '.OOOOOOOOOOO.',
    '.............']),
  tpl('laberinto-corto', 2, 2, 7, [
    '.............',
    '.RRRRRR.RRRR.',
    '.......R.....',
    '.RRRR.RR.RRR.',
    '.....R.......',
    '.RRRRR.RRRRR.',
    '.............']),
  tpl('esquinas-con-foso', 2, 1, 7, [
    'OO.........OO',
    'O...........O',
    '.............',
    '.............',
    '.............',
    'O...........O',
    'OO.........OO']),
  tpl('pasillo-de-pinchos', 1, 1, 7, [
    '.............',
    '.............',
    '.SSSSSSSSSSS.',
    '.............',
    '.SSSSSSSSSSS.',
    '.............',
    '.............']),
  tpl('arena', 3, 0, 7, [
    '.............',
    '.............',
    '.............',
    '.....RRR.....',
    '.............',
    '.............',
    '.............']),
  tpl('vallas', 2, 0, 7, [
    '.............',
    '..RRRR.RRRR..',
    '.............',
    '.............',
    '.............',
    '..RRRR.RRRR..',
    '.............']),
  tpl('mierda-y-fuego', 1, 1, 7, [
    '.............',
    '.F.P.....P.F.',
    '.............',
    '.............',
    '.............',
    '.F.P.....P.F.',
    '.............']),
  tpl('aspas', 2, 0, 7, [
    'R...........R',
    '.R.........R.',
    '..R.......R..',
    '.............',
    '..R.......R..',
    '.R.........R.',
    'R...........R']),
  tpl('corredor-doble', 2, 0, 7, [
    '.............',
    'RRRRRR.RRRRRR',
    '.............',
    '.............',
    '.............',
    'RRRRRR.RRRRRR',
    '.............']),
  tpl('altar-con-foso', 1, 1, 7, [
    '.............',
    '.............',
    '....R...R....',
    '...R.OOO.R...',
    '....R...R....',
    '.............',
    '.............']),
  tpl('piedras-marcadas', 1, 0, 7, [
    '.............',
    '.............',
    '.....RRR.....',
    '....RXXXR....',
    '.....RRR.....',
    '.............',
    '.............']),
  tpl('doble-fila-de-fuegos', 1, 2, 7, [
    '.............',
    '.............',
    '.F.F.F.F.F.F.',
    '.............',
    '.F.F.F.F.F.F.',
    '.............',
    '.............']),
  tpl('zigzag', 2, 0, 7, [
    '.............',
    '.RRRR........',
    '.............',
    '........RRRR.',
    '.............',
    '.RRRR........',
    '.............']),
  tpl('pozos', 2, 1, 7, [
    '.............',
    '..O.......O..',
    '.............',
    '...O.....O...',
    '.............',
    '..O.......O..',
    '.............']),
  tpl('mierda-dispersa', 2, 0, 7, [
    '.............',
    '.P..P...P..P.',
    '.............',
    '...P.....P...',
    '.............',
    '.P..P...P..P.',
    '.............']),
  tpl('bloque-en-u', 2, 0, 7, [
    '.............',
    '.............',
    '...RRRRRRR...',
    '...R.....R...',
    '.............',
    '.............',
    '.............']),
];

// Convierte filas de símbolos en casillas (con volteo), despeja las puertas y devuelve null si alguna queda aislada
function rowsToTiles(rows, flipH, flipV) {
  const tiles = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) tiles[r * COLS + c] = ROOM_SYM[rows[flipV ? ROWS - 1 - r : r][flipH ? COLS - 1 - c : c]];
  }
  clearDoors(tiles);
  return connectedDoors(tiles) ? tiles : null;
}

// Salas de jefe: una o dos variantes por jefe. Dejan libre la zona donde aparece el jefe
// (ver BOSS_CLEAR en tools/check-rooms.mjs). Un jefe sin entrada usa el generador anterior.
// El Gusano Gemelo no tiene obstáculos: se mueve en línea recta y podría quedar atascado.
const BOSS_ROOMS = {
  gloton: [
    ['.............', '.RR.......RR.', '.R.........R.', '.............', '.R.........R.', '.RR.......RR.', '.............'],
    ['.............', '.P.........P.', '.............', '..P.......P..', '.............', '.P.........P.', '.............'],
  ],
  zumbido: [
    ['.............', '.............', '..OO.....OO..', '.............', '..OO.....OO..', '.............', '.............'],
    ['.............', '...R.....R...', '.............', '.............', '.............', '...R.....R...', '.............'],
  ],
  babosa: [
    ['.............', '.PP.......PP.', '.P.........P.', '.............', '.P.........P.', '.PP.......PP.', '.............'],
    ['.............', '...P.....P...', '.............', '.............', '.............', '...P.....P...', '.............'],
  ],
  coloso: [
    ['.............', '.RR.......RR.', '.............', '.............', '.............', '.RR.......RR.', '.............'],
    ['.............', '.............', '..R.......R..', '.............', '..R.......R..', '.............', '.............'],
  ],
  coagulo: [
    ['.............', '.............', '..RR.....RR..', '.............', '..RR.....RR..', '.............', '.............'],
    ['.............', '.P.........P.', '.............', '.............', '.............', '.P.........P.', '.............'],
  ],
  placenta: [
    ['.............', 'OO.........OO', '.............', '.............', '.............', 'OO.........OO', '.............'],
    ['.............', '..P.......P..', '.............', '.............', '.............', '..P.......P..', '.............'],
  ],
  carcelero: [
    ['.............', '..RR.....RR..', '.............', '.............', '.............', '..RR.....RR..', '.............'],
    ['.............', '.............', '.............', '.............', '.............', '.............', '.............'],
  ],
  pira: [
    ['.............', '.O.........O.', '.............', '.............', '.............', '.O.........O.', '.............'],
    ['.............', '..M.......M..', '.............', '.............', '.............', '..M.......M..', '.............'],
  ],
  rey: [
    ['.............', '.M.........M.', '.............', '.............', '.............', '.M.........M.', '.............'],
    ['.............', '.T.........T.', '.............', '.............', '.............', '.T.........T.', '.............'],
  ],
  gtopo: [
    ['.............', '..R.......R..', '.............', '.............', '.............', '..R.......R..', '.............'],
    ['RR.........RR', '.............', '.............', '.............', '.............', '.............', 'RR.........RR'],
  ],
  gusano: [
    ['.............', '.............', '.............', '.............', '.............', '.............', '.............'],
  ],
  masa: [
    ['.............', '.............', '..R.......R..', '.............', '..R.......R..', '.............', '.............'],
    ['.............', '.RRR.....RRR.', '.............', '.............', '.............', '.RRR.....RRR.', '.............'],
  ],
  llorona: [
    ['.............', '.............', '...P.....P...', '.............', '...P.....P...', '.............', '.............'],
    ['.............', '.R.........R.', '.............', '.............', '.............', '.R.........R.', '.............'],
  ],
  mama: [
    ['.............', '.............', '.............', '.............', '.............', '.............', '.............'],
  ],
  corazon: [
    ['RR.........RR', 'R...........R', '.............', '.............', '.............', 'R...........R', 'RR.........RR'],
  ],
};

function bossRoomTiles(id, rng) {
  const list = BOSS_ROOMS[id];
  return list ? rowsToTiles(pick(list, rng), rng() < 0.5, rng() < 0.5) : null;
}

// Salas especiales (sacrificio, biblioteca, reto y minijefe). Los objetos de la biblioteca van en la fila 2
// (columnas 3, 5, 7 y 9) y el minijefe nace en la casilla 6,3: esas casillas deben quedar libres.
const SPECIAL_ROOMS = {
  sacrifice: [
    ['.............', '.............', '.....SSS.....', '.....SSS.....', '.....SSS.....', '.............', '.............'],
  ],
  library: [
    ['.............', '.RR.......RR.', '.............', '.............', '.............', '.RR.......RR.', '.............'],
  ],
  challenge: [
    ['.............', '.............', '..R.......R..', '.............', '..R.......R..', '.............', '.............'],
  ],
  miniboss: [
    ['.............', '.RR.......RR.', '.............', '.............', '.............', '.RR.......RR.', '.............'],
  ],
};
const ROOM_LABELS = { library: 'BIBLIOTECA', sacrifice: 'SACRIFICIO', challenge: 'RETO', miniboss: 'MINIJEFE' };

function specialRoomTiles(type, rng) {
  return rowsToTiles(pick(SPECIAL_ROOMS[type], rng), rng() < 0.5, rng() < 0.5) || new Uint8Array(COLS * ROWS);
}

// Enemigos colocados a mano: id de plantilla -> [tipo, columna, fila]. El tipo es una clave de EN
// (data.js) o 'pool' para elegir uno de los enemigos del tema del piso. Deben estar sobre casillas
// vacías (los voladores también valen sobre fosos) y a 3 o más casillas de las puertas.
// Una plantilla sin entrada aquí reparte enemigos al azar según el presupuesto del piso.
const ROOM_SPAWNS = {
  islas: [['pool', 4, 1], ['pool', 8, 1], ['pool', 4, 5], ['pool', 8, 5]],
  pasillos: [['charger', 3, 3], ['charger', 9, 3]],
  'cuatro-pilares': [['pool', 4, 3], ['pool', 6, 3], ['pool', 8, 3]],
  arena: [['pool', 3, 2], ['pool', 9, 2], ['pool', 3, 4], ['pool', 9, 4]],
  columnas: [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  damero: [['pool', 3, 3], ['pool', 5, 3], ['pool', 7, 3], ['pool', 9, 3]],
  rejilla: [['pool', 4, 3], ['pool', 6, 3], ['pool', 8, 3]],
  'foso-central': [['afly', 4, 3], ['afly', 6, 3], ['afly', 8, 3], ['pool', 10, 5]],
  puente: [['pool', 2, 1], ['pool', 10, 1], ['pool', 2, 5], ['pool', 10, 5], ['afly', 4, 3], ['afly', 8, 3]],
  'anillo-de-fosos': [['pool', 4, 3], ['pool', 8, 3], ['pool', 3, 2], ['pool', 9, 4]],
  'esquinas-con-foso': [['pool', 4, 2], ['pool', 8, 2], ['pool', 4, 4], ['pool', 8, 4]],
  'campo-de-fuego': [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  'altar-con-foso': [['afly', 6, 3], ['pool', 2, 2], ['pool', 10, 4]],
  'bloque-en-u': [['pool', 5, 3], ['pool', 7, 3], ['pool', 4, 5], ['pool', 8, 5]],
  aspas: [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  zigzag: [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 1], ['pool', 9, 5]],
  vallas: [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  'corredor-doble': [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  'muros-verticales': [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  barriles: [['pool', 4, 3], ['pool', 8, 3]],
  'pinchos-pares': [['pool', 3, 3], ['pool', 6, 3], ['pool', 9, 3]],
  'pasillo-de-pinchos': [['pool', 3, 3], ['pool', 9, 3]],
};

// Devuelve { tiles, spawns } de la plantilla, volteada al azar; null si no sirve para esta sala.
// spawns queda vacío si la plantilla no fija enemigos.
function templateRoom(t, rng) {
  const flipH = rng() < 0.5, flipV = rng() < 0.5;
  const tiles = rowsToTiles(t.rows, flipH, flipV);
  if (!tiles) return null;
  const spawns = (ROOM_SPAWNS[t.id] || []).map(([type, c, r]) => ({ type, c: flipH ? COLS - 1 - c : c, r: flipV ? ROWS - 1 - r : r }));
  return { tiles, spawns };
}

// Multiplicador de peso de cada plantilla según el tema del piso (las que no aparecen valen 1)
const THEME_TEMPLATE_BIAS = {
  basement: { 'mierda-dispersa': 3, 'esquinas-sucias': 2.5, 'roca-y-mierda': 2.5 },
  caves: { 'foso-central': 2, puente: 2, 'anillo-de-fosos': 2, 'esquinas-con-foso': 2, 'laberinto-corto': 1.5, barriles: 2 },
  depths: { 'campo-de-fuego': 3, 'doble-fila-de-fuegos': 3, 'pasillo-de-pinchos': 3, 'pinchos-pares': 3, metal: 3, barriles: 2, 'laberinto-corto': 2 },
  womb: { 'mierda-y-fuego': 3, 'campo-de-fuego': 2, 'anillo-de-fosos': 2, 'altar-con-foso': 2.5, 'mierda-dispersa': 2, pozos: 2.5 },
};

function pickRoomTemplate(fi, rng) {
  const bias = THEME_TEMPLATE_BIAS[FLOORS[fi].theme] || {};
  const list = ROOM_TEMPLATES.filter(t => fi >= t.min && fi <= t.max).map(t => [t, t.w * (bias[t.id] || 1)]);
  return list.length ? weighted(list, rng) : null;
}
