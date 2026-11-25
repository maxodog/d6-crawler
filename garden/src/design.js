const E = require('./engine.js'), P = require('./probe.js');
const COUNTS = (process.env.COUNTS || '3,1,2,4,6,2,4,5,7,3,5,6').split(',').map(Number);
const TARGET = (process.env.TARGET || '1.4,1.6,1.8,2.2,1.4,1.6,1.7,2.0,1.5,1.7,1.8,2.2').split(',').map(Number);
const K = +process.env.K || 24, SEED = +process.env.SEED || 11;
const r = P.mulberry(SEED);
const out = [], base = E.LEVEL_DEFS.map(d => Object.assign({}, d));
const t0 = Date.now();
for (let L = 1; L <= 12; L++) {
  const d0 = base[L - 1], cnt = COUNTS[L - 1];
  const cands = [];
  for (let k = 0; k < K; k++) {
    const at = P.sample(d0.map, cnt, r, 2); if (!at) continue;
    const e = P.evalLevel({ t: d0.t, map: d0.map, m: d0.m, at }, L, 1);
    cands.push({ at, e, s: Math.abs(e.dmg - TARGET[L - 1]) + e.death * 2 });
  }
  cands.sort((a, b) => a.s - b.s);
  const fin = cands.slice(0, 4).map(c => { const e = P.evalLevel({ t: d0.t, map: d0.map, m: d0.m, at: c.at }, L, 3); return { at: c.at, e, s: Math.abs(e.dmg - TARGET[L - 1]) + e.death * 2 }; }).sort((a, b) => a.s - b.s);
  const b = fin[0];
  console.log('L' + L, d0.m, 'x' + cnt, 'daño', b.e.dmg.toFixed(2), 'muerte', (100 * b.e.death).toFixed(0) + '%', 'turnos', b.e.turns.toFixed(1), 'at', JSON.stringify(b.at));
  out.push(b.at);
}
console.log('AT=' + JSON.stringify(out));
console.log('seg', ((Date.now() - t0) / 1000).toFixed(0));
