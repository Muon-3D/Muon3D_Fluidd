import sys,glob,os
from playwright.sync_api import sync_playwright
OUT='C:/Users/jack/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/side-session-notes/local_a7ecc622-b03d-4bdf-be0c-446b0556e33e/control-mockups-v2-1105/overview/'
B='http://localhost:8080/boxwood-367a/__mockup/overview'
exe=glob.glob(os.path.expanduser('~/AppData/Local/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-win64/chrome-headless-shell.exe'))[-1]
only=set(sys.argv[1:])
# name, query, w, h, light, action
S=[
 ('overview-dark-desktop','',1440,900,False,None),
 ('overview-light-desktop','',1440,900,True,None),
 ('overview-dark-phone','',390,844,False,None),
 ('overview-camera-toggle-dark-desktop','?cam=1&view=camera',1440,900,False,None),
 ('overview-edit-mode-dark-desktop','?edit=1',1440,900,False,None),
 ('hotend-popover-open-dark-desktop','?pop=hotend',1440,900,False,None),
 ('topbar-printer-switcher-open-dark-desktop','',1440,900,False,'[data-tid=printer-switch]'),
 ('topbar-account-menu-open-dark-desktop','',1440,900,False,'[data-tid=account]'),
 ('topbar-quick-actions-open-dark-desktop','',1440,900,False,'[data-tid=quick-actions]'),
]
THEME="""async (light)=>{const r=document.querySelector('.v-application').__vue__.$root;const t=r.$store.state.config.uiSettings.theme;await r.$store.dispatch('config/onThemeChange',{...t,isDark:!light});}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe,args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for name,q,w,h,light,act in S:
        if only and name not in only: continue
        pg=b.new_context(viewport={'width':w,'height':h}).new_page()
        pg.goto(B+q,wait_until='domcontentloaded',timeout=60000)
        pg.wait_for_function("document.querySelector('.v-application') && !document.querySelector('#muon-loader')",timeout=60000)
        pg.add_style_tag(content='vite-plugin-checker-error-overlay{display:none!important}')
        pg.evaluate(THEME,light)
        if light:
            pg.wait_for_timeout(2000); pg.evaluate("()=>{document.querySelector('.v-application').__vue__.$root.$router.push('/boxwood-367a/jobs').catch(()=>{})}"); pg.wait_for_timeout(3000); pg.evaluate("()=>{document.querySelector('.v-application').__vue__.$root.$router.push('/boxwood-367a/__mockup/overview').catch(()=>{})}"); pg.wait_for_timeout(2000)
        pg.wait_for_timeout(5000)
        try: pg.wait_for_function("document.querySelectorAll('.mq-tile--graph svg path[stroke]').length>3",timeout=40000)
        except Exception: print('chart empty',name,flush=True)
        pg.wait_for_timeout(1500)
        if name=='hotend-popover-open-dark-desktop':
            pg.evaluate("()=>{document.querySelector('[data-tid=tile-hotend]').scrollIntoView({block:'start'});window.scrollBy(0,-90)}"); pg.wait_for_timeout(1500)
        if act:
            pg.click(act); pg.wait_for_timeout(3000)
        if w<500:
            # the page scrolls inside the app: grow the viewport to fit
            hh=pg.evaluate("Math.max(document.querySelector('.v-main__wrap')?document.querySelector('.v-main__wrap').scrollHeight+80:0,document.documentElement.scrollHeight)")
            pg.set_viewport_size({'width':w,'height':int(hh)}); pg.wait_for_timeout(2500)
        pg.screenshot(path=OUT+name+'.png')
        # a tall companion so every tile is visible
        if w>=1000 and not act:
            pg.set_viewport_size({'width':w,'height':1750}); pg.wait_for_timeout(2500)
            pg.screenshot(path=OUT+name+'-full.png')
        print('shot',name,flush=True)
        if light: pg.evaluate(THEME,False); pg.wait_for_timeout(2500)
        pg.context.close()
    b.close()
