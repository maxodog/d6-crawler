'use strict';
const E = require('./engine.js');
const { idx, XY, N } = E;

function clone(st) {
  return { hero: st.hero, equip: st.equip, levelIdx: st.levelIdx, adv: Object.assign({}, st.adv), mons: st.mons.map(m => Object.assign({}, m)), phase: st.phase,
    turn: Object.assign({}, st.turn, { assign: Object.assign({}, st.turn.assign), dice: st.turn.dice && st.turn.dice.slice(), sides: st.turn.sides.slice() }),
    undo: [], turnNo: st.turnNo, abil: st.abil, cp: st.cp };
}
function greedyAttacks(s, acts) {
  for (;;) {
    let best = null, bScore = Infinity;
    const dmg = E.ambushReady(s) ? 2 : 1;
    for (const m of s.mons) {
      const inf = E.attackInfo(s, m);
      if (!inf.ok) continue;
      const kill = m.hp <= dmg;
      const score = (kill ? 0 : 100) + inf.cost / Math.min(dmg, m.hp) + m.hp * 0.01;
      if (score < bScore) { bScore = score; best = m; }
    }
    if (!best) break;
    acts.push({ t: 'atk', id: best.id });
    E.attackMon(s, best);
  }
}
function evalState(s, n0) {
  if (s.mons.length === 0) return 1e5 + s.adv.hp * 10;
  const c = clone(s), hp0 = c.adv.hp;
  E.playMonsters(c);
  const dmg = hp0 - c.adv.hp;
  if (c.adv.hp <= 0) return -1e6 - dmg;
  const lv = E.lvOf(c), advI = idx(c.adv.x, c.adv.y);
  let sumd = 0, sumhp = 0;
  for (const m of c.mons) { sumd += E.rangeDist(lv, advI, idx(m.x, m.y)); sumhp += m.hp; }
  return -45 * dmg - 6 * sumhp - 8 * c.mons.length - 0.5 * sumd;
}
const PERMS = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
function planTurn(st) {
  const n0 = st.mons.length;
  const cands = [];
  for (const p of PERMS) {
    const s = clone(st);
    s.turn.assign = { spd: p[0], atk: p[1], def: p[2] };
    E.confirmEnergy(s);
    const pushes = [null];
    if (s.hero === 'beetle' && !s.abil) for (const m of s.mons) if (E.cornadaInfo(s, m).ok) pushes.push(m.id);
    for (const pid of pushes) {
      const s0 = clone(s), base = [];
      if (pid) { const m = s0.mons.find(o => o.id === pid); base.push({ t: 'push', id: pid }); E.cornada(s0, m); }
      const cur = idx(s0.adv.x, s0.adv.y);
      const R = E.reachFromAdv(s0);
      for (let d = 0; d < N; d++) {
        if (R.dist[d] > s0.turn.spdLeft) continue;
        // 1) mover y luego atacar
        const s1 = clone(s0), a1 = base.slice();
        if (d !== cur) { a1.push({ t: 'move', to: d, dist: R.dist[d] }); E.moveAdv(s1, d, R.dist[d]); }
        greedyAttacks(s1, a1);
        cands.push({ v: evalState(s1, n0), acts: a1, perm: p });
        // 2) atacar y luego mover
        if (d !== cur) {
          const s2 = clone(s0), a2 = base.slice();
          greedyAttacks(s2, a2);
          const R2 = E.reachFromAdv(s2);
          if (R2.dist[d] <= s2.turn.spdLeft) { a2.push({ t: 'move', to: d, dist: R2.dist[d] }); E.moveAdv(s2, d, R2.dist[d]); cands.push({ v: evalState(s2, n0), acts: a2, perm: p }); }
        }
      }
    }
  }
  cands.sort((a, b) => b.v - a.v);
  return cands[0];
}
function helmReroll(st) {
  if (!E.canReroll(st)) return;
  const t = st.turn; let bi = -1, br = 1;
  for (let i = 0; i < 3; i++) { const r = t.dice[i] / t.sides[i]; if (r < br) { br = r; bi = i; } }
  if (br > (+process.env.HELM_THR || 1)) return;
  E.useHelm(st, bi);
}
// Juega un nivel hasta ganar o morir. Devuelve {won, turns, dmg}
function playLevel(st, maxTurns = 40) {
  const hp0 = st.adv.hp;
  let turns = 0;
  while (turns < maxTurns) {
    helmReroll(st);
    const plan = planTurn(st);
    const p = plan.perm;
    st.turn.assign = { spd: p[0], atk: p[1], def: p[2] };
    E.confirmEnergy(st);
    for (const a of plan.acts) {
      if (a.t === 'push') E.cornada(st, st.mons.find(o => o.id === a.id));
      else if (a.t === 'move') E.moveAdv(st, a.to, a.dist);
      else if (a.t === 'atk') E.attackMon(st, st.mons.find(o => o.id === a.id));
    }
    turns++;
    if (E.levelCleared(st)) return { won: true, turns, dmg: hp0 - st.adv.hp };
    E.endTurn(st);
    if (st.phase === 'dead') return { won: false, turns, dmg: hp0 };
  }
  return { won: false, turns, dmg: hp0 };
}
function pickDie(st) {
  let bi = -1;
  st.kit.forEach((s, i) => { if (E.nextDie(s) && (bi < 0 || s > st.kit[bi])) bi = i; });
  return bi < 0 ? null : 'dice' + bi;
}
/* Estrategias de mejora (opts.strat). Habilidades: orden de prioridad ('rng3' = Alcance hasta 3). Muda: mezcla de dados y habilidades. */
const SK_ORDERS = {
  def: ['def', 'rng3', 'atk', 'spd', 'rng'],     // Defensa a tope, luego Alcance 3, Ataque, Velocidad
  defatk: ['def', 'atk', 'spd', 'rng'],          // Defensa y Ataque a tope, sin Alcance
  atkdef: ['atk', 'def', 'spd', 'rng3', 'rng'],  // Ataque primero
  spddef: ['spd', 'def', 'atk', 'rng3', 'rng'],  // Velocidad primero
  rngdef: ['rng3', 'def', 'atk', 'spd', 'rng']   // Alcance 3 primero
};
const STRATS_KITS = ['def', 'defatk', 'atkdef', 'spddef', 'rngdef', 'bal', 'heal'];
// mix: dice = dados y luego habilidades; skills = habilidades y luego dados; alt; onlydice; onlyskills. die: big|small. sk: orden de habilidades
const STRATS_MUDA = {
  'dados>def':   { mix: 'dice', die: 'big', sk: 'def' },
  'def>dados':   { mix: 'skills', die: 'big', sk: 'def' },
  'alt':         { mix: 'alt', die: 'big', sk: 'def' },
  'solo-dados':  { mix: 'onlydice', die: 'big', sk: 'def' },
  'solo-hab':    { mix: 'onlyskills', die: 'big', sk: 'def' },
  'dados-chicos>def': { mix: 'dice', die: 'small', sk: 'def' },
  'atk>dados':   { mix: 'skills', die: 'big', sk: 'atkdef' },
  'dados>atk':   { mix: 'dice', die: 'big', sk: 'atkdef' },
  'solo-hab-atk': { mix: 'onlyskills', die: 'big', sk: 'atkdef' }
};
function skillPick(a, order) {
  for (const k of order) { const kk = k === 'rng3' ? 'rng' : k, lim = k === 'rng3' ? 3 : E.SKILL_MAX; if (a[kk] < lim) return kk; }
  return null;
}
function diePick(st, which) {
  let bi = -1;
  st.kit.forEach((sd, i) => { if (!E.nextDie(sd)) return; if (bi < 0 || (which === 'small' ? sd < st.kit[bi] : sd > st.kit[bi])) bi = i; });
  return bi < 0 ? null : 'dice' + bi;
}
function pickStrat(st, opts) {
  const a = st.adv, heal = opts.heal == null ? 2 : opts.heal;
  if (a.hp <= heal) return 'heal';
  if (opts.strat === 'heal') return 'heal';
  if (opts.strat === 'bal') {
    let best = null; for (const k of ['def', 'atk', 'spd', 'rng']) if (a[k] < E.SKILL_MAX && (best === null || a[k] < a[best])) best = k;
    return best || 'heal';
  }
  if (st.mode === 'muda') {
    const c = STRATS_MUDA[opts.strat], n = st.breakNo = (st.breakNo || 0) + 1, d = diePick(st, c.die), k = skillPick(a, SK_ORDERS[c.sk]);
    const seq = c.mix === 'dice' ? [d, k] : c.mix === 'skills' ? [k, d] : c.mix === 'onlydice' ? [d] : c.mix === 'onlyskills' ? [k] : (n % 2 ? [d, k] : [k, d]);
    return seq.find(Boolean) || 'heal';
  }
  return skillPick(a, SK_ORDERS[opts.strat]) || 'heal';
}
function pickBreak(st, opts) {
  if (opts.strat) return pickStrat(st, opts);
  const a = st.adv;
  if (a.hp <= (opts.heal == null ? 2 : opts.heal)) return 'heal';
  if (st.mode === 'muda') {
    const pol = opts.policy || 'alt', n = st.breakNo = (st.breakNo || 0) + 1, d = pickDie(st);
    const skill = () => { for (const k of opts.order || ['def', 'rng', 'atk', 'spd']) { const lim = k === 'rng' ? 3 : E.SKILL_MAX; if (a[k] < lim) return k; } return null; };
    const seq = pol === 'dice' ? [d, skill()] : pol === 'def' ? [skill(), d] : (n % 2 ? [d, skill()] : [skill(), d]);
    return seq.find(Boolean) || 'heal';
  }
  for (const k of opts.order || ['def', 'rng', 'atk', 'spd']) {
    const lim = k === 'rng' ? 3 : E.SKILL_MAX;
    if (a[k] < lim) return k;
  }
  for (const k of ['def', 'atk', 'spd', 'rng']) if (a[k] < E.SKILL_MAX) return k;
  return 'heal';
}
function campaign(hero, equip, opts = {}) {
  E.loadLevels(E.DEFS[opts.mode || 'kits']);
  const st = E.newRun(hero, equip, opts.mode), RETRY = opts.retry == null ? 3 : opts.retry;
  const levels = [];
  let retries = 0, reached = 0;
  for (let i = 0; i < E.LEVELS.length; i++) {
    reached = i + 1;
    let tries = 0, won = false, r;
    while (tries <= RETRY) {
      r = playLevel(st);
      if (opts.log) opts.log(i, tries, r);
      if (r.won) { won = true; break; }
      tries++; retries++;
      E.retryLevel(st);
    }
    levels.push({ tries, won, dmg: r.dmg, turns: r.turns });
    if (!won) return { won: false, reached, retries, levels };
    if (i === E.LEVELS.length - 1) return { won: true, reached: 12, retries, levels };
    E.applyBreak(st, pickBreak(st, opts));
    E.nextLevel(st);
  }
}
module.exports = { clone, planTurn, playLevel, campaign, pickBreak, STRATS_KITS, STRATS_MUDA };
