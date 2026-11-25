const E = require('./engine.js'), B = require('./bot.js');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const rng = mulberry(+process.env.SEED || 5);
function typicalAdv(L) { // L = nivel 1..12
  const ups = Math.round((L - 1) * 0.85), a = { spd: 1, atk: 1, def: 1, rng: 2 };
  const order = ['def', 'rng', 'atk', 'spd'];
  for (let i = 0; i < ups; i++) { for (const k of order) { const lim = k === 'rng' ? 3 : 6; if (a[k] < lim) { a[k]++; break; } } }
  return a;
}
function typical(hero, L, mode) { // héroe típico al empezar el nivel L (1..12): { adv, kit }
  if (mode !== 'muda') return { adv: typicalAdv(L), kit: null };
  const a = { spd: 1, atk: 1, def: 1, rng: 2 }, kit = E.MUDA_KITS[hero].slice(), ups = Math.round((L - 1) * 0.85);
  const order = ['def', 'rng', 'atk', 'spd'];
  const skill = () => { for (const k of order) { const lim = k === 'rng' ? 3 : 6; if (a[k] < lim) { a[k]++; return true; } } return false; };
  const die = () => { let bi = -1; kit.forEach((s, i) => { if (E.nextDie(s) && (bi < 0 || s > kit[bi])) bi = i; }); if (bi < 0) return false; kit[bi] = E.nextDie(kit[bi]); return true; };
  for (let i = 0; i < ups; i++) { if (i % 2 === 0) { if (!die()) skill(); } else { if (!skill()) die(); } }
  return { adv: a, kit };
}
function candidates(mapKey, minStart) {
  minStart = minStart || 8;
  const lv = E.LEVELS.find(l => l.mapKey === mapKey), R = E.dijkstra(lv, lv.start, null, null).dist, out = [];
  for (let i = 0; i < E.N; i++) if (!lv.walls[i] && R[i] >= minStart && R[i] < Infinity) out.push(i);
  return { lv, cand: out };
}
function sample(mapKey, count, r, mind, minStart) {
  mind = mind || 3;
  minStart = minStart || (count <= 4 ? 8 : count <= 6 ? 6 : 5);
  const { lv, cand } = candidates(mapKey, minStart);
  for (let tries = 0; tries < 200; tries++) {
    const pick = [], pool = cand.slice();
    while (pick.length < count && pool.length) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    let ok = pick.length === count;
    for (let a = 0; ok && a < pick.length; a++) for (let b = a + 1; b < pick.length; b++) if (E.rangeDist(lv, pick[a], pick[b]) < mind) ok = false;
    if (ok) return pick.map(E.XY);
  }
  return null;
}
// evalúa un nivel (definición) con héroes/equipos mezclados
function evalLevel(def, L, trials, hp = 6, mode) {
  const defs = E.DEFS[mode || 'kits'].slice(); defs[L - 1] = def; E.loadLevels(defs);
  let dmg = 0, deaths = 0, n = 0, turns = 0;
  const combos = [['beetle','thorn'],['beetle','shield'],['beetle','helm'],['mantis','thorn'],['mantis','shield'],['mantis','helm']];
  for (let t = 0; t < trials; t++) for (const [h, q] of combos) {
    const ty = typical(h, L, mode), st = E.newRun(h, q, mode); if (ty.kit) st.kit = ty.kit; E.setupLevel(st, L - 1); st.adv = Object.assign({ x: st.adv.x, y: st.adv.y, hp }, ty.adv);
    const r = B.playLevel(st);
    n++; if (!r.won) deaths++; dmg += r.dmg; turns += r.turns;
  }
  return { dmg: dmg / n, death: deaths / n, turns: turns / n };
}
module.exports = { typical, typicalAdv, sample, candidates, evalLevel, rng, mulberry };
if (require.main === module) {
  const probes = [ ['A','tij',2],['A','tij',3],['A','tij',4],['A','tij',5],['A','tij',6],['A','tij',7],
    ['B','coc',1],['B','coc',2],['B','coc',3],['B','coc',4],
    ['A2','bom',1],['A2','bom',2],['A2','bom',3],['A2','bom',4],['A2','bom',5],
    ['B2','avi',1],['B2','avi',2],['B2','avi',3],['B2','avi',4],['B2','avi',5] ];
  for (const [mk, mon, c] of probes) {
    for (const L of [1, 6, 11]) {
      let acc = { dmg: 0, death: 0, turns: 0 }, K = 4;
      for (let k = 0; k < K; k++) {
        const at = sample(mk, c, rng); if (!at) { acc = null; break; }
        const r = evalLevel({ t: 'x', map: mk, m: mon, at }, L, 1);
        acc.dmg += r.dmg / K; acc.death += r.death / K; acc.turns += r.turns / K;
      }
      if (acc) console.log(mon, 'x' + c, 'nivel', L, 'daño', acc.dmg.toFixed(1), 'muerte', (100 * acc.death).toFixed(0) + '%', 'turnos', acc.turns.toFixed(1));
    }
  }
}
