# El usuario conectado se recuerda al cambiar de juego; cada juego guarda su propio campo en la nube
import asyncio
exec(open('/home/claude/d6-crawler/test/cloud_test.py').read().split('\nasync def main():')[0])
BASE = 'file:///home/claude/d6-crawler/index.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(locale='es-CL', viewport={'width': 390, 'height': 844})
        await ctx.route(re.compile(r'https://(identitytoolkit|securetoken|firestore)\.googleapis\.com/.*'), handler)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '?w=arch'); await pg.wait_for_timeout(400)
        await pg.click('#mUser'); await pg.click('#uNew'); await pg.wait_for_selector('#uPw2'); await pg.wait_for_timeout(200)
        for _ in range(3):
            await pg.fill('#uName', 'Max Prueba'); await pg.fill('#uPw', 'secreto1'); await pg.fill('#uPw2', 'secreto1'); await pg.wait_for_timeout(150)
            if await pg.evaluate("['uName','uPw','uPw2'].every(id => document.getElementById(id).value)"): break
        await pg.click('#uGo'); await pg.wait_for_timeout(1200)
        a = await pg.inner_text('#mUser')
        await pg.click('#mWorld'); await pg.wait_for_timeout(1500)
        k = await pg.inner_text('#mUser'); await pg.wait_for_timeout(1200)
        fields = sorted(list(docs.values())[0]['fields'].keys()) if docs else []
        # salir en Colossus también sale en Archeodice
        await pg.click('#mUser'); await pg.wait_for_timeout(300)
        out = pg.locator('#pOut, #uOut, [data-act="logout"]')
        n = await out.count()
        if n: await out.first.click(); await pg.wait_for_timeout(300)
        await pg.goto(BASE + '?w=arch'); await pg.wait_for_timeout(500)
        a2 = await pg.inner_text('#mUser')
        print('arch:', a.split('\n')[0], '| kaiju:', k.split('\n')[0], '| campos nube:', fields, '| botón salir:', n, '| arch tras salir:', a2.split('\n')[0])
        ok = 'Max Prueba' in a and 'Max Prueba' in k and 'data_arch' in fields and 'data_kaiju' in fields and (n == 0 or 'Max Prueba' not in a2) and not errs
        print('errores', errs); print('ok' if ok else 'FAIL'); await b.close()
asyncio.run(main())
