# Saltador (Colossus): cambia de lugar con cualquier kaiju del tablero, esté donde esté.
import asyncio, json, subprocess
from playwright.async_api import async_playwright
ROOT = '/home/claude/d6-crawler'
JS = """
const E = require('%s/src/engine.js'), fs = require('fs'), vm = require('vm');
const c = {}; vm.createContext(c);
vm.runInContext(fs.readFileSync('%s/src/worlds.js', 'utf8') + ';this.W = WORLDS', c);
const W = c.W.kaiju;
E.setAbil(W.abilVar || {});
E.GAMES.mguf.levels = E.ownLevels(W.levels.mguf, Object.assign({}, W.stats, (W.gstats || {}).mguf), 0);
E.useGame('mguf');
const st = E.newRun('corsair', 'mguf', []); E.setupLevel(st, 0);
const lv = E.LEVELS[0], libres = [];
for (let i = 0; i < E.N; i++) if (!lv.walls[i]) libres.push(i);
st.adv.x = E.XY(libres[0])[0]; st.adv.y = E.XY(libres[0])[1];
const m0 = lv.mon, lejos = libres[libres.length - 1];
st.mons = [{ id: 1, x: E.XY(lejos)[0], y: E.XY(lejos)[1], hp: m0.hp, maxHp: m0.hp, spd: m0.spd, atk: m0.atk, def: m0.def, rng: m0.rng }];
E.rollTurn(st); st.turn.dice = [1, 1, 1]; st.turn.assign = { spd: 0, atk: 1, def: 2, rng: -1 }; E.confirmEnergy(st);
console.log(JSON.stringify(st));
""" % (ROOT, ROOT)

def make_state():
    return subprocess.check_output(['node', '-e', JS]).decode().strip()

async def main():
    estado = make_state()
    st = json.loads(estado)
    adv0, mon0 = (st['adv']['x'], st['adv']['y']), (st['mons'][0]['x'], st['mons'][0]['y'])
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--lang=es-CL'])
        ctx = await b.new_context(locale='es-CL', viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        await ctx.add_init_script("localStorage.setItem('dw:kaiju:dioc-unlock-all','1')")
        await ctx.add_init_script("localStorage.setItem('dw:kaiju:dioc-run-v3', %s)" % json.dumps(estado))
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await page.goto('file://%s/index.html?w=kaiju' % ROOT); await page.wait_for_timeout(400)
        await page.click('#mContinue'); await page.wait_for_timeout(500)
        etiqueta = await page.inner_text('#btnAbil')
        await page.click('#btnAbil'); await page.wait_for_timeout(300)
        marcadas = await page.locator('.tile.target').count()
        await page.locator('.tile').nth(mon0[1] * 5 + mon0[0]).click(); await page.wait_for_timeout(500)
        pos = await page.evaluate("() => { const t=[...document.querySelectorAll('.tile')]; const h=document.querySelector('.herospot'); const m=document.querySelector('.token.mon'); const xy = e => +e.style.getPropertyValue('--y') * 5 + +e.style.getPropertyValue('--x'); return [t.indexOf(h.closest('.tile')), xy(m)]; }")
        texto = (await page.inner_text('#log')).replace('\n', ' ')
        de_nuevo = await page.locator('#btnAbil').count()
        await b.close()
    esperado = [mon0[1] * 5 + mon0[0], adv0[1] * 5 + adv0[0]]
    print('botón: %s · casillas marcadas: %d · posiciones tras el cambio: %s (esperado %s)' % (etiqueta, marcadas, pos, esperado))
    print('mensaje:', texto[:80])
    fallos = []
    if etiqueta.strip().lower() != 'cambiar de lugar': fallos.append('la etiqueta del botón no es la del Saltador')
    if marcadas != 1: fallos.append('se marcó %d casillas, debía marcarse 1 (el kaiju)' % marcadas)
    if pos != esperado: fallos.append('el héroe y el kaiju no cambiaron de lugar')
    if de_nuevo: fallos.append('la habilidad sigue disponible después de usarla')
    if errs: fallos.append('errores de página: %s' % errs)
    if fallos:
        print('FALLO:', '; '.join(fallos)); raise SystemExit(1)
    print('ok  el Saltador cambia de lugar con un kaiju lejano y la habilidad se consume')

asyncio.run(main())
