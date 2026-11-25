const E = require('./engine.js'), P = require('./probe.js');
const r = P.mulberry(3);
const maps = { A: [1,5,9], B: [2,6,10], A2: [3,7,11], B2: [4,8,12] };
const monOf = { A: 'tij', B: 'coc', A2: 'bom', B2: 'avi' };
const only = process.env.MAPS ? process.env.MAPS.split(',') : Object.keys(maps);
for (const mk of only) {
  console.log(mk, monOf[mk]);
  for (const L of maps[mk]) {
    const row = [];
    for (let c = 1; c <= 7; c++) {
      let d = 0, de = 0, k = 0;
      for (let t = 0; t < 3; t++) { const at = P.sample(mk, c, r, 2); if (!at) continue; const e = P.evalLevel({ t: 'x', map: mk, m: monOf[mk], at }, L, 1); d += e.dmg; de += e.death; k++; }
      row.push(k ? (d / k).toFixed(1) + '/' + (100 * de / k).toFixed(0) + '%' : '--');
    }
    console.log('  L' + L, row.map(x => x.padStart(9)).join(' '));
  }
}
