# Tratos del diablo y salas del ángel

Reglas de aparición tras derrotar a un jefe (desde el segundo piso). El cálculo está en `dealChance` y las cifras en
`DEAL_RULES`, ambos en `src/gen.js`; cambiar una cifra de esa tabla basta para reequilibrar.

## Probabilidad de que se abra un trato

Se parte de la base y se suman o restan los ajustes; el resultado se limita a **5 %–95 %**
(salvo `devil100` y `eucharist`, que lo fuerzan al 100 %).

| Situación | Efecto |
| --- | --- |
| Piso **sin** recibir daño | base **55 %** |
| Piso en el que **has recibido daño** | base **20 %** (no se suma la racha) |
| Cada jefe **seguido** derrotado sin daño en su piso (máx. 3) | **+5 %** cada uno |
| Cada **sala especial visitada** en el piso (máx. 5) | **−3 %** cada una |
| Cada **trato ya aceptado** en la partida (máx. 3) | **−8 %** cada uno |
| Cada pasivo `devil` o `angel` | **+15 %** cada uno |
| Pasivo `devil100` o `eucharist` | **100 %** |

- **Racha:** `run.noHitStreak` sube en 1 cada vez que se derrota un jefe sin haber recibido daño en ese piso, y vuelve a
  0 si hubo daño. Cuenta también el primer piso, aunque ahí no haya trato.
- **Salas especiales:** cuentan las visitadas (no las simplemente vistas en el mapa) de estos tipos: tienda, tesoro,
  secreta, biblioteca, sacrificio, reto y minijefe (`DEAL_SPECIAL_TYPES`). El inicio y el jefe no cuentan.
- **Tratos aceptados:** `run.dealsTaken` sube en 1 la primera vez que se coge un objeto de una sala del diablo o del
  ángel; coger más objetos de la misma sala no cuenta de nuevo.

## Reparto entre diablo y ángel

Cuando se abre un trato, esta es la parte de las veces que es sala del **ángel** (el resto, diablo). Se limita a 0 %–100 %.

| Situación | Efecto sobre el ángel |
| --- | --- |
| Base, sin tratos aceptados | **50 %** |
| Pasivo `angel` | **+25 %** |
| Cada trato del **diablo** aceptado | **−25 %** cada uno (menos ángel) |
| Cada trato del **ángel** aceptado | **+25 %** cada uno (menos diablo) |

Casos especiales, que mandan sobre lo anterior:

- `eucharist` fuerza el ángel (**100 %**).
- `devil100` fuerza el diablo (**0 %**); si están los dos pasivos, gana `devil100`.
- `duality` abre las **dos puertas** a la vez, así que el reparto no se sortea.

`run.devilDeals` y `run.angelDeals` cuentan los tratos aceptados de cada tipo, con la misma regla que `dealsTaken`: suben
la primera vez que se coge un objeto de una sala, y coger más de la misma sala no cuenta de nuevo. Antes bastaba un
trato del diablo para que no saliera nunca más un ángel; ahora son dos tratos seguidos los que lo anulan.

## Qué ofrece cada sala

Cada sala sortea una **oferta** (`DEAL_OFFERS` en `src/gen.js`; la genera `dealOffer`). Una oferta es una lista de 1 a 3
objetos, cada uno pasivo (`p`) o activo (`a`) y con su forma de pago. Los objetos salen de la reserva del diablo o del
ángel, sin repetirse; si no queda ninguno del tipo pedido se elige entre todos.

Formas de pago:

| Pago | Coste | Dónde se ve |
| --- | --- | --- |
| Corazones rojos (`hprice`) | 1 corazón (40 %) o 2 (60 %), como antes | corazones rojos |
| Corazones de alma (`sprice`) | 2 corazones, 3 si el objeto es de calidad 3 o más; no se puede pagar si dejaría sin vida | corazones azules |
| Monedas (`price`) | 10 + 5 por la calidad del objeto, y 10 más si es activo (10–40) | `25¢` |
| Llaves (`kprice`) | 1 llave, 2 si es de calidad 3 o más | `1 llave` / `2 llaves` |
| Gratis | nada | sin precio |

The Lost lo obtiene todo gratis; Keeper y el pasivo `poundflesh` pagan las vidas y almas con monedas (15 por corazón).

Ofertas del **diablo** (peso entre paréntesis; nunca hay objetos gratis):

| Oferta | Peso |
| --- | --- |
| 2 pasivos por corazones rojos | 4 |
| 3 pasivos por corazones rojos | 3 |
| 1 pasivo por corazones rojos + 1 activo por monedas | 3 |
| 1 pasivo por almas + 1 pasivo por corazones rojos + 1 activo por monedas | 2 |
| 2 pasivos por monedas | 2 |
| 2 pasivos por almas | 1,5 |

Ofertas del **ángel** (todas sin pago en vida ni monedas):

| Oferta | Peso |
| --- | --- |
| 2 pasivos gratis, **elige uno** | 4 |
| 3 pasivos gratis, **elige uno** | 3 |
| 1 pasivo + 1 activo gratis, **elige uno** | 3 |
| 1 pasivo gratis (sin elección) | 2 |
| 2 pasivos por llaves, se pueden coger los dos | 2 |

Con estos pesos, alrededor del 32 % de las salas del diablo y del 20 % de las del ángel llevan un activo.

## Simulación

`tools/sim-deals.mjs` juega partidas enteras sin abrir el juego y mide los tratos con las reglas reales de `dealChance`:

```bash
node tools/sim-deals.mjs 20000 --pasivos=angel --semilla=3
```

- Primer argumento: partidas por estilo de jugador (5.000 por defecto). `--pasivos=` admite `devil`, `angel`, `devil100`,
  `eucharist` y `duality`, separados por comas. `--semilla=` fija el azar: la misma semilla da el mismo resultado.
- Simula seis jefes por partida (pisos 2 a 7) con cuatro estilos de jugador: **Novato** (recibe daño en el 70 % de los
  pisos), **Cuidadoso** (25 %), **Experto** (5 %) y **Experto que lo recoge todo** (visita todas las salas especiales y
  acepta todos los tratos). Las salas especiales de cada piso salen de pisos generados de verdad.
- Para cada estilo muestra la probabilidad media de trato por jefe, los tratos por partida, el reparto ángel/diablo, los
  tratos aceptados, la frecuencia por piso y cuántas partidas tienen 0, 1, 2… tratos. Termina con `0 problemas` o con la
  lista de probabilidades fuera de rango.

Resultados con los valores actuales (sin pasivos, 5.000 partidas por estilo):

| Estilo | Prob. de trato por jefe | Tratos por partida | Ángel / diablo |
| --- | --- | --- | --- |
| Novato | 23 % | 1,4 | 50 % / 50 % |
| Cuidadoso | 40 % | 2,4 | 50 % / 50 % |
| Experto | 52 % | 3,1 | 49 % / 51 % |
| Experto que lo recoge todo | 45 % | 2,7 | 49 % / 51 % |

Lo que se ve: la probabilidad baja piso a piso (en el Experto, del 58 % en el piso 2 al 44 % en el 7) porque se acumulan
salas visitadas y tratos aceptados; recogerlo todo cuesta unos 7 puntos de probabilidad frente a un Experto selectivo;
y, como los tratos aceptados se compensan, el reparto queda cerca del 50/50 salvo con pasivos. Con `angel` el ángel sube
a cerca del 80 %, `devil100` da 6 tratos de diablo por partida y `eucharist` 6 de ángel.

## Ejemplos

| Partida | Probabilidad |
| --- | --- |
| Primer jefe tras el piso 1, sin daño, tienda y tesoro visitados | 55 % − 6 % = **49 %** (+5 % de racha = **54 %**) |
| Tres jefes seguidos sin daño, sin salas especiales | 55 % + 15 % = **70 %** |
| Tres jefes sin daño, 3 salas especiales y 1 trato aceptado | 55 % + 15 % − 9 % − 8 % = **53 %** |
| Con daño, 2 salas especiales | 20 % − 6 % = **14 %** |
| Con daño y el pasivo `devil` | 20 % + 15 % = **35 %** |

Reparto (parte de ángel):

| Partida | Ángel |
| --- | --- |
| Sin tratos aceptados | **50 %** |
| Un trato del diablo aceptado | 50 % − 25 % = **25 %** |
| Dos tratos del diablo aceptados | **0 %** |
| Un trato del diablo y pasivo `angel` | 50 % + 25 % − 25 % = **50 %** |
| Un trato del ángel aceptado | 50 % + 25 % = **75 %** |
| Un trato de cada tipo | **50 %** |
