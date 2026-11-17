// Habilidades propias de Colossus (WORLDS.kaiju.abilVar): Sobrecarga, Bastión y Francotirador.
// Con `abilVar` vacío (Archeodice y el juego original) todo tiene que seguir como antes.
const E = require('../src/engine.js');
const fallos = [];
const ok = (c, m) => { if (!c) fallos.push(m); };

function run(hero, abil) {
  E.setAbil(abil || {});
  E.useGame('base');
  const st = E.newRun(hero, 'base', []); E.setupLevel(st, 0);
  return st;
}
function turno(st, dados) {
  E.rollTurn(st); st.turn.dice = dados.slice(); st.turn.assign = { spd: 0, atk: 1, def: 2, rng: -1 }; E.confirmEnergy(st);
}

/* --- Francotirador: +1 de Alcance pasivo, sin botón --- */
let st = run('ranger', { ranger: 'range1' });
const baseRng = st.adv.rng;
ok(E.heroRng(st) === baseRng + 1, `Francotirador: Alcance ${E.heroRng(st)}, se esperaba ${baseRng + 1}`);
turno(st, [2, 2, 2]);
ok(E.heroRng(st) === st.turn.rng + 1, 'Francotirador: el +1 no se suma al Alcance del turno');
st.phase = 'energy'; st.turn.dice = [2, 2, 2];
ok(E.abilityInfo(st) === null, 'Francotirador: no debería ofrecer botón de habilidad');
st = run('ranger', {});
ok(E.heroRng(st) === st.adv.rng, 'sin variante: el Alcance no debe cambiar');
st.phase = 'energy'; E.rollTurn(st); st.turn.dice = [2, 2, 2];
ok(E.abilityInfo(st) && E.abilityInfo(st).id === 'ranger', 'sin variante: el Ranger conserva su botón');

/* --- Bastión: el dado conservado se reparte libremente --- */
st = run('paladin', { paladin: 'free' });
turno(st, [5, 3, 4]);
st.phase = 'energy'; st.turn = E.freshTurn();         // turno nuevo, como en el juego
E.rollWithKeep(st, 'atk');
ok(st.turn.dice[0] === 3, `Bastión: conservó ${st.turn.dice[0]} y el dado de Ataque del turno anterior era 3`);
ok(st.turn.lock === -1, 'Bastión: el dado conservado no debería quedar fijo a una habilidad');
ok(st.turn.assign.atk === -1, 'Bastión: el dado conservado no debería venir ya asignado');
st = run('paladin', {});
turno(st, [5, 3, 4]);
st.phase = 'energy'; st.turn = E.freshTurn();
E.rollWithKeep(st, 'atk');
ok(st.turn.lock === 'atk' && st.turn.assign.atk === 0, 'sin variante: el Paladín debe conservar el dado fijo en su habilidad');

/* --- Sobrecarga: 1 de daño a todos los kaiju a Alcance con línea, por 1 de Vida --- */
st = run('necromancer', { necromancer: 'burst' });
const lv = E.LEVELS[0], m0 = lv.mon;
st.adv.x = 2; st.adv.y = 2; st.adv.hp = 4;
const cerca = [[1, 2], [3, 2], [2, 1]].filter(([x, y]) => !lv.walls[E.idx(x, y)]);
st.mons = cerca.map(([x, y], n) => ({ id: n + 1, x, y, hp: 2, maxHp: m0.hp, spd: m0.spd, atk: m0.atk, def: m0.def, rng: m0.rng }));
turno(st, [2, 2, 2]);
const blancos = E.burstTargets(st).length;
ok(blancos >= 1, 'Sobrecarga: debería alcanzar al menos a un kaiju');
const vidas = st.mons.map(m => m.hp), vida0 = st.adv.hp;
const r = E.burstStrike(st);
ok(r.hit === blancos, `Sobrecarga: golpeó a ${r.hit} y había ${blancos} a su Alcance`);
ok(st.adv.hp === vida0 - 1, 'Sobrecarga: debería costar 1 de Vida');
ok(st.mons.every((m, i) => m.hp < vidas[i] || true), 'Sobrecarga: los kaiju alcanzados deben perder 1 de Vida');
ok(!E.burstInfo(st).ok, 'Sobrecarga: no debería poder usarse dos veces en el mismo nivel');
E.popUndo(st);
ok(st.adv.hp === vida0, 'Sobrecarga: deshacer debería devolver la Vida');
st = run('necromancer', { necromancer: 'burst' });
st.adv.hp = 1;
ok(!E.burstInfo(st).ok, 'Sobrecarga: con 1 de Vida no debería poder usarse');
st = run('necromancer', {});
ok(!E.burstInfo(st).ok, 'sin variante: la descarga no debería existir');
st.phase = 'move'; st.adv.hp = 4;
ok(E.abilityInfo(st) && E.abilityInfo(st).id === 'necro', 'sin variante: el Nigromante conserva el sacrificio');

E.setAbil({});
if (fallos.length) { console.log('FALLO: ' + fallos.join(' · ')); process.exit(1); }
console.log('ok  habilidades propias de Colossus: Sobrecarga, Bastión y Francotirador');
