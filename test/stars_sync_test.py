# Las estrellas no se pierden al unir el historial local con el de la nube (mergeRec), y las ya perdidas se recuperan.
import asyncio, json
from playwright.async_api import async_playwright
ROOT = '/home/claude/d6-crawler'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--lang=es-CL'])
        ctx = await b.new_context(locale='es-CL', viewport={'width': 390, 'height': 844})
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto('file://%s/index.html?w=kaiju' % ROOT); await page.wait_for_timeout(500)
        r = await page.evaluate("""() => {
          const m = window.__dioc.mergeRec;
          const local = { games: { base: { wins: 1, falls: 0, best: 12, heroes: ['paladin'], pure: [], stars: { win: 100, noabil: 300 } } }, tot: {}, ach: {}, hist: [], heroes: ['paladin'] };
          const nube  = { games: { base: { wins: 1, falls: 0, best: 12, heroes: ['paladin'], pure: [], stars: { win: 200, packs: 250 } },
                                   mguf: { wins: 0, falls: 1, best: 3, heroes: [], pure: [] } }, tot: {}, ach: {}, hist: [], heroes: [] };
          const a = m(local, nube), b = m(nube, local), c = m(local, null), d = m(null, nube);
          return { a: a.games.base.stars, b: b.games.base.stars, c: c.games.base.stars, d: d.games.base.stars, mguf: a.games.mguf.stars };
        }""")
        await b.close()
    print(json.dumps(r))
    fallos = []
    if r['a'] != {'win': 100, 'noabil': 300, 'packs': 250}: fallos.append('local+nube perdió estrellas: %s' % r['a'])
    if r['b'] != r['a']: fallos.append('el orden de la unión cambia el resultado')
    if r['c'] != {'win': 100, 'noabil': 300}: fallos.append('sin nube se perdieron estrellas locales: %s' % r['c'])
    if r['d'] != {'win': 200, 'packs': 250}: fallos.append('sin datos locales se perdieron las de la nube: %s' % r['d'])
    if r['mguf'] != {}: fallos.append('una aventura sin estrellas debe quedar vacía: %s' % r['mguf'])
    if errs: fallos.append('errores de página: %s' % errs)
    if fallos:
        print('FALLO:', '; '.join(fallos)); raise SystemExit(1)
    print('ok  estrellas: se conservan al unir con la nube')

asyncio.run(main())
