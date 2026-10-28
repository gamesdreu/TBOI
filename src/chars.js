'use strict';
/* =========================================================
   Personajes (estadísticas de la wiki de Fandom)
   hp: r rojo · e contenedor vacío · a alma · n negro · h hueso · m moneda (Keeper)
   tps: modificador de lágrimas/s · tpsAbs: valor fijo · rng: alcance en casillas
   ========================================================= */
const CHARS = [
  { id: 'isaac', name: 'Isaac', hp: 'rrr', bombs: 1, active: '105', desc: 'Empieza con El D6.', look: { skin: '#f0d2c2' } },
  { id: 'magdalena', name: 'Magdalena', hp: 'rrrr', spd: 0.85, active: '45', desc: 'Más vida, más lenta. Delicioso Corazón.', look: { skin: '#f2d6c8', hair: { c: '#e2b84e', s: 'long' } } },
  { id: 'cain', name: 'Cain', hp: 'rr', dmgMult: 1.2, rng: 4.5, spd: 1.3, keys: 1, items: ['46'], desc: 'Rápido y con suerte, poco alcance.', look: { skin: '#ecc9b6', hair: { c: '#5a3a1a', s: 'short' }, patch: true } },
  { id: 'judas', name: 'Judas', hp: 'r', dmgMult: 1.35, coins: 3, active: '34', desc: 'Mucho daño, un solo corazón. Libro de Belial.', look: { skin: '#efd0be', fez: true } },
  { id: 'bluebaby', name: '???', hp: 'aaa', dmgMult: 1.05, spd: 1.1, active: '36', noRed: true, desc: 'Solo corazones de alma. La Popó.', look: { skin: '#9cc6ee', line: '#2a3a5a' } },
  { id: 'eve', name: 'Eve', hp: 'rr', dmgMult: 0.75, spd: 1.23, items: ['122', '117'], active: '126', eve: true, desc: 'Más fuerte con poca vida.', look: { skin: '#f2d6c8', hair: { c: '#1e1414', s: 'long' } } },
  { id: 'samson', name: 'Samson', hp: 'rrr', tps: -0.05, sht: 1.31, rng: 5, spd: 1.1, items: ['157'], desc: 'Se enfurece al recibir golpes.', look: { skin: '#eccab6', hair: { c: '#7a4a20', s: 'long' } } },
  { id: 'azazel', name: 'Azazel', hp: 'nnn', dmgMult: 1.5, tps: 0.5, rng: 4.5, spd: 1.25, flight: true, mode: 'brim', brimShort: true, card: 0, desc: 'Vuela y lanza azufre de corto alcance.', look: { skin: '#3c3036', line: '#120808', horns: true, wings: 'bat' } },
  { id: 'lazarus', name: 'Lazarus', hp: 'rrr', rng: 4.5, lck: -1, pill: true, items: ['214'], reviveAs: 'lazrisen', desc: 'Resucita una vez como Lazarus Risen.', look: { skin: '#e6dcc8', hair: { c: '#4a3020', s: 'short' } } },
  { id: 'eden', name: 'Eden', hp: 'rrr', random: true, desc: 'Estadísticas y objetos al azar.', look: { skin: '#efd0be', hair: { c: 'random', s: 'spiky' } } },
  { id: 'lost', name: 'The Lost', hp: '', coins: 1, flight: true, spectral: true, mantle: true, active: '609', lost: true, desc: 'Sin vida: muere de un golpe. Vuela y tiene manto.', look: { skin: '#f6f6f6', ghost: true } },
  { id: 'lilith', name: 'Lilith', hp: 'rnn', items: ['360', '412'], active: '357', blind: true, desc: 'No puede disparar: su Íncubo lo hace por ella.', look: { skin: '#e8d0c4', hair: { c: '#141010', s: 'long' }, blindfold: true } },
  { id: 'keeper', name: 'Keeper', hp: 'mmm', dmgMult: 1.2, tpsMult: 0.6, spd: 0.85, lck: -2, bombs: 1, coins: 1, x3: true, active: '349', keeper: true, desc: 'Corazones de moneda: las monedas le curan.', look: { skin: '#b8c890', rope: true } },
  { id: 'apollyon', name: 'Apollyon', hp: 'rr', active: '477', desc: 'Vacío: absorbe los objetos.', look: { skin: '#a8a8b4', hood: true } },
  { id: 'forgotten', name: 'The Forgotten', hp: 'hha', dmgMult: 1.5, tpsMult: 0.5, mode: 'club', desc: 'Ataca cuerpo a cuerpo con su garrote de hueso.', look: { skin: '#ece4d2', skull: true } },
  { id: 'bethany', name: 'Bethany', hp: 'rrr', active: '584', desc: 'Libro de virtudes: invoca llamas aliadas.', look: { skin: '#f2d6c8', hair: { c: '#c8702a', s: 'braid' } } },
  { id: 'jacob', name: 'Jacob y Esau', hp: 'rrr', dmgBase: 2.75, tpsAbs: 3, sht: 1.15, rng: 5, lck: 1, esau: true, desc: 'Esau te acompaña y dispara contigo.', look: { skin: '#f0d2c2', hair: { c: '#6a4424', s: 'short' } } },
  // ---- Variantes (Tainted), con sus mecánicas simplificadas ----
  { id: 't_isaac', name: 'Tainted Isaac', tainted: true, hp: 'rrr', bombs: 1, cycle2: true, desc: 'Los objetos alternan entre dos opciones.', look: { skin: '#d8b8a8' } },
  { id: 't_magdalena', name: 'Tainted Magdalena', tainted: true, hp: 'rree', active: '45', contact: 20, desc: 'Golpea al tocar enemigos.', look: { skin: '#e8c4b4', hair: { c: '#c89a3e', s: 'long' } } },
  { id: 't_cain', name: 'Tainted Cain', tainted: true, hp: 'rr', dmgMult: 1.2, spd: 1.3, keys: 1, active: '710', desc: 'Fabrica objetos con recursos.', look: { skin: '#dcb8a4', hair: { c: '#3a2a1a', s: 'short' }, patch: true } },
  { id: 't_judas', name: 'Tainted Judas', tainted: true, hp: 'nn', rng: 4.5, spd: 1.23, coins: 3, active: '705', desc: 'Artes oscuras: atraviesa y castiga.', look: { skin: '#3a3036', line: '#0a0606', fez: true } },
  { id: 't_bluebaby', name: 'Tainted ???', tainted: true, hp: 'aaa', tpsAbs: 2.04, spd: 0.9, bombs: 3, noRed: true, desc: 'Solo alma, lágrimas más lentas.', look: { skin: '#7aa6d0', line: '#1a2a4a' } },
  { id: 't_eve', name: 'Tainted Eve', tainted: true, hp: 'rr', dmgMult: 1.2, tpsAbs: 1.2, keys: 1, active: '713', desc: 'Sumptorium: convierte vida en coágulos aliados.', look: { skin: '#e2c4b6', hair: { c: '#0e0808', s: 'long' } } },
  { id: 't_samson', name: 'Tainted Samson', tainted: true, hp: 'rrr', tpsAbs: 2.5, rng: 5, active: '704', desc: 'Berserk: furia temporal.', look: { skin: '#dcb8a4', hair: { c: '#5a3416', s: 'long' } } },
  { id: 't_azazel', name: 'Tainted Azazel', tainted: true, hp: 'nnn', dmgMult: 1.5, tpsAbs: 1.6, spd: 1.25, flight: true, mode: 'brim', brimShort: true, desc: 'Azufre delgado y vuelo.', look: { skin: '#2a2026', line: '#000000', horns: true, wings: 'bat' } },
  { id: 't_lazarus', name: 'Tainted Lazarus', tainted: true, hp: 'rrr', rng: 4.5, active: '711', desc: 'Cambio: alterna entre dos formas.', look: { skin: '#d6cab4', hair: { c: '#3a2416', s: 'short' } },
    alt: { id: 't_lazarus2', name: 'Dead Tainted Lazarus', tainted: true, hp: 'aa', dmgMult: 1.5, tpsAbs: 2.5, spd: 0.9, lck: -2, look: { skin: '#9fb0a0', hair: { c: '#2a2a2a', s: 'short' } } } },
  { id: 't_eden', name: 'Tainted Eden', tainted: true, hp: 'rrr', random: true, rerollOnHurt: true, desc: 'Cambia de objetos cada vez que recibe daño.', look: { skin: '#dcc0b0', hair: { c: 'random', s: 'spiky' } } },
  { id: 't_lost', name: 'Tainted Lost', tainted: true, hp: '', dmgMult: 1.3, coins: 1, flight: true, spectral: true, lost: true, desc: 'Sin vida y sin manto: un golpe y mueres.', look: { skin: '#e8e8e8', ghost: true } },
  { id: 't_lilith', name: 'Tainted Lilith', tainted: true, hp: 'rnn', spd: 0.85, items: ['678'], desc: 'Cesárea: dispara fetos que persiguen.', look: { skin: '#d8c0b4', hair: { c: '#0a0808', s: 'long' }, blindfold: true } },
  { id: 't_keeper', name: 'Tainted Keeper', tainted: true, hp: 'mm', tpsAbs: 0.99, lck: -2, bombs: 1, x4: true, keeper: true, coinKills: true, desc: 'Disparo cuádruple; los enemigos sueltan monedas.', look: { skin: '#a0b478', rope: true } },
  { id: 't_apollyon', name: 'Tainted Apollyon', tainted: true, hp: 'rr', tpsAbs: 1.82, active: '706', desc: 'Abismo: convierte objetos en langostas.', look: { skin: '#8a8a98', hood: true } },
  { id: 't_forgotten', name: 'Tainted Forgotten', tainted: true, hp: 'aaa', dmgMult: 1.5, tpsAbs: 1.36, mode: 'club', desc: 'Garrote y solo corazones de alma.', look: { skin: '#d8d0bc', skull: true } },
  { id: 't_bethany', name: 'Tainted Bethany', tainted: true, hp: 'aaa', active: '712', desc: 'Lemegeton: invoca espíritus de objetos.', look: { skin: '#e2c4b6', hair: { c: '#6a3a6a', s: 'braid' } } },
  { id: 't_jacob', name: 'Tainted Jacob', tainted: true, hp: 'rrr', dmgBase: 2.75, tpsAbs: 3, active: '722', desc: 'Anima Sola: encadena enemigos.', look: { skin: '#dcc0b0', hair: { c: '#4a2c14', s: 'short' } } },
];

// Formas especiales a las que se llega resucitando
const SPECIAL_CHARS = {
  bluebaby: CHARS[4],
  darkjudas: { id: 'darkjudas', name: 'Dark Judas', hp: 'nn', dmgMult: 2, spd: 1.1, look: { skin: '#3a3036', line: '#0a0606', fez: true } },
  lazrisen: { id: 'lazrisen', name: 'Lazarus Risen', hp: 'r', dmgMult: 1.2, spd: 1.25, items: ['214'], look: { skin: '#e6dcc8', hair: { c: '#4a3020', s: 'short' }, bandage: true } },
};
