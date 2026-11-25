'use strict';
/* Garden Crawler — motor (sin DOM). Reglas basadas en D6 Crawler, tablero 6x6 y kits de dados por héroe. */
const COLS = 6, ROWS = 6, N = COLS * ROWS;
const idx = (x, y) => y * COLS + x;
const XY = i => [i % COLS, (i / COLS) | 0];
// [dx, dy, coste de Movimiento]: recto 2, diagonal 3
const DIRS = [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2],[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]];
const START_HP = 6, SKILL_MAX = 6;

let rnd = Math.random;
function setRng(f) { rnd = f || Math.random; }
const roll = s => 1 + Math.floor(rnd() * s);

/* ---------- Datos ---------- */
const HEROES = {
  beetle: { key: 'beetle', name: 'Escarabajo rinoceronte', emoji: '🪲', kit: [8, 6, 4],
    abil: 'Cornada', txt: 'Una vez por nivel, empuja a un monstruo pegado a ti (en recto) hasta 3 casillas. Si choca con un muro, el borde u otro monstruo, recibe 1 de daño (y el otro monstruo también).' },
  mantis: { key: 'mantis', name: 'Mantis religiosa', emoji: '🦗', kit: [12, 4, 4],
    abil: 'Emboscada', txt: 'Pasiva: si todavía no te has movido en el turno, tu primer ataque hace 2 de daño.' }
};
/* Prueba 2 «Muda»: kits iniciales más pequeños; en cada pausa un dado puede mudar al siguiente tamaño. */
const MUDA_KITS = { beetle: [6, 6, 4], mantis: [8, 4, 4] };
const DIE_STEPS = [4, 6, 8, 12];
const nextDie = s => DIE_STEPS[DIE_STEPS.indexOf(s) + 1] || 0;
const EQUIPS = {
  thorn: { key: 'thorn', name: 'Espina de rosa', emoji: '🌹', type: 'Arma', txt: 'Tus ataques cuestan 1 punto de Ataque menos (mínimo 1).' },
  shield: { key: 'shield', name: 'Escudo de pétalo', emoji: '🌸', type: 'Armadura', txt: 'Tu Defensa es 1 punto más alta en cada turno.' },
  helm: { key: 'helm', name: 'Casco de bellota', emoji: '🌰', type: 'Armadura', txt: 'Cada 2 turnos (puedes usarlo en el primero), repites un dado y te quedas con el mejor de los dos resultados.' }
};
const MONS = {
  tij: { key: 'tij', name: 'Tijereta', plural: 'Tijeretas', emoji: '🦂', color: '#b5473a', hp: 2, spd: 6, atk: 4, def: 3, rng: 3, txt: 'Rápida y frágil.' },
  bom: { key: 'bom', name: 'Escarabajo bombardero', plural: 'Escarabajos bombarderos', emoji: '🐞', color: '#c0792b', hp: 3, spd: 4, atk: 5, def: 5, rng: 5, txt: 'Dispara a distancia.' },
  coc: { key: 'coc', name: 'Cochinilla', plural: 'Cochinillas', emoji: '🐌', color: '#6c7a89', hp: 4, spd: 3, atk: 6, def: 6, rng: 3, txt: 'Lenta y acorazada.' },
  avi: { key: 'avi', name: 'Avispón', plural: 'Avispones', emoji: '🐝', color: '#c9a227', hp: 4, spd: 5, atk: 8, def: 5, rng: 4, txt: 'Golpea muy fuerte.' }
};
const MAPS = {
  A: ['......', '.#..#.', '......', '..##..', '.#....', 'H...#.'],
  B: ['..#...', '...#..', '.##...', '...#.#', '.#....', '....#H']
};
const rot180 = m => m.slice().reverse().map(r => r.split('').reverse().join(''));
MAPS.A2 = rot180(MAPS.A); MAPS.B2 = rot180(MAPS.B);

// 12 niveles: cada combinación mapa+giro enfrenta siempre al mismo monstruo; cambian la cantidad y las posiciones
const LEVEL_DEFS = [
  { t: 'Los tulipanes',   map: 'A',  m: 'tij', at: [[3,2],[2,0],[4,2],[2,2]] },
  { t: 'El seto de boj',  map: 'B',  m: 'coc', at: [[5,0]] },
  { t: 'Macetas volcadas', map: 'A2', m: 'bom', at: [[0,1],[0,4],[0,3]] },
  { t: 'El compost',      map: 'B2', m: 'avi', at: [[5,2],[5,4]] },
  { t: 'El rosal',        map: 'A',  m: 'tij', at: [[0,1],[1,0],[3,1],[1,3],[2,2],[5,0],[4,2]] },
  { t: 'La enredadera',   map: 'B',  m: 'coc', at: [[2,5],[4,0],[1,0]] },
  { t: 'El invernadero',  map: 'A2', m: 'bom', at: [[3,3],[0,3],[4,5],[5,4],[0,5]] },
  { t: 'El cobertizo',    map: 'B2', m: 'avi', at: [[5,1],[4,4],[5,2],[5,5],[1,5],[5,4]] },
  { t: 'La glorieta',     map: 'A',  m: 'tij', at: [[5,0],[4,4],[5,5],[3,1],[2,2],[2,4],[1,3],[4,0],[4,3]] },
  { t: 'El estanque seco', map: 'B', m: 'coc', at: [[3,0],[2,1],[4,1],[0,4]] },
  { t: 'El muro de piedra', map: 'A2', m: 'bom', at: [[3,1],[5,4],[1,1],[3,3],[2,1],[0,4],[4,3]] },
  { t: 'El panal',        map: 'B2', m: 'avi', at: [[0,5],[5,3],[5,2],[5,4],[1,5],[1,4],[3,1],[5,1]] }
];

/* Prueba 2 «Muda»: mismos mapas y monstruos, otras cantidades y posiciones (se afinan con design.js). */
const LEVEL_DEFS_MUDA = LEVEL_DEFS.map(d => Object.assign({}, d));
const MUDA_AT = [[[1,0],[2,2],[4,2]],[[0,2]],[[3,4],[0,0]],[[0,3]],[[2,1],[2,0],[5,4],[4,2],[4,3],[2,2]],[[0,0],[1,0],[3,0]],[[0,1],[5,4],[0,2],[0,5]],[[1,3],[5,0],[3,4],[0,4],[5,2]],[[5,0],[4,0],[5,1],[5,2],[3,4],[5,5],[3,0],[4,2],[5,3],[3,2]],[[0,1],[0,0],[0,5],[4,2],[3,2]],[[2,3],[0,2],[2,4],[1,3],[3,5],[4,5],[2,5]],[[5,4],[5,3],[0,4],[3,0],[2,5],[5,0],[3,2]]];
LEVEL_DEFS_MUDA.forEach((d, i) => { d.at = MUDA_AT[i]; });
const DEFS = { kits: LEVEL_DEFS, muda: LEVEL_DEFS_MUDA };

let LEVELS = [];
function buildLevel(def, num) {
  const rows = MAPS[def.map], walls = new Array(N).fill(false);
  let start = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = rows[y][x];
    if (c === '#') walls[idx(x, y)] = true;
    if (c === 'H') start = idx(x, y);
  }
  return { num, title: def.t, mapKey: def.map, mon: MONS[def.m], walls, start, spawns: def.at.map(([x, y]) => idx(x, y)), rd: {}, lm: {} };
}
function loadLevels(defs) { LEVELS = (defs || LEVEL_DEFS).map((d, i) => buildLevel(d, i + 1)); return LEVELS; }
loadLevels();

/* ---------- Caminos ---------- */
function adjOf(lv) {
  if (lv._adj) return lv._adj;
  const adj = new Array(N);
  for (let i = 0; i < N; i++) {
    const [x, y] = XY(i), out = [];
    for (const [dx, dy, c] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const j = idx(nx, ny);
      if (lv.walls[j]) continue;
      out.push(c === 3 ? [j, c, idx(x + dx, y), idx(x, y + dy)] : [j, c, -1, -1]);
    }
    adj[i] = out;
  }
  lv._adj = adj;
  return adj;
}
function dijkstra(lv, src, blocked, cut) {
  const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
  const adj = adjOf(lv);
  dist[src] = 0;
  for (;;) {
    let u = -1, b = Infinity;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < b) { b = dist[i]; u = i; }
    if (u < 0) break;
    done[u] = true;
    const ns = adj[u];
    for (let k = 0; k < ns.length; k++) {
      const v = ns[k][0], c = ns[k][1];
      if (blocked && blocked[v]) continue;
      if (c === 3) { const h = ns[k][2], w = ns[k][3]; if ((lv.walls[h] || (cut && cut[h])) && (lv.walls[w] || (cut && cut[w]))) continue; }
      if (b + c < dist[v]) { dist[v] = b + c; prev[v] = u; }
    }
  }
  return { dist, prev };
}
function rangeDist(lv, a, b) {
  let d = lv.rd[a];
  if (!d) d = lv.rd[a] = dijkstra(lv, a, null).dist;
  return d[b];
}
function distAdv(lv, src, advI) {
  if (!lv._dc) lv._dc = new Map();
  let tab = lv._dc.get(advI);
  if (!tab) { tab = new Array(N); lv._dc.set(advI, tab); }
  let r = tab[src];
  if (!r) { const bl = new Array(N).fill(false); bl[advI] = true; r = tab[src] = dijkstra(lv, src, bl, bl); }
  return r;
}

/* ---------- Línea de visión ---------- */
const LOS_PTS = [0.02, 0.2, 0.5, 0.8, 0.98];
function segTouches(ax, ay, bx, by, sx, sy) {
  const dx = bx - ax, dy = by - ay;
  let lo = 0, hi = 1;
  if (dx === 0) { if (ax < sx || ax > sx + 1) return false; }
  else {
    let t1 = (sx - ax) / dx, t2 = (sx + 1 - ax) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    lo = Math.max(lo, t1); hi = Math.min(hi, t2);
  }
  if (dy === 0) { if (ay < sy || ay > sy + 1) return false; }
  else {
    let t1 = (sy - ay) / dy, t2 = (sy + 1 - ay) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    lo = Math.max(lo, t1); hi = Math.min(hi, t2);
  }
  return hi - lo >= -1e-9;
}
function losSegs(lv, a, b) {
  const key = a * N + b;
  if (lv.lm[key] !== undefined) return lv.lm[key];
  const [ax, ay] = XY(a), [bx, by] = XY(b), walls = [], out = [];
  for (let w = 0; w < N; w++) if (lv.walls[w] && w !== a && w !== b) walls.push(XY(w));
  for (const u of LOS_PTS) for (const v of LOS_PTS) for (const x of LOS_PTS) for (const y of LOS_PTS) {
    const p = ax + u, q = ay + v, r = bx + x, s = by + y;
    let ok = true;
    for (const [wx, wy] of walls) if (segTouches(p, q, r, s, wx, wy)) { ok = false; break; }
    if (ok) out.push(p, q, r, s);
  }
  lv.lm[key] = out;
  return out;
}
function hasLOS(lv, a, b, blockers) {
  if (a === b) return true;
  const segs = losSegs(lv, a, b);
  if (!segs.length) return false;
  const bl = blockers.filter(t => t !== a && t !== b).map(XY);
  if (!bl.length) return true;
  for (let k = 0; k < segs.length; k += 4) {
    let ok = true;
    for (const [tx, ty] of bl) if (segTouches(segs[k], segs[k + 1], segs[k + 2], segs[k + 3], tx, ty)) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

/* ---------- Estado ---------- */
const lvOf = st => LEVELS[st.levelIdx];
function freshTurn(st) {
  return { dice: null, sides: st.kit.slice(), assign: { spd: -1, atk: -1, def: -1 }, rerolled: false, moved: false, attacks: 0,
           spd: 0, atk: 0, def: 0, rng: 0, spdLeft: 0, atkLeft: 0 };
}
function rollTurn(st) { st.turn.dice = st.turn.sides.map(roll); }
function setupLevel(st, i) {
  const lv = LEVELS[i];
  st.levelIdx = i;
  const [x, y] = XY(lv.start);
  st.adv.x = x; st.adv.y = y;
  st.mons = lv.spawns.map((s, n) => {
    const [mx, my] = XY(s), m = lv.mon;
    return { id: n + 1, x: mx, y: my, hp: m.hp, maxHp: m.hp, spd: m.spd, atk: m.atk, def: m.def, rng: m.rng };
  });
  st.abil = false;
  st.lastHelm = -99;
  st.phase = 'energy';
  st.turn = freshTurn(st);
  rollTurn(st);
  st.undo = [];
  st.turnNo = 1;
  st.cp = { hp: st.adv.hp, adv: Object.assign({}, st.adv), kit: st.kit.slice() };
  return st;
}
function newRun(hero, equip, mode) {
  mode = mode || 'kits';
  const st = { hero, equip, mode, kit: (mode === 'muda' ? MUDA_KITS : { beetle: HEROES.beetle.kit, mantis: HEROES.mantis.kit })[hero].slice(), levelIdx: 0, adv: { x: 0, y: 0, hp: START_HP, spd: 1, atk: 1, def: 1, rng: 2 }, mons: [], phase: 'energy', turn: null, undo: [], turnNo: 1, abil: false, cp: null };
  return setupLevel(st, 0);
}
function retryLevel(st) {
  const cp = st.cp;
  st.adv = Object.assign({}, cp.adv);
  st.kit = cp.kit.slice();
  return setupLevel(st, st.levelIdx);
}

/* ---------- Fase de energía ---------- */
function assignDie(st, skill, die) {
  const t = st.turn;
  for (const k of ['spd', 'atk', 'def']) if (t.assign[k] === die) t.assign[k] = -1;
  t.assign[skill] = die;
}
function unassign(st, skill) { st.turn.assign[skill] = -1; }
const assignComplete = t => t.assign.spd >= 0 && t.assign.atk >= 0 && t.assign.def >= 0;
let HELM_EVERY = 2; // el Casco se puede usar cada N turnos (1 = todos los turnos; 99 = una vez por nivel)
const setHelmEvery = n => { HELM_EVERY = n; };
function canReroll(st) { return st.equip === 'helm' && st.phase === 'energy' && !st.turn.rerolled && st.turnNo - (st.lastHelm == null ? -99 : st.lastHelm) >= HELM_EVERY; }
function useHelm(st, die) {
  if (!canReroll(st) || die < 0 || die > 2) return false;
  const nw = roll(st.turn.sides[die]);
  st.turn.lastRoll = nw;
  st.turn.dice[die] = Math.max(st.turn.dice[die], nw);
  st.turn.rerolled = true; st.lastHelm = st.turnNo;
  return true;
}
function confirmEnergy(st) {
  const t = st.turn, a = st.adv;
  t.spd = a.spd + t.dice[t.assign.spd]; t.atk = a.atk + t.dice[t.assign.atk]; t.def = a.def + t.dice[t.assign.def] + (st.equip === 'shield' ? 1 : 0); t.rng = a.rng;
  t.spdLeft = t.spd; t.atkLeft = t.atk;
  st.phase = 'move';
  st.undo = [];
}

/* ---------- Fase del héroe ---------- */
function pushUndo(st) {
  st.undo.push(JSON.stringify({ x: st.adv.x, y: st.adv.y, hp: st.adv.hp, mons: st.mons, spdLeft: st.turn.spdLeft, atkLeft: st.turn.atkLeft,
    moved: st.turn.moved, attacks: st.turn.attacks, abil: st.abil }));
}
function popUndo(st) {
  const s = JSON.parse(st.undo.pop());
  st.adv.x = s.x; st.adv.y = s.y; st.adv.hp = s.hp; st.mons = s.mons;
  st.turn.spdLeft = s.spdLeft; st.turn.atkLeft = s.atkLeft; st.turn.moved = s.moved; st.turn.attacks = s.attacks; st.abil = s.abil;
}
function reachFromAdv(st) {
  const lv = lvOf(st), src = idx(st.adv.x, st.adv.y), blocked = new Array(N).fill(false);
  for (const m of st.mons) blocked[idx(m.x, m.y)] = true;
  return dijkstra(lv, src, blocked, blocked);
}
function moveAdv(st, i, dist) {
  pushUndo(st);
  const [x, y] = XY(i);
  st.turn.spdLeft -= dist; st.turn.moved = true;
  st.adv.x = x; st.adv.y = y;
}
const atkCost = (st, m) => Math.max(1, m.def - (st.equip === 'thorn' ? 1 : 0));
const ambushReady = st => st.hero === 'mantis' && !st.turn.moved && st.turn.attacks === 0;
function attackInfo(st, m) {
  const lv = lvOf(st), a = idx(st.adv.x, st.adv.y), t = idx(m.x, m.y);
  const rd = rangeDist(lv, a, t);
  if (rd > st.turn.rng) return { ok: false, why: 'range', rd };
  if (!hasLOS(lv, a, t, st.mons.filter(o => o !== m).map(o => idx(o.x, o.y)))) return { ok: false, why: 'los', rd };
  if (st.turn.atkLeft < atkCost(st, m)) return { ok: false, why: 'points', rd, cost: atkCost(st, m) };
  return { ok: true, rd, cost: atkCost(st, m) };
}
function attackMon(st, m) {
  pushUndo(st);
  const dmg = ambushReady(st) ? 2 : 1;
  st.turn.atkLeft -= atkCost(st, m);
  st.turn.attacks++;
  m.hp -= dmg;
  const dead = m.hp <= 0;
  st.mons = st.mons.filter(o => o.hp > 0);
  return { dead, dmg };
}
// Cornada del Escarabajo
function cornadaInfo(st, m) {
  if (st.hero !== 'beetle' || st.abil) return { ok: false, why: 'unavailable' };
  const dx = m.x - st.adv.x, dy = m.y - st.adv.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return { ok: false, why: 'adjacent' };
  return { ok: true, dx, dy };
}
function cornada(st, m) {
  const inf = cornadaInfo(st, m);
  if (!inf.ok) return null;
  pushUndo(st);
  const lv = lvOf(st), res = { from: [m.x, m.y], steps: 0, hit: null, dmg: [] };
  let x = m.x, y = m.y;
  for (let k = 0; k < 3; k++) {
    const nx = x + inf.dx, ny = y + inf.dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || lv.walls[idx(nx, ny)]) { res.hit = 'wall'; break; }
    const other = st.mons.find(o => o !== m && o.x === nx && o.y === ny);
    if (other) { res.hit = 'mon'; res.other = other; break; }
    x = nx; y = ny; res.steps++;
  }
  m.x = x; m.y = y;
  if (res.hit) { m.hp -= 1; res.dmg.push(m.id); if (res.other) { res.other.hp -= 1; res.dmg.push(res.other.id); } }
  st.abil = true;
  res.to = [x, y];
  st.mons = st.mons.filter(o => o.hp > 0);
  return res;
}

/* ---------- Fase de los monstruos ---------- */
function chooseMove(lv, st, m) {
  const advI = idx(st.adv.x, st.adv.y), me = idx(m.x, m.y);
  const others = st.mons.filter(o => o !== m).map(o => idx(o.x, o.y));
  const D = distAdv(lv, me, advI);
  const spd = Math.max(0, m.spd);
  const stand = i => i === me || (!lv.walls[i] && i !== advI && !others.includes(i) && D.dist[i] < Infinity);
  const R = () => m.rng;
  const canHit = i => rangeDist(lv, i, advI) <= R() && hasLOS(lv, i, advI, others);
  // A) posición de ataque alcanzable este turno: la de mayor distancia dentro de su Alcance
  let best = -1, bRd = -1, bC = Infinity;
  for (let i = 0; i < N; i++) {
    if (!stand(i) || D.dist[i] > spd || !canHit(i)) continue;
    const rd = rangeDist(lv, i, advI);
    if (rd > bRd || (rd === bRd && D.dist[i] < bC)) { best = i; bRd = rd; bC = D.dist[i]; }
  }
  if (best >= 0) return best;
  // B) destino de ataque para los próximos turnos (turnos contados de verdad)
  const fromD = [];
  const dOf = u => fromD[u] || (fromD[u] = u === me ? D.dist : distAdv(lv, u, advI).dist);
  const turnsFrom = s => {
    const tn = new Array(N).fill(Infinity); tn[s] = 0; let front = [s];
    for (let k = 1; front.length; k++) {
      const nx = [];
      for (const u of front) { const du = dOf(u); for (let w = 0; w < N; w++) if (tn[w] === Infinity && stand(w) && du[w] <= spd) { tn[w] = k; nx.push(w); } }
      front = nx;
    }
    return tn;
  };
  const TM = turnsFrom(me);
  let target = -1, tT = Infinity, tRd = -1, tC = Infinity;
  for (let i = 0; i < N; i++) {
    if (!stand(i) || TM[i] === Infinity || !canHit(i)) continue;
    const tn = TM[i], rd = rangeDist(lv, i, advI);
    if (tn < tT || (tn === tT && (rd > tRd || (rd === tRd && D.dist[i] < tC)))) { target = i; tT = tn; tRd = rd; tC = D.dist[i]; }
  }
  if (target >= 0) {
    const TT = turnsFrom(target), T = dOf(target);
    let b = me, bTT = TT[me], bT = T[me], bR = rangeDist(lv, me, advI), c0 = 0;
    for (let i = 0; i < N; i++) {
      if (!stand(i) || D.dist[i] > spd) continue;
      const r = rangeDist(lv, i, advI);
      if (TT[i] < bTT || (TT[i] === bTT && (T[i] < bT || (T[i] === bT && (r < bR || (r === bR && D.dist[i] < c0)))))) { b = i; bTT = TT[i]; bT = T[i]; bR = r; c0 = D.dist[i]; }
    }
    return b;
  }
  // C) acercarse todo lo posible
  let b = me, bD = rangeDist(lv, me, advI), c0 = 0;
  for (let i = 0; i < N; i++) {
    if (!stand(i) || D.dist[i] > spd) continue;
    const d = rangeDist(lv, i, advI);
    if (d < bD || (d === bD && D.dist[i] < c0)) { b = i; bD = d; c0 = D.dist[i]; }
  }
  return b;
}
function attackers(st) {
  const lv = lvOf(st), advI = idx(st.adv.x, st.adv.y);
  return st.mons.filter(m => {
    const me = idx(m.x, m.y);
    if (rangeDist(lv, me, advI) > m.rng) return false;
    return hasLOS(lv, me, advI, st.mons.filter(o => o !== m).map(o => idx(o.x, o.y)));
  });
}
// Secuencia estricta y una sola vuelta, en orden de cercanía. Muta el estado y devuelve eventos.
function playMonsters(st) {
  const lv = lvOf(st), advI = idx(st.adv.x, st.adv.y), ev = [];
  const order = st.mons.slice().sort((a, b) => rangeDist(lv, advI, idx(a.x, a.y)) - rangeDist(lv, advI, idx(b.x, b.y)) || a.id - b.id);
  for (const m of order) {
    const from = idx(m.x, m.y), to = chooseMove(lv, st, m);
    if (to !== from) {
      const D = distAdv(lv, from, advI), path = [];
      for (let c = to; c !== -1; c = D.prev[c]) path.push(c);
      path.reverse();
      const [x, y] = XY(to); m.x = x; m.y = y;
      ev.push({ t: 'move', id: m.id, from, to, path });
    }
  }
  const att = attackers(st);
  const total = att.reduce((s, m) => s + m.atk, 0);
  const def = Math.max(1, st.turn.def);
  let dmg = Math.floor(total / def);
  let shielded = 0;
  
  st.adv.hp = Math.max(0, st.adv.hp - dmg);
  ev.push({ t: 'attack', ids: att.map(m => m.id), total, def, dmg, shielded });
  return ev;
}
function endTurn(st) {
  const ev = playMonsters(st);
  if (st.adv.hp <= 0) { st.phase = 'dead'; return ev; }
  st.phase = 'energy';
  st.turn = freshTurn(st);
  rollTurn(st);
  st.undo = [];
  st.turnNo++;
  return ev;
}

/* ---------- Entre niveles ---------- */
const levelCleared = st => st.mons.length === 0;
function applyBreak(st, choice) {
  if (choice === 'heal') { st.adv.hp = START_HP; return true; }
  if (/^dice[012]$/.test(choice)) {
    if (st.mode !== 'muda') return false;
    const i = +choice[4], n = nextDie(st.kit[i]);
    if (!n) return false;
    st.kit[i] = n; return true;
  }
  if (!['spd', 'atk', 'def', 'rng'].includes(choice) || st.adv[choice] >= SKILL_MAX) return false;
  st.adv[choice] += 1; return true;
}
function nextLevel(st) {
  if (st.levelIdx >= LEVELS.length - 1) { st.phase = 'won'; return false; }
  setupLevel(st, st.levelIdx + 1);
  return true;
}

const API = { setHelmEvery, LEVEL_DEFS_MUDA, DEFS, MUDA_KITS, DIE_STEPS, nextDie, COLS, ROWS, N, idx, XY, START_HP, SKILL_MAX, HEROES, EQUIPS, MONS, MAPS, LEVEL_DEFS, get LEVELS() { return LEVELS; }, loadLevels, setRng, roll,
  dijkstra, rangeDist, hasLOS, adjOf, lvOf, newRun, retryLevel, setupLevel, assignDie, unassign, assignComplete, canReroll, useHelm, confirmEnergy,
  pushUndo, popUndo, reachFromAdv, moveAdv, atkCost, ambushReady, attackInfo, attackMon, cornadaInfo, cornada, chooseMove, attackers, playMonsters, endTurn,
  levelCleared, applyBreak, nextLevel, freshTurn, rollTurn };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
