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
- Colossus además define `stats` (cifras por defecto), `gstats` (cifras por aventura, jefes incluidos), `levels.<aventura>` (niveles propios), `heroPack` (héroes en otras expansiones) y `rogueNoCap`.
- `E.ownLevels(defs, stats, i0)` (en `engine.js`) construye los niveles propios de una aventura; lo usan `ui.js`, `balance.js` y `design.js`. Cada nivel: `{ t, m, map, at, chest: 1 }`; los jefes: `{ boss: k, t, m, map }` (aparece en el centro, sin cofre, sin mejora previa).
- Íconos propios por mundo en `ui.js`: `WORLD_ICONS_SRC` (monstruos) y `WORLD_HERO_ICONS_SRC` (héroes, pensados para el nombre de cada mundo: sombrero de explorador para la Arqueóloga, mira para el Francotirador, etc.). La Escaladora se queda con la montaña del ícono común. Los ítems todavía usan los íconos comunes.
- `WORLDS[mundo].abilVar` cambia una habilidad de héroe solo en ese mundo: `ui.js` la pasa con `E.setAbil()` y el motor decide en `abilityInfo`. Hoy `{ corsair: 'swap', necromancer: 'burst', paladin: 'free', ranger: 'range1' }`:
  - **Saltador**: una vez por nivel cambia de lugar con cualquier kaiju del tablero (`swapInfo`/`swapMon`), sin gastar Movimiento.
  - **Sobrecarga**: una vez por nivel pierde 1 de Vida y hace 1 de daño a todos los kaiju a su Alcance con línea (`burstInfo`/`burstTargets`/`burstStrike`).
  - **Bastión**: el dado conservado ya no queda fijo a su habilidad; se reparte donde se quiera (`rollWithKeep` no pone `lock`).
  - **Francotirador**: +1 de Alcance pasivo, sin botón. El Alcance del héroe se calcula en un solo sitio, `heroRng(st)`, que suma ese bono como lo haría un objeto (puede pasar de 6).
  Archeodice conserva las cuatro habilidades originales. Lo cubren `test/abil_test.js` y `test/swap_test.py`.

## Reglas de diseño que no se cambian sin que Max lo pida
- Mecánicas afinadas: IA de monstruos (`chooseMove`: A) si puede atacar, va a su alcance máximo con línea de visión; B) si no, a la casilla de ataque con menos turnos; C) si no, se acerca), sin diagonal entre dos obstáculos, habilidades del héroe con tope 6 (`SKILL_MAX`).
- **Fase de los monstruos: secuencia estricta y una sola vuelta** (decisión de Max). Se ordenan por cercanía al aventurero y cada uno decide **solo para sí mismo**, con el tablero tal como está en ese momento: no predice los movimientos de los otros monstruos ni del aventurero, no hay plan de grupo y nadie vuelve a moverse después. Si le da lo mismo, se queda quieto, aunque luego otro monstruo le tape la línea. Si ya está a alcance pero no en su alcance máximo, puede alejarse hasta el máximo mientras no pierda la línea. No volver a agregar la «segunda oportunidad» que existía antes.
- Logros y desbloqueos usan los ítems con que se **empezó** la aventura (`G.startItems`).
- **Estrellas por aventura** (`STARS` en `ui.js`, se guardan en `rec.games[aventura].stars` y en el progreso de invitado): Superada (oro), Dos expansiones (celeste, ganada con héroes de dos expansiones distintas), Sin objetos (verde, sin gastar ningún objeto: lo marca `st.itemEver` en el motor) y Sin habilidad (violeta, sin usar la habilidad; los héroes con habilidad pasiva —Mecánica y el Francotirador de Colossus— no la pueden ganar). Las aventuras sin objetos muestran 3 y las de objetos 4. Se ven arriba de la portada en la tarjeta de la aventura y se avisan en el resumen final. Lo cubre `test/stars_test.py`.
- `DEBUG_USERS` en `ui.js`: el usuario **Max** tiene todas las aventuras abiertas (y con ellas héroes y objetos) para probar; el resto las desbloquea jugando.
- Topes: la **vida de los monstruos** y los **atributos del héroe** van hasta 6. Velocidad, ataque, defensa y alcance de los monstruos pueden llegar a 7 u 8.
- **Pícaro / Contrabandista (Archeodice) mantiene el tope de 6** al sumar +1 a los dados (decisión de Max, aunque el original no lo especifica). El **Hacker de Colossus no tiene tope** (`rogueNoCap`).
- Pantalla de mejora: el último botón es «Ver la campaña hasta ahora» (destacado en naranja); «Curarte» no va destacado ni al final.
- En el celular, la selección de aventura muestra una portada por fila.
- Créditos visibles: «inspirado en las reglas de One Card Dungeon, de Barny Skinner»; sin arte ni textos originales.

## Colossus D6: estado del contenido propio
- **Kaiju Protocol (base)**: hecho. Kaiju: Mordedor 3/6/5/3/3, Escupidor 3/4/5/5/5, Acorazado 5/3/6/6/3, Rugidor 3/5/7/5/4 (vida/vel/atq/def/alc). 12 niveles en `worlds.js` (`levels.base`).
- Héroes: base = Bastión, Francotirador, Mecánica, Hacker; Alerta Omega = Furia, Oráculo, Ariete, Saltador; Glaciar = Sobrecarga; Bahía = Arpón; Fisura = Fantasma.
- **Alerta Omega (mguf)**: hecho. 12 niveles con los 12 mapas de Kaiju Protocol (cada kaiju en sus propios sectores) + 4 jefes con mapas propios tras los niveles 3, 6, 9 y 12. Cifras en `gstats.mguf`: Mordedor 4/7/4/3/3, Escupidor 3/3/6/4/6, Acorazado 5/3/5/7/3, Rugidor 4/6/7/4/5; jefes Rey Coraza 5/4/7/3/5, Rey Polilla 5/8/8/4/6, Rey Tormenta 7/6/8/6/6, Kaiju Omega 12/8/8/8/8.
- **Operación Glaciar (peak)**: hecho. 10 niveles con **4 mapas propios en dos pares girados 180°** (como las dos caras de la carta original): A ↔ A' y B ↔ B'; A va con el Rastreador (niveles 1, 4, 7), B con el Sabueso (2, 5, 8), A' con el Behemot (3, 6, 9) y B' con El Durmiente (10). Al girar un mapa, la escalera de entrada y la de salida se intercambian. Cifras en `gstats.peak`: Rastreador de escarcha 2/6/4/3/4, Sabueso glacial 2/7/5/4/3, Behemot glacial 5/3/6/5/3, El Durmiente del Hielo 10/4/8/6/6. Cantidad de kaiju por nivel como el original (2,2,1,3,3,2,5,4,3,1) y posiciones propias.
- **Pendiente**: Bahía Abisal (8, agua), Fisura Infernal (12 + 4 jefes, grietas de magma + Roca del Núcleo). Hoy usan los mapas y cifras originales. Hacer efectos de algunos ítems y habilidades distintos al original. Hechas: **Saltador**, **Sobrecarga**, **Bastión** y **Francotirador** (ver `abilVar` más arriba). Max decidió **no tocar Furia**. Faltan efectos propios de **ítems**, sobre todo en Glaciar, Bahía y Fisura.
- Objetivo de equilibrio: ganar la aventura igual de difícil que su equivalente de Archeodice, con dificultad que suba de forma pareja y ningún nivel trivial.

## Herramientas de equilibrio (Node)
- `node test/balance.js 80` (con `ONLY=own` mide solo Colossus): daño, derrotas y turnos por nivel, empezando cada nivel con Vida 6 y mejoras típicas. Variables: `WORLD`, `GAME`, `LV=1,2`.
- `CAMPAIGN=200 node test/balance.js`: campañas completas (original vs propio); reporta % que llega a cada nivel, % de victorias y nivel medio. `ONLY=own` u `ONLY=orig` miden solo uno. Medidas con la fase de monstruos de una sola vuelta (200 campañas, ±0,3 de ruido): base original 5,2 y gana 1%, Kaiju Protocol 6,9 y 1%; Alerta Omega original 5,4 y 0%, propio 6,1 y 0%; Glaciar original 6,9 y gana 6%, propio 6,9 y gana 3%.
- `GSTATS='{"ogre":{"hp":5,...}}' node test/balance.js` prueba cifras sin tocar `worlds.js` (útil para los jefes).
- `node test/design.js` (`T0`, `T1`, `NS`, `TRIES`, `LVS=2,4`, `CNT=2,2,1,…` para fijar la cantidad por nivel y buscar solo posiciones): busca cantidad y posiciones de aparición para acercar cada nivel a una curva de daño objetivo. Imprime `AT=[...]` para pegar en `worlds.js`.
- El bot es débil (gana poco): sirve para comparar versiones, no como dificultad absoluta. Cada campaña de 200 tarda ~7 min; córrelas en segundo plano.

## Pruebas y publicación
- Pruebas en `test/` (Playwright con `/usr/bin/google-chrome`, Node). Tienen rutas absolutas a `/home/claude/d6-crawler/` (las de Node cargan `../src/engine.js`); si clonas en otra carpeta, ajústalas con `sed`. `mon_detour_test.js` se omite solo si falta el motor del repo antiguo.
- `src/tools_runall.sh` corre todas y termina con `FAIL=0/1`; tarda ~12 min (córrelo en segundo plano). **Publica solo si FAIL=0.** `ui_test.py` está obsoleta y se omite.
- `world_text_test.py` revisa que no queden nombres del original en pantalla en ambos mundos e idiomas.
- Commit con los trailers de atribución que indique la sesión y `git -c push.negotiate=true push origin main`.
- Cambios de UI o reglas que también apliquen al juego antiguo: aplícalos además en `maxodog/dungeon-in-one-card` (mismo `ui.js` base, sin `worlds.js`).
