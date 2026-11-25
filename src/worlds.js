'use strict';
/* ===== MUNDOS: Archeodice y Colossus D6: Kaiju Protocol =====
   Mismas reglas, mapas y cifras; cambian nombres, textos y portadas. Formato de nombres: 'es|en' o, para
   monstruos, 'singular es|plural es|singular en|plural en' (si no hay plural, se repite el singular). */
const WORLDS = {
  arch: {
    id: 'arch', name: 'Archeodice', logo: ['ARCHEODICE', ''],
    tagline: ['Un mapa, tres dados y una ruina por explorar.', 'One map, three dice and a ruin to explore.'],
    games: { base: 'Archeodice|Archeodice', mguf: 'El Laberinto de los Espejos|The Mirror Labyrinth', peak: 'La Fortaleza entre la Bruma|Fortress in the Mist',
      harbour: 'La Selva de las Mil Raíces|Jungle of a Thousand Roots', hell: 'La Biblioteca Enterrada|The Buried Library' },
    mon: {
      spider: 'Escorpión|Escorpiones|Scorpion|Scorpions', skeleton: 'Momia|Momias|Mummy|Mummies', orc: 'Gólem de piedra|Gólems de piedra|Stone Golem|Stone Golems',
      demon: 'Espíritu jaguar|Espíritus jaguar|Jaguar Spirit|Jaguar Spirits',
      ogre: 'Minotauro de bronce||Bronze Minotaur|', reaper: 'La Dama del Espejo||The Lady of the Mirror|', drake: 'Serpiente de cristal||Crystal Serpent|', mguf: 'El Doble Oscuro||The Dark Double|',
      goblin: 'Murciélago de la bruma|Murciélagos de la bruma|Mist Bat|Mist Bats', wolf: 'Puma fantasma|Pumas fantasma|Ghost Puma|Ghost Pumas',
      yeti: 'Guerrero de jade|Guerreros de jade|Jade Warrior|Jade Warriors', sorcerer: 'El Oráculo Velado||The Veiled Oracle|',
      crab: 'Rana dardo|Ranas dardo|Dart Frog|Dart Frogs', octopus: 'Lagarto acechador|Lagartos acechadores|Lurking Lizard|Lurking Lizards',
      zombie: 'Caimán|Caimanes|Caiman|Caimans', kraken: 'Anaconda gigante|Anacondas gigantes|Giant Anaconda|Giant Anacondas',
      imp: 'Escarabajo devorador|Escarabajos devoradores|Devourer Beetle|Devourer Beetles', chained: 'Escriba maldito|Escribas malditos|Cursed Scribe|Cursed Scribes',
      fiend: 'Gárgola de arenisca|Gárgolas de arenisca|Sandstone Gargoyle|Sandstone Gargoyles', maw: 'Gusano de arena|Gusanos de arena|Sandworm|Sandworms',
      cultist: 'El Bibliotecario||The Librarian|', goat: 'La Esfinge||The Sphinx|', butcher: 'Guardián chacal||Jackal Warden|', lord: 'La Reina de las Arenas||The Queen of the Sands|'
    },
    titles: {
      'Telarañas': 'Nido de escorpiones|Scorpion Nest', 'Osario': 'Cámara de las momias|Mummy Chamber', 'Cubil del orco': 'Sala del gólem|Golem Hall', 'Puerta del demonio': 'Altar del jaguar|Jaguar Altar',
      'Sendero helado': 'Sendero entre la bruma|Misty Path', 'Aullidos en la nieve': 'Huellas en la niebla|Tracks in the Fog', 'Guarida del yeti': 'Salón de jade|Jade Hall',
      'Campamento goblin': 'Campanario de los murciélagos|Bat Belfry', 'Colmillos de escarcha': 'Garras fantasma|Ghost Claws', 'Ventisquero del yeti': 'Guardia de jade|Jade Guard',
      'Horda goblin': 'Nube de alas|Cloud of Wings', 'Manada del huargo': 'Cacería en la bruma|Hunt in the Mist', 'Cumbre del yeti': 'Ejército de jade|Jade Army',
      'Orilla de cangrejos': 'Charca de ranas|Frog Pond', 'Muelle de tentáculos': 'Raíces acechantes|Lurking Roots', 'Marea de piratas': 'Ribera de caimanes|Caiman Bank',
      'El Kraken despierta': 'La Anaconda despierta|The Anaconda Awakens', 'Plaga de cangrejos': 'Lluvia de ranas|Rain of Frogs', 'Pulpos del rompeolas': 'Lagartos del templo|Temple Lizards',
      'Tripulación maldita': 'Pantano de los caimanes|Caiman Marsh', 'Furia del Kraken': 'Furia de la Anaconda|Anaconda\'s Fury',
      'Umbral de brasas': 'Umbral de arena|Sand Threshold', 'Cadenas al rojo': 'Tinta maldita|Cursed Ink', 'Alas de ceniza': 'Alas de piedra|Stone Wings', 'Boca del abismo': 'Boca de la duna|Mouth of the Dune',
      'Legión de diablillos': 'Plaga de escarabajos|Beetle Plague', 'Penitentes del fuego': 'Copistas eternos|Eternal Copyists', 'Bandada infernal': 'Cornisa de gárgolas|Gargoyle Ledge',
      'Fauces gemelas': 'Gusanos gemelos|Twin Worms', 'Horda del Averno': 'Enjambre de papiro|Papyrus Swarm', 'Cárcel de los condenados': 'Scriptorium maldito|Cursed Scriptorium',
      'Tormenta de alas': 'Tormenta de piedra|Stone Storm', 'Abismo sin fondo': 'Mar de arena|Sea of Sand'
    },
    heroes: { paladin: 'Arqueóloga|Archaeologist', barbarian: 'Mercenario|Mercenary', ranger: 'Topógrafa|Surveyor', mage: 'Adivino|Fortune-teller', necromancer: 'Chamán|Shaman',
      cleric: 'Restauradora|Restorer', knight: 'Escolta|Bodyguard', rogue: 'Contrabandista|Smuggler', sherpa: 'Escaladora|Climber', corsair: 'Aviadora|Aviator', demonhunter: 'Encantador de serpientes|Snake Charmer' },
    items: { cloak: 'Linterna de bruma|Linterna|Mist Lantern|Lantern', axe: 'Látigo de cuero|Látigo|Leather Whip|Whip', herbs: 'Bálsamo de montaña|Bálsamo|Mountain Balm|Balm',
      wyrm: 'Botas de escalada|Botas|Climbing Boots|Boots', flame: 'Moneda de la suerte|Moneda|Lucky Coin|Coin', hourglass: 'Bengala|Bengala|Flare|Flare', eye: 'Ídolo de oro|Ídolo|Golden Idol|Idol',
      powder: 'Dinamita|Dinamita|Dynamite|Dynamite', sands: 'Repelente|Repelente|Repellent|Repellent', gorgon: 'Flauta de hueso|Flauta|Bone Flute|Flute', pendant: 'Amuleto ankh|Ankh|Ankh Amulet|Ankh',
      holy: 'Pergamino protector|Pergamino|Ward Scroll|Scroll', laurel: 'Cetro del escriba|Cetro|Scribe\'s Scepter|Scepter', fist: 'Martillo de roca|Martillo|Rock Hammer|Hammer', mail: 'Escudo de bronce|Escudo|Bronze Shield|Shield' },
    // reemplazos en los textos (frases completas primero; respetan mayúsculas)
    terms: {
      es: [['de la caja original', 'del juego base'], ['la caja original', 'el juego base'], ['Empiezas con la original', 'Empiezas con el juego base'], ['Se empieza con la original', 'Se empieza con el juego base'], ['de la original', 'del juego base'], ['Cáliz de Brasas', 'Primer hallazgo'], ["Fin de M'Guf-yn", 'Más allá del reflejo'], ['Rey de la cima', 'Señor de la bruma'], ['Lobo de mar', 'Rey de la selva'], ['Portero del Infierno', 'Guardián del saber'], ['la Montaña Eterna', 'La Fortaleza entre la Bruma'], ['tres demonios', 'tres espíritus jaguar'], ['su carta', 'su ficha'], ['Una carta', 'Un mapa'], ['Usar la cota', 'Usar el escudo'], ['la cota', 'el escudo'], ['Piedra de la Perdición', 'Losa del Escriba'], ['casillas malditas', 'casillas de arena maldita'], ['casilla maldita', 'casilla de arena maldita'],
        ['Casillas malditas', 'Casillas de arena maldita'], ['Casilla maldita', 'Casilla de arena maldita'], ['ventiscas', 'brumas'], ['ventisca', 'bruma'], ['Ventiscas', 'Brumas'], ['Ventisca', 'Bruma'],
        ['cofres', 'relicarios'], ['cofre', 'relicario'], ['Cofres', 'Relicarios'], ['Cofre', 'Relicario'], ['agua', 'pantano'], ['Agua', 'Pantano'],
        ['mazmorras', 'ruinas'], ['mazmorra', 'ruina'], ['Mazmorras', 'Ruinas'], ['Mazmorra', 'Ruina']],
      en: [['from the original box', 'from the base game'], ['You start with the original', 'You start with the base game'], ['from the original', 'from the base game'], ['Ember Chalice', 'First Find'], ["End of M'Guf-yn", 'Beyond the Reflection'], ['King of the Peak', 'Lord of the Mist'], ['Sea Wolf', 'King of the Jungle'], ['Gatekeeper of Hell', 'Keeper of Lore'], ['three demons', 'three jaguar spirits'], ['their card', 'their sheet'], ['One card', 'One map'], ['Use the mail', 'Use the shield'], ['the mail', 'the shield'], ['Stone of Doom', 'Scribe\'s Slab'], ['cursed tiles', 'cursed sand tiles'], ['cursed tile', 'cursed sand tile'], ['Cursed tiles', 'Cursed sand tiles'],
        ['Cursed tile', 'Cursed sand tile'], ['blizzards', 'mists'], ['blizzard', 'mist'], ['Blizzards', 'Mists'], ['Blizzard', 'Mist'], ['chests', 'reliquaries'], ['chest', 'reliquary'], ['Chests', 'Reliquaries'],
        ['Chest', 'Reliquary'], ['water', 'swamp'], ['Water', 'Swamp'], ['dungeons', 'ruins'], ['dungeon', 'ruin'], ['Dungeons', 'Ruins'], ['Dungeon', 'Ruin']]
    }
  },
  kaiju: {
    id: 'kaiju', name: 'Colossus D6', logo: ['COLOSSUS D6', 'KAIJU PROTOCOL'],
    tagline: ['Un sector, tres dados y una ciudad por defender.', 'One sector, three dice and a city to defend.'],
    games: { base: 'Kaiju Protocol|Kaiju Protocol', mguf: 'Alerta Omega|Omega Alert', peak: 'Operación Glaciar|Operation Glacier', harbour: 'Bahía Abisal|Abyssal Bay', hell: 'Fisura Infernal|Infernal Rift' },
    mon: {
      spider: 'Mordedor|Mordedores|Biter|Biters', skeleton: 'Escupidor|Escupidores|Spitter|Spitters', orc: 'Acorazado|Acorazados|Armored|Armoreds', demon: 'Rugidor|Rugidores|Roarer|Roarers',
      ogre: 'Rey Coraza||Shell King|', reaper: 'Rey Polilla||Moth King|', drake: 'Rey Tormenta||Storm King|', mguf: 'Kaiju Omega||Omega Kaiju|',
      goblin: 'Rastreador de escarcha|Rastreadores de escarcha|Frost Crawler|Frost Crawlers', wolf: 'Sabueso glacial|Sabuesos glaciales|Glacial Hound|Glacial Hounds',
      yeti: 'Behemot glacial|Behemots glaciales|Glacial Behemoth|Glacial Behemoths', sorcerer: 'El Durmiente del Hielo||The Ice Sleeper|',
      crab: 'Cangrejo blindado|Cangrejos blindados|Armored Crab|Armored Crabs', octopus: 'Anguila voltaica|Anguilas voltaicas|Volt Eel|Volt Eels',
      zombie: 'Tortuga acorazada|Tortugas acorazadas|Shell Turtle|Shell Turtles', kraken: 'Calamar abisal|Calamares abisales|Abyssal Squid|Abyssal Squids',
      imp: 'Larva de magma|Larvas de magma|Magma Larva|Magma Larvae', chained: 'Escupelava|Escupelavas|Lava Spitter|Lava Spitters',
      fiend: 'Escarabajo de ceniza|Escarabajos de ceniza|Ash Beetle|Ash Beetles', maw: 'Fauce de magma|Fauces de magma|Magma Maw|Magma Maws',
      cultist: 'La Incubadora||The Incubator|', goat: 'Centinela de obsidiana||Obsidian Sentinel|', butcher: 'Mantis ígnea||Fire Mantis|', lord: 'El Rey de la Fisura||The King of the Rift|'
    },
    titles: {
      'Telarañas': 'Barrio infestado|Infested Block', 'Osario': 'Avenida ácida|Acid Avenue', 'Cubil del orco': 'Puente acorazado|Armored Bridge', 'Puerta del demonio': 'Plaza del rugido|Roar Square',
      'Sendero helado': 'Pista helada|Frozen Runway', 'Aullidos en la nieve': 'Aullidos en la base|Howls at the Base', 'Guarida del yeti': 'Grieta del behemot|Behemoth Crevasse',
      'Campamento goblin': 'Hangar infestado|Infested Hangar', 'Colmillos de escarcha': 'Jauría glacial|Glacial Pack', 'Ventisquero del yeti': 'Avalancha|Avalanche',
      'Horda goblin': 'Enjambre de escarcha|Frost Swarm', 'Manada del huargo': 'Cacería polar|Polar Hunt', 'Cumbre del yeti': 'Muro de hielo|Ice Wall',
      'Orilla de cangrejos': 'Muelle de cangrejos|Crab Dock', 'Muelle de tentáculos': 'Corriente voltaica|Volt Current', 'Marea de piratas': 'Marea de caparazones|Shell Tide',
      'El Kraken despierta': 'El Calamar despierta|The Squid Awakens', 'Plaga de cangrejos': 'Invasión de cangrejos|Crab Invasion', 'Pulpos del rompeolas': 'Anguilas del rompeolas|Breakwater Eels',
      'Tripulación maldita': 'Flota hundida|Sunken Fleet', 'Furia del Kraken': 'Furia abisal|Abyssal Fury',
      'Umbral de brasas': 'Calle en llamas|Burning Street', 'Cadenas al rojo': 'Lluvia de lava|Lava Rain', 'Alas de ceniza': 'Alas de ceniza|Ash Wings', 'Boca del abismo': 'Boca de la fisura|Mouth of the Rift',
      'Legión de diablillos': 'Nido de larvas|Larva Nest', 'Penitentes del fuego': 'Río de magma|Magma River', 'Bandada infernal': 'Nube de ceniza|Ash Cloud', 'Fauces gemelas': 'Fauces gemelas|Twin Maws',
      'Horda del Averno': 'Erupción|Eruption', 'Cárcel de los condenados': 'Cráter|Crater', 'Tormenta de alas': 'Tormenta ígnea|Firestorm', 'Abismo sin fondo': 'Núcleo del planeta|Planet Core'
    },
    // Mapas propios: sin escaleras ('#' muro, 'H' inicio del aventurero, 'X' cofre, '~' ventisca, 'V' hueco)
    stats: { spider: { hp: 3, spd: 6, atk: 5, def: 3, rng: 3 }, skeleton: { hp: 3, spd: 4, atk: 5, def: 5, rng: 5 }, orc: { hp: 5, spd: 3, atk: 6, def: 6, rng: 3 }, demon: { hp: 3, spd: 5, atk: 7, def: 5, rng: 4 } },
    levels: { base: [
      { t: 'Avenida ácida|Acid Avenue', m: 'skeleton', map: ['.....', '..#..', '.....', '.#.#.', '....H'], at: [[0,4]] },
      { t: 'Barrio infestado|Infested Block', m: 'spider', map: ['.....', '.#...', '...#.', '.....', 'H....'], at: [[0,1],[4,2]] },
      { t: 'Puente acorazado|Armored Bridge', m: 'orc', map: ['.....', '.....', '##.#.', '.....', '..H..'], at: [[4,0]] },
      { t: 'Estación tomada|Overrun Station', m: 'spider', map: ['.....', '...#.', '.#...', '...#.', 'H....'], at: [[4,3],[4,4]] },
      { t: 'Plaza del rugido|Roar Square', m: 'demon', map: ['.....', '.#...', '...#.', '.#...', '....H'], at: [[3,0]] },
      { t: 'Torres de vigía|Watchtowers', m: 'skeleton', map: ['.....', '..##.', '.....', '.#...', '...H.'], at: [[4,1],[1,2]] },
      { t: 'Muelle de carga|Loading Dock', m: 'orc', map: ['.....', '.....', '.##..', '....#', '...H.'], at: [[2,0],[0,3],[3,1]] },
      { t: 'Túnel del metro|Subway Tunnel', m: 'demon', map: ['....#', '.....', '.#.#.', '.....', '#...H'], at: [[2,0],[1,4]] },
      { t: 'Mercado en ruinas|Ruined Market', m: 'spider', map: ['.....', '#....', '...#.', '.#...', '....H'], at: [[0,0],[1,1],[2,2],[4,1],[1,0]] },
      { t: 'Azoteas|Rooftops', m: 'skeleton', map: ['.....', '.#...', '...#.', '.....', 'H.#..'], at: [[4,0],[2,1],[2,0]] },
      { t: 'Central eléctrica|Power Plant', m: 'orc', map: ['.....', '.#.#.', '.....', '..#..', 'H....'], at: [[2,2],[3,2],[2,1]] },
      { t: 'Corazón de la ciudad|City Heart', m: 'demon', map: ['.....', '.#.#.', '.....', '.#.#.', '..H..'], at: [[0,0],[3,0],[0,1],[4,2]] }
    ], mguf: [
      { t: 'Brecha en el perímetro|Perimeter Breach', m: 'spider', chest: 1, map: ['..X..', '.#...', '...#.', '.....', 'H....'], at: [[4,2],[2,2]] },
      { t: 'Lluvia ácida|Acid Rain', m: 'skeleton', chest: 1, map: ['X....', '..#..', '.....', '.#.#.', '....H'], at: [[0,1]] },
      { t: 'Túnel de enjambre|Swarm Tunnel', m: 'spider', chest: 1, map: ['X....', '...#.', '.#...', '...#.', 'H....'], at: [[3,4],[4,3]] },
      { boss: 1, t: 'Rey Coraza|Shell King', m: 'ogre', map: ['.....', '.#..#', '.....', '#..#.', '....H'] },
      { t: 'Paso blindado|Armored Crossing', m: 'orc', chest: 1, map: ['....X', '.....', '##.#.', '.....', '..H..'], at: [[1,1]] },
      { t: 'Rugido en la plaza|Roar in the Plaza', m: 'demon', chest: 1, map: ['...X.', '.#...', '...#.', '.#...', '....H'], at: [[1,0]] },
      { t: 'Torres bajo fuego|Towers Under Fire', m: 'skeleton', chest: 1, map: ['X....', '..##.', '.....', '.#...', '...H.'], at: [[2,0],[0,3]] },
      { boss: 2, t: 'Rey Polilla|Moth King', m: 'reaper', map: ['...#.', '.#...', '.....', '...#.', '.#..H'] },
      { t: 'Mercado en llamas|Market on Fire', m: 'spider', chest: 1, map: ['..X..', '#....', '...#.', '.#...', '....H'], at: [[0,3],[1,0],[3,1]] },
      { t: 'Último muelle|Last Dock', m: 'orc', chest: 1, map: ['.X...', '.....', '.##..', '....#', '...H.'], at: [[0,4],[2,1],[0,2]] },
      { t: 'Estación sitiada|Station Under Siege', m: 'demon', chest: 1, map: ['X...#', '.....', '.#.#.', '.....', '#...H'], at: [[1,0],[0,2]] },
      { boss: 3, t: 'Rey Tormenta|Storm King', m: 'drake', map: ['..#..', '.....', '.#.#.', '.....', '..#.H'] },
      { t: 'Corte de energía|Blackout', m: 'orc', chest: 1, map: ['.....', '.#.#.', '....X', '..#..', 'H....'], at: [[4,0],[3,0],[4,1],[2,0]] },
      { t: 'Techos al alba|Rooftops at Dawn', m: 'skeleton', chest: 1, map: ['.....', '.#..X', '...#.', '.....', 'H.#..'], at: [[2,0],[3,3],[4,2],[4,0]] },
      { t: 'Corazón en alerta|Heart on Alert', m: 'demon', chest: 1, map: ['..X..', '.#.#.', '.....', '.#.#.', '..H..'], at: [[2,1],[1,0],[4,2],[0,2]] },
      { boss: 4, t: 'Kaiju Omega|Omega Kaiju', m: 'mguf', map: ['.....', '.##..', '.....', '..##.', '....H'] }
    ], peak: [
      { t: 'Grietas de hielo|Ice Cracks', m: 'goblin', map: ['..#..', '..~~.', '.#..~', '~~.#.', 'X...H'], at: [[4,1],[4,0]] },
      { t: 'Ecos en la nieve|Echoes in the Snow', m: 'wolf', map: ['...~V', '.#...', '~~.#.', '.#.~~', 'X...H'], at: [[1,0]] },
      { t: 'Mole en la ladera|Hulk on the Slope', m: 'yeti', map: ['....X', '.#.~~', '~..#.', '.~~..', '..#.H'], at: [[3,0]] },
      { t: 'Patrulla de escarcha|Frost Patrol', m: 'goblin', map: ['..#..', '..~~.', '.#..~', '~~.#.', 'X...H'], at: [[1,3],[3,1]] },
      { t: 'Jauría glacial|Glacial Pack', m: 'wolf', map: ['...~V', '.#...', '~~.#.', '.#.~~', 'X...H'], at: [[2,2],[4,1]] },
      { t: 'Garganta del behemot|Behemoth Gorge', m: 'yeti', map: ['....X', '.#.~~', '~..#.', '.~~..', '..#.H'], at: [[0,1],[2,2]] },
      { t: 'Nido de rastreadores|Crawler Nest', m: 'goblin', map: ['..#..', '..~~.', '.#..~', '~~.#.', 'X...H'], at: [[1,0],[1,1],[0,3],[3,0]] },
      { t: 'Cacería en la ventisca|Hunt in the Blizzard', m: 'wolf', map: ['...~V', '.#...', '~~.#.', '.#.~~', 'X...H'], at: [[0,3],[2,0],[3,0]] },
      { t: 'Muralla de hielo|Ice Wall', m: 'yeti', map: ['....X', '.#.~~', '~..#.', '.~~..', '..#.H'], at: [[1,0],[0,3],[4,1]] },
      { t: 'El Durmiente despierta|The Sleeper Awakens', m: 'sorcerer', map: ['....X', '~~.#.', '.#.~~', '...#.', 'V~..H'], at: [[2,2]] }
    ], harbour: [
      { t: 'Marea de blindados|Armored Tide', m: 'crab', chest: 1, map: ['H...W', '.#.WW', '..X.W', 'W.#WW', 'WW...'], at: [[0,4],[1,3]] },
      { t: 'Corriente eléctrica|Live Current', m: 'octopus', chest: 1, map: ['H.W..', '.#W#.', '..ZWW', '.W..#', 'WW...'], at: [[3,0],[4,2]] },
      { t: 'Costa acorazada|Armored Coast', m: 'zombie', chest: 1, map: ['H....', '.##W.', '.WWW.', '.W..X', '..#..'], at: [[4,0]] },
      { t: 'El Calamar emerge|The Squid Emerges', m: 'kraken', chest: 1, map: ['H..W.', '.WW#.', '.WZW.', '.#WW.', '...W.'], at: [[4,3]] },
      { t: 'Banco de blindados|Armored Shoal', m: 'crab', chest: 1, map: ['H...W', '.#.WW', '..X.W', 'W.#WW', 'WW...'], at: [[3,1],[4,4],[3,3],[0,4]] },
      { t: 'Tormenta submarina|Undersea Storm', m: 'octopus', chest: 1, map: ['H.W..', '.#W#.', '..ZWW', '.W..#', 'WW...'], at: [[3,3],[4,4],[4,1],[4,0]] },
      { t: 'Caparazones en la bruma|Shells in the Mist', m: 'zombie', chest: 1, map: ['H....', '.##W.', '.WWW.', '.W..X', '..#..'], at: [[2,2],[3,1]] },
      { t: 'Abismo del Calamar|Squid Abyss', m: 'kraken', chest: 1, map: ['H..W.', '.WW#.', '.WZW.', '.#WW.', '...W.'], at: [[0,3],[2,3]] }
    ], hell: [
      { t: 'Grieta incipiente|Budding Fissure', m: 'imp', chest: 1, map: ['H..D.', '.D#..', 'D...X', '.#D..', '..D.D'], at: [[3,4],[3,0]] },
      { t: 'Chorros de lava|Lava Jets', m: 'chained', chest: 1, map: ['H....', 'DD#.D', '..TD.', '.#..X', 'D...D'], at: [[1,4],[4,4]] },
      { t: 'Élitros de ceniza|Ash Elytra', m: 'fiend', chest: 1, map: ['H.D..', '#.D.#', '.T..D', 'D.#..', '..D.X'], at: [[3,0]] },
      { boss: 1, t: 'La Incubadora|The Incubator', m: 'cultist', map: ['H.D..', '.#.D.', 'D...D', '.D#..', '..D.D'] },
      { t: 'Garganta de fuego|Throat of Fire', m: 'maw', chest: 1, map: ['H...D', '.D#..', 'D.T.D', '..#D.', 'X...D'], at: [[4,0]] },
      { t: 'Nido en ebullición|Boiling Nest', m: 'imp', chest: 1, map: ['H..D.', '.D#..', 'D...X', '.#D..', '..D.D'], at: [[3,1],[4,0],[2,3],[3,0]] },
      { t: 'Géiser de escupelavas|Spitter Geysers', m: 'chained', chest: 1, map: ['H....', 'DD#.D', '..TD.', '.#..X', 'D...D'], at: [[2,3],[3,0],[0,3]] },
      { boss: 2, t: 'Centinela de obsidiana|Obsidian Sentinel', m: 'goat', map: ['H...D', '.D#..', '...D.', '.#.D.', 'D...D'] },
      { t: 'Nube de escarabajos|Beetle Cloud', m: 'fiend', chest: 1, map: ['H.D..', '#.D.#', '.T..D', 'D.#..', '..D.X'], at: [[2,4],[3,0]] },
      { t: 'Fauces en cadena|Chained Maws', m: 'maw', chest: 1, map: ['H...D', '.D#..', 'D.T.D', '..#D.', 'X...D'], at: [[3,3],[3,2]] },
      { t: 'Marejada de larvas|Larva Surge', m: 'imp', chest: 1, map: ['H..D.', '.D#..', 'D...X', '.#D..', '..D.D'], at: [[2,4],[4,4],[4,0],[4,3],[0,4]] },
      { boss: 3, t: 'Mantis ígnea|Fire Mantis', m: 'butcher', map: ['H.D..', 'D#...', '..D.D', '.#.#.', 'D...D'] },
      { t: 'Cráter de escupelavas|Spitter Crater', m: 'chained', chest: 1, map: ['H....', 'DD#.D', '..TD.', '.#..X', 'D...D'], at: [[3,2],[4,0],[3,3],[0,3],[4,4]] },
      { t: 'Plaga de ceniza|Ash Plague', m: 'fiend', chest: 1, map: ['H.D..', '#.D.#', '.T..D', 'D.#..', '..D.X'], at: [[3,3],[1,3],[4,3]] },
      { t: 'Corazón de la Fisura|Heart of the Rift', m: 'maw', chest: 1, map: ['H...D', '.D#..', 'D.T.D', '..#D.', 'X...D'], at: [[4,1],[3,3],[4,2]] },
      { boss: 4, t: 'El Rey de la Fisura|The King of the Rift', m: 'lord', map: ['H..D.', '.D#..', 'D...D', '.##D.', '.D...'] }
    ] },
    // cifras por aventura (sobreescriben a 'stats'); jefes incluidos
    gstats: {
      mguf: {
        spider: { hp: 4, spd: 7, atk: 4, def: 3, rng: 3 }, skeleton: { hp: 3, spd: 3, atk: 6, def: 4, rng: 6 },
        orc: { hp: 5, spd: 3, atk: 5, def: 7, rng: 3 }, demon: { hp: 4, spd: 6, atk: 7, def: 4, rng: 5 },
        ogre: { hp: 5, spd: 4, atk: 7, def: 3, rng: 5 }, reaper: { hp: 5, spd: 8, atk: 8, def: 4, rng: 6 },
        drake: { hp: 7, spd: 6, atk: 8, def: 6, rng: 6 }, mguf: { hp: 12, spd: 8, atk: 8, def: 8, rng: 8 }
      },
      peak: {
        goblin: { hp: 3, spd: 6, atk: 4, def: 3, rng: 4 }, wolf: { hp: 4, spd: 7, atk: 5, def: 4, rng: 3 },
        yeti: { hp: 5, spd: 3, atk: 6, def: 5, rng: 3 }, sorcerer: { hp: 10, spd: 4, atk: 8, def: 7, rng: 6 }
      },
      harbour: {
        crab: { hp: 3, spd: 5, atk: 4, def: 4, rng: 3, bonusOn: 'tide', bonus: { def: 1, rng: 1 } },
        octopus: { hp: 4, spd: 6, atk: 5, def: 3, rng: 4, bonusOn: 'tide', bonus: { atk: 2 } },
        zombie: { hp: 5, spd: 3, atk: 7, def: 6, rng: 3, bonusOn: 'tide', bonus: { atk: 1, def: 1 } },
        kraken: { hp: 6, spd: 5, atk: 7, def: 5, rng: 5, bonusOn: 'tide', bonus: { atk: 2, rng: 1 } }
      },
      hell: {
        imp: { hp: 3, spd: 6, atk: 3, def: 3, rng: 3, bonusOn: 'refuge', bonus: { atk: 2 } },
        chained: { hp: 3, spd: 4, atk: 5, def: 3, rng: 5, bonusOn: 'refuge', bonus: { def: 2 } },
        fiend: { hp: 4, spd: 3, atk: 6, def: 4, rng: 3, bonusOn: 'refuge', bonus: { atk: 1, rng: 1 } },
        maw: { hp: 5, spd: 4, atk: 6, def: 5, rng: 4, bonusOn: 'refuge', bonus: { atk: 1, def: 1 } },
        cultist: { hp: 5, spd: 3, atk: 6, def: 4, rng: 3, bonusOn: 'refuge', bonus: { atk: 1, def: 1 } },
        goat: { hp: 7, spd: 4, atk: 5, def: 6, rng: 4, bonusOn: 'refuge', bonus: { def: 1, rng: 1 } },
        butcher: { hp: 9, spd: 6, atk: 7, def: 5, rng: 4, bonusOn: 'refuge', bonus: { atk: 1, rng: 1 } },
        lord: { hp: 12, spd: 7, atk: 8, def: 7, rng: 6, bonusOn: 'refuge', bonus: { atk: 1, def: 1 } }
      }
    },
    // habilidades propias de Colossus (distintas al original)
    abilVar: { corsair: 'swap', necromancer: 'burst', paladin: 'free', ranger: 'range1' },
    rogueNoCap: true,   // Hacker: +1 a cada dado aunque sea un 6
    heroPack: { paladin: 'base', ranger: 'base', cleric: 'base', rogue: 'base', barbarian: 'mguf', mage: 'mguf', knight: 'mguf', corsair: 'mguf',
      necromancer: 'peak', demonhunter: 'harbour', sherpa: 'hell' },
    heroes: { paladin: 'Bastión|Bastion', barbarian: 'Furia|Fury', ranger: 'Francotirador|Sniper', mage: 'Oráculo|Oracle', necromancer: 'Sobrecarga|Overload', cleric: 'Mecánica|Mechanic',
      knight: 'Ariete|Ram', rogue: 'Hacker|Hacker', sherpa: 'Fantasma|Phantom', corsair: 'Saltador|Jumper', demonhunter: 'Arpón|Harpoon' },
    items: { cloak: 'Calefactor de núcleo|Calefactor|Core Heater|Heater', axe: 'Espada de plasma|Espada|Plasma Blade|Blade', herbs: 'Nanorreparación|Nanorrep.|Nano-Repair|Repair',
      wyrm: 'Turbopropulsor|Turbo|Booster|Booster', flame: 'Recalibración|Recalib.|Recalibration|Recal.', hourglass: 'Pulso aturdidor|Pulso|Stun Pulse|Pulse', eye: 'Núcleo experimental|Núcleo|Experimental Core|Core',
      powder: 'Misiles en racimo|Misiles|Cluster Missiles|Missiles', sands: 'Drenaje hidráulico|Drenaje|Hydraulic Drain|Drain', gorgon: 'Red magnética|Red|Mag-Net|Net',
      pendant: 'Reactor de respaldo|Reactor|Backup Reactor|Reactor', holy: 'Refrigerante|Refrig.|Coolant|Coolant', laurel: 'Implante de control|Implante|Control Implant|Implant',
      fist: 'Puño sísmico|Puño|Seismic Fist|Fist', mail: 'Placas de titanio|Placas|Titanium Plating|Plating' },
    terms: {
      es: [['de la caja original', 'del juego base'], ['la caja original', 'el juego base'], ['Empiezas con la original', 'Empiezas con el juego base'], ['Se empieza con la original', 'Se empieza con el juego base'], ['de la original', 'del juego base'], ['Cáliz de Brasas', 'Primera defensa'], ["Fin de M'Guf-yn", 'Alerta desactivada'], ['Rey de la cima', 'Rompehielos'], ['Lobo de mar', 'Guardián de la bahía'], ['Portero del Infierno', 'Sellador de fisuras'], ['tres demonios', 'tres rugidores'], ['su carta', 'su ficha'], ['Una carta', 'Un sector'], ['Usar la cota', 'Usar las placas'], ['la cota', 'las placas'], ['Piedra de la Perdición', 'Roca del Núcleo'], ['casillas malditas', 'grietas de magma'], ['casilla maldita', 'grieta de magma'],
        ['Casillas malditas', 'Grietas de magma'], ['Casilla maldita', 'Grieta de magma'], ['cofres', 'contenedores'], ['cofre', 'contenedor'], ['Cofres', 'Contenedores'], ['Cofre', 'Contenedor'],
        ['mazmorras', 'zonas'], ['mazmorra', 'zona'], ['Mazmorras', 'Zonas'], ['Mazmorra', 'Zona']],
      en: [['from the original box', 'from the base game'], ['You start with the original', 'You start with the base game'], ['from the original', 'from the base game'], ['Ember Chalice', 'First Defense'], ["End of M'Guf-yn", 'Alert Cleared'], ['King of the Peak', 'Icebreaker'], ['Sea Wolf', 'Bay Guardian'], ['Gatekeeper of Hell', 'Rift Sealer'], ['three demons', 'three roarers'], ['their card', 'their sheet'], ['One card', 'One sector'], ['Use the mail', 'Use the plating'], ['the mail', 'the plating'], ['Stone of Doom', 'Core Rock'], ['cursed tiles', 'magma cracks'], ['cursed tile', 'magma crack'], ['Cursed tiles', 'Magma cracks'],
        ['Cursed tile', 'Magma crack'], ['chests', 'crates'], ['chest', 'crate'], ['Chests', 'Crates'], ['Chest', 'Crate'], ['dungeons', 'zones'], ['dungeon', 'zone'], ['Dungeons', 'Zones'], ['Dungeon', 'Zone']]
    }
  }
};
// nombres originales (en el código y en los textos base), para reemplazarlos en los textos visibles
const ORIG_NAMES = {
  games: { base: 'One Card Dungeon|One Card Dungeon', mguf: "M'Guf-yn Returns|M'Guf-yn Returns", peak: 'Montaña Eterna|Eternal Peak', harbour: 'Harbour Clash|Harbour Clash', hell: 'La Puerta del Infierno|Hell\'s Door' },
  mon: { spider: 'Araña|Arañas|Spider|Spiders', skeleton: 'Esqueleto|Esqueletos|Skeleton|Skeletons', orc: 'Orco|Orcos|Orc|Orcs', demon: 'Demonio|Demonios|Demon|Demons',
    ogre: 'Ogro de las brasas||Ember Ogre|', reaper: 'Heraldo esquelético||Skeletal Herald|', drake: 'Serpiente alada||Winged Serpent|', mguf: "M'Guf-yn||M'Guf-yn|",
    goblin: 'Goblin|Goblins|Goblin|Goblins', wolf: 'Lobo|Lobos|Wolf|Wolves', yeti: 'Yeti|Yetis|Yeti|Yetis', sorcerer: 'Hechicero Blanco||White Sorcerer|',
    crab: 'Cangrejo|Cangrejos|Crab|Crabs', octopus: 'Hombre pulpo|Hombres pulpo|Octopus Man|Octopus Men', zombie: 'Pirata zombi|Piratas zombi|Zombie Pirate|Zombie Pirates', kraken: 'Kraken|Krakens|Kraken|Krakens',
    imp: 'Diablillo|Diablillos|Imp|Imps', chained: 'Condenado|Condenados|Damned|Damned', fiend: 'Murciélago infernal|Murciélagos infernales|Hell Bat|Hell Bats', maw: 'Abisal|Abisales|Abyssal|Abyssals',
    cultist: 'Sacerdote carmesí||Crimson Priest|', goat: 'Demonio de las llamas||Flame Demon|', butcher: 'Verdugo cornudo||Horned Executioner|', lord: 'Señor del Infierno||Lord of Hell|' },
  heroes: { paladin: 'Paladín|Paladin', barbarian: 'Bárbaro|Barbarian', ranger: 'Ranger|Ranger', mage: 'Mago|Mage', necromancer: 'Nigromante|Necromancer', cleric: 'Clérigo|Cleric',
    knight: 'Caballero|Knight', rogue: 'Pícaro|Rogue', sherpa: 'Sherpa|Sherpa', corsair: 'Corsario|Corsair', demonhunter: 'Cazador de demonios|Demon Hunter' },
  items: { cloak: 'Capa de cuero|Leather Cloak', axe: 'Cuerda y piolet|Rope and Ice Axe', herbs: 'Hierbas curativas|Healing Herbs', wyrm: 'Extracto de Wyrm|Wyrm Extract',
    flame: 'Llama del destino|Flame of Fate', hourglass: 'Reloj de arena|Hourglass', eye: 'Ojo de dragón|Dragon\'s Eye', powder: 'Pólvora negra|Black Powder', sands: 'Arenas ocultas|Hidden Sands',
    gorgon: 'Cabeza de Gorgona|Gorgon\'s Head', pendant: 'Colgante de alma|Soul Pendant', holy: 'Agua bendita|Holy Water', laurel: 'Corona de laurel|Laurel Crown', fist: 'Puño de hierro|Iron Fist', mail: 'Cota de malla|Chainmail' }
};
