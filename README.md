# Lágrimas del Sótano

Fan-game roguelike inspirado en *The Binding of Isaac* (Edmund McMillen). Reproduce sus mecánicas
(pisos procedurales, salas cerradas hasta limpiarlas, lágrimas, bombas, llaves, tiendas, salas
secretas, tratos con el diablo y salas del ángel, píldoras, cartas, objetos activos y pasivos,
familiares, jefes y Mamá). Los nombres de objetos y personajes y sus estadísticas proceden de la
[wiki de The Binding of Isaac en Fandom](https://bindingofisaac.fandom.com/es/wiki/Objetos) (CC BY-SA);
el **arte y el sonido son originales y se generan por código**. Es un único archivo HTML sin
dependencias que funciona en PC, Android e iOS.

## Jugar

| Dónde | Cómo |
| --- | --- |
| **PC** | Abre `dist/index.html` con doble clic (Chrome, Edge, Firefox o Safari). |
| **Móvil (misma Wi‑Fi)** | En el PC ejecuta `node serve.mjs` y abre en el móvil la dirección `http://192.168.x.x:8080` que aparece. |
| **Móvil (cualquier sitio)** | Sube la carpeta `dist/` a GitHub Pages, Netlify o Cloudflare Pages. Desde el navegador del móvil usa *Añadir a pantalla de inicio* y se instala como app a pantalla completa (funciona sin conexión). |

Se juega mejor con el móvil en horizontal, aunque también funciona en vertical.

## Controles

| Acción | Teclado | Móvil | Mando |
| --- | --- | --- | --- |
| Moverse | W A S D | Joystick izquierdo (toca en la mitad izquierda) | Stick izquierdo / cruceta |
| Disparar | Flechas | Joystick derecho (4 direcciones) | Stick derecho o A/B/X/Y |
| Bomba | E | Botón de bomba | LB |
| Objeto activo | Espacio | Botón de objeto | RB |
| Píldora / carta | Q | Botón de bolsillo | LT |
| Cambiar activo (Mochila) | F | Botón pequeño junto al objeto | RT |
| Trucos | T o º | Pausa → Trucos | — |
| Pausa | P / Esc | Botón de pausa | Start |
| Silencio | M | En la pausa | Select |

Con objetos que cargan el disparo (Azufre, Tech X, Batido de chocolate, Cuchillo de Mamá, Fetus épico…)
mantén la dirección de disparo y suéltala para lanzar el ataque.

## Contenido

- **8 pisos**: Sótano I‑II, Cuevas I‑II, Profundidades I‑II (Mamá), Útero I‑II (El Corazón).
- **34 personajes** con las estadísticas de la wiki: los 17 normales (Isaac, Magdalena, Cain, Judas, ???,
  Eve, Samson, Azazel, Lazarus, Eden, The Lost, Lilith, Keeper, Apollyon, The Forgotten, Bethany,
  Jacob y Esau) y sus 17 variantes *Tainted* (con mecánicas simplificadas), más Dark Judas y
  Lazarus Risen al resucitar.
- **718 coleccionables** (todos los de la wiki, del juego original a Repentance, más El Gamekid y el
  Cuchillo de Mamá, que faltaban en sus tablas). Cada uno tiene su efecto en el juego: subidas de
  estadísticas, corazones rojos, de alma, negros y de moneda, efectos de lágrima (teledirigidas,
  perforantes, espectrales, veneno, fuego, miedo, encanto, congelación, electricidad…), modos de
  disparo (azufre, láser, cuchillo, Fetus épico, Ludovico, Tech X, disparos cargados, espada, garrote,
  lágrimas explosivas…), más de 100 familiares, objetos activos, resurrecciones y efectos al recibir
  daño, matar o entrar en una sala. Los objetos más complejos están simplificados y lo indican en su
  descripción.
- **17 enemigos y 7 jefes**: Glotón, Señor Zumbido, Gusano Gemelo, La Masa, La Llorona, Mamá y El Corazón.
- Tienda, sala del tesoro, sala secreta (se abre con bombas), tratos con el diablo, salas del ángel,
  cofres, baterías, rocas marcadas, barriles explosivos, fuegos, pinchos y fosos.
- **22 cartas del tarot** y **17 efectos de píldora** que se identifican al tomarlas.
- **Estadísticas en pantalla** (velocidad, lágrimas, daño, alcance, velocidad de disparo y suerte), con
  el cambio en verde o rojo al coger un objeto. Se pueden ocultar desde la pausa.
- **Menú de trucos** (tecla T o desde la pausa): coger cualquiera de los 718 objetos, invencibilidad,
  daño ×5, matar a todos, recursos, curar, cargar el activo, revelar el mapa, ir al jefe o pasar de piso.
  Las partidas con trucos no cuentan como victoria.

## Desarrollo

El código está en `src/` (JavaScript sin dependencias). Tras editarlo, vuelve a generar el HTML:

```bash
node build.mjs
```

Esto crea `dist/index.html` (juego completo en un archivo), `manifest.webmanifest`, `sw.js` e
`icon.svg` para instalarlo como app.

Los objetos se definen en `tools/itemspecs.txt` (un efecto por línea, con el formato explicado al
principio del archivo) y se combinan con los nombres de la wiki (`tools/wiki/items.json`):

```bash
node tools/gen-items.mjs
```
