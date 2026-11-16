// Compara el motor anterior (repositorio publicado) con el actual: con el héroe quieto, ¿en cuántos turnos ataca el monstruo?
const NEW = require(process.env.NEWENG || '/home/claude/d6-crawler/src/engine.js');
const OLD = require(process.env.OLDENG || '/home/claude/dungeon-in-one-card/src/engine.js');
function turnsToAttack(E, game, L, hx, hy, mx, my, chestOpen, key) {
  E.useGame(game);
  const st = E.newRun('knight', game, [], game !== 'base'); E.setupLevel(st, L);
  const lv = E.LEVELS[L]; if (st.chest) st.chest.open = chestOpen;
  st.adv.x = hx; st.adv.y = hy; st.adv.hp = 999;
  const m0 = lv.mon;
  st.mons = [{ id: 1, x: mx, y: my, hp: m0.hp, maxHp: m0.hp, spd: m0.spd, atk: m0.atk, def: m0.def, rng: m0.rng }];
  for (let t = 1; t <= 12; t++) { const ev = E.playMonsters(st); if (ev.find(e => e.t === 'attack').ids.length) return t; }
  return 99;
}
let total = 0, better = 0, worse = 0, same = 0; const ex = [];
for (const game of ['base', 'mguf', 'peak', 'harbour', 'hell']) {
  NEW.useGame(game); const n = NEW.LEVELS.length;
  for (let L = 0; L < n; L++) {
    NEW.useGame(game); const lv = NEW.LEVELS[L];
    const free = []; for (let i = 0; i < 25; i++) if (!lv.walls[i] && i !== lv.chestAt) free.push(i);
    for (const open of (game === 'base' ? [true] : [false, true])) for (const h of free) for (const m of free) {
      if (h === m) continue; const [hx, hy] = NEW.XY(h), [mx, my] = NEW.XY(m);
      const a = turnsToAttack(OLD, game, L, hx, hy, mx, my, open), b = turnsToAttack(NEW, game, L, hx, hy, mx, my, open);
      total++; if (b < a) { better++; if (ex.length < 4) ex.push(`${game} nivel ${L + 1} héroe ${hx},${hy} monstruo ${mx},${my} cofre ${open ? 'abierto' : 'cerrado'}: ${a} → ${b} turnos`); } else if (b > a) { worse++; if (worse <= 5) console.log('PEOR', game, L + 1, hx, hy, mx, my, open, a, b); } else same++;
    }
  }
}
console.log(`casos ${total}: mejoran ${better}, igual ${same}, empeoran ${worse}`); ex.forEach(x => console.log('  ' + x));
console.log(worse === 0 ? 'ok  ningún monstruo tarda más en atacar' : 'HAY CASOS PEORES');
