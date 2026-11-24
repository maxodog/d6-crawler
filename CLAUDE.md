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
- **Los mapas propios no tienen escaleras** (decisión de Max: eran solo un adorno). Caracteres: `#` muro, `H` inicio del aventurero, `X` cofre, `~` ventisca, `V` hueco, `W` agua, `D` grieta de magma, `T` Roca del Núcleo. `buildLevel` admite `H` (inicio sin escalera) y `ownLevels` ya no usa `chestOnExit`: cada mapa con cofre marca su casilla con `X`. Los mapas originales (Archeodice, y las expansiones de Colossus aún sin contenido propio) conservan `S`/`U` y sus escaleras.
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
- **El cofre cerrado cuenta como muro, siempre** (decisión de Max): nadie puede pisar su casilla ni aparecer encima mientras no se abra; al abrirlo queda libre. `chestBlock(st)` en `engine.js` lo aplica al héroe, a los monstruos, al Sherpa, al Corsario, al Cazador de demonios y a la Corona de laurel. **Sin excepciones**: también bloquea sobre una escalera (el infierno original lo pone ahí en 12 de 16 niveles), porque el nivel termina al matar a todos los monstruos y no al llegar a la escalera. `setupLevel` corre a otra casilla cualquier aparición que caiga sobre el cofre, y `balance.js` y `design.js` ni proponen esa casilla ni cuentan con ella para medir la conexión del mapa. Lo cubre `test/chest_test.js`.
- Logros y desbloqueos usan los ítems con que se **empezó** la aventura (`G.startItems`).
- **Estrellas por aventura** (`STARS` en `ui.js`, se guardan en `rec.games[aventura].stars` y en el progreso de invitado): Superada (oro), Dos expansiones (celeste, ganada con héroes de dos expansiones distintas), Sin objetos (verde, sin gastar ningún objeto: lo marca `st.itemEver` en el motor) y Sin habilidad (violeta, sin usar la habilidad; los héroes con habilidad pasiva —Mecánica y el Francotirador de Colossus— no la pueden ganar). Las aventuras sin objetos muestran 3 y las de objetos 4. Se ven arriba de la portada en la tarjeta de la aventura y se avisan en el resumen final. Lo cubre `test/stars_test.py`.
- **Las estrellas sobreviven a la sincronización**: `mergeRec` las une con `mergeStars` (fecha más antigua). Antes las descartaba y solo los invitados las conservaban (error visto con Max). `progOf` recupera «Superada» y «Dos expansiones» de las victorias y héroes ya anotados. Lo cubre `test/stars_sync_test.py` (en modo local `window.__dioc.mergeRec` queda expuesto solo para pruebas).
- **El botón para cambiar de mundo del menú es una tarjeta destacada** (`.world-switch`): portada, nombre y colores del otro mundo, con «⇄».
- **Pantalla de inicio distinta por mundo** (`.menu-s.w-arch` / `.w-kaiju` en `style.css`): Archeodice con tierra y dorado, banner de la ruina y logo centrado; Colossus con panel táctico cian/naranja, banner del kaiju, esquinas cortadas y líneas de escaneo. El selector de juego colorea cada tarjeta igual. Solo afecta al menú.
- `DEBUG_USERS` en `ui.js`: el usuario **Max** tiene todas las aventuras abiertas (y con ellas héroes y objetos) para probar; el resto las desbloquea jugando.
- **Un solo tipo de monstruo por mapa y orientación** (como el original): un mapa en una orientación concreta siempre lleva el mismo kaiju; lo que cambia por nivel es la cantidad y las posiciones. Los mapas de jefe no tienen esta restricción.
- Topes: la **vida de los monstruos** y los **atributos del héroe** van hasta 6. Velocidad, ataque, defensa y alcance de los monstruos pueden llegar a 7 u 8.
- **Pícaro / Contrabandista (Archeodice) mantiene el tope de 6** al sumar +1 a los dados (decisión de Max, aunque el original no lo especifica). El **Hacker de Colossus no tiene tope** (`rogueNoCap`).
- Pantalla de mejora: el último botón es «Ver la campaña hasta ahora» (destacado en naranja); «Curarte» no va destacado ni al final.
- En el celular, la selección de aventura muestra una portada por fila.
- Créditos visibles: «inspirado en las reglas de One Card Dungeon, de Barny Skinner»; sin arte ni textos originales.

## Colossus D6: estado del contenido propio
- **Kaiju Protocol (base)**: hecho. Kaiju: Mordedor 3/6/5/3/3, Escupidor 3/4/5/5/5, Acorazado 5/3/6/6/3, Rugidor 3/5/7/5/4 (vida/vel/atq/def/alc). 12 niveles en `worlds.js` (`levels.base`).
- Héroes: base = Bastión, Francotirador, Mecánica, Hacker; Alerta Omega = Furia, Oráculo, Ariete, Saltador; Glaciar = Sobrecarga; Bahía = Arpón; Fisura = Fantasma.
- **Alerta Omega (mguf)**: hecho. 12 niveles con los 12 mapas de Kaiju Protocol (cada kaiju en sus propios sectores) + 4 jefes con mapas propios tras los niveles 3, 6, 9 y 12. Cifras en `gstats.mguf`: Mordedor 4/7/4/3/3, Escupidor 3/3/6/4/6, Acorazado 5/3/5/7/3, Rugidor 4/6/7/4/5; jefes Rey Coraza 5/4/7/3/5, Rey Polilla 5/8/8/4/6, Rey Tormenta 7/6/8/6/6, Kaiju Omega 12/8/8/8/8.
- **Operación Glaciar (peak)**: hecho. 10 niveles con **4 mapas propios en dos pares girados 180°** (como las dos caras de la carta original): A ↔ A' y B ↔ B'; A va con el Rastreador (niveles 1, 4, 7), B con el Sabueso (2, 5, 8), A' con el Behemot (3, 6, 9) y B' con El Durmiente (10). Al girar un mapa, la escalera de entrada y la de salida se intercambian. Cifras en `gstats.peak`: Rastreador de escarcha 3/6/4/3/4, Sabueso glacial 4/7/5/4/3, Behemot glacial 5/3/6/5/3, El Durmiente del Hielo 10/4/8/7/6. Cantidad propia por nivel (2,1,1,2,2,2,4,3,3,1) y posiciones propias, buscadas con `design.js` contra una curva de daño de 0,8 a 3,2.
- **Pendiente**: Bahía Abisal (8, agua), Fisura Infernal (12 + 4 jefes, grietas de magma + Roca del Núcleo). Hoy usan los mapas y cifras originales. Hacer efectos de algunos ítems y habilidades distintos al original. Hechas: **Saltador**, **Sobrecarga**, **Bastión** y **Francotirador** (ver `abilVar` más arriba). Max decidió **no tocar Furia**. Faltan efectos propios de **ítems**, sobre todo en Glaciar, Bahía y Fisura.
- Objetivo de equilibrio: ganar la aventura igual de difícil que su equivalente de Archeodice, con dificultad que suba de forma pareja y ningún nivel trivial.

## Herramientas de equilibrio (Node)
- `node test/balance.js 80` (con `ONLY=own` mide solo Colossus): daño, derrotas y turnos por nivel, empezando cada nivel con Vida 6 y mejoras típicas. Variables: `WORLD`, `GAME`, `LV=1,2`.
- `CAMPAIGN=200 node test/balance.js`: campañas completas (original vs propio); reporta % que llega a cada nivel, % de victorias y nivel medio. `ONLY=own` u `ONLY=orig` miden solo uno. **Ahora la campaña reintenta el nivel al morir, como el juego real** (`RETRY=3` intentos por nivel), así que el número que importa ya no es solo el nivel medio sino el **% que termina la aventura** y los **reintentos que necesita**. Medido con el bot bueno (200 campañas, dos semillas):

| Aventura | Original (Archeodice) | Propia (Colossus) |
|---|---|---|
| Kaiju Protocol | gana 61% (def) · 65-71% (planseq) | gana 82-83% (def) · 82-86% (planseq) |
| Alerta Omega | gana 64-65% (def) · 63-68% (planseq) | gana 46-48% (def) · 56-60% (planseq) |
| Operación Glaciar | gana 97-99% (def) · 94-99% (planseq) | gana 70-75% (def) · 69% (planseq) — objetivo de Max: ~70% |
| Bahía Abisal / Fisura Infernal | 95-96% / 68% (def) · 95% / 71-76% (planseq) | aún sin contenido propio |

(24-nov-2026, 200 campañas, semillas 7 y 11, tras quitar escaleras y hacer que el cofre bloquee siempre.) Kaiju Protocol propio es más fácil que el base original; Alerta Omega algo más difícil (el cofre ahora bloquea); Glaciar mucho más difícil a propósito.
- **Estrategias de mejora del bot** (`UPG`, medidas en noviembre de 2026; `PLAN=def:6,atk:3,spd:3,rng:2` son los valores finales deseados, el Alcance parte en 2 y no baja):
  - `def` (por defecto): toda la Defensa y luego lo más atrasado.
  - `planseq`: completa el perfil en orden Defensa → Ataque → Velocidad → Alcance (perfil de Max 6/3/3/2). Algo mejor que `def` en Alerta Omega propio (58% contra 47%) y en el original de Fisura; igual en lo demás. `plan`: sube lo que más falta, sin orden fijo (igual o peor).
  - `sim`/`simfree`: simulan el siguiente nivel con sus kaiju reales (`SIMK` veces, mismos dados para cada opción) y eligen lo que menos daño recibe. **Peores**: 53% contra 75% en Glaciar y 71% contra 82% en Kaiju Protocol; sin perfil (`simfree`) mucho peores. Buscan el beneficio inmediato y se pierden la ventaja acumulada de la Defensa; además son ~60× más lentas.
  - Perfil final, ganar % propio (planseq): 6/3/3/2 → base 80, Omega 61, Glaciar 74 · 6/4/2/2 → 84, 54, 81 · 6/2/4/2 → 81, 41, 71 · 6/3/2/3 → 80, 63, 73 · 6/6/1/2 → 80, 51, 82 · **5/4/3/2 → 86, 16, 86**. Conclusiones: Defensa 6 es imprescindible en Alerta Omega (sus jefes pegan 7-8; con Defensa 5 casi nadie termina); el Ataque rinde más que la Velocidad (Velocidad 4 es lo peor); en aventuras largas conviene Alcance 3.
- `GSTATS='{"ogre":{"hp":5,...}}' node test/balance.js` prueba cifras sin tocar `worlds.js` (útil para los jefes).
- `node test/design.js` (`T0`, `T1`, `NS`, `TRIES`, `LVS=2,4`, `CNT=2,2,1,…` para fijar la cantidad por nivel y buscar solo posiciones): busca cantidad y posiciones de aparición para acercar cada nivel a una curva de daño objetivo. Imprime `AT=[...]` para pegar en `worlds.js`.
- **Qué hace bueno al bot** (todo medido en noviembre de 2026, con varias semillas):
  1. **Reintentar el nivel al morir** (`RETRY=3`), como permite el juego real: es lo que más cambia el resultado. Sin esto el bot ganaba 0% y parecía que ninguna aventura se podía terminar.
  2. **Subir siempre Defensa** entre niveles (`UPG=def`, idea de Max): 64% de victorias contra 23% subiendo la habilidad más atrasada. Subir Ataque primero es lo peor (1%).
  3. **Curar solo con Vida ≤2** (`HEAL=2`): 83% contra 64% curando con ≤3. Con reintentos y Defensa alta conviene gastar las pausas en mejoras.
  4. Usar la **habilidad del héroe** y, en las aventuras con objetos, **empezar con tres**, como un jugador.
- Lo que se probó y **no** sirvió: mirar el turno siguiente al repartir los dados (`DEPTH=2`, igual o peor y 5× más lento), buscar el turno completo en vez de avanzar paso a paso (`BOT=full`), abrir el cofre (`CHEST=1`, cuesta medio nivel porque aprovecha mal el botín), buscar casillas cubiertas donde menos kaiju le vean (`W_LOS`, de 83% a 46%: se vuelve pasivo y la pelea se alarga), subir el peso de la vida de los monstruos y cambiar el término que lo acerca a los monstruos (de 7,2 a 5,9). Los pesos de la evaluación (daño ×40, vida ×3, acercarse ×0,5) están en su mejor punto: no tocarlos sin volver a medir.
- `SEED=7` fija los dados: la misma semilla da siempre el mismo resultado, así dos variantes se comparan con la misma suerte y hacen falta muchas menos partidas. `design.js` lo usa solo: criba todos los candidatos con pocas partidas y una suerte, y afina los cuatro mejores con todas las partidas y otra suerte distinta (para no premiar al que tuvo suerte en la criba).
- El bot es débil (gana poco): sirve para comparar versiones, no como dificultad absoluta. Tras las optimizaciones de noviembre de 2026 una campaña de 200 tarda ~20 s (antes ~7 min) y una búsqueda de posiciones unos 4 s por nivel, así que ya se pueden correr en primer plano.

## Rendimiento del motor
- `adjOf(lv)` guarda la lista de vecinos de cada casilla y `distAdv(lv, src, advI, cb)` las distancias con el aventurero (y el cofre cerrado) como único estorbo: son las que la fase de monstruos repite miles de veces. Ambas cachés **se atan al array `lv.walls`**, así que una variante del nivel con otros muros (`lv.cv` con el cofre cerrado, `lv.ns` con la Piedra rota) las rehace sola. No quitar esa comprobación: con ella se arregló un error que daba caminos imposibles.
- `test/path_test.js` compara `dijkstra` con el cálculo directo en todos los niveles y variantes; si alguien toca las cachés, salta ahí.
- El bot de `balance.js` copia solo lo que puede cambiar al probar una jugada (`clone`), no el estado entero.

## Pruebas y publicación
- Pruebas en `test/` (Playwright con `/usr/bin/google-chrome`, Node). Tienen rutas absolutas a `/home/claude/d6-crawler/` (las de Node cargan `../src/engine.js`); si clonas en otra carpeta, ajústalas con `sed`. `mon_detour_test.js` se omite solo si falta el motor del repo antiguo.
- `src/tools_runall.sh` corre todas y termina con `FAIL=0/1`; tarda ~12 min (córrelo en segundo plano). **Publica solo si FAIL=0.** `ui_test.py` está obsoleta y se omite.
- `world_text_test.py` revisa que no queden nombres del original en pantalla en ambos mundos e idiomas.
- Commit con los trailers de atribución que indique la sesión y `git -c push.negotiate=true push origin main`.
- Cambios de UI o reglas que también apliquen al juego antiguo: aplícalos además en `maxodog/dungeon-in-one-card` (mismo `ui.js` base, sin `worlds.js`).
