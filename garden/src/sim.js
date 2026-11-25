const E = require('./engine.js'), B = require('./bot.js');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const runs = +process.env.RUNS || 20, seed = +process.env.SEED || 1;
const heroes = (process.env.HEROES || 'beetle,mantis').split(','), equips = (process.env.EQUIPS || 'thorn,shield,helm').split(',');
const t0 = Date.now();
for (const h of heroes) for (const q of equips) {
  E.setRng(mulberry(seed * 1000 + h.length * 7 + q.length));
  let w = 0, ret = 0, reach = 0; const dm = new Array(12).fill(0), cn = new Array(12).fill(0);
  for (let r = 0; r < runs; r++) {
    const c = B.campaign(h, q, { mode: process.env.MODE, policy: process.env.POLICY });
    if (c.won) w++; ret += c.retries; reach += c.reached;
    c.levels.forEach((l, i) => { dm[i] += l.dmg; cn[i]++; });
  }
  console.log(h.padEnd(7), q.padEnd(7), 'gana', (100 * w / runs).toFixed(0) + '%', 'reintentos', (ret / runs).toFixed(1), 'nivel medio', (reach / runs).toFixed(1));
  if (process.env.PROFILE) console.log('   daño/nivel', dm.map((d, i) => (d / cn[i]).toFixed(1)).join(' '));
}
console.log('ms', Date.now() - t0);
