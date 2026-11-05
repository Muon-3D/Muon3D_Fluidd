import glob,os
from playwright.sync_api import sync_playwright
exe=glob.glob(os.path.expanduser('~/AppData/Local/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-win64/chrome-headless-shell.exe'))[-1]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe,args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page()
    pg.goto('http://localhost:8080/boxwood-367a/__mockup/overview',wait_until='domcontentloaded')
    pg.wait_for_function("document.querySelector('.v-application') && !document.querySelector('#muon-loader')",timeout=60000)
    pg.wait_for_timeout(4000)
    pg.click('[data-tid=account]'); pg.wait_for_timeout(3000)
    print(pg.evaluate("""()=>{const m=document.querySelector('.muon-account__menu');const c=getComputedStyle(m);return [c.backgroundColor,c.opacity,c.backdropFilter,getComputedStyle(document.documentElement).getPropertyValue('--m3d-surface'), document.querySelector('.v-application').className]}"""))
    print(pg.evaluate("""()=>{const r=document.querySelector('.v-application').__vue__.$root.$store.state.config.uiSettings.theme;return JSON.stringify(r)}"""))
    b.close()
