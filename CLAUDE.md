# D6 Crawler (Archeodice + Colossus D6) — notas del proyecto

Proyecto de Max. Responde siempre en **español**, corto (lo lee en el celular). Antes de publicar, corre las pruebas.

## Qué es
- Juego de dados solitario web, un solo `index.html`, publicado con GitHub Pages en https://maxodog.github.io/d6-crawler/ (repo `maxodog/d6-crawler`, rama `main`).
- Dos mundos con las mismas reglas: **Archeodice** (explorador de ruinas; mapas y cifras del juego original *One Card Dungeon*) y **Colossus D6: Kaiju Protocol** (mecha vs kaiju; contenido propio).
- Cada mundo guarda progreso, logros, desbloqueos y partidas por separado (también en la nube). El usuario conectado se comparte entre mundos.
- El juego original sin re-tematizar vive en otro repo (`maxodog/dungeon-in-one-card`), solo para Max y Monogu (modo Clásico con cartas reales). No copiar sus cartas ni portadas a este repo.

## Estructura
- `src/`: `worlds.js` (datos de cada mundo), `engine.js` (reglas, sin DOM), `ui.js`, `style.css`, `template.html`, `sounds.js`, `music.js`, `build.py`.
- `python3 build.py` (desde `src/`) genera `src/index.html`; **cópialo a la raíz** (`index.html`) antes de publicar.
- `img/arch/*.jpg` e `img/kaiju/*.jpg`: portadas (base, mguf, peak, harbour, hell). `musica/`: canciones.
- Mundo activo: `?w=arch|kaiju` o `localStorage 'dw:world'`; sin mundo aparece el selector. `?w=orig` (solo local/file://) usa los nombres originales: lo usan las pruebas.
- Almacenamiento: `ui.js` hace sombra de `localStorage` y antepone `dw:<mundo>:` a las claves (salvo idioma, sonido y música, que van con `dw:`). Sesión compartida: `dw:session`.
- Nube (Firebase REST, proyecto `dungeon-in-one-card`, Firestore `users/{uid}`): cada mundo escribe su propio campo (`data_arch`, `data_kaiju`) con `updateMask`, para no borrar los otros.

## Cómo se re-tematiza (worlds.js + ui.js)
- `WORLDS[mundo]`: `games`, `mon` (nombres), `titles` (títulos de nivel por título original), `heroes`, `items` (nombre y nombre corto), `terms` (frases a reemplazar), `logo`, `tagline`.
- `L(es, en)` pasa todo texto visible por `wsub()`, que cambia nombres y términos originales por los del mundo (los nombres nuevos se mapean a sí mismos para no reemplazar dos veces).
- Colossus además define `stats`, `levels.base` (niveles propios), `heroPack` (héroes en otras expansiones) y `rogueNoCap`.
- Íconos de monstruos propios por mundo: `WORLD_ICONS_SRC` en `ui.js`. Héroes e ítems todavía usan los íconos comunes.

## Reglas de diseño que no se cambian sin que Max lo pida
- Mecánicas afinadas: IA de monstruos (`chooseMove`: A) si puede atacar, va a su alcance máximo con línea de visión; B) si no, a la casilla de ataque con menos turnos; C) si no, se acerca), sin diagonal entre dos obstáculos, habilidades del héroe con tope 6 (`SKILL_MAX`).
- Logros y desbloqueos usan los ítems con que se **empezó** la aventura (`G.startItems`).
- Topes: la **vida de los monstruos** y los **atributos del héroe** van hasta 6. Velocidad, ataque, defensa y alcance de los monstruos pueden llegar a 7 u 8.
- **Pícaro / Contrabandista (Archeodice) mantiene el tope de 6** al sumar +1 a los dados (decisión de Max, aunque el original no lo especifica). El **Hacker de Colossus no tiene tope** (`rogueNoCap`).
- Pantalla de mejora: el último botón es «Ver la campaña hasta ahora» (destacado en naranja); «Curarte» no va destacado ni al final.
- En el celular, la selección de aventura muestra una portada por fila.
- Créditos visibles: «inspirado en las reglas de One Card Dungeon, de Barny Skinner»; sin arte ni textos originales.

## Colossus D6: estado del contenido propio
- **Kaiju Protocol (base)**: hecho. Kaiju: Mordedor 3/6/5/3/3, Escupidor 3/4/5/5/5, Acorazado 5/3/6/6/3, Rugidor 3/5/7/5/4 (vida/vel/atq/def/alc). 12 niveles en `worlds.js` (`levels.base`).
- Héroes: base = Bastión, Francotirador, Mecánica, Hacker; Alerta Omega = Furia, Oráculo, Ariete, Saltador; Glaciar = Sobrecarga; Bahía = Arpón; Fisura = Fantasma.
- **Pendiente**: Alerta Omega (reutiliza los 12 mapas del base y suma 4 jefes propios), Operación Glaciar (10 niveles, ventisca), Bahía Abisal (8, agua), Fisura Infernal (12 + 4 jefes, grietas de magma + Roca del Núcleo). Hoy usan los mapas y cifras originales. Hacer efectos de algunos ítems y habilidades distintos al original.
- Objetivo de equilibrio: ganar la aventura igual de difícil que su equivalente de Archeodice, con dificultad que suba de forma pareja y ningún nivel trivial.

## Herramientas de equilibrio (Node)
- `node test/balance.js 80` (con `ONLY=own` mide solo Colossus): daño, derrotas y turnos por nivel, empezando cada nivel con Vida 6 y mejoras típicas. Variables: `WORLD`, `GAME`, `LV=1,2`.
- `CAMPAIGN=200 node test/balance.js`: campañas completas (original vs propio); reporta % que llega a cada nivel, % de victorias y nivel medio. Referencia original base: nivel medio 6,1, gana 1%. Kaiju Protocol actual: 6,7 y 1%.
- `node test/design.js` (`T0`, `T1`, `NS`, `TRIES`, `LVS=2,4`): busca cantidad y posiciones de aparición para acercar cada nivel a una curva de daño objetivo. Imprime `AT=[...]` para pegar en `worlds.js`.
- El bot es débil (gana poco): sirve para comparar versiones, no como dificultad absoluta. Cada campaña de 200 tarda ~7 min; córrelas en segundo plano.

## Pruebas y publicación
- Pruebas en `test/` (Playwright con `/usr/bin/google-chrome`, Node). Tienen rutas absolutas a `/home/claude/d6-crawler/`; si clonas en otra carpeta, ajústalas con `sed`.
- `src/tools_runall.sh` corre todas y termina con `FAIL=0/1`; tarda ~12 min (córrelo en segundo plano). **Publica solo si FAIL=0.** `ui_test.py` está obsoleta y se omite.
- `world_text_test.py` revisa que no queden nombres del original en pantalla en ambos mundos e idiomas.
- Commit con los trailers de atribución que indique la sesión y `git -c push.negotiate=true push origin main`.
- Cambios de UI o reglas que también apliquen al juego antiguo: aplícalos además en `maxodog/dungeon-in-one-card` (mismo `ui.js` base, sin `worlds.js`).
