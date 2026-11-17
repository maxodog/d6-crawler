// Los caminos del motor usan listas de vecinos y distancias guardadas en caché. Esta prueba comprueba que
// `dijkstra` da exactamente lo mismo que el cálculo directo, en todos los niveles, también en las variantes del
// nivel con otros muros (cofre cerrado, Piedra rota), que son las que antes se quedaban con la caché vieja.
const E = require('../src/engine.js');
const N = E.N, COLS = 5;
const DIRS = [[1, 0, 2], [-1, 0, 2], [0, 1, 2], [0, -1, 2], [1, 1, 3], [1, -1, 3], [-1, 1, 3], [-1, -1, 3]];

// cálculo directo, sin listas precalculadas ni caché
function referencia(lv, src, blocked, cut) {
  const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
  dist[src] = 0;
  for (;;) {
    let u = -1, b = Infinity;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < b) { b = dist[i]; u = i; }
    if (u < 0) break;
    done[u] = true;
    const [x, y] = E.XY(u);
    for (const [dx, dy, c] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= COLS) continue;
      const v = E.idx(nx, ny);
      if (lv.walls[v]) continue;
      if (c === 3) {
        const h = E.idx(x + dx, y), w = E.idx(x, y + dy);
        if ((lv.walls[h] || (cut && cut[h])) && (lv.walls[w] || (cut && cut[w]))) continue;
      }
      if (blocked && blocked[v]) continue;
      if (b + c < dist[v]) { dist[v] = b + c; prev[v] = u; }
    }
  }
  return { dist, prev };
}

let casos = 0;
const fallos = [];
function comparar(lv, etiqueta) {
  for (let src = 0; src < N; src++) {
    if (lv.walls[src]) continue;
    for (let rep = 0; rep < 6; rep++) {
      let bl = null;
      if (rep) {
        bl = new Array(N).fill(false);
        for (let k = 0; k < rep; k++) { const t = Math.floor(Math.random() * N); if (t !== src) bl[t] = true; }
      }
      const a = E.dijkstra(lv, src, bl, bl), b = referencia(lv, src, bl, bl);
      casos++;
      for (let q = 0; q < N; q++) {
        if (a.dist[q] !== b.dist[q] || a.prev[q] !== b.prev[q]) {
          fallos.push(`${etiqueta} desde ${src} a ${q}: motor ${a.dist[q]}/${a.prev[q]}, directo ${b.dist[q]}/${b.prev[q]}`);
          return;
        }
      }
    }
  }
}

for (const g of Object.keys(E.GAMES)) {
  E.useGame(g);
  E.LEVELS.forEach((lv, i) => {
    comparar(lv, `${g} nivel ${i + 1}`);
    // variante con el cofre cerrado como muro y variante con la Piedra rota: mismas que arma el motor
    if (lv.chestAt >= 0) {
      const w = lv.walls.slice(); w[lv.chestAt] = true;
      comparar(Object.assign({}, lv, { walls: w, rd: {}, lm: {} }), `${g} nivel ${i + 1} (cofre cerrado)`);
    }
    if (lv.stoneAt >= 0) {
      const w = lv.walls.slice(); w[lv.stoneAt] = false;
      comparar(Object.assign({}, lv, { walls: w, rd: {}, lm: {} }), `${g} nivel ${i + 1} (Piedra rota)`);
    }
  });
}

if (fallos.length) { console.log('FALLO: ' + fallos.slice(0, 3).join(' · ')); process.exit(1); }
console.log(`ok  caminos iguales al cálculo directo (${casos} comprobaciones)`);
