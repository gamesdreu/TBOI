# Dificultad de los enemigos y de las salas

Cómo se mide y se ajusta la dificultad. Todo sale del código real; la herramienta es `tools/difficulty.mjs`:

```bash
node tools/difficulty.mjs 150 --crecimiento=0.25 --base=7 --paso=1.5
```

Admite el número de pisos por nivel (150 por defecto), `--crecimiento` (cuánto sube el daño por segundo del jugador por
piso), `--sala` (segundos fijos por sala), y la curva objetivo con `--base`, `--paso` y `--tolerancia`.

## Dónde están los números

- **Por enemigo:** vida, radio, velocidad y `cost` en `EN` (`src/data.js`). El `cost` es lo que "gasta" de presupuesto en
  una sala.
- **Escala por piso:** `DIFFICULTY` (`src/data.js`): la vida se multiplica por `1 + piso × hpPerFloor` (0,2); el
  presupuesto de una sala normal es `(budgetBase + piso × budgetPerFloor + azar × budgetSpread) × budgetFloorMul[piso] ×
  celdas` (2,2 + 0,75 por piso + hasta 1,8 de azar). `budgetFloorMul` es un ajuste por piso, 1 = sin cambio.
- **Quién sale en cada tema:** `ENEMY_POOLS` (`src/data.js`), con pesos.

## Método

1. **Vida efectiva** de cada enemigo (tabla `EFECTIVA` de la herramienta). Es la vida multiplicada por la parte del tiempo
   que no se le puede dañar (`mul = 1 / fracción del ciclo en que se le puede golpear`), más la de las crías que deja o
   llama. Son estimaciones razonadas, no medidas: Escarabajo ×1,5 (armadura), Topo ×1,8 (sobre tierra ~48 % del ciclo),
   Parpadeo ×1,7, Espectro ×1,15, Calavera ×1,5, Brincador ×1,4, Imparable ×1,1, Sanador ×1,2 (apoyo); y crías: Gelatina
   dos gelatinitas, Invocador tres sombras, Hinchado y Colmena tres moscas furiosas, Araña gigante dos arañas, Carnoso 7 de
   vida al resucitar.
2. **Escala de coste.** Los 17 enemigos originales dan una mediana de **10 de coste por cada 100 de vida efectiva**
   (el Boquiabierto: 10 de vida, coste 1). Un enemigo está "bien" si su coste queda a ±30 % de `vida efectiva × 0,10`.
3. **Tiempo de limpieza de una sala normal** = vida efectiva total de sus enemigos ÷ daño por segundo del jugador + 3 s
   fijos (moverse y esquivar). Se supone un daño por segundo inicial de 9,6 (daño 3,5 × 2,73 lágrimas por segundo) que
   crece un 25 % por piso por los objetos que se van cogiendo.
4. **Curva objetivo:** 7 s en el primer piso y +1,5 s por piso, es decir, de 7 a 17,5 s. Se acepta una desviación de ±10 %.

## Qué se ha cambiado (tarea 3.6)

**Costes de enemigos nuevos**, porque salían entre un 30 % y un 50 % por debajo de lo que pesan:

| Enemigo | Coste antes → ahora | Desvío antes → ahora |
| --- | --- | --- |
| Gelatina | 1,4 → 2,2 | −50 % → −21 % |
| Topo | 1,5 → 1,8 | −31 % → −17 % |
| Escarabajo | 1,8 → 2,3 | −40 % → −23 % |
| Parpadeo | 1,4 → 1,7 | −31 % → −17 % |
| Invocador | 1,8 → 2,6 | −47 % → −24 % |
| Imparable | 2,2 → 3,3 | −50 % → −25 % |
| Sanador | 1,8 → 2,2 | 0 % → +2 % (con el 20 % extra por apoyo) |

El resto de los nuevos (Aspa, Baboso, Minero, Mortero, Vigía, Furioso, Espectro, Espiral, Gemelo) ya estaban dentro de
±25 %. Las vidas no se han tocado.

**Presupuesto por piso** (`budgetFloorMul` = 1 · 1 · 0,94 · 1 · 0,87 · 0,92 · 1 · 1): las reservas de Cuevas I y sobre
todo de Profundidades I tienen enemigos más duros que las de los pisos vecinos y daban un escalón. Tiempo de limpieza
estimado por piso:

| Piso | Antes | Ahora | Objetivo | Desvío ahora |
| --- | --- | --- | --- | --- |
| 1 Sótano I | 7,0 s | 6,9 s | 7,0 s | −2 % |
| 2 Sótano II | 8,4 s | 8,1 s | 8,5 s | −4 % |
| 3 Cuevas I | 10,8 s | 10,5 s | 10,0 s | +5 % |
| 4 Cuevas II | 11,6 s | 11,3 s | 11,5 s | −2 % |
| 5 Profundidades I | 15,1 s | 13,7 s | 13,0 s | +6 % |
| 6 Profundidades II | 15,8 s | 15,0 s | 14,5 s | +3 % |
| 7 Útero I | 16,2 s | 15,9 s | 16,0 s | 0 % |
| 8 Útero II | 17,3 s | 17,5 s | 17,5 s | 0 % |

## Pendiente de decidir

Siete enemigos **originales** cuestan bastante menos de lo que pesan por su vida efectiva (Calavera −38 %, Gordinflón −50 %,
Hinchado −55 %, Carnoso −35 %, Araña gigante −46 %, Colmena −49 %, Brincador −40 %), y la Mosca cuesta un 50 % más. No se han
tocado porque son el diseño original, pero explican por qué las salas de Profundidades y Útero pesan tanto: son los
enemigos más baratos por vida. Subirles el coste las haría más ligeras (menos enemigos por sala) y habría que subir
`budgetPerFloor` o `budgetFloorMul` para compensar. Si se quiere, es un ajuste de una línea por enemigo más una pasada de
`difficulty.mjs`.

## Límites

- El tiempo de limpieza es una estimación: no mide puntería, esquivas ni el daño que reciben los enemigos de los
  objetos del jugador. Sirve para comparar pisos y enemigos entre sí, no para predecir segundos reales.
- Los campeones cuentan con 1,7 veces la vida (la media de sus variantes).
- Los jefes, las salas especiales y las salas de reto no entran en esta tabla.
