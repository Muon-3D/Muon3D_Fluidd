"""usage: python shoot2.py out.png route [--w N --h N --light]  (headless shell; MSIX-safe)"""
import sys,glob,os
from playwright.sync_api import sync_playwright
a=sys.argv[1:]; w,h,light=1440,900,False
if '--w' in a: i=a.index('--w'); w=int(a[i+1]); del a[i:i+2]
if '--h' in a: i=a.index('--h'); h=int(a[i+1]); del a[i:i+2]
if '--light' in a: a.remove('--light'); light=True
out,route=a[0],(a[1] if len(a)>1 else '/')
exe=glob.glob(os.path.expanduser('~/AppData/Local/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-win64/chrome-headless-shell.exe'))[-1]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe,args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_context(viewport={'width':w,'height':h}).new_page()
    pg.on('console',lambda m: print('C',m.text[:160]) if m.type=='error' else None)
    pg.goto('http://localhost:8080'+route,wait_until='domcontentloaded',timeout=60000)
    pg.wait_for_function("document.querySelector('#app') && document.querySelector('#app').__vue__ && !document.querySelector('#muon-loader')",timeout=45000)
    pg.add_style_tag(content='vite-plugin-checker-error-overlay{display:none!important}')
    pg.wait_for_timeout(9000)
    print(pg.url)
    pg.screenshot(path=out,full_page=(w<500))
    b.close()
