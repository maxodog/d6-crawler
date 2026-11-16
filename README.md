# D6 Crawler: Archeodice y Colossus D6

Juego de dados solitario para jugar desde el celular, con dos mundos:

- **Archeodice**: un explorador recorre ruinas antiguas.
- **Colossus D6: Kaiju Protocol**: un mecha defiende la ciudad de los kaiju.

Mismas reglas y mapas en ambos; cada mundo guarda su progreso, logros y desbloqueos por separado.

Juega en https://maxodog.github.io/d6-crawler/

Inspirado en las reglas del juego solitario *One Card Dungeon*, de Barny Skinner. Ilustraciones, nombres y textos propios.

## Desarrollo
- Fuentes en `src/`. `python3 build.py` (desde `src/`) genera `index.html` en un solo archivo.
- Pruebas en `test/` (Playwright y Node).
