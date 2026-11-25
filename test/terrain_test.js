// Terreno propio de Colossus: marea (Bahía Abisal) y refugio en grietas + Roca del Núcleo (Fisura Infernal).
// Archeodice (reglas originales de Harbour Clash y La Puerta del Infierno) no cambia.
const fs = require('fs'), vm = require('vm'), path = require('path');
const E = require('../src/engine.js');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/worlds.js'), 'utf8').replace(/^'use strict';/, '') + ';this.WORLDS=WORLDS;', ctx);
const W = ctx.WORLDS.kaiju;
const fallos = [];
const ok = (c, m) => { if (!c) fallos.push(m); };
const own = g => E.ownLevels(W.levels[g], Object.assign({}, W.stats, (W.gstats || {})[g]), 0);
const orig = {}; for (const g of ['harbour', 'hell']) orig[g] = E.GAMES[g].levels;

// ---------- Bahía Abisal: marea ----------
E.GAMES.harbour.levels = own('harbour');
{
  const st = E.newRun('paladin', 'harbour', []); E.setupLevel(st, 0);
  const lv = E.LEVELS[0], m = st.mons[0], B = lv.mon.bonus;
  ok(lv.mon.bonusOn === 'tide', 'los kaiju de Bahía deberían usar la marea');
  const agua = lv.water.findIndex(Boolean), seca = lv.walls.findIndex((w, i) => !w && !lv.water[i] && i !== lv.start);
  const k = Object.keys(B)[0];
  m.x = E.XY(agua)[0]; m.y = E.XY(agua)[1];
  st.turnNo = 1; ok(!E.tideHigh(st), 'el primer turno es de marea baja');
  ok(E.mStat(st, m, k) === m[k], 'con marea baja el agua no da bono');
  st.turnNo = 2; ok(E.tideHigh(st), 'el segundo turno es de marea alta');
  ok(E.mStat(st, m, k) === m[k] + B[k], 'con marea alta el agua suma el bono');
  m.x = E.XY(seca)[0]; m.y = E.XY(seca)[1];
  ok(E.mStat(st, m, k) === m[k], 'en tierra no hay bono ni con marea alta');
  m.x = E.XY(agua)[0]; m.y = E.XY(agua)[1];
  st.sands = true; ok(E.mStat(st, m, k) === m[k], 'el Drenaje (sands) apaga el bono con marea alta');
  st.sands = false;
  // el juego sigue: terminar el turno cambia la marea
  const t0 = st.turnNo; st.phase = 'move'; E.endTurnCleanup(st);
  ok(st.turnNo === t0 + 1 && E.tideHigh(st) === !(t0 % 2 === 0), 'al pasar el turno cambia la marea');
}
// El Harbour Clash original no tiene marea: el agua da bono siempre
E.GAMES.harbour.levels = orig.harbour;
{
  const st = E.newRun('paladin', 'harbour', []); E.setupLevel(st, 0);
  const lv = E.LEVELS[0], m = st.mons[0], k = Object.keys(lv.mon.bonus)[0], agua = lv.water.findIndex(Boolean);
  ok(!lv.mon.bonusOn, 'Harbour Clash original no debería llevar bonusOn');
  m.x = E.XY(agua)[0]; m.y = E.XY(agua)[1];
  for (const t of [1, 2, 3]) { st.turnNo = t; ok(E.mStat(st, m, k) === m[k] + lv.mon.bonus[k], 'en el original el agua da bono en el turno ' + t); }
}

// ---------- Fisura Infernal: refugio ----------
E.GAMES.hell.levels = own('hell');
{
  const idx = E.GAMES.hell.levels.findIndex(l => !l.boss && l.stoneAt >= 0);
  ok(idx >= 0, 'debería haber un nivel con Roca del Núcleo');
  const st = E.newRun('paladin', 'hell', []); E.setupLevel(st, idx);
  const lv = E.LEVELS[idx], m = st.mons[0], B = lv.mon.bonus, k = Object.keys(B)[0];
  ok(lv.mon.bonusOn === 'refuge', 'los kaiju de Fisura deberían usar el refugio');
  const grietas = lv.damned.map((d, i) => d ? i : -1).filter(i => i >= 0), grieta = grietas[0], llana = lv.walls.findIndex((w, i) => !w && !lv.damned[i] && i !== lv.chestAt);
  st.adv.x = E.XY(llana)[0]; st.adv.y = E.XY(llana)[1];
  ok(E.mStat(st, m, k) === m[k] + B[k], 'fuera de una grieta el bono cuenta');
  st.adv.x = E.XY(grieta)[0]; st.adv.y = E.XY(grieta)[1];
  ok(E.mStat(st, m, k) === m[k], 'sobre una grieta el bono se apaga');
  st.sands = true; st.adv.x = E.XY(llana)[0]; st.adv.y = E.XY(llana)[1];
  ok(E.mStat(st, m, k) === m[k], 'el Agua bendita (holy) apaga el bono');
  st.sands = false;

  // Roca del Núcleo: 1 de daño a todos, 2 a los que estén sobre una grieta; el héroe pierde 1 salvo sobre una grieta
  const prueba = (heroEnGrieta, kaijuEnGrieta, fist) => {
    const s2 = E.newRun('paladin', 'hell', []); E.setupLevel(s2, idx);
    const L = E.LEVELS[idx], t = heroEnGrieta ? grieta : llana;
    s2.adv.x = E.XY(t)[0]; s2.adv.y = E.XY(t)[1]; s2.adv.hp = 6;
    s2.mons.forEach(o => { o.hp = 6; });
    const m0 = s2.mons[0], tm = kaijuEnGrieta ? grietas[1] : llana;
    m0.x = E.XY(tm)[0]; m0.y = E.XY(tm)[1];
    s2.phase = 'move'; s2.turn = E.freshTurn(); s2.turn.atkLeft = 6; s2.fist = !!fist;
    E.breakStone(s2);
    const base = fist ? 2 : 1;
    return { heroHp: s2.adv.hp, kaijuHp: m0.hp, n: s2.mons.length, esperado: 6 - (base + (kaijuEnGrieta ? 1 : 0)) };
  };
  let r = prueba(false, false); ok(r.heroHp === 5 && r.kaijuHp === r.esperado, `Roca normal: héroe ${r.heroHp}, kaiju ${r.kaijuHp}`);
  r = prueba(false, true); ok(r.heroHp === 5 && r.kaijuHp === r.esperado, `Roca con kaiju en grieta: héroe ${r.heroHp}, kaiju ${r.kaijuHp} (esperado ${r.esperado})`);
  r = prueba(true, false); ok(r.heroHp === 6 && r.kaijuHp === r.esperado, `Roca con héroe en grieta: héroe ${r.heroHp}, kaiju ${r.kaijuHp}`);
  r = prueba(true, true, true); ok(r.heroHp === 6 && r.kaijuHp === r.esperado, `Roca con Puño, todo en grieta: héroe ${r.heroHp}, kaiju ${r.kaijuHp} (esperado ${r.esperado})`);
}
// La Puerta del Infierno original: bono mientras el héroe está sobre una casilla maldita; la Piedra pega 1 a todos y 1 al héroe
E.GAMES.hell.levels = orig.hell;
{
  const idx = orig.hell.findIndex(l => !l.boss && l.stoneAt >= 0);
  const st = E.newRun('paladin', 'hell', []); E.setupLevel(st, idx);
  const lv = E.LEVELS[idx], m = st.mons[0], k = Object.keys(lv.mon.bonus)[0];
  const grieta = lv.damned.findIndex(Boolean), llana = lv.walls.findIndex((w, i) => !w && !lv.damned[i]);
  ok(lv.mon.bonusOn === 'hero', 'La Puerta del Infierno original usa bonusOn hero');
  st.adv.x = E.XY(llana)[0]; st.adv.y = E.XY(llana)[1]; ok(E.mStat(st, m, k) === m[k], 'original: sin bono fuera de la casilla maldita');
  st.adv.x = E.XY(grieta)[0]; st.adv.y = E.XY(grieta)[1]; ok(E.mStat(st, m, k) === m[k] + lv.mon.bonus[k], 'original: bono sobre la casilla maldita');
  st.adv.hp = 6; st.mons.forEach(o => { o.hp = 6; }); st.phase = 'move'; st.turn = E.freshTurn(); st.turn.atkLeft = 6;
  E.breakStone(st);
  ok(st.adv.hp === 5 && st.mons.every(o => o.hp === 5), 'original: la Piedra hace 1 a todos y 1 al héroe, también sobre una casilla maldita');
}

if (fallos.length) { console.log('FALLA terrain_test:\n - ' + fallos.join('\n - ')); process.exit(1); }
console.log('terrain_test: todo bien');
