# Recorre Archeodice y Colossus (español e inglés) y busca nombres o términos del juego original en pantalla
import asyncio, re, json, subprocess
from playwright.async_api import async_playwright
URL = 'file:///home/claude/d6-crawler/index.html'
O = json.loads(subprocess.check_output(['node', '-e', "eval(require('fs').readFileSync('/home/claude/d6-crawler/src/worlds.js','utf8').replace(/^'use strict';/,'')+';console.log(JSON.stringify(ORIG_NAMES))')"]).decode())
def forbidden(world, lang):
    en = lang == 'en'; w = []
    for v in O['games'].values(): w.append(v.split('|')[en])
    for v in O['mon'].values():
        p = v.split('|'); i = 2 if en else 0; w += [p[i], p[i + 1] or p[i]]
    for v in O['heroes'].values(): w.append(v.split('|')[en])
    for v in O['items'].values(): w.append(v.split('|')[en])
    if en: w += ['Stone of Doom', 'chest', 'chests', 'Chest', 'dungeon', 'dungeons', 'Little Rocket', 'card'] + (['blizzard', 'blizzards', 'Blizzard', 'water', 'Water'] if world == 'arch' else ['cursed tile', 'cursed tiles'])
    else: w += ['Piedra de la Perdición', 'cofre', 'cofres', 'Cofre', 'mazmorra', 'mazmorras', 'Little Rocket', 'carta'] + (['ventisca', 'ventiscas', 'Ventisca', 'agua', 'Agua'] if world == 'arch' else ['casilla maldita', 'casillas malditas'])
    w = sorted({x for x in w if x and x not in ('Ranger', 'Abyssal', 'Hacker')}, key=len, reverse=True)
    return re.compile(r'(?<![\w])(' + '|'.join(re.escape(x) for x in w) + r')(?![\w])', re.I)
ALLOW = re.compile(r'One Card Dungeon, (de|by) Barny Skinner')
WN = json.loads(subprocess.check_output(['node', '-e', "eval(require('fs').readFileSync('/home/claude/d6-crawler/src/worlds.js','utf8').replace(/^'use strict';/,'')+';console.log(JSON.stringify(WORLDS))')"]).decode())
def newnames(world):
    d = WN[world]; out = []
    for sec in ('games', 'mon', 'titles', 'heroes', 'items'): out += [x for v in d[sec].values() for x in v.split('|') if x]
    return re.compile('|'.join(re.escape(x) for x in sorted(set(out), key=len, reverse=True)), re.I)
async def run(b, world, lang, found):
    ctx = await b.new_context(locale='es-CL', viewport={'width': 400, 'height': 860}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL + '?w=' + world)
    await pg.evaluate("([w,l]) => { localStorage.setItem('dw:dioc-lang', l); localStorage.setItem('dw:'+w+':dioc-unlock-all', '1'); }", [world, lang])
    await pg.goto(URL + '?w=' + world); await pg.wait_for_timeout(400)
    F = forbidden(world, lang); NN = newnames(world)
    async def scan(where):
        t = await pg.evaluate("document.body.innerText + '\\n' + [...document.querySelectorAll('[aria-label],[title],[alt]')].map(e => (e.getAttribute('aria-label')||'')+' '+(e.getAttribute('title')||'')+' '+(e.getAttribute('alt')||'')).join('\\n')")
        for line in t.split('\n'):
            m = F.search(NN.sub('', ALLOW.sub('', line)))
            if m: found.setdefault(f'{world}/{lang}/{where}', set()).add(f'«{m.group(1)}» en: ' + line.strip()[:120])
    await scan('menu'); await pg.click('#mRules'); await pg.wait_for_timeout(200); await scan('reglas'); await pg.click('#x')
    for g in ['base', 'mguf', 'peak', 'harbour', 'hell']:
        await pg.goto(URL + '?w=' + world); await pg.wait_for_timeout(300)
        await pg.click('#mNew'); await pg.wait_for_timeout(200); await scan('aventuras')
        await pg.click(f'[data-game="{g}"]'); await pg.wait_for_timeout(200)
        if await pg.locator('#moreH').count(): await pg.click('#moreH'); await pg.wait_for_timeout(150)
        await scan(g + ' héroes')
        await pg.locator('[data-hero]').first.click(); await pg.wait_for_timeout(200); await scan(g + ' objetos')
        if await pg.locator('#itGo').count(): await pg.click('#itGo'); await pg.wait_for_timeout(400)
        await scan(g + ' tablero'); await pg.click('#btnRules'); await pg.wait_for_timeout(200); await scan(g + ' reglas')
    await ctx.close(); return errs
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); found = {}; errs = []
        for w in ['arch', 'kaiju']:
            for l in ['es', 'en']: errs += await run(b, w, l, found)
        for k, v in found.items():
            print(f'[{k}]'); [print('   ', x) for x in sorted(v)]
        print('errores', errs); print('FAIL' if found or errs else 'ok', len(found)); await b.close()
asyncio.run(main())
