# Lista de tareas

Se trabaja de una en una, en orden. Al terminar una se marca `[x]`, se anota qué se cambió y se pregunta
si se continúa con la siguiente. Después de tocar `src/`, ejecutar `node build.mjs`.

Reglas de contenido: salas, enemigos y jefes son **diseños originales** (nombres, patrones y arte propios).
Las mecánicas se pueden inspirar en la wiki, pero no se copian layouts ni arte del juego original.

Estado actual (referencia): salas generadas por estilos en `src/gen.js` (`STYLES`, `genLayout`), 17 enemigos
y 7 jefes en `src/data.js`/`src/enemies.js`, tratos en `src/game.js` (~línea 410).

## 1. Salas

- [x] **1.1 Salas prediseñadas.** Crear `src/rooms.js` con una lista de plantillas de sala hechas a mano
  (cuadrícula 13×7, mismos símbolos que `T.*`), con peso y piso mínimo/máximo. `genNormal` elige entre plantilla
  y estilo procedural (p. ej. 60 % plantilla). Mínimo 30 plantillas para normales.
- [x] **1.2 Plantillas con enemigos colocados.** Permitir que cada plantilla fije posiciones y tipos de
  enemigos (además de la selección aleatoria por presupuesto).
- [x] **1.3 Salas de jefe propias.** Un layout distinto por jefe (arena abierta, con pilares, con fosos…).
- [x] **1.4 Salas especiales nuevas.** Sala de sacrificio (pinchos + recompensa), biblioteca (cartas/libros),
  sala de reto (oleadas con recompensa), sala de mini-jefe.
- [x] **1.5 Salas con forma.** Soporte para salas grandes (2×1, 2×2) y en L en el generador de pisos
  (`gen.js`, mapa en cuadrícula).
- [x] **1.6 Variedad por tema.** Obstáculos y decorado propios por tema (sótano, cuevas, profundidades, útero).

## 2. Tratos del diablo y salas del ángel

- [x] **2.1 Extraer la lógica a una función.** Mover el cálculo de probabilidades de `game.js` a una función
  `dealChance(run, player)` que devuelva `{ chance, angelShare }` para poder probarlo y mostrarlo en trucos.
- [x] **2.2 Reglas de aparición revisadas.** Penalizaciones y bonos documentados: daño recibido en el piso,
  salas especiales vistas, jefes sin daño, objetos que suben/bajan la probabilidad, tratos ya aceptados.
- [x] **2.3 Reparto ángel/diablo.** Que aceptar tratos del diablo reduzca la opción de ángel y viceversa;
  casos especiales (objetos que fuerzan uno u otro).
- [x] **2.4 Contenido de las salas.** Ofertas variadas: objetos por vida, por monedas, por corazones de alma;
  ángel con 1–2 objetos o llave/sacrificio; ofertas de pasivo + activo.
- [x] **2.5 Interfaz.** Mostrar en el menú de trucos y en la pausa la probabilidad actual de trato.
- [x] **2.6 Tests.** Script en `tools/` que simula N pisos y muestra la distribución ángel/diablo.

## 3. Enemigos corrientes

Cada enemigo nuevo: entrada en `EN` (`data.js`), comportamiento en `BEHAV` (`enemies.js`), dibujo en
`render.js`, y alta en `ENEMY_POOLS` por tema.

- [x] **3.1 Sótano (4 nuevos).** Por ejemplo: uno que dispara en cruz, uno que se divide al morir, uno que
  se esconde y emerge, uno que deja un charco.
- [x] **3.2 Cuevas (4 nuevos).** Por ejemplo: uno acorazado (solo recibe daño por la espalda), uno que
  pone minas, uno que teletransporta, uno que lanza proyectiles en arco.
- [x] **3.3 Profundidades (4 nuevos).** Por ejemplo: uno que invoca esbirros, uno con láser, uno que
  se enfurece al quedar solo, uno que atraviesa rocas.
- [x] **3.4 Útero (4 nuevos).** Por ejemplo: uno que regenera a otros, uno que persigue lento pero
  imparable, uno que dispara en espiral, uno que se fusiona con otro.
- [x] **3.5 Campeones.** Ampliar las variantes campeón (ahora 4–8 %): más tipos con efecto distinto.
- [x] **3.6 Equilibrado.** Revisar `cost`, `hp` y composición de salas por piso con una tabla de dificultad.

## 4. Jefes

Cada jefe nuevo: entrada en `BOSSES`, comportamiento en `BEHAV`, dibujo en `render.js`, alta en `FLOORS[].bosses`.

- [x] **4.1 Jefes de Sótano (2 nuevos).**
- [x] **4.2 Jefes de Cuevas (2 nuevos).**
- [x] **4.3 Jefes de Profundidades (2 nuevos).**
- [x] **4.4 Jefes de Útero (2 nuevos).**
- [x] **4.5 Mini-jefes.** Jefes más pequeños para la sala de mini-jefe (1.4) y para salas de reto.
- [x] **4.6 Fases.** Dar a los jefes actuales una segunda fase al bajar del 50 % de vida.
- [x] **4.7 Recompensas.** Drops específicos por jefe (objeto garantizado, cofre, corazones).

## 5. Pulido

- [x] **5.1 Aviso de jefe.** Pantalla de presentación al entrar en la sala de jefe.
- [x] **5.2 Registro de bestiario.** Pantalla con enemigos y jefes vistos.
- [x] **5.3 Actualizar README.** Cifras de contenido (salas, enemigos, jefes) y descripción de novedades.

## Registro de cambios

_(Se añade una línea por cada tarea completada: fecha, tarea, archivos tocados.)_

- 2026-10-28 · **1.1 Salas prediseñadas** · 33 plantillas en `src/rooms.js` (con volteo horizontal y vertical al azar),
  usadas en el 60 % de las salas normales (`ROOM_TEMPLATE_CHANCE`); si una plantilla aísla una puerta se cae al
  generador por estilos. Tocados: `src/rooms.js` (nuevo), `src/gen.js` (`genNormal`), `build.mjs` (orden),
  `tools/check-rooms.mjs` (nuevo, valida tamaño, símbolos y puertas en las 4 orientaciones).
  Comprobado: 0 errores en 320 pisos generados y una sala vista en el navegador.
- 2026-10-28 · **1.2 Plantillas con enemigos colocados** · `ROOM_SPAWNS` en `src/rooms.js` fija tipo y casilla de los
  enemigos de 22 plantillas (`'pool'` elige uno del tema del piso; los voladores pueden ir sobre fosos). Las posiciones
  se voltean con la sala. `genNormal` usa esos enemigos en vez del presupuesto aleatorio, y las plantillas sin entrada
  siguen repartiendo al azar. `tools/check-rooms.mjs` valida casilla libre, enemigo existente y 3+ casillas de las
  puertas. Tocados: `src/rooms.js` (`templateTiles` pasa a `templateRoom`), `src/gen.js`, `tools/check-rooms.mjs`.
  Comprobado: 320 pisos sin errores, 0 enemigos en casilla inválida o repetida, y una sala de "pasillos" vista en el
  navegador con sus dos embestidores.
- 2026-10-28 · **1.3 Salas de jefe propias** · `BOSS_ROOMS` en `src/rooms.js`: 11 diseños para los 7 jefes (2 variantes
  para Glotón, Zumbido, Masa y Llorona; 1 para Gusano, Mamá y Corazón), con volteo al azar. Todos dejan libre la zona
  donde nace el jefe; el Gusano Gemelo va en sala sin obstáculos porque se mueve en línea recta y podría atascarse.
  `fillRoom` (`src/gen.js`) los usa y conserva el método anterior para jefes sin diseño. `tools/check-rooms.mjs` valida
  forma, símbolos, puertas en las 4 orientaciones y la zona del jefe. Tocados: `src/rooms.js`, `src/gen.js`,
  `tools/check-rooms.mjs`. Comprobado: 480 pisos sin errores y la sala del Señor Zumbido vista en el navegador.
- 2026-10-28 · **1.4 Salas especiales nuevas** · Cuatro tipos nuevos de sala en los callejones que sobran, del piso 2
  al 7 (el Sótano I y el Útero II no los llevan): **reto** (3 oleadas; recompensa: objeto del tesoro o cofre dorado
  más un corazón), **sacrificio** (cada pinchazo da coin, corazón, llave, bomba y cofre dorado; el sexto da un objeto
  y retira los pinchos), **biblioteca** (un objeto a 12 monedas y 3 cartas a 4) y **minijefe** (enemigo grande,
  campeón y con ×3 de vida más dos acompañantes; recompensa: objeto de jefe y un corazón). Con etiqueta en la sala e
  icono propio en el minimapa. Probabilidades por piso en `tryFloor` (`src/gen.js`). El minijefe es provisional: la
  tarea 4.5 lo sustituirá por jefes pequeños propios. Tocados: `src/rooms.js` (`SPECIAL_ROOMS`, `ROOM_LABELS`),
  `src/gen.js` (`farTiles`, `genChallenge`, `genMiniboss`), `src/game.js` (`spawnRoomEnemy`, `sacrifice`, `clearRoom`),
  `src/entities.js` (pinchazo), `src/render.js` (minimapa), `tools/check-rooms.mjs`. Comprobado: 480 pisos sin
  errores (≈90 salas de cada tipo), las 3 oleadas del reto con su recompensa, las 6 recompensas del sacrificio
  (también con un pinchazo real), la biblioteca y el minijefe.
- 2026-10-28 · **1.5 Salas con forma** · Salas grandes de verdad: **2×1, 1×2, L (3 celdas) y 2×2**, del piso 2 en
  adelante (≈11 % de las salas). Una sala ocupa una o varias celdas del mapa y mide 13×7 casillas por celda; las
  constantes del mundo (`COLS`, `ROWS`, `X1`, `Y1`, `CX`, `CY`, `DIRS`, `DIRNAMES`) ahora son variables que fija
  `setRoomShape(sala)` al generar o entrar en ella, así que el resto del código no cambia. Novedades: **cámara** que
  sigue al jugador (`updateCamera`; la pantalla sigue siendo de 600×360 y el HUD no se mueve), **puertas por
  ranura** (`up`, `up1`, `down`, `down1`, `left`, `left1`, `right`, `right1`; cada puerta guarda `slots` con su ranura
  en cada sala), casilla **`T.WALL`** (muro macizo) para el hueco de las L, **minimapa** que dibuja las celdas de
  cada sala unidas, y **diseño** de cada sala grande uniendo un diseño de 13×7 por celda con pasillos de 3 casillas
  entre celdas. Las salas grandes solo salen de salas normales (nunca inicio, tesoro, tienda, jefe, especiales ni
  secreta) y el hueco de una L nunca es la sala secreta, así que no hay puertas en el hueco. Los enemigos de las
  salas grandes escalan con el número de celdas. Tocados: `src/util.js` (`setRoomShape`, ranuras, `T.WALL`),
  `src/gen.js` (`makeRoom` con celdas, `bigRoomGroups`, `genBigLayout`, puertas por ranura), `src/game.js`
  (`enterRoom`, `goDoor`, `playerBounds`, `updateCamera`, `renderWorld`/`drawWorld`), `src/render.js` (fondo del
  tamaño de la sala, muro del hueco, minimapa), `tools/check-floors.mjs` (nuevo). Comprobado: 800 pisos en Node
  (1.057 salas grandes, 21.032 puertas) con 0 problemas, y en el navegador las transiciones en los dos sentidos por
  todas las puertas de una sala 2×2, la cámara y el dibujo de una L.
  Límites: no hay salas de 3 celdas en línea ni más de 2×2; los enemigos fijos de las plantillas (1.2) no se usan
  en las grandes; el sacrificio, la biblioteca y los jefes siguen siendo de una celda.
- 2026-10-28 · **1.6 Variedad por tema** · Cada tema tiene su propio carácter: **obstáculos** (`THEME_OBSTACLES` en
  `src/gen.js`), **estilos de sala** (`THEME_STYLES`), **plantillas favorecidas** (`THEME_TEMPLATE_BIAS` en
  `src/rooms.js`, multiplica el peso de cada plantilla) y **decorado de suelo** (`paintThemeDecor` en `src/render.js`,
  determinista por sala y proporcional a las celdas). Sótano: mierda, huesecillos y manchas de humedad. Cuevas: fosos y
  barriles, charcos y guijarros. Profundidades: pinchos, fuego y metal, calaveras, huesos y cadenas. Útero: fuego, fosos
  y mierda, charcos de sangre y bultos de carne. Antes los pesos dependían solo del número de piso; ahora dependen del
  tema. Tocados: `src/gen.js`, `src/rooms.js`, `src/render.js`, `tools/check-rooms.mjs` (comprueba que los
  multiplicadores nombran plantillas que existen). Comprobado: casillas por sala medidas en 200 pisos
  (sótano 2,1 de mierda frente a 0,6 en cuevas; cuevas 4,3 de fosos; profundidades 2,3 de pinchos y 1 de fuego; útero
  1 de fuego, 4 de fosos y 1,4 de mierda), 480 pisos sin problemas en `check-floors.mjs` y las cuatro salas vistas en
  el navegador. Solo usa los tipos de casilla existentes: los obstáculos con arte nuevo por tema quedan fuera.
- 2026-10-28 · **2.1 Extraer la lógica de tratos** · `dealChance(run, has)` en `src/gen.js` calcula, sin tocar el
  juego, `{ chance, angelShare, both }`: probabilidad de que se abra un trato tras un jefe, parte de las veces que es
  del ángel y si salen las dos puertas (Dualidad). `run` es `{ floorHit, devilTaken }` y `has(id)` consulta pasivos, así
  que se puede llamar con cualquier combinación. `bossRewards` (`src/game.js`) solo la usa: sorteo de `chance`, luego
  de `angelShare`. El comportamiento no cambia (0,55 sin daño, 0,2 con daño, +0,15 por cada uno de los pasivos `devil`
  y `angel`; `devil100` y `eucharist` fuerzan el trato; `duality` abre las dos puertas). Comprobado: la función nueva
  coincide con la fórmula antigua en las 128 combinaciones de pasivos y estados, y en el juego, 2.000 jefes por
  caso dan 56 % de tratos sin daño y 19 % con daño, con 53 % de ángel (50 % con daño) y 0 % de ángel tras aceptar un
  trato del diablo. Tocados: `src/gen.js`, `src/game.js`. La función es la base de 2.2 a 2.6.
- 2026-10-28 · **2.2 Reglas de aparición revisadas** · Las cifras pasan a una tabla, `DEAL_RULES` en `src/gen.js`, y
  `dealChance` suma tres ajustes nuevos a la base (55 % sin daño, 20 % con daño): **racha** de jefes seguidos sin daño
  (+5 % cada uno, máx. 3), **salas especiales visitadas** en el piso (−3 % cada una, máx. 5; tipos en
  `DEAL_SPECIAL_TYPES`) y **tratos ya aceptados** (−8 % cada uno, máx. 3). Los pasivos `devil` y `angel` siguen sumando
  15 % y el resultado se limita a 5 %–95 % (salvo `devil100` y `eucharist`, que fuerzan 100 %). Datos nuevos de la
  partida: `run.noHitStreak` (se actualiza en `bossRewards`, también en el primer piso) y `run.dealsTaken` (sube en
  `giveItem` la primera vez que se coge un objeto de una sala del diablo o del ángel); las salas especiales se cuentan
  al calcular. Reglas documentadas con ejemplos en `docs/TRATOS.md`. Con los datos nuevos a cero el resultado es el de
  antes. Comprobado: 17 casos en Node (cada regla, topes, suelo, techo y forzados; incluye los ejemplos de la
  documentación), 960 pisos válidos en `check-floors.mjs` y, en el juego, racha 1, 2 y 0 tras un piso con daño, 2 de
  3 salas especiales contadas y un solo trato aunque se cojan dos objetos de la misma sala. Tocados: `src/gen.js`,
  `src/game.js`, `docs/TRATOS.md` (nuevo). Cambia el equilibrio: con tienda y tesoro visitados la probabilidad base baja
  de 55 % a 49 %, compensada por la racha.
- 2026-10-28 · **2.3 Reparto ángel/diablo** · El reparto deja de depender de un único aviso ("ya aceptaste un trato del
  diablo" → 0 % de ángel para siempre) y pasa a contar los tratos de cada tipo: `run.devilDeals` y `run.angelDeals`
  (suben en `giveItem` la primera vez que se coge un objeto de una sala, junto a `dealsTaken`). Parte de ángel: base
  50 %, +25 % con el pasivo `angel`, −25 % por cada trato del diablo aceptado y +25 % por cada uno del ángel (límites
  0 %–100 %); las cifras están en `DEAL_RULES` (`angelBase`, `angelItem`, `perDevil`, `perAngel`). Casos especiales
  que mandan: `eucharist` fuerza el ángel, `devil100` fuerza el diablo (gana si están los dos) y `duality` abre las dos
  puertas. Se elimina `run.devilTaken`, que ya no se lee. Efecto de juego: antes un trato del diablo anulaba los
  ángeles; ahora hacen falta dos seguidos. Reglas y ejemplos en `docs/TRATOS.md`. Comprobado: 14 casos en Node (cada
  regla, límites y forzados) y, en el juego con una partida limpia y 4.000 jefes por caso, 50 % de ángel sin tratos,
  25 % con un trato del diablo, 0 % con dos, 76 % con uno del ángel y 49 % con uno de cada; los contadores suben una
  sola vez por sala. Tocados: `src/gen.js`, `src/game.js`, `src/entities.js`, `docs/TRATOS.md`.
- 2026-10-28 · **2.4 Contenido de las salas** · Las salas del diablo y del ángel sortean una oferta de `DEAL_OFFERS`
  (`src/gen.js`, función `dealOffer`) en vez de repartir siempre dos o tres objetos iguales. Formas de pago: corazones
  rojos (como antes), **corazones de alma** (`sprice`, nuevo), **monedas** (`price`, precio según la calidad del objeto),
  **llaves** (`kprice`, nuevo) o gratis. Las ofertas mezclan **pasivos y activos**: el diablo con 6 ofertas (hay una
  con almas, corazones y monedas a la vez) y el ángel con 5 (una elección entre pasivo y activo, un objeto único y dos
  por llaves). `pickItem` acepta ahora el tipo de objeto (`'p'`/`'a'`) y cae a cualquiera si no queda ninguno. La compra
  de almas y llaves está en `touchStatic` (`src/entities.js`), no deja sin vida al jugador y es gratis para The Lost; los
  precios nuevos se dibujan en `drawPickup` (`src/render.js`); el objeto Cupón y los pedestales cambiantes los
  reconocen. Tablas y reglas de pago en `docs/TRATOS.md`. Comprobado: con el catálogo real (718 objetos) y 3.000 salas
  de cada lado, 0 fallos (ningún objeto repetido, fuera de su reserva, con más de un pago ni fuera de rango; también con
  la reserva casi vacía o vacía), y en el juego las compras de almas, llaves y monedas (pagan con fondos y no cobran sin
  ellos) y el dibujo de los tres precios en una sala del diablo y de las llaves en una del ángel. Tocados:
  `src/gen.js`, `src/game.js`, `src/entities.js`, `src/render.js`, `src/items.js`, `docs/TRATOS.md`.
- 2026-10-28 · **2.5 Interfaz** · La pausa y el menú de trucos muestran la probabilidad actual de trato, por ejemplo
  "Tratos tras el jefe: 60 % · ángel 50 % / diablo 50 %". Es lo que pasaría si el jefe de este piso cayera ahora: la
  racha cuenta este piso y se tienen en cuenta el daño recibido, las salas especiales visitadas, los tratos aceptados y
  los pasivos. En el primer piso y tras el jefe final dice que no hay tratos, y con Dualidad indica que salen las dos
  puertas. `dealState()` (estado que ve `dealChance`) lo comparten `bossRewards` y el texto, así que lo mostrado es
  exactamente lo que se aplica; `dealText()` da la línea. Posición: al pie de la pausa, abajo a la derecha en los
  trucos horizontales y bajo el título en los verticales; en la pausa horizontal el aviso "Partida con trucos" sube
  unos píxeles para dejarle sitio. Comprobado en el navegador: valores 60 % (primer jefe), 70 % (racha 2), 20 % (con
  daño), reparto 25/75 tras un trato del diablo, y los textos de primer piso y último piso; dibujo de la pausa y de
  los trucos en horizontal y en vertical (móvil). Tocados: `src/game.js`.
- 2026-10-28 · **2.6 Tests** · `tools/sim-deals.mjs` simula partidas enteras con `dealChance` y las salas especiales de
  pisos generados de verdad, para cuatro estilos de jugador (Novato, Cuidadoso, Experto y Experto que lo recoge todo), y
  muestra probabilidad de trato por jefe, tratos por partida, reparto ángel/diablo, aceptados, frecuencia por piso y
  distribución de partidas según su número de tratos. Admite `--pasivos=` (`devil`, `angel`, `devil100`, `eucharist`,
  `duality`), `--semilla=` (resultado reproducible) y el número de partidas; valida los límites de probabilidad y sale
  con error si algo se sale de rango o si el pasivo no existe. Uso y resultados de referencia en `docs/TRATOS.md`.
  Comprobado: sin pasivos da 23 %, 40 %, 52 % y 45 % de trato por jefe según el estilo, con reparto cercano a 50/50;
  `devil100` da 100 % de diablo y 6 tratos por partida, `eucharist` 100 % de ángel, `angel` cerca del 80 % de ángel,
  `devil` y `angel` juntos suben la probabilidad al 50–65 %, y `duality` abre las dos puertas con reparto 50/50. Al
  probarlo corregí dos fallos del propio simulador (una etiqueta y el recuento de puertas con Dualidad). Con esto queda
  **cerrado el bloque 2**. Tocados: `tools/sim-deals.mjs` (nuevo), `docs/TRATOS.md`.
- 2026-10-28 · **3.1 Sótano (4 nuevos)** · Cuatro enemigos originales (nombre, comportamiento y dibujo propios) en la
  reserva del Sótano, con peso 1,2–1,5 cada uno: **Aspa** (`cross`, 14 de vida: deambula despacio y cada 2–2,8 s dispara
  cuatro lágrimas, alternando cruz y diagonales; los brazos giran a diagonal cuando toca esa volea), **Gelatina**
  (`jelly`, 18: persigue a ritmo pulsante y al morir se divide en dos **gelatinitas** `jellet` de 5 de vida que no salen
  solas en las salas), **Topo** (`mole`, 12: bajo tierra se acerca al jugador sin poder ser golpeado ni hacer daño y
  pasando por rocas y fosos; emerge —nunca dentro de una roca—, dispara tres lágrimas en abanico y se vuelve a enterrar)
  y **Baboso** (`slug`, 16: se arrastra tras el jugador dejando charcos viscosos que hacen medio corazón de daño).
  Datos en `EN` y `ENEMY_POOLS` (`src/data.js`), comportamientos en `BEHAV` (`src/enemies.js`), división en `killEnemy` y
  daño pequeño de los charcos (`c.small`) en `src/entities.js`, dibujos en `drawEnemy` (`src/render.js`). Todos escalan
  con el piso y pueden ser campeones como el resto. Nuevo `tools/check-enemies.mjs`: comprueba que cada enemigo y jefe
  tiene datos, comportamiento y dibujo, y que las reservas de los temas solo nombran enemigos que existen. Comprobado:
  0 problemas en el validador, en 80 pisos del Sótano salen 27 Aspas, 53 Gelatinas, 21 Topos y 62 Babosos sin errores, y
  en una sala de prueba en el juego: el Aspa dispara cuatro lágrimas, la Gelatina deja dos gelatinitas, el Topo repite
  el ciclo bajo tierra → arriba → bajo tierra → arriba, y el Baboso deja 8 charcos pequeños. Tocados: `src/data.js`,
  `src/enemies.js`, `src/entities.js`, `src/render.js`, `tools/check-enemies.mjs` (nuevo).
  Pendiente de equilibrado (tarea 3.6): costes y vida se han puesto a ojo comparando con los enemigos del mismo piso.
- 2026-10-28 · **3.2 Cuevas (4 nuevos)** · Cuatro enemigos originales más en la reserva de las Cuevas (peso 1,2–1,5):
  **Escarabajo** (`shell`, 20 de vida, acorazado: camina hacia donde mira y gira despacio hacia el jugador; las
  lágrimas, láseres y cuchillos que le llegan de frente —dentro de ±72° del rumbo— rebotan sin daño; por detrás o de
  lado, y con veneno, fuego o explosiones, daña normal), **Minero** (`miner`, 14: mantiene 150–240 px de distancia y
  deja hasta 5 **minas** a la vez), **Mina** (`mine`, no sale sola: se arma a los 0,9 s, explota si el jugador se
  acerca o si la matan —medio corazón×2 de daño y 25 a los enemigos cercanos—, no bloquea la sala y desaparece al
  limpiarla o a los 14 s), **Parpadeo** (`blinker`, 12: aparece, dispara dos veces, se desvanece y reaparece a 130 px o
  más del jugador; oculto no se le puede dañar) y **Mortero** (`mortar`, 16: inmóvil, lanza uno o dos proyectiles en arco
  al sitio donde está el jugador y marca en el suelo dónde caerán). La armadura está en `damageEnemy` y `makeEnemy`
  (`armor` en `EN`, rumbo `hd`), la explosión de la mina en `killEnemy`, los comportamientos en `BEHAV`
  (`src/enemies.js`) y los dibujos en `drawEnemy` (`src/render.js`). `check-enemies.mjs` pasa con 27 enemigos y 7 jefes.
  Comprobado en el juego avanzando fotograma a fotograma: armadura (de frente y diagonal frontal 0 de daño; detrás,
  lado, sin dirección y explosión daño completo), giro hacia el jugador, minero (distancia 241 px, 5 minas máx., la
  mina quita un corazón al explotar, desaparecen al limpiar), Parpadeo (visible y oculto en ciclo, nunca golpeable
  oculto, reaparece a 165 px o más), Mortero (6 proyectiles en arco que caen a 15 px del jugador, el segundo con
  dispersión) y dibujo de los cuatro. Tocados: `src/data.js`, `src/enemies.js`, `src/entities.js`, `src/render.js`.
  Pendiente de equilibrado (3.6), como en 3.1. El Escarabajo puede resultar difícil con armas que solo disparan al
  frente: queda pendiente decidir si hace falta un indicio en pantalla de su zona protegida.
- 2026-10-28 · **3.3 Profundidades (4 nuevos)** · Cuatro enemigos originales más en la reserva de las Profundidades
  (peso 1,2–1,5): **Invocador** (`summoner`, 22 de vida: mantiene 170–260 px de distancia y, tras un conjuro de 0,7 s
  con círculo en el suelo, llama a dos **sombras** `shade` de 4 de vida —nunca más de 4 a la vez—; las sombras no salen
  solas), **Vigía** (`laser`, 20: ojo de piedra inmóvil; apunta 0,55 s siguiendo al jugador y luego fijo, carga hasta
  0,9 s con una línea roja discontinua de aviso, y dispara un rayo de 0,5 s que daña a quien lo cruce; el aviso no hace
  daño), **Furioso** (`enrager`, 18: camina hacia el jugador y, si es el único enemigo que queda en la sala, se
  enfurece y corre 2,6 veces más rápido, con la cara roja y vapor) y **Espectro** (`phaser`, 16: gárgola que atraviesa
  rocas, fosos y muros persiguiendo al jugador; mientras está dentro de un obstáculo se ve casi transparente y no se le
  puede dañar ni hace daño). Datos en `EN` y `ENEMY_POOLS` (`src/data.js`), comportamientos en `BEHAV`
  (`src/enemies.js`), dibujos —incluido el rayo— en `drawEnemy` (`src/render.js`). `check-enemies.mjs` pasa con 32
  enemigos y 7 jefes. Comprobado en el juego avanzando fotograma a fotograma: Invocador (2 conjuros en 20 s, 4 sombras
  como máximo, 242 px de distancia), Vigía (fases reposo → apunta → dispara → reposo, 0 de daño en el aviso, un golpe
  de un corazón en la fila del rayo y 0 fuera de ella), Furioso (46 con compañero, 120 solo y enfurecido) y Espectro
  (cruza un muro de rocas; 94 fotogramas fundido sin poder ser dañado ni dañar, y siempre golpeable fuera) y el dibujo de
  los cuatro. Al probar descubrí que mi primera medición del Vigía no valía porque el jugador moría en el primer tramo;
  la repetí con una partida limpia. Tocados: `src/data.js`, `src/enemies.js`, `src/render.js`. Pendiente de
  equilibrado (3.6), como en 3.1 y 3.2.
- 2026-10-28 · **3.4 Útero (4 nuevos)** · Cuatro enemigos originales más en la reserva del Útero (peso 1,2–1,5):
  **Sanador** (`healer`, 18 de vida: se mantiene a 180–270 px del jugador y, tras 0,8 s de concentración con un hilo
  verde hasta su objetivo, cura un 40 % de vida máxima al aliado más herido que tenga cerca; nunca a jefes),
  **Imparable** (`relentless`, 40: lentísimo, 26 de velocidad, pero inmune a empuje, ralentización, congelación, miedo,
  encanto y confusión; veneno, fuego y sangrado sí le afectan), **Espiral** (`spiral`, 20: casi inmóvil; ráfagas de
  2,4 s con dos brazos de lágrimas que giran, hasta 120 lágrimas en pantalla, y descanso de 1,6–2,4 s) y **Gemelo**
  (`merger`, 10: sale siempre **por parejas**; si dos se tocan durante 0,8 s se funden en unos **gemelos fundidos**
  `fused` con la vida sumada de los dos, radio 16, que persiguen y disparan tres lágrimas en abanico; los fundidos no
  salen solos). Datos en `EN` y `ENEMY_POOLS` (`src/data.js`; nuevas marcas `kb: 0` e `immune: true`), parejas de
  Gemelos en `genNormal` (`src/gen.js`), inmunidad a estados en `updateEnemy` y `makeEnemy` (`src/entities.js`),
  comportamientos en `BEHAV` (`src/enemies.js`) y dibujos en `drawEnemy` (`src/render.js`). `check-enemies.mjs` pasa
  con 37 enemigos y 7 jefes. Comprobado en el juego avanzando fotograma a fotograma: Sanador (cura primero al más
  herido, 7→15 de 22, y a otro aliado 42→70, ignora al jefe, 269 px de distancia), Imparable (con slow, freeze, fear,
  charm y confuse a 0, empuje 0, el veneno le hace daño y avanza a 26), Espiral (2 ráfagas en 10 s, 25 lágrimas a la
  vez, el remolino recorre 26 ángulos), Gemelos (se funden a los 292 fotogramas en uno de 44 = 22+22) y gemelos fundidos
  (tres lágrimas) y el dibujo de todos. Corregí un fallo propio: la inmunidad del Imparable no funcionaba si la
  aplicaba su comportamiento, porque `updateEnemy` no lo ejecuta mientras el enemigo está congelado o asustado; ahora la
  garantiza `updateEnemy` con `immune`. Tocados: `src/data.js`, `src/gen.js`, `src/entities.js`, `src/enemies.js`,
  `src/render.js`. Pendiente de equilibrado (3.6), como en las tareas anteriores. Con esto los cuatro temas tienen
  cuatro enemigos nuevos cada uno.
- 2026-10-28 · **3.5 Campeones** · Los campeones dejan de ser todos iguales: hay **cinco variantes** (`CHAMPIONS` en
  `src/data.js`, con `pickChampion()` para sortear) y `e.champ` pasa de verdadero/falso al nombre de la variante. El
  porcentaje de campeones por sala no cambia (4 % + 1 % por piso); lo que cambia es cuál sale. **Resistente** (27 %: el de
  antes, doble de vida y cuerpo teñido de rojo), **Veloz** (18 %: 1,4× de vida y 1,5× de velocidad), **Explosivo** (18 %:
  1,5× de vida; al morir explota con radio 55 y 20 de daño al jugador y a los enemigos cercanos), **Tóxico** (18 %: 1,5×
  de vida; al morir deja tres charcos verdes de 5 s que dañan) y **Regenerador** (18 %: 1,6× de vida; tras 1,5 s sin
  recibir daño recupera un 8 % de vida máxima por segundo). Todos siguen soltando corazón o alma al morir. Cada variante
  lleva un **aura** propia (anillo en el suelo y marcas: rayas de velocidad, chispas, burbujas o cruces) dibujada en
  `drawEnemy`; los charcos admiten color (`col`). Se aplican al crear el enemigo (`makeEnemy`), los efectos de muerte en
  `killEnemy` y la regeneración en `updateEnemy` (`src/entities.js`). `check-enemies.mjs` valida los datos de las
  variantes y que cada una con efecto tenga código y aura. Comprobado en el juego: estadísticas de cada variante frente a
  un Boquiabierto normal, reparto del sorteo (2.000 campeones: 28 % resistentes, 17–19 % el resto), Explosivo (20 al
  vecino, 0 al lejano, un corazón al jugador), Tóxico (3 charcos verdes de 5 s), Regenerador (no cura durante la espera,
  +11 en 1,5 s de curación y vuelve a esperar tras un golpe), Veloz (70 px frente a 43) y las cinco auras en pantalla.
  Tocados: `src/data.js`, `src/entities.js`, `src/render.js`, `src/game.js`, `tools/check-enemies.mjs`.
- 2026-10-28 · **3.6 Equilibrado** · Nueva herramienta `tools/difficulty.mjs` con dos tablas hechas con el código real:
  por enemigo (vida, vida efectiva contando escudos, tiempo sin poder golpearlo y crías, coste y desvío respecto a la
  escala de los 17 originales: 10 de coste por cada 100 de vida efectiva) y por piso (enemigos, vida y coste medios de las
  salas normales, campeones, daño por segundo supuesto y tiempo de limpieza estimado frente a una curva objetivo de 7 a
  17,5 s, +1,5 s por piso). Las constantes de escala pasan a una tabla `DIFFICULTY` en `src/data.js` (vida por piso,
  presupuesto de las salas y un ajuste por piso `budgetFloorMul`) usada por `makeEnemy`, `killEnemy` y `genNormal`.
  Cambios: costes de siete enemigos nuevos (Gelatina 1,4→2,2, Topo 1,5→1,8, Escarabajo 1,8→2,3, Parpadeo 1,4→1,7,
  Invocador 1,8→2,6, Imparable 2,2→3,3, Sanador 1,8→2,2) y presupuesto por piso (0,94 en Cuevas I, 0,87 en Profundidades I
  y 0,92 en Profundidades II). El tiempo de limpieza estimado queda dentro de ±6 % de la curva objetivo en los ocho pisos
  (antes llegaba a +16 % en Profundidades I) y la herramienta no da avisos. Método, tablas antes y después y supuestos en
  `docs/DIFICULTAD.md`. Comprobado: 150 pisos por nivel en la herramienta, validadores de enemigos, salas y pisos en 0
  problemas, simulador de tratos sin cambios y, en el juego, 200 pisos generados sin errores con la nueva escala (la vida
  de un enemigo del piso 6 es 2× la del piso 1, como marca `hpPerFloor`). **Queda sin decidir** si hay que tocar siete
  enemigos originales que cuestan entre un 35 % y un 55 % menos de lo que pesan (Calavera, Gordinflón, Hinchado, Carnoso,
  Araña gigante, Colmena y Brincador): no se han tocado por ser el diseño original; ver `docs/DIFICULTAD.md`. Tocados:
  `src/data.js`, `src/entities.js`, `src/gen.js`, `tools/difficulty.mjs` (nuevo), `docs/DIFICULTAD.md` (nuevo).
  Con esto queda **cerrado el bloque 3**.
- 2026-10-28 · **4.1 Jefes del Sótano (2 nuevos)** · Dos jefes originales, con nombre, comportamiento, dibujo, arena y
  recompensa propios, en la lista de Sótano I y II (junto a Glotón, Señor Zumbido y Gusano Gemelo; cada uno sale en
  torno al 20 % de las veces). **Reina Babosa** (`babosa`, 210 de vida, radio 34): se arrastra hacia el jugador a 38 de
  velocidad dejando charcos viscosos verdes que dañan y, cada 2–3 s, se detiene y escupe un abanico de 5 lágrimas.
  Por debajo de la mitad de vida ruge, **pare dos baboso**, va a 54 de velocidad y escupe abanicos de 7 con descansos más
  cortos. **Gran Topo** (`gtopo`, 190, radio 28): bajo tierra persigue al jugador sin poder ser golpeado ni hacer daño
  (pasa por rocas y fosos); **marca en el suelo con un anillo rojo** el punto donde estaba el jugador y, a 1 s, emerge
  allí: la erupción daña a quien siga encima y lanza un anillo de 8 lágrimas; queda al descubierto 2 s, dispara un
  abanico de 3 y se vuelve a enterrar. Por debajo de la mitad de vida va a 135 de velocidad, avisa solo 0,75 s, el
  anillo es de 12 lágrimas, el abanico de 5 y el descubierto dura 1,5 s. Como el resto de jefes, su vida se escala por
  piso (×1,22 por piso) y al caer dan la recompensa de jefe (objeto, corazón y trampilla). Datos en `BOSSES` y
  `FLOORS` (`src/data.js`), comportamientos en `BEHAV` (`src/enemies.js`), dibujos en `drawEnemy` (`src/render.js`; la
  presentación de jefe los dibuja sin cambios) y arenas en `BOSS_ROOMS` (`src/rooms.js`: dos para cada uno, con montones
  de mierda la de la Reina y rocas en los bordes la del Topo). Comprobado: `check-enemies.mjs` y `check-rooms.mjs`
  (15 salas de jefe) y `check-floors.mjs` con 0 problemas; en el juego avanzando fotograma a fotograma, Reina Babosa
  (fases reposo → escupe → camina…, 11 charcos, 5 lágrimas por escupitajo; en fase 2, nacen 2 baboso y salen 7
  lágrimas) y Gran Topo (ciclo cavar → marcar → emerger, inmune y sin daño bajo tierra, vulnerable y dañino arriba,
  emerge exactamente en el punto marcado, 5 de daño si el jugador se queda y 0 si se aparta, anillo de 8 y de 12
  lágrimas), el dibujo de ambos y de su pantalla de presentación, y un sorteo con 600 pisos (48–72 de 300 por jefe y
  piso). Dos de mis mediciones eran inválidas y las rehíce: el recuento del anillo (el jugador estaba justo encima y las
  lágrimas se consumían al instante) y el sorteo (usaba una semilla fija por piso). Tocados: `src/data.js`,
  `src/enemies.js`, `src/render.js`, `src/rooms.js`. Pendiente de equilibrar con los demás jefes en la 4.6/4.7.
- 2026-10-28 · **4.2 Jefes de las Cuevas (2 nuevos)** · Dos jefes originales más, en la lista de Cuevas I y II (ahora seis
  posibles en cada una). **Coloso de Piedra** (`coloso`, 300 de vida, radio 38): gigante de roca que camina despacio hacia
  el jugador (30 de velocidad); cada 2–3 s alza los brazos y **lanza tres peñascos en arco** marcando en el suelo con un
  anillo rojo dónde caerán (uno apunta al jugador y los otros caen dispersos); si el jugador se acerca a menos de 120 px
  **pisa** y suelta un anillo de 10 lágrimas (3 s entre pisotones). Bajo la mitad de vida camina a 42, lanza 5 peñascos, el
  anillo es de 14 lágrimas y descansa menos. **Rey Minero** (`rey`, 260, radio 30): se mantiene a 170–260 px del jugador y
  cada 1,5–2,2 s elige entre **sembrar 2 minas** junto al jugador (nunca más de 7 en la sala; las minas son las del
  enemigo Mina: se arman a los 0,9 s, explotan al acercarse y desaparecen al caer el jefe), **embestir** en línea recta
  tras 0,7 s de aviso con el pico en alto, o **disparar tres lágrimas**. Bajo la mitad de vida siembra 3 minas, embiste a
  330 en vez de 280 y descansa menos. Su vida escala por piso (×1,22 por piso: 432 y 374 en el piso 3) y dan la
  recompensa de jefe. Datos en `BOSSES` y `FLOORS` (`src/data.js`), comportamientos en `BEHAV` (`src/enemies.js`), dibujos
  en `drawEnemy` (`src/render.js`; el Coloso también marca dónde caen los peñascos), arenas en `BOSS_ROOMS`
  (`src/rooms.js`: cuatro columnas o dos pilares para el Coloso; bloques de metal o barriles explosivos en las esquinas para
  el Rey) y tamaño en la presentación (`src/game.js`). Comprobado: `check-enemies.mjs`, `check-rooms.mjs` (19 salas de
  jefe) y `check-floors.mjs` con 0 problemas; en el juego, fotograma a fotograma: Coloso (ciclo lanzar → caminar → pisar,
  12 peñascos en 14 s, hasta 3 marcas a la vez, caen a 12–89 px del jugador, 5 por lanzamiento y anillo de 14 en la fase 2) y
  Rey Minero (ciclo caminar → aviso → embestida, 6 minas como máximo, embestida a 280 y a 330, abanico de 3, la mina quita un
  corazón al explotar, al morir el jefe no queda ninguna mina viva), y el dibujo de ambos. Dos mediciones mías eran
  inválidas y las rehíce: el anillo del pisotón de la fase 2 salió 0 por el estado que dejó la prueba anterior (una traza
  fotograma a fotograma mostró 14 lágrimas) y la explosión de la mina, porque una mina recién creada tarda 0,15 s en
  activarse. Tocados: `src/data.js`, `src/enemies.js`, `src/render.js`, `src/rooms.js`, `src/game.js`. Pendiente de equilibrar
  con los demás jefes en la 4.6/4.7.
- 2026-10-28 · **4.3 Jefes de las Profundidades (2 nuevos)** · Dos jefes originales más, **solo en Profundidades I**:
  Profundidades II sigue teniendo únicamente a Mamá, que es el jefe fijo del final de ese tramo, y no se ha desplazado.
  **Carcelero** (`carcelero`, 320 de vida, radio 32): corpulento, con máscara de hierro; camina hacia el jugador a 36
  haciendo girar a su alrededor una **bola de cadena** de púas (radio 88; daña al tocarla, no se puede dañar, las lágrimas
  la atraviesan y no bloquea la sala; el giro se invierte cada 4–6 s). Cada 2–3 s se detiene 1 s y **llama a dos sombras**
  (nunca más de 4). Bajo la mitad de vida gira una **segunda bola**, camina a 44 y, la mitad de las veces, en lugar de llamar
  sombras **lanza las bolas hacia fuera** durante 1,8 s (el radio llega a 168). **Pira Viviente** (`pira`, 280, radio 30):
  hoguera con cara que se arrastra hacia el jugador (24). Cada 2–3 s elige entre **encender fuegos** (marca 3 casillas
  junto al jugador en naranja y a los 0,9 s se incendian; los fuegos dañan medio corazón al tocarlos, se apagan a tiros,
  nunca hay más de 8, ni cerca de las puertas ni bajo el jugador), **lanzar 3 brasas en arco** con marca de caída, o, bajo
  la mitad de vida, una **nova de 12 lágrimas de fuego** (la fase 2 también marca 4 casillas por incendio y camina a 34).
  Al morir se apagan los fuegos que dejó. Su vida se escala por piso (×1,22: 602 y 526 en el piso 5) y dan la recompensa
  de jefe. Datos en `BOSSES`, `FLOORS` y `EN` (nueva parte `ball`, `src/data.js`), comportamientos en `BEHAV`
  (`src/enemies.js`), limpieza de los fuegos en `killEnemy` (`src/entities.js`), dibujos en `drawEnemy` (`src/render.js`;
  la bola dibuja su cadena hasta el Carcelero y la Pira marca las casillas), arenas en `BOSS_ROOMS` (`src/rooms.js`: dos
  para cada uno) y tamaño en la presentación (`src/game.js`). Comprobado: `check-enemies.mjs`, `check-rooms.mjs` (23 salas
  de jefe) y `check-floors.mjs` con 0 problemas; en el juego, fotograma a fotograma: Carcelero (ciclo caminar → llamar,
  4 sombras como máximo, giro invertido, bola inmune que daña un corazón, en fase 2 dos bolas y lanzamiento hasta 168 px,
  y al morir no quedan bolas) y Pira (ciclo encender → caminar → brasas, 3 marcas de brasas, 18 brasas en 40 s, ningún fuego
  junto a las puertas ni bajo el jugador, el fuego quita medio corazón, en fase 2 nova de 12 y 4 casillas, y al morir se
  apagan todos los fuegos), y el dibujo de ambos. La medición destapó un fallo mío, que corregí: la Pira llegaba a **10
  fuegos** porque comprobaba el tope de 8 antes de encender y luego añadía 3 o 4 más; ahora lo comprueba al encender cada
  casilla y se queda en 8 durante 90 s en las dos fases. Tocados: `src/data.js`, `src/enemies.js`, `src/entities.js`,
  `src/render.js`, `src/rooms.js`, `src/game.js`. Pendiente de equilibrar con los demás jefes en la 4.6/4.7.
- 2026-10-28 · **4.4 Jefes del Útero (2 nuevos)** · Dos jefes originales más, **solo en Útero I** (seis posibles):
  Útero II sigue teniendo únicamente a El Corazón, el jefe final. **Coágulo Mayor** (`coagulo`, 330 de vida, radio 36):
  masa de sangre que rebota por la sala en saltos de 0,75 s hacia el jugador; en el aire no se le puede golpear ni hace
  daño. Al caer suelta un **anillo de 6 lágrimas** (8 bajo la mitad de vida) y deja un **charco de sangre** de 6 s. Al
  bajar de **dos tercios** y de **un tercio** de vida se divide: suelta **dos coágulos** (el enemigo normal) cada vez, y
  no más. **Placenta** (`placenta`, 300, radio 34): órgano con venas que apenas se mueve (14 de velocidad, 20 bajo la mitad
  de vida). Cada 2,6–3,4 s late: avisa 0,7 s (se hincha y brilla), suelta un **anillo de 14 lágrimas** y 0,5 s después
  **otro girado** (28 en total). Cada 8–11 s llama a una **pareja de gemelos** (nunca más de 4; son los del enemigo y se
  funden si se tocan). Bajo la mitad de vida, el 40 % de las veces en lugar de latir gira una **espiral de tres brazos**
  durante 2,2 s. La vida se escala por piso (×1,22: 766 y 696 en el piso 7) y dan la recompensa de jefe. Datos en `BOSSES` y
  `FLOORS` (`src/data.js`), comportamientos en `BEHAV` (`src/enemies.js`), dibujos en `drawEnemy` (`src/render.js`), arenas
  en `BOSS_ROOMS` (`src/rooms.js`: columnas o montones de mierda para el Coágulo, fosos o mierda en las esquinas para la
  Placenta) y tamaño en la presentación (`src/game.js`). No hace falta ningún enemigo nuevo: reutilizan el Coágulo y los
  Gemelos. Comprobado: `check-enemies.mjs`, `check-rooms.mjs` (27 salas de jefe) y `check-floors.mjs` con 0 problemas; en
  el juego, fotograma a fotograma: Coágulo (ciclo reposo → salto, intocable e inofensivo en el aire, 8 saltos en 12 s,
  anillo de 6 y de 8, 4 charcos como máximo, división en dos coágulos bajo 2/3 y otros dos bajo 1/3 sin repetirse, y al
  morir no queda nada) y Placenta (ciclo latir → avanzar, 14 lágrimas en el primer anillo y 28 tras el segundo, hasta 4
  gemelos, velocidad 14, en fase 2 espiral de 2,2 s con hasta 32 lágrimas, y al morir no queda nadie), y el dibujo de ambos.
  Tocados: `src/data.js`, `src/enemies.js`, `src/render.js`, `src/rooms.js`, `src/game.js`. Con esto los cuatro tramos tienen
  dos jefes nuevos cada uno. Pendiente de equilibrar con los demás jefes en la 4.6/4.7.
- 2026-10-28 · **4.5 Mini-jefes** · Sustituyen al mini-jefe provisional de la 1.4 (un enemigo normal con el triple de vida y
  dos acompañantes). Ahora la sala de mini-jefe lleva **un jefe pequeño propio del tema, solo**, en el centro: `MINIBOSS_POOLS`
  (`src/data.js`) da Moscardón o Cangrejo en el Sótano, Gólem menor o Cangrejo en las Cuevas, Chamán, Cangrejo o Gólem menor en
  las Profundidades y Moscardón o Chamán en el Útero. Son entradas de `EN` marcadas `mini: true`; `spawnRoomEnemy`
  (`src/game.js`) los crea con `boss = true` (barra de vida, sin empuje, contacto de jefe) y la sala muestra el aviso
  «Minijefe» con su nombre. Vida base 100–150 con la escala normal de enemigos (×(1 + 0,2 por piso)). Al caer se limpia la sala y
  se suelta la recompensa de siempre (un objeto de jefe y un corazón); sus crías desaparecen. **Moscardón** (`mfly`, 100):
  vuela rebotando en diagonal a 70 (98 en fase 2) y cada 2,8–3,6 s dispara un abanico de 3 lágrimas (5) y, la mitad de las
  veces, llama a dos moscas furiosas (nunca más de 4). **Gólem menor** (`mgolem`, 150): camina a 34 (44); si te acercas a
  menos de 100 px pisa tras 0,6 s de aviso y suelta un anillo de 8 lágrimas (12), y cada 3 s lanza un peñasco en arco con
  marca de caída (2). **Chamán** (`mshaman`, 100): aparece, lanza un anillo de 8 lágrimas (12) a los 0,7 s, se desvanece a
  los 1,6 s y reaparece a 0,8 s a 120 px o más; desvanecido no se le puede dañar; en fase 2 repite el anillo a los 1,2 s.
  **Cangrejo** (`mcrab`, 130): se desplaza de lado hasta alinearse con el jugador en un eje, avisa 0,65 s (0,45) y embiste en
  línea recta a 300 (340) hasta chocar; al chocar queda **aturdido 1,4 s, inofensivo y expuesto**. Dibujos en `drawEnemy`
  (`src/render.js`), comportamientos en `BEHAV` (`src/enemies.js`) y `genMiniboss` simplificado (`src/gen.js`).
  `check-enemies.mjs` valida ahora que cada tema solo nombre mini-jefes y que todos salgan en algún tema (42 enemigos y 15
  jefes, 0 problemas). Comprobado: generación (360 pisos, 0 errores, cada tema da solo los suyos, 1 mini-jefe por sala), creación
  como jefe con la vida escalada (210 el Gólem en el piso 3), Moscardón (70 y 98, hasta 4 moscas, abanico de 3 y de 5),
  Gólem (anillo de 8 y de 12, peñascos con marca), Chamán (ciclo visible/oculto, nunca golpeable oculto, reaparece a 202 px,
  anillos de 8 y de 12+12), Cangrejo (aviso 0,63 y 0,45 s, embestida a 300 y 340 en línea recta, aturdimiento de 1,4 s sin
  daño), recompensa al caer (sala limpia, un objeto y un corazón, ningún enemigo vivo) y las moscas del Moscardón
  desaparecen al caer. La medición destapó dos fallos míos, ya corregidos: el Moscardón iba a 85 y 120 por una dirección
  inicial no normalizada, y el Cangrejo seguía haciendo daño el fotograma del choque. Además una compilación falló una vez al
  escribir `dist/artifact.html` (bloqueo momentáneo de Windows) y funcionó al repetirla. Tocados: `src/data.js`,
  `src/enemies.js`, `src/render.js`, `src/gen.js`, `src/game.js`, `tools/check-enemies.mjs`.
- 2026-10-28 · **4.6 Fases** · Auditoría de qué cambiaba cada jefe original al bajar del 50 % de vida: el **Glotón** no cambiaba
  nada; el **Señor Zumbido** solo expulsaba moscas algo antes; el **Gusano Gemelo** solo iba más rápido (150 en vez de 115); la
  **Masa** y la **Llorona** solo subían un poco el número de lágrimas; **Mamá** (la pisada suelta un anillo y descansa menos) y
  **El Corazón** (espirales y anillos de más) ya tenían fase 2 con contenido; los jefes nuevos (4.1–4.4) y los mini-jefes ya la
  tenían. **Transición común** a todos los jefes y mini-jefes (`startPhase2` en `src/entities.js`, se dispara una sola vez
  desde `updateEnemy`): grito con un anillo de 12 lágrimas rojas, sacudida de pantalla, aviso «¡Se enfurece!» con su nombre,
  **protección de 1 s** (el daño se bloquea también cuando llega por una parte del jefe, como los segmentos del Gusano) y, a
  partir de ahí, un **aura roja** (halo y anillo en el suelo, `drawEnemy`). **Nuevo en fase 2:** Glotón —descansa un 40 % menos,
  saltos de hasta 150 px en vez de 110, escupitajo de 20 lágrimas en vez de 13, y la caída desde el aire suelta 14 en vez de
  10 y deja tres charcos ácidos—; Señor Zumbido —vuela un 40 % más rápido, orbita con 4 moscas en vez de 3 y dispara cada
  2,4–3,2 s un abanico de 5—; Gusano Gemelo —su cola dispara cada 1,2–2 s en 8 direcciones en vez de cada 2,5–4 s en 4—;
  Masa —abanico de 7 lágrimas en vez de 5 y 3 escupemoscas en vez de 2—; Llorona —abanico de 5 en vez de 3 y un charco cada
  0,3 s en vez de 0,45—. Comprobado en el juego fotograma a fotograma: la transición en 10 jefes (gloton, zumbido, gusano, masa,
  llorona, mama, corazon, babosa, coagulo, carcelero): se activa una vez, 12 lágrimas, aviso, daño bloqueado durante 1 s y
  recibido después; y cada ataque nuevo comparado con su fase 1 (Glotón 13→20, anillo 10→14, 0→3 charcos, descanso 0,7→0,34 s;
  Zumbido 3→4 moscas, abanico de 5, velocidad 57→80; Gusano 4→8 direcciones y 10→25 voleas en 40 s; Masa abanico 5→7 y 2→3
  escupemoscas; Llorona abanico 3→5 y 0,47→0,32 s entre charcos), más la captura del aviso y el aura. Dos mediciones eran
  inválidas y las rehíce: el Coágulo no recibía daño porque estaba saltando (en el aire es intocable) y el Gusano no disparaba
  porque `e.t3 = 0` se lee como «sin valor» en `(e.t3 || 2)`. Tocados: `src/entities.js`, `src/render.js`, `src/enemies.js`.
  Con esto los jefes y mini-jefes tienen todos una fase 2 visible y con contenido. Pendiente de equilibrar en la 4.7.
- 2026-10-28 · **4.7 Recompensas** · Hasta ahora todos los jefes soltaban lo mismo (objeto de jefe, corazón o alma, trampilla). Ahora
  cada jefe y cada mini-jefe suelta además **sus propios extras**, definidos en la tabla `BOSS_DROPS` (`src/data.js`; 18 entradas, 2,1
  recogibles de media) y repartidos alrededor del centro de la sala por `spawnBossDrops` (`src/game.js`), llamado desde `bossRewards` y
  desde la rama de mini-jefe de `clearRoom`. Jefes: Glotón 2 corazones; Señor Zumbido 3 monedas y 1 bomba; Gusano Gemelo 2 llaves; La
  Masa 2 almas; La Llorona 1 carta y 1 píldora; Mamá 2 almas; Reina Babosa 1 cofre; Gran Topo 2 bombas y 1 moneda; Coloso de Piedra un
  cofre dorado; Rey Minero 1 bomba doble y 1 llave; Carcelero 3 llaves; Pira Viviente 1 corazón negro y 1 bomba; Coágulo Mayor 2
  corazones y medio corazón; Placenta 1 cofre y 1 alma. Mini-jefes: Moscardón 2 monedas, Gólem menor 1 bomba doble, Chamán 1 carta y 1
  píldora, Cangrejo 2 llaves. El Corazón sigue dando solo el trofeo y la sala de reto no cambia. Nuevo `docs/JEFES.md` con todos los
  jefes (dónde salen, vida, fase 2 y recompensas) y los mini-jefes. `check-enemies.mjs` comprueba que cada jefe (salvo El Corazón) y
  cada mini-jefe tiene recompensa y que sus recogibles existen (18 entradas, 0 problemas). Comprobado en el juego: los 14 jefes soltaban
  lo común (corazón o alma, objeto y trampilla) y lo propio; Mamá conserva sus dos objetos; El Corazón da solo el trofeo; los 4
  mini-jefes dejan la sala limpia con su objeto de jefe, su corazón y sus extras; la sala de reto sigue igual (objeto y corazón); y con
  una muerte real el Carcelero suelta exactamente 3 llaves, el Glotón 2 corazones más el común y la Reina Babosa un cofre, sin duplicar.
  Mi primera captura mostraba 6 llaves por culpa de la prueba (llamé a `bossRewards` a mano y el bucle del juego la repitió); con una
  muerte normal sale una sola vez. Tocados: `src/data.js`, `src/game.js`, `tools/check-enemies.mjs`, `docs/JEFES.md` (nuevo). Con esto
  queda **cerrado el bloque 4**.

- 2026-10-28 · **5.1 Aviso de jefe** · La pantalla de presentación ya existía (`drawBossIntro`, estado `bossintro`: jugador, «VS» y
  jefe sobre una banda); se ha completado. Cada jefe tiene ahora un **epíteto** (`title` en `BOSSES`, `src/data.js`; p. ej.
  Glotón «El que nunca se sacia»), que se muestra bajo su nombre; arriba aparece el **nombre del piso** y, tras 0,5 s, un aviso
  parpadeante «Pulsa una tecla para continuar» (o «Toca para continuar» en móvil). Los nombres del jefe y del jugador pasan a ir
  **centrados** bajo su dibujo: con la alineación a la izquierda, «Gusano Gemelo» se salía de la pantalla de 600 px. Los
  mini-jefes siguen con su aviso «Minijefe» (no entran en esta pantalla). Comprobado en el navegador con Glotón y Gusano Gemelo
  (la captura de la transición y la presentación estable) y `check-enemies.mjs` en 0 problemas. Tocados: `src/data.js`,
  `src/game.js`.
- 2026-10-28 · **5.2 Registro de bestiario** · Pantalla nueva `bestiary` con tres pestañas —**Enemigos** (38), **Mini-jefes** (4) y
  **Jefes** (15)— que muestran el progreso de cada una (p. ej. «Enemigos 12/38»). Cada casilla enseña el dibujo del enemigo si se
  ha visto, o «?» si no; la ficha de abajo da nombre, epíteto (jefes), vida base, **veces derrotado** y los temas donde aparece
  (o «Lo invocan otros enemigos»). Se abre con **B** (título y pausa) o con el botón «Bestiario» del título (táctil), se mueve con
  las flechas, **Q** cambia de pestaña y Esc/«Volver» cierra y vuelve a donde se estaba. Funciona en horizontal y en vertical. El
  registro vive en `Store.data.bestiary` (id → derrotas; que exista la clave significa «visto»): `makeEnemy` y `makeBoss`
  (`src/entities.js`) apuntan lo visto y lo guardan al momento, y `killEnemy` suma derrotas (se guardan con el resto de datos al
  cambiar de piso o morir); los segmentos del Gusano Gemelo no cuentan aparte. Los dibujos del bestiario se crean con `noSeen` /
  `quiet`, así que mirarlos no marca nada. Arreglado de paso el ojo de Mamá (`src/render.js`), que fallaba al dibujarse sin
  jugador. Tocados: `src/util.js`, `src/entities.js`, `src/input.js` (tecla B), `src/game.js`, `src/render.js`. Comprobado en el
  navegador: los 57 dibujos sin error y sin marcar nada, ver un enemigo y matarlo lo registra (1 derrota, y se guarda), el Glotón
  sale con «Derrotado: 1 vez», pestañas, ficha de no visto, vertical, Esc vuelve a la pausa y apertura desde el título.
  No hay botón de bestiario en la pausa táctil (el menú de pausa no tiene sitio); en móvil se llega desde el título.
- 2026-10-28 · **5.3 Actualizar README** · Cifras recontadas con el código real (no de memoria): 38 enemigos (5 de ellos solo los
  crean otros), 4 mini-jefes, 15 jefes, 5 variantes de campeón, 33 plantillas de sala (22 con enemigos colocados), 27 salas de jefe
  y 4 salas especiales nuevas; antes decía «17 enemigos y 7 jefes». `README.md` describe ahora los enemigos por tema, los campeones,
  los jefes (fase 2, recompensas y presentación), los mini-jefes, las salas (plantillas, salas grandes y especiales), los tratos
  del diablo y del ángel y el bestiario; añade la tecla B a la tabla de controles y una tabla con las herramientas de `tools/` y los
  documentos de `docs/`. Comprobado: los comandos de la tabla existen y pasan (`check-enemies`, `check-rooms`, `check-floors`).
  Tocados: `README.md`, `docs/TAREAS.md`. Con esto queda **cerrado el bloque 5** y la lista de tareas completa.
- 2026-10-28 · **Extra: filtros por mejora en el menú de trucos** · Pedido aparte tras cerrar la lista. Cada objeto tiene ahora
  `cats` (`itemCats`, `src/items.js`): qué mejora —vida, daño, cadencia, velocidad, alcance, velocidad de disparo, suerte, efectos de
  lágrima, recursos o mapa—, deducido de sus efectos (una estadística solo cuenta si sube, así «Lágrimas +1,5 · Alcance −2,5» sale en
  cadencia pero no en alcance). El filtro de los trucos pasa de 5 a **15 opciones** (`cheatFilters`, `src/game.js`): las 5 de antes
  (Todos, Pasivos, Activos, Familiares, Tus objetos) y 10 nuevas («Mejora de vida», «Mejora de daño»…, «Efectos de lágrima»,
  «Recursos», «Mapa y secretos»). Se cambia con el botón (avanza), con **◀** (retrocede) o con izquierda/derecha estando sobre el
  botón; al cambiar, la selección se queda en el botón (antes saltaba). El resumen de la lista dice el filtro y el número de objetos
  («Vida · 103 objetos · pág. 1/3»). La ficha del objeto muestra ahora sus categorías junto al número y el tipo, y en horizontal
  tiene sitio para 4 líneas de descripción (antes 3; la más larga mide 150 caracteres). Recuento: vida 103, daño 48, cadencia 36,
  velocidad 24, alcance 32, vel. disparo 13, suerte 10, lágrimas 105, recursos 56, mapa 8; 408 objetos de utilidad no entran en
  ninguna categoría y siguen en Todos/Pasivos/Activos. Comprobado en el navegador: los filtros con sus cifras, el teclado sobre
  el botón, el botón ◀, la ficha con el objeto de descripción más larga y la etiqueta de cada botón (acortadas las largas para
  que quepan en vertical). Tocados: `src/items.js`, `src/game.js`.
- 2026-10-28 · **Extra: dificultad al iniciar partida** · Tres niveles —Fácil, Normal y Difícil— que se eligen en el título (botón
  «Dificultad» o tecla Tab; se guarda en `Store.data.diff` y la partida lo fija en `run.diff`) y se ven en la pausa y en la pantalla
  final. Cada nivel multiplica la vida de enemigos, mini-jefes y jefes (×0,8 / ×1 / ×1,25) y el presupuesto de enemigos de las salas
  normales (×0,85 / ×1 / ×1,12); `DIFF_LEVELS` y `diffMul` en `src/data.js`, aplicados en `makeEnemy` y `makeBoss`
  (`src/entities.js`) y en `genNormal` (`src/gen.js`). Fuera de una partida vale 1, así que los validadores y el simulador miden
  Normal. `tools/difficulty.mjs` admite `--dificultad=0|1|2`. Medido con la herramienta: tiempo de limpieza estimado ~0,8× en Fácil
  y ~1,3× en Difícil, y Normal igual que antes (−4 % a +6 %). Mi primera versión (×0,75/×0,8 y ×1,35/×1,2) daba ×0,6 y ×1,6 y la
  suavicé. Al probarla destapé que las herramientas tienen un `G.run` sin `diff` y caían en Fácil: ahora «sin diff» cuenta como
  Normal. Comprobado en el juego: vida del Gaper 12,8 / 16 / 20 y del Glotón 332 / 415 / 519 en el piso 4, Tab alterna los tres
  niveles y los guarda, la partida toma el elegido y la pausa lo muestra. No cambia el daño que recibe el jugador ni los objetos.
  Tocados: `src/data.js`, `src/entities.js`, `src/gen.js`, `src/game.js`, `src/util.js`, `src/input.js`, `tools/difficulty.mjs`,
  `docs/DIFICULTAD.md`, `README.md`.
