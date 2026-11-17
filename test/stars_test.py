# Estrellas de aventura: se avisan al ganar y quedan marcadas en la tarjeta de la aventura.
import asyncio, json, subprocess
from playwright.async_api import async_playwright
ROOT = '/home/claude/d6-crawler'

JS = """
const E = require('%s/src/engine.js'), fs = require('fs'), vm = require('vm');
const c = {}; vm.createContext(c);
vm.runInContext(fs.readFileSync('%s/src/worlds.js', 'utf8') + ';this.W = WORLDS', c);
const W = c.W.kaiju;
E.setAbil(W.abilVar || {});
E.GAMES.base.levels = E.ownLevels(W.levels.base, Object.assign({}, W.stats, (W.gstats || {}).base), 0);
E.useGame('base');
const ultimo = E.GAMES.base.levels.length - 1;
const st = E.newRun('paladin', 'base', []); E.setupLevel(st, ultimo);
st.adv.hp = 5; st.adv.atk = 6; st.adv.def = 3; st.trackAbil = true; st.abilEver = false; st.itemEver = false; st.startItems = [];
const lv = E.LEVELS[ultimo], libre = [];
for (let i = 0; i < E.N; i++) if (!lv.walls[i] && i !== E.idx(st.adv.x, st.adv.y)) libre.push(i);
const cerca = libre.filter(i => Math.abs(E.XY(i)[0] - st.adv.x) <= 1 && Math.abs(E.XY(i)[1] - st.adv.y) <= 1)[0];
const m0 = lv.mon;
st.mons = [{ id: 1, x: E.XY(cerca)[0], y: E.XY(cerca)[1], hp: 1, maxHp: m0.hp, spd: m0.spd, atk: m0.atk, def: m0.def, rng: m0.rng }];
E.rollTurn(st); st.turn.dice = [6, 6, 6]; st.turn.assign = { spd: 0, atk: 1, def: 2, rng: -1 }; E.confirmEnergy(st);
console.log(JSON.stringify(st));
""" % (ROOT, ROOT)

async def main():
    estado = subprocess.check_output(['node', '-e', JS]).decode().strip()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--lang=es-CL'])
        ctx = await b.new_context(locale='es-CL', viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        await ctx.add_init_script("localStorage.setItem('dw:kaiju:dioc-run-v3', %s)" % json.dumps(estado))
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto('file://%s/index.html?w=kaiju' % ROOT); await page.wait_for_timeout(400)
        await page.click('#mContinue'); await page.wait_for_timeout(400)
        await page.locator('.tile.target').first.click(); await page.wait_for_timeout(5000)
        ganadas = await page.locator('.end-stars .star-win').count()
        nombres = await page.locator('.end-stars .star-win b').all_inner_texts()
        # a la pantalla de aventuras: la tarjeta del juego base debe tener estrellas encendidas
        await page.click('#eMenu'); await page.wait_for_timeout(700)
        await page.click('#mNew'); await page.wait_for_timeout(700)
        encendidas = await page.locator('.adv-card[data-game="base"] .star.on').count()
        huecos = await page.locator('.adv-card[data-game="base"] .star').count()
        conItems = await page.locator('.adv-card[data-game="peak"] .star').count()
        await b.close()
    print('estrellas avisadas al ganar: %d %s · encendidas en la tarjeta: %d de %d · aventura con objetos: %d huecos'
          % (ganadas, nombres, encendidas, huecos, conItems))
    fallos = []
    if ganadas < 2: fallos.append('el resumen final debía avisar al menos 2 estrellas (Superada y Sin habilidad)')
    if encendidas < 2: fallos.append('la tarjeta debía quedar con al menos 2 estrellas encendidas')
    if huecos != 3: fallos.append('una aventura sin objetos debe mostrar 3 estrellas, mostró %d' % huecos)
    if conItems != 4: fallos.append('una aventura con objetos debe mostrar 4 estrellas, mostró %d' % conItems)
    if errs: fallos.append('errores de página: %s' % errs)
    if fallos:
        print('FALLO:', '; '.join(fallos)); raise SystemExit(1)
    print('ok  estrellas: aviso al ganar y marcadas en la tarjeta')

asyncio.run(main())
