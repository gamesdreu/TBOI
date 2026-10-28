# Jefes, mini-jefes y recompensas

Resumen de todos los jefes del juego: dónde salen, su fase 2 y lo que sueltan al caer. Los números están en `BOSSES`,
`FLOORS` y `BOSS_DROPS` (`src/data.js`); el comportamiento, en `BEHAV` (`src/enemies.js`).

## Dónde sale cada jefe

| Piso | Jefes posibles |
| --- | --- |
| 1 Sótano I · 2 Sótano II | Glotón, Señor Zumbido, Gusano Gemelo, Reina Babosa, Gran Topo |
| 3 Cuevas I | La Masa, La Llorona, Gusano Gemelo, Glotón, Coloso de Piedra, Rey Minero |
| 4 Cuevas II | La Masa, La Llorona, Señor Zumbido, Glotón, Coloso de Piedra, Rey Minero |
| 5 Profundidades I | La Masa, La Llorona, Glotón, Gusano Gemelo, Carcelero, Pira Viviente |
| 6 Profundidades II | Mamá (siempre) |
| 7 Útero I | La Masa, La Llorona, Señor Zumbido, Gusano Gemelo, Coágulo Mayor, Placenta |
| 8 Útero II | El Corazón (siempre) |

La vida de un jefe se multiplica por `1 + piso × 0,22` (por 1 en Mamá y El Corazón). En una partida no se repite un jefe
mientras queden otros sin salir de la lista de ese piso.

## Fase 2

Todos los jefes y mini-jefes entran en fase 2 al bajar del **50 % de vida** (`startPhase2`, `src/entities.js`): grito con un
anillo de 12 lágrimas rojas, sacudida de pantalla, aviso «¡Se enfurece!», **1 s de protección** y un aura roja. Además cada uno
cambia su comportamiento:

| Jefe | Vida base | Qué cambia en fase 2 |
| --- | --- | --- |
| Glotón | 250 | descansa un 40 % menos; saltos de 150 px; escupe 20 lágrimas (13); la caída suelta 14 (10) y deja 3 charcos ácidos |
| Señor Zumbido | 160 | un 40 % más rápido; 4 moscas en órbita (3); abanico de 5 lágrimas cada 2,4–3,2 s |
| Gusano Gemelo | 170 | 150 de velocidad (115); la cola dispara en 8 direcciones cada 1,2–2 s (4 cada 2,5–4 s) |
| La Masa | 420 | abanico de 7 (5); 3 escupemoscas (2); anillo de 14 (10); ataca más a menudo |
| La Llorona | 340 | anillo de 12 (8); abanico de 5 (3); camina a 60 (45); charco cada 0,3 s (0,45 s) |
| Mamá | 640 | descansa menos; la pisada suelta un anillo de 8 lágrimas |
| El Corazón | 1100 | espiral de 3 brazos (2), anillo de 16 (12), late más rápido y ataca el doble de seguido |
| Reina Babosa | 210 | pare 2 baboso; abanicos de 7 (5); camina a 54 (38) |
| Gran Topo | 190 | 135 de velocidad bajo tierra (105); avisa 0,75 s (1 s); anillo de 12 (8); abanico de 5 (3) |
| Coloso de Piedra | 300 | camina a 42 (30); 5 peñascos (3); anillo del pisotón de 14 (10) |
| Rey Minero | 260 | siembra 3 minas (2); embiste a 330 (280); descansa menos |
| Carcelero | 320 | segunda bola de cadena; camina a 44 (36); a veces lanza las bolas hacia fuera (radio hasta 168) |
| Pira Viviente | 280 | marca 4 casillas por incendio (3); camina a 34 (24); nova de 12 lágrimas de fuego |
| Coágulo Mayor | 330 | anillo de 8 al caer (6); descansa menos entre saltos (se divide a 2/3 y 1/3 en todas las fases) |
| Placenta | 300 | espiral de tres brazos el 40 % de las veces; late más seguido; camina a 20 (14) |

## Recompensas

Al caer un jefe se suelta siempre lo común: **un objeto de jefe** (dos si se tiene Opciones; en Mamá, además, sus dos objetos
propios), **un corazón o un alma** (60 / 40 %), la **trampilla** al piso siguiente y, a veces, la puerta del diablo o del ángel
(ver `docs/TRATOS.md`). Encima, cada jefe suelta **sus propios extras** (`BOSS_DROPS`):

| Jefe | Extras | Jefe | Extras |
| --- | --- | --- | --- |
| Glotón | 2 corazones | Coloso de Piedra | cofre dorado |
| Señor Zumbido | 3 monedas y 1 bomba | Rey Minero | 1 bomba doble y 1 llave |
| Gusano Gemelo | 2 llaves | Carcelero | 3 llaves |
| La Masa | 2 almas | Pira Viviente | 1 corazón negro y 1 bomba |
| La Llorona | 1 carta y 1 píldora | Coágulo Mayor | 2 corazones y medio corazón |
| Mamá | 2 almas | Placenta | 1 cofre y 1 alma |
| Reina Babosa | 1 cofre | El Corazón | solo el trofeo |
| Gran Topo | 2 bombas y 1 moneda | | |

Los extras salen repartidos alrededor del centro de la sala. La idea de cada uno: el Glotón devora y devuelve corazones, los
jefes de pasillos y cadenas (Gusano, Carcelero) dan llaves, los de explosivos (Topo, Rey, Pira) dan bombas, los de hueso y roca
(Coloso) un cofre dorado, y los de carne (Coágulo, Placenta) corazones y cofres.

## Mini-jefes

La sala de mini-jefe (pisos 3 a 7; el último piso no las lleva) lleva uno solo, propio del tema (`MINIBOSS_POOLS`), con la escala normal de enemigos
(`1 + piso × 0,2`). Al caer suelta un objeto de jefe, un corazón y sus extras:

| Mini-jefe | Vida base | Sale en | Extras |
| --- | --- | --- | --- |
| Moscardón | 100 | Sótano, Útero | 2 monedas |
| Gólem menor | 150 | Cuevas, Profundidades | 1 bomba doble |
| Chamán | 100 | Profundidades, Útero | 1 carta y 1 píldora |
| Cangrejo | 130 | Sótano, Cuevas, Profundidades | 2 llaves |

## Cómo tocarlo

- Cambiar un extra: editar `BOSS_DROPS` en `src/data.js`; `node tools/check-enemies.mjs` comprueba que cada jefe y mini-jefe
  tiene recompensa y que los recogibles existen.
- Probar un jefe: `node build.mjs`, abrir el juego y usar el menú de trucos (T) para ir a la sala del jefe.
