import type { Plugin } from 'vite'

/**
 * The entry must not run before the loader has painted. A module script in
 * the head can execute before the first frame, so the build turns the entry
 * script into a modulepreload and the stylesheets into preloads, and a small
 * inline bootstrap loads them after a frame: first the CSS, then the entry.
 * Progress marks line up with loader.ts's setLoaderProgress.
 */
const bootstrap = (entry: string, styles: string[]) => `<script>
(function () {
  var ENTRY = ${JSON.stringify(entry)}
  var CSS = ${JSON.stringify(styles)}
  function progress (p) {
    var l = document.getElementById('muon-loader')
    if (l) l.style.setProperty('--muon-loader-progress', p)
  }
  function fail () {
    var e = document.querySelector('#muon-loader .muon-loader__error')
    if (e) e.hidden = false
  }
  function boot () {
    import(ENTRY).catch(fail)
  }
  var went = false
  function go () {
    if (went) return
    went = true
    progress(0.15)
    if (!CSS.length) { progress(0.5); boot(); return }
    var done = 0
    CSS.forEach(function (href) {
      var l = document.createElement('link')
      l.rel = 'stylesheet'
      l.crossOrigin = 'anonymous'
      var next = function () {
        if (++done === CSS.length) { progress(0.5); boot() }
      }
      l.onload = next
      l.onerror = next
      l.href = href
      document.head.appendChild(l)
    })
  }
  /* rAF is no proof a frame was presented; the first real paint is. */
  var observing = false
  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries()
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].name === 'first-paint' || entries[i].name === 'first-contentful-paint') { go(); return }
      }
    }).observe({ type: 'paint', buffered: true })
    observing = true
  } catch (e) {}
  if (!observing) requestAnimationFrame(function () { setTimeout(go, 0) })
  setTimeout(go, 300)
})()
</script>`

const vitePluginStartup = (): Plugin => {
  return {
    name: 'muon-startup',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler (html) {
        const entries: string[] = []
        const styles: string[] = []

        html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_m, src) => {
          entries.push(src)
          return `<link rel="modulepreload" crossorigin href="${src}">`
        })
        html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_m, href) => {
          styles.push(href)
          return `<link rel="preload" as="style" crossorigin href="${href}">`
        })

        return html.replace('</body>', `${bootstrap(entries[0] ?? '', styles)}\n</body>`)
      }
    }
  }
}

export default vitePluginStartup

/**
 * What the service worker precaches (KAN-5101, over KAN-525's shell-only
 * set). KAN-525 kept the install to the app shell; the lazy chunks, the viewer,
 * the M1 model, its decoders and the images were left to a runtime cache that
 * only fills on first use, so a laptop that goes offline after one visit found
 * the pages half drawn: unstyled, with no model (Jack, 19 Nov, Army demo).
 *
 * Now the whole app is the offline set: every script, stylesheet, font,
 * image, wasm, the M1 .glb and the draco decoder it loads. What is left out is
 * what the app does not need to draw a page offline: the Monaco code editor
 * (about 8 MB, config editing only; it stays a runtime cache), the printed
 * licence texts, and the version probes (release_info.json, build-info.json,
 * which must always come from the network) and config.json (its own
 * stale-while-revalidate rule in sw.ts).
 *
 * The cost is paid in the background: the worker is registered after the first
 * paint, in idle time (RegisterServiceWorker.vue), so no first load waits for it.
 */
const MONACO = /^(?:monacoeditorwork\/|assets\/(?:setupMonaco|onigasm|codicon|jsonMode|cssMode|htmlMode|tsMode))/
const NEVER = /^(?:licenses\/|LICENSE|licences\.html|robots\.txt|build-info\.json|release_info\.json|config\.json|manifest\.webmanifest|sw\.js)/
const OFFLINE_ROOTS = /^(?:index\.html$|assets\/|fonts\/|draco\/|img\/|logo_[^/]+\.svg$|favicon\.ico$|editor\.theme\.json$)/

export const isOffline = (url: string) => OFFLINE_ROOTS.test(url) && !MONACO.test(url) && !NEVER.test(url) && !url.endsWith('.map')

export const offlineSet = () => (entries: Array<{ url: string }>) => ({
  manifest: entries.filter(e => isOffline(e.url)),
  warnings: [] as string[]
})
