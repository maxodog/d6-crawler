'use strict';
// Compara la dificultad nivel a nivel de un juego propio (Colossus) con su equivalente de Archeodice (mapas originales).
// Cada nivel se juega muchas veces desde Vida 6 con mejoras típicas para esa altura; mide derrotas, daño y turnos.
// Uso: node test/balance.js [N]   (WORLD=kaiju GAME=base por defecto)
const fs = require('fs'), vm = require('vm'), path = require('path');
const E = require('../src/engine.js');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/worlds.js'), 'utf8').replace(/^'use strict';/, '') + ';this.WORLDS=WORLDS;', ctx);
const WORLD = process.env.WORLD || 'kaiju', GAME = process.env.GAME || 'base', N = +(process.argv[2] || 150);
const W = ctx.WORLDS[WORLD];
if (process.env.GSTATS) { const o = JSON.parse(process.env.GSTATS); W.gstats = W.gstats || {}; W.gstats[GAME] = Object.assign({}, W.gstats[GAME], o); }   // prueba rápida de cifras: GSTATS='{"ogre":{...}}'

function ownLevels() { return E.ownLevels(W.levels[GAME], Object.assign({}, W.stats, (W.gstats || {})[GAME]), 0); }
const ORIG = E.GAMES[GAME].levels, OWN = ownLevels();

// ---- comprobaciones de mapas ----
let bad = 0;
OWN.forEach((lv, i) => {
  if (lv.map.length !== 5 || lv.map.some(r => r.length !== 5)) { console.log('mapa mal formado', i + 1); bad++; }
  if (lv.start < 0 || lv.stairs.length !== 2) { console.log('escaleras', i + 1); bad++; }
  const d = E.dijkstra(lv, lv.start, null).dist;
  for (let t = 0; t < E.N; t++) if (!lv.walls[t] && d[t] === Infinity) { console.log('casilla aislada', i + 1, E.XY(t)); bad++; }
  lv.spawns.forEach(p => { if (lv.walls[p] || p === lv.start) { console.log('aparición inválida', i + 1, E.XY(p)); bad++; } });
  if (lv.chestAt >= 0 && !lv.stairs.includes(lv.chestAt) && lv.spawns.includes(lv.chestAt)) { console.log('aparición sobre el cofre', i + 1, E.XY(lv.chestAt)); bad++; }
  if (new Set(lv.spawns).size !== lv.spawns.length) { console.log('dos monstruos en la misma casilla', i + 1); bad++; }
  const same = ORIG.findIndex(o => o.map.join() === lv.map.join());
  if (same >= 0) { console.log('mapa igual al original', i + 1); bad++; }
});
console.log('mapas propios ok:', bad === 0);

// ---- bot (mismo criterio que sim.js) ----
const clone = s => JSON.parse(JSON.stringify(s));
function evalState(st) {
  const c = clone(st), hp0 = c.adv.hp;
  if (!c.mons.length) return -1000;
  E.playMonsters(c);
  return (hp0 - c.adv.hp) * 40 + c.mons.reduce((s, m) => s + m.hp, 0) * 3;
}
function evalMove(st, i, cost) {
  const c = clone(st); const [x, y] = E.XY(i); c.adv.x = x; c.adv.y = y; c.turn.spdLeft -= cost;
  const potential = c.mons.some(m => E.attackInfo(c, m).ok) ? 1 : 0;
  const lv = E.LEVELS[c.levelIdx];
  let dmin = Infinity; for (const m of c.mons) dmin = Math.min(dmin, E.rangeDist(lv, i, E.idx(m.x, m.y)));
  const c2 = clone(c);
  for (let g = 0; g < 10; g++) {
    const t = c2.mons.filter(m => E.attackInfo(c2, m).ok).sort((a, b) => a.hp - b.hp);
    if (!t.length) break; c2.turn.atkLeft -= t[0].def; t[0].hp--; if (t[0].hp <= 0) c2.mons = c2.mons.filter(o => o !== t[0]);
  }
  return evalState(c2) - potential * 5 + dmin * 0.5;
}
function greedy(st) {
  for (let g = 0; g < 30; g++) {
    const tg = st.mons.filter(m => E.attackInfo(st, m).ok).sort((a, b) => a.hp - b.hp || a.def - b.def);
    if (tg.length) { E.attackMon(st, tg[0]); if (!st.mons.length) return; continue; }
    const R = E.reachFromAdv(st), here = E.idx(st.adv.x, st.adv.y);
    let best = { i: here, score: evalMove(st, here, 0), cost: 0 };
    for (let i = 0; i < E.N; i++) if (R.dist[i] > 0 && R.dist[i] <= st.turn.spdLeft) {
      const s = evalMove(st, i, R.dist[i]); if (s < best.score - 1e-9) best = { i, score: s, cost: R.dist[i] };
    }
    if (best.cost > 0) E.moveAdv(st, best.i, best.cost); else break;
  }
}
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
function playTurn(st) {
  st.turn.dice = E.rollDice();
  let best = null, bs = Infinity;
  for (const p of PERMS) {
    const c = clone(st); c.turn.assign = { spd: p[0], atk: p[1], def: p[2] }; E.confirmEnergy(c); greedy(c);
    const sc = evalState(c); if (sc < bs) { bs = sc; best = c; }
  }
  Object.assign(st, best);
}
const W8 = { atk: 1, def: 1, spd: 0.7, rng: 0.8 };
function upgrades(st, n) {
  for (let k = 0; k < n; k++) {
    let b = null, bs = Infinity;
    for (const s of ['atk', 'def', 'spd', 'rng']) { const v = st.adv[s] / W8[s]; if (v < bs && st.adv[s] < E.SKILL_MAX) { bs = v; b = s; } }
    E.applyBreak(st, b);
  }
}
function playLevel(levels, i) {
  E.GAMES[GAME].levels = levels; E.useGame(GAME);
  const st = E.newRun('paladin', GAME, []); upgrades(st, levels.slice(0, i).filter(l => !l.boss).length); E.setupLevel(st, i); st.adv.hp = E.START_HP;
  for (let t = 1; t <= 60; t++) {
    playTurn(st);
    if (!st.mons.length) return { dead: false, dmg: E.START_HP - st.adv.hp, t };
    E.playMonsters(st);
    if (st.adv.hp <= 0) return { dead: true, dmg: E.START_HP, t };
    st.turn = E.freshTurn(); st.phase = 'energy';
  }
  return { dead: true, dmg: E.START_HP - st.adv.hp, t: 60 };
}
function measure(levels) {
  return levels.map((lv, i) => {
    let d = 0, dmg = 0, t = 0;
    for (let k = 0; k < N; k++) { const r = playLevel(levels, i); d += r.dead; dmg += r.dmg; t += r.t; }
    return { dead: d / N, dmg: dmg / N, t: t / N, n: lv.spawns.length, key: lv.boss ? 'JEFE ' + lv.mon.key : lv.mon.key };
  });
}
// ---- campaña completa: niveles seguidos, con la Vida que quede; cura si queda con poca Vida ----
function campaign(levels, healAt) {
  E.GAMES[GAME].levels = levels; E.useGame(GAME);
  const st = E.newRun('paladin', GAME, []); let turns = 0;
  for (;;) {
    turns++; playTurn(st);
    if (!st.mons.length) {
      if (st.levelIdx === levels.length - 1) return levels.length + 1;
      if (E.afterClear(st) === 'boss') { E.nextLevel(st); continue; }   // el jefe no da mejora
      let b = 'heal';
      if (st.adv.hp > healAt) { let bs = Infinity; for (const s of ['atk', 'def', 'spd', 'rng']) { const v = st.adv[s] / W8[s]; if (v < bs && st.adv[s] < E.SKILL_MAX) { bs = v; b = s; } } }
      E.applyBreak(st, b); E.nextLevel(st); continue;
    }
    E.playMonsters(st);
    if (st.adv.hp <= 0) return st.levelIdx + 1;
    st.turn = E.freshTurn(); st.phase = 'energy';
    if (turns > 600) return st.levelIdx + 1;
  }
}
if (process.env.CAMPAIGN) {
  const n = +process.env.CAMPAIGN, H = +(process.env.HEAL || 3);
  for (const [name, lv] of [['original', ORIG], ['propio', OWN]]) {
    if (process.env.ONLY === 'own' && name === 'original') continue;
    if (process.env.ONLY === 'orig' && name === 'propio') continue;
    const reach = new Array(lv.length + 2).fill(0); let sum = 0;
    for (let k = 0; k < n; k++) { const r = campaign(lv, H); sum += r; for (let i = 1; i <= r; i++) reach[i]++; }
    console.log(`${name.padEnd(9)} campaña: llega al nivel → ` + reach.slice(1, lv.length + 1).map((v, i) => `${i + 1}:${Math.round(100 * v / n)}%`).join(' ') + ` · gana ${Math.round(100 * reach[lv.length + 1] / n)}% · nivel medio ${(sum / n).toFixed(1)}`);
  }
  process.exit(0);
}
const only = process.env.LV ? process.env.LV.split(',').map(x => +x - 1) : null;
const pick = a => only ? a.filter((_, i) => only.includes(i)) : a;
const t0 = Date.now();
const A = process.env.ONLY === 'own' ? OWN.map(() => ({ dead: 0, dmg: 0, t: 0, n: 0, key: '-' })) : measure(ORIG), B = measure(OWN);
const fmt = r => `${(r.dead * 100).toFixed(0).padStart(3)}% muere · daño ${r.dmg.toFixed(1)} · ${r.t.toFixed(1)} turnos`;
console.log(`nivel | Archeodice (original)                   | ${W.name} (propio)`);
A.forEach((a, i) => { if (only && !only.includes(i)) return; const b = B[i]; console.log(`${String(i + 1).padStart(5)} | ${a.n}× ${a.key.padEnd(8)} ${fmt(a)} | ${b.n}× ${b.key.padEnd(8)} ${fmt(b)}${Math.abs(a.dmg - b.dmg) > 0.8 ? '  <-- revisar' : ''}`); });
const avg = (R, f) => R.reduce((s, r) => s + f(r), 0) / R.length;
console.log(`total: original daño ${avg(A, r => r.dmg).toFixed(2)} muertes ${(avg(A, r => r.dead) * 100).toFixed(0)}% · propio daño ${avg(B, r => r.dmg).toFixed(2)} muertes ${(avg(B, r => r.dead) * 100).toFixed(0)}% · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
