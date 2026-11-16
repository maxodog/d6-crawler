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

function ownLevels() {
  const mons = {};
  return W.levels[GAME].map((d, i) => {
    const mon = mons[d.m] || (mons[d.m] = Object.assign({ key: d.m, name: d.m, plural: d.m }, W.stats[d.m]));
    return E.buildLevel({ title: d.t.split('|')[0], at: d.at, num: i + 1 }, { mon, map: d.map });
  });
}
const ORIG = E.GAMES[GAME].levels;

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
  const st = E.newRun('paladin', GAME, []); upgrades(st, i); E.setupLevel(st, i); st.adv.hp = E.START_HP;
  for (let t = 1; t <= 60; t++) {
    playTurn(st);
    if (!st.mons.length) return { dead: false, dmg: E.START_HP - st.adv.hp, t };
    E.playMonsters(st);
    if (st.adv.hp <= 0) return { dead: true, dmg: E.START_HP, t };
    st.turn = E.freshTurn(); st.phase = 'energy';
  }
  return { dead: true, dmg: E.START_HP - st.adv.hp, t: 60 };
}

// ---- diseño automático: para cada nivel elige cantidad y posiciones de aparición que den el daño objetivo ----
const DEF = W.levels[GAME];
const T0 = +(process.env.T0 || 0.8), T1 = +(process.env.T1 || 3.6), NS = +(process.env.NS || 30), TRIES = +(process.env.TRIES || 10);
const RANGE = i => i < 3 ? [1, 3] : [1, 5];
const mons = {};
function mk(d, at) { const mon = mons[d.m] || (mons[d.m] = Object.assign({ key: d.m, name: d.m, plural: d.m }, W.stats[d.m])); return E.buildLevel({ title: d.t, at, num: 1 }, { mon, map: d.map }); }
function freeTiles(lv, startIdx) {
  const out = [], dist = E.dijkstra(lv, lv.start, null).dist;
  for (let t = 0; t < E.N; t++) if (!lv.walls[t] && t !== lv.start && dist[t] >= 6) out.push(E.XY(t));
  return out;
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const levels = DEF.map(d => mk(d, d.at));
const result = [];
const ONLYL = process.env.LVS ? process.env.LVS.split(',').map(x => +x - 1) : null;
for (let i = 0; i < DEF.length; i++) {
  if (ONLYL && !ONLYL.includes(i)) { result.push(DEF[i].at); continue; }
  const target = T0 + (T1 - T0) * i / (DEF.length - 1), d = DEF[i];
  const free = freeTiles(levels[i]);
  let best = null;
  const [c0, c1] = RANGE(i);
  for (let c = c0; c <= c1; c++) for (let k = 0; k < TRIES; k++) {
    const pool = free.slice(); const at = [];
    while (at.length < c && pool.length) at.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    if (at.length < c) continue;
    levels[i] = mk(d, at);
    let dmg = 0; for (let r = 0; r < NS; r++) dmg += playLevel(levels, i).dmg; dmg /= NS;
    const err = Math.abs(dmg - target);
    if (!best || err < best.err) best = { err, dmg, at, c };
  }
  levels[i] = mk(d, best.at); result.push(best.at);
  console.log(`nivel ${i + 1} ${d.m}: objetivo ${target.toFixed(2)} → ${best.c}× daño ${best.dmg.toFixed(2)} en ${JSON.stringify(best.at)}`);
}
console.log('AT=' + JSON.stringify(result));
