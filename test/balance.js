'use strict';
// Compara la dificultad nivel a nivel de un juego propio (Colossus) con su equivalente de Archeodice (mapas originales).
// Cada nivel se juega muchas veces desde Vida 6 con mejoras típicas para esa altura; mide derrotas, daño y turnos.
// Uso: node test/balance.js [N]   (WORLD=kaiju GAME=base por defecto)
const fs = require('fs'), vm = require('vm'), path = require('path');
const E = require('../src/engine.js');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/worlds.js'), 'utf8').replace(/^'use strict';/, '') + ';this.WORLDS=WORLDS;', ctx);
const WORLD = process.env.WORLD || 'kaiju', GAME = process.env.GAME || 'base', N = +(process.argv[2] || 150);
// SEED fija los dados: con la misma semilla dos variantes se comparan con exactamente la misma suerte, así que
// hacen falta muchas menos partidas para notar la diferencia (y los resultados se pueden repetir).
let rngX = 1;   // estado del generador: la estrategia 'sim' lo guarda y lo restaura para probar mejoras con la misma suerte
if (process.env.SEED || /^sim/.test(process.env.UPG || '')) {
  rngX = (+process.env.SEED >>> 0) || 7;
  Math.random = () => { rngX ^= rngX << 13; rngX >>>= 0; rngX ^= rngX >> 17; rngX ^= rngX << 5; rngX >>>= 0; return rngX / 4294967296; };
}
const W = ctx.WORLDS[WORLD];
if (process.env.GSTATS) { const o = JSON.parse(process.env.GSTATS); W.gstats = W.gstats || {}; W.gstats[GAME] = Object.assign({}, W.gstats[GAME], o); }   // prueba rápida de cifras: GSTATS='{"ogre":{...}}'

function ownLevels() { return E.ownLevels(W.levels[GAME], Object.assign({}, W.stats, (W.gstats || {})[GAME]), 0); }
const ORIG = E.GAMES[GAME].levels, OWN = (W.levels || {})[GAME] ? ownLevels() : [];   // Bahía y Fisura aún no tienen niveles propios

// ---- comprobaciones de mapas ----
let bad = 0;
OWN.forEach((lv, i) => {
  if (lv.map.length !== 5 || lv.map.some(r => r.length !== 5)) { console.log('mapa mal formado', i + 1); bad++; }
  if (lv.start < 0 || lv.stairs.length) { console.log('inicio o escaleras', i + 1); bad++; }
  // el cofre cerrado cuenta como muro: la conexión del mapa se mide con él puesto
  // (con una copia del nivel donde el cofre es un muro de verdad, como hace el motor: así tampoco se cuela en diagonal)
  const lvc = lv.chestAt >= 0 ? Object.assign({}, lv, { walls: lv.walls.map((w, t) => w || t === lv.chestAt), rd: {}, lm: {}, _adj: null, _dc: null }) : lv;
  const d = E.dijkstra(lvc, lv.start, null).dist;
  for (let t = 0; t < E.N; t++) if (!lv.walls[t] && t !== lv.chestAt && d[t] === Infinity) { console.log('casilla aislada', i + 1, E.XY(t)); bad++; }
  lv.spawns.forEach(p => { if (lv.walls[p] || p === lv.start) { console.log('aparición inválida', i + 1, E.XY(p)); bad++; } });
  if (lv.chestAt >= 0 && (lv.spawns.includes(lv.chestAt) || lv.chestAt === lv.start)) { console.log('cofre ocupado', i + 1, E.XY(lv.chestAt)); bad++; }
  if (new Set(lv.spawns).size !== lv.spawns.length) { console.log('dos monstruos en la misma casilla', i + 1); bad++; }
  const same = ORIG.findIndex(o => o.map.join() === lv.map.join());
  if (same >= 0) { console.log('mapa igual al original', i + 1); bad++; }
});
console.log('mapas propios ok:', bad === 0);

// ---- bot (mismo criterio que sim.js) ----
// Copia solo lo que el bot puede cambiar al probar una jugada (antes se serializaba el estado entero, que era
// el 20% del tiempo). El historial de deshacer no se copia: el bot nunca deshace.
const cloneTurn = t => ({ dice: t.dice ? t.dice.slice() : null, d12: t.d12 ? t.d12.slice() : t.d12,
  assign: Object.assign({}, t.assign), assign2: t.assign2 ? Object.assign({}, t.assign2) : t.assign2,
  sel: t.sel, lock: t.lock, ranger: t.ranger, knight: t.knight, rerolled: t.rerolled, boosted: t.boosted,
  loot: t.loot ? Object.assign({}, t.loot) : t.loot,
  spd: t.spd, atk: t.atk, def: t.def, rng: t.rng, spdLeft: t.spdLeft, atkLeft: t.atkLeft });
function clone(s) {
  const c = Object.assign({}, s);
  c.adv = Object.assign({}, s.adv);
  c.mons = s.mons.map(m => Object.assign({}, m));
  c.turn = cloneTurn(s.turn);
  c.undo = [];
  if (s.items) c.items = s.items.slice();
  if (s.chest) c.chest = Object.assign({}, s.chest);
  if (s.stone) c.stone = Object.assign({}, s.stone);
  if (s.cp) c.cp = Object.assign({}, s.cp, { items: (s.cp.items || []).slice() });
  if (s.prev) c.prev = Object.assign({}, s.prev);
  return c;
}
// ---- política del bot ----
// El bot usa la habilidad del héroe (Bastión: conserva el dado alto del turno anterior) y, en las aventuras que
// llevan objetos, empieza con tres, como un jugador. Medido en tres semillas × 400 campañas, eso sube el nivel
// medio de 7,0 a 7,5 en Glaciar. Lo que **no** funcionó (todo medido, no cambiar sin volver a medir):
//   DEPTH=2    mirar el turno siguiente al repartir los dados: igual o peor, y cinco veces más lento
//   BOT=full   probar todas las casillas del turno en vez de avanzar paso a paso: 7,0 contra 7,2
//   CHEST=1    abrir el cofre: cuesta medio nivel, porque el bot aprovecha mal los puntos de botín
//   ABIL=0 / ITEMS=0 / ITEMSTART=n ajustan o apagan lo anterior.
const ITEM_GAMES = ['peak', 'harbour', 'hell'];   // las únicas aventuras que se juegan con objetos
const DEPTH = +(process.env.DEPTH || 1), USE_CHEST = process.env.CHEST === '1',
      USE_ITEMS = process.env.ITEMS !== '0', USE_ABIL = process.env.ABIL !== '0';
const W_DMG = +(process.env.W_DMG || 40), W_HP = +(process.env.W_HP || 3);   // pesos de la evaluación
const W_POT = +(process.env.W_POT || 5), W_DIST = +(process.env.W_DIST || 0.5), W_LOS = +(process.env.W_LOS || 0);   // atacar vs acercarse
const PESO2 = +(process.env.PESO2 || 0.6);   // cuánto pesa el turno siguiente frente al actual
const LOOT_VAL = +(process.env.LOOT_VAL || 4);   // cuánto vale un punto de botín frente a 3 puntos de vida de kaiju
// ITEMSTART=2: el bot empieza la aventura con los primeros objetos de la expansión, como un jugador real
const ITEMSTART = process.env.ITEMSTART != null ? +process.env.ITEMSTART : (ITEM_GAMES.includes(GAME) ? 3 : 0);
const objetosIniciales = () => E.itemPool(GAME).slice(0, ITEMSTART);
const DADOS_FIJOS = [5, 4, 3];   // tirada representativa para el segundo turno: no gasta azar y no añade ruido

// Tras la fase de monstruos: si quedó daño pendiente, decide Cota de malla y Hierbas y lo aplica.
function resolvePending(st) {
  if (!st.pendingDmg) return;
  const pa = st.pendingAtk || { total: 0, def: 1 }, tiene = k => st.items && st.items.includes(k);
  const conMalla = tiene('mail') ? Math.floor(pa.total / (pa.def + 3)) : st.pendingDmg;
  const malla = tiene('mail') && conMalla < st.pendingDmg && (st.pendingDmg >= 2 || st.adv.hp <= 2);
  const queda = malla ? conMalla : st.pendingDmg;
  const hierbas = tiene('herbs') && queda > 1 && (queda >= 3 || st.adv.hp <= 3);
  E.resolveAttack(st, malla, hierbas);
}

// Objetos que convienen antes de pelear: los que duran todo el nivel y los que suman al turno cuando hace falta.
function useItems(st, fase) {
  if (!USE_ITEMS || !st.items || !st.items.length) return;
  for (const id of ['cloak', 'sands', 'holy']) if (E.itemUsable(st, id)) E.useItem(st, id);   // anulan el terreno todo el nivel
  if (fase !== 'move') return;
  const puedeAtacar = () => st.mons.some(m => E.attackInfo(st, m).ok);
  if (!puedeAtacar() && E.itemUsable(st, 'axe')) E.useItem(st, 'axe');     // +2 Ataque y +2 Alcance: abre el disparo
  if (!puedeAtacar() && st.turn.spdLeft < 2 && E.itemUsable(st, 'wyrm')) E.useItem(st, 'wyrm');
}

// Botín del cofre: puntos para sumar a una habilidad este turno. Al Ataque si hay a quién pegarle, si no al Movimiento.
function spendLoot(st) {
  if (!st.loot || process.env.LOOT === '0') return;
  const lv = E.LEVELS[st.levelIdx], a = E.idx(st.adv.x, st.adv.y);
  const cerca = st.mons.some(m => E.rangeDist(lv, a, E.idx(m.x, m.y)) <= E.heroRng(st) + 1);
  E.setLoot(st, cerca ? 'atk' : 'spd', Math.min(st.loot, 2));
}

function evalState(st, depth) {
  const c = clone(st), hp0 = c.adv.hp;
  if (!c.mons.length) return -1000;
  E.playMonsters(c);
  resolvePending(c);
  let sc = (hp0 - c.adv.hp) * W_DMG + c.mons.reduce((s, m) => s + m.hp, 0) * W_HP - (c.loot || 0) * LOOT_VAL;
  if ((depth || 1) > 1 && c.mons.length && c.adv.hp > 0) sc += PESO2 * nextTurn(c);
  return sc;
}
// Segundo turno con una tirada fija: prueba dos repartos (todo al ataque y todo a la defensa) y se queda con el mejor.
function nextTurn(st) {
  st.turn = E.freshTurn(); st.phase = 'energy';
  let best = Infinity;
  for (const p of [[2, 0, 1], [1, 2, 0]]) {
    const c = clone(st);
    c.turn.dice = DADOS_FIJOS.slice();
    c.turn.assign = { spd: p[0], atk: p[1], def: p[2] };
    E.confirmEnergy(c); if (FULL) fullTurn(c, 1); else greedy(c, 1);
    const sc = evalState(c, 1);
    if (sc < best) best = sc;
  }
  return best;
}
function evalMove(st, i, cost, depth) {
  const c = clone(st); const [x, y] = E.XY(i); c.adv.x = x; c.adv.y = y; c.turn.spdLeft -= cost;
  const potential = c.mons.some(m => E.attackInfo(c, m).ok) ? 1 : 0;
  const lv = E.LEVELS[c.levelIdx];
  let dmin = Infinity; for (const m of c.mons) dmin = Math.min(dmin, E.rangeDist(lv, i, E.idx(m.x, m.y)));
  const c2 = clone(c);
  for (let g = 0; g < 10; g++) {
    const t = c2.mons.filter(m => E.attackInfo(c2, m).ok).sort((a, b) => a.hp - b.hp);
    if (!t.length) break; c2.turn.atkLeft -= t[0].def; t[0].hp--; if (t[0].hp <= 0) c2.mons = c2.mons.filter(o => o !== t[0]);
  }
  let expuesto = 0;
  if (W_LOS) { const lv2 = E.lvOf(c2), ai = E.idx(c2.adv.x, c2.adv.y), otros = c2.mons.map(o => E.idx(o.x, o.y));
    for (const m of c2.mons) { const t = E.idx(m.x, m.y);
      if (E.rangeDist(lv2, ai, t) <= E.mStat(c2, m, 'rng') && E.hasLOS(lv2, t, ai, otros.filter(o => o !== t))) expuesto++; } }
  return evalState(c2, depth) - potential * W_POT + dmin * W_DIST + expuesto * W_LOS;
}
// Fase del aventurero: ataca a lo que pueda, abre el cofre si le sobran puntos y se coloca lo mejor posible.
function greedy(st, depth) {
  useItems(st, 'move');
  for (let g = 0; g < 30; g++) {
    const tg = st.mons.filter(m => E.attackInfo(st, m).ok).sort((a, b) => a.hp - b.hp || a.def - b.def);
    if (tg.length) { E.attackMon(st, tg[0]); if (!st.mons.length) return; continue; }
    const R = E.reachFromAdv(st), here = E.idx(st.adv.x, st.adv.y);
    let best = { i: here, score: evalMove(st, here, 0, depth), cost: 0 };
    for (let i = 0; i < E.N; i++) if (R.dist[i] > 0 && R.dist[i] <= st.turn.spdLeft) {
      const s = evalMove(st, i, R.dist[i], depth); if (s < best.score - 1e-9) best = { i, score: s, cost: R.dist[i] };
    }
    if (best.cost > 0) { E.moveAdv(st, best.i, best.cost); continue; }
    // el cofre al final: con los puntos de ataque que sobran, cuando ya no hay a quién pegarle ni dónde moverse
    if (USE_CHEST && st.chest && !st.chest.open && E.chestInfo(st).ok) { E.openChest(st); continue; }
    break;
  }
}
// BOT=full: en vez de avanzar casilla a casilla eligiendo el mejor paso (que se queda en el primer sitio bueno),
// prueba TODAS las casillas a las que llega este turno y, en cada una, atacar antes o después de moverse. Es la
// misma cuenta de simulaciones que el paso a paso, pero no se le escapa una jugada que necesita dos pasos.
const FULL = process.env.BOT === 'full';
function atacarTodo(st) {
  for (let g = 0; g < 30; g++) {
    const tg = st.mons.filter(m => E.attackInfo(st, m).ok).sort((a, b) => a.hp - b.hp || a.def - b.def);
    if (!tg.length) return;
    E.attackMon(st, tg[0]);
    if (!st.mons.length) return;
  }
}
function fullTurn(st, depth) {
  useItems(st, 'move');
  const R = E.reachFromAdv(st), here = E.idx(st.adv.x, st.adv.y);
  let best = null, bs = Infinity;
  for (let i = 0; i < E.N; i++) {
    if (i !== here && !(R.dist[i] > 0 && R.dist[i] <= st.turn.spdLeft)) continue;
    for (const atacarPrimero of (i === here ? [true] : [true, false])) {
      const c = clone(st);
      if (atacarPrimero) { atacarTodo(c); if (c.mons.length && i !== here) { const R2 = E.reachFromAdv(c); if (R2.dist[i] > 0 && R2.dist[i] <= c.turn.spdLeft) E.moveAdv(c, i, R2.dist[i]); else continue; } }
      else { E.moveAdv(c, i, R.dist[i]); atacarTodo(c); }
      if (atacarPrimero && c.mons.length) atacarTodo(c);
      if (USE_CHEST && c.chest && !c.chest.open && E.chestInfo(c).ok) E.openChest(c);
      // mismos términos de posición que el paso a paso: poder atacar desde ahí y no quedarse lejos
      const pot = c.mons.some(m => E.attackInfo(c, m).ok) ? 1 : 0;
      const lv = E.LEVELS[c.levelIdx], fin = E.idx(c.adv.x, c.adv.y);
      let dmin = Infinity; for (const m of c.mons) dmin = Math.min(dmin, E.rangeDist(lv, fin, E.idx(m.x, m.y)));
      if (!c.mons.length) dmin = 0;
      const sc = evalState(c, depth) - pot * W_POT + dmin * W_DIST;
      if (sc < bs) { bs = sc; best = c; }
    }
  }
  if (best) Object.assign(st, best);
}
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
// Habilidad del héroe en la fase de energía. Hoy el bot juega con Bastión: conserva el dado alto del turno anterior.
function rollPhase(st) {
  if (USE_ABIL && st.hero === 'paladin' && !st.abil && st.prev) {
    let k = null, v = 0;
    for (const s of ['atk', 'def', 'spd', 'rng']) if ((st.prev[s] || 0) > v) { v = st.prev[s]; k = s; }
    const libre = E.abilVar('paladin') === 'free';   // en Colossus el dado se reparte donde se quiera
    if (k && v >= (libre ? 5 : 6)) { E.rollWithKeep(st, k); return; }
  }
  st.turn.dice = E.rollDice();
}
function playTurn(st) {
  useItems(st, 'energy');
  rollPhase(st);
  spendLoot(st);
  // repartos posibles: con el dado conservado fijo a una habilidad (Bastión del original) solo quedan dos
  const lk = st.turn.lock, libres = ['spd', 'atk', 'def'].filter(k => k !== lk);
  const opciones = (lk && lk !== -1)
    ? [{ [lk]: 0, [libres[0]]: 1, [libres[1]]: 2 }, { [lk]: 0, [libres[0]]: 2, [libres[1]]: 1 }]
    : PERMS.map(p => ({ spd: p[0], atk: p[1], def: p[2] }));
  let best = null, bs = Infinity;
  for (const a of opciones) {
    const c = clone(st);
    c.turn.assign = Object.assign({}, c.turn.assign, a);
    E.confirmEnergy(c); if (FULL) fullTurn(c, 1); else greedy(c, 1);
    const sc = evalState(c, DEPTH); if (sc < bs) { bs = sc; best = c; }
  }
  Object.assign(st, best);
}
// UPG elige qué habilidad subir entre niveles: 'def' (por defecto) prioriza Defensa, que medido es con diferencia
// lo mejor (64% de victorias contra 23% subiendo la más atrasada, idea de Max); 'par' es la regla vieja, 'atk'
// prioriza Ataque (1%) y 'defatk' sube Defensa hasta 4 y luego Ataque (igual que 'def' en el juego base, peor en
// Alerta Omega). Curar: con 'def' y reintentos conviene curar solo con Vida ≤2 (83% contra 64% curando con ≤3).
const UPG = process.env.UPG || 'def';
const W8 = { atk: 1, def: 1, spd: 0.7, rng: 0.8 };
// Estrategias con perfil objetivo (PLAN = valores finales que se quieren al terminar, p. ej. atk:3,def:6,spd:3,rng:2;
// el Alcance parte en 2 y no baja):
//   plan     sube la habilidad con más déficit respecto al perfil (empate: Defensa, Ataque, Velocidad, Alcance)
//   planseq  completa el perfil en orden: primero toda la Defensa, luego el Ataque, la Velocidad y el Alcance
//   sim      entre las habilidades que aún no llegan al perfil, simula el siguiente nivel (con sus kaiju reales)
//            SIMK veces por opción, con los mismos dados para todas, y elige la que menos daño recibe
//   simfree  igual que sim pero sin perfil: cualquier habilidad es candidata
function parsePlan(t) { const o = {}; for (const q of (t || '').split(',')) { const [k, v] = q.split(':'); if (k && v) o[k.trim()] = +v; } return o; }
const PLAN = Object.assign({ atk: 3, def: 6, spd: 3, rng: 2 }, parsePlan(process.env.PLAN));
const SIMK = +(process.env.SIMK || 6), PRI = ['def', 'atk', 'spd', 'rng'];
function costNext(st, choice) {
  const guardado = rngX; let tot = 0, n = 0;
  for (let r = 0; r < SIMK; r++) {
    rngX = (Math.imul(r + 1, 2654435761) ^ 0x9e3779b9) >>> 0 || 1;   // la misma suerte para todas las opciones
    const c = clone(st); E.applyBreak(c, choice);
    if (!E.nextLevel(c)) continue;
    let dead = false, t = 0;
    for (; t < 40; t++) {
      playTurn(c);
      if (!c.mons.length) break;
      E.playMonsters(c); resolvePending(c);
      if (c.adv.hp <= 0) { dead = true; break; }
      c.turn = E.freshTurn(); c.phase = 'energy';
    }
    tot += dead || t >= 40 ? 9 : E.START_HP - c.adv.hp; n++;
  }
  rngX = guardado;
  return n ? tot / n : 0;
}
function mejorMejora(st, sinNivel) {
  const a = st.adv, libre = k => a[k] < E.SKILL_MAX;
  if (UPG === 'plan' || UPG === 'planseq' || UPG === 'sim' || UPG === 'simfree') {
    const falta = k => Math.max(0, PLAN[k] - a[k]);
    let cand = PRI.filter(k => libre(k) && (UPG === 'simfree' || falta(k) > 0));
    if (!cand.length) cand = PRI.filter(libre);                       // perfil completo: lo que quede, Defensa primero
    if (!cand.length) return 'def';
    if (UPG === 'planseq') return cand[0];
    if (UPG === 'plan' || sinNivel || cand.length === 1) return cand.slice().sort((x, y) => falta(y) - falta(x) || PRI.indexOf(x) - PRI.indexOf(y))[0];
    let b = cand[0], bs = Infinity;
    for (const k of cand) { const v = costNext(st, k) - 0.01 * falta(k); if (v < bs) { bs = v; b = k; } }
    return b;
  }
  if (UPG === 'def' && libre('def')) return 'def';
  if (UPG === 'atk' && libre('atk')) return 'atk';
  if (UPG === 'defatk') { if (a.def < 4 && libre('def')) return 'def'; if (libre('atk')) return 'atk'; if (libre('def')) return 'def'; }
  let b = 'atk', bs = Infinity;
  for (const k of ['atk', 'def', 'spd', 'rng']) { const v = a[k] / W8[k]; if (v < bs && libre(k)) { bs = v; b = k; } }
  return b;
}
function upgrades(st, n) {
  for (let k = 0; k < n; k++) E.applyBreak(st, mejorMejora(st, true));
}
function playLevel(levels, i) {
  E.GAMES[GAME].levels = levels; E.useGame(GAME);
  const st = E.newRun('paladin', GAME, objetosIniciales()); upgrades(st, levels.slice(0, i).filter(l => !l.boss).length); E.setupLevel(st, i); st.adv.hp = E.START_HP;
  for (let t = 1; t <= 60; t++) {
    playTurn(st);
    if (!st.mons.length) return { dead: false, dmg: E.START_HP - st.adv.hp, t };
    E.playMonsters(st); resolvePending(st);
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
// Como en el juego real, al morir se puede reintentar el nivel tal como se empezó (misma Vida, objetos y mejoras).
// RETRY=n es cuántos intentos se le dan a cada nivel antes de dar la campaña por perdida (0 = como antes).
const RETRY = +(process.env.RETRY != null ? process.env.RETRY : 3);
function campaign(levels, healAt) {
  E.GAMES[GAME].levels = levels; E.useGame(GAME);
  let st = E.newRun('paladin', GAME, objetosIniciales()), turns = 0, intentos = 0, reintentos = 0;
  for (;;) {
    turns++; playTurn(st);
    if (!st.mons.length) {
      if (st.levelIdx === levels.length - 1) return { nivel: levels.length + 1, reintentos };
      intentos = 0;
      if (E.afterClear(st) === 'boss') { E.nextLevel(st); continue; }   // el jefe no da mejora
      let b = 'heal';
      if (st.adv.hp > healAt) b = mejorMejora(st);
      E.applyBreak(st, b); E.nextLevel(st); continue;
    }
    E.playMonsters(st); resolvePending(st);
    if (st.adv.hp <= 0) {
      if (intentos < RETRY) { intentos++; reintentos++; st = E.retryLevel(st); turns++; continue; }
      return { nivel: st.levelIdx + 1, reintentos };
    }
    st.turn = E.freshTurn(); st.phase = 'energy';
    if (turns > 600 + RETRY * 200) return { nivel: st.levelIdx + 1, reintentos };
  }
}
if (process.env.CAMPAIGN) {
  const n = +process.env.CAMPAIGN, H = +(process.env.HEAL || 2);
  for (const [name, lv] of [['original', ORIG], ['propio', OWN]]) {
    if (process.env.ONLY === 'own' && name === 'original') continue;
    if (process.env.ONLY === 'orig' && name === 'propio') continue;
    const reach = new Array(lv.length + 2).fill(0); let sum = 0;
    let rt = 0;
    for (let k = 0; k < n; k++) { const r = campaign(lv, H); sum += r.nivel; rt += r.reintentos; for (let i = 1; i <= r.nivel; i++) reach[i]++; }
    console.log(`${name.padEnd(9)} campaña: llega al nivel → ` + reach.slice(1, lv.length + 1).map((v, i) => `${i + 1}:${Math.round(100 * v / n)}%`).join(' ') + ` · gana ${Math.round(100 * reach[lv.length + 1] / n)}% · nivel medio ${(sum / n).toFixed(1)} · reintentos ${(rt / n).toFixed(1)}`);
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
