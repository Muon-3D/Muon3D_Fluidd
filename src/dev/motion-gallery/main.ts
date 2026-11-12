// The Muon3D motion gallery: every motion pattern, playable, with the old
// behaviour beside it where it replaces something. A dev page; it is not part
// of any build. Control's real theme tokens come from the two SCSS files.
import '@/scss/muon3d.scss'
import '@/scss/muon3d-glass.scss'
import './gallery.css'

/* ------------------------------------------------------------------ springs */

// A spring as a CSS linear() curve: unit mass, the response to a step of 1.
function spring (stiffness: number, zeta: number) {
  const w0 = Math.sqrt(stiffness)
  const settle = Math.log(1000) / (Math.min(zeta, 1) * w0)
  const at = (t: number) => {
    if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t))
  }
  const n = 32
  const points = Array.from({ length: n + 1 }, (_, i) => i === n ? 1 : +at(settle * i / n).toFixed(4))
  return { css: `linear(${points.join(', ')})`, ms: Math.round(settle * 1000), fn: (p: number) => p >= 1 ? 1 : at(settle * p) }
}

const SPRINGS = {
  snappy: spring(520, 1),
  gentle: spring(260, 0.8),
  bouncy: spring(300, 0.55)
}

const root = document.documentElement
for (const [name, s] of Object.entries(SPRINGS)) {
  root.style.setProperty(`--m3d-spring-${name}`, s.css)
  root.style.setProperty(`--m3d-spring-${name}-duration`, `${s.ms}ms`)
}

const DUR = { instant: 80, fast: 160, base: 240, slow: 340, slower: 520, camera: 800, stagger: 40 }
const EASE = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  linear: 'linear',
  snappy: SPRINGS.snappy.css,
  gentle: SPRINGS.gentle.css,
  bouncy: SPRINGS.bouncy.css
}

/* ------------------------------------------------------------------ helpers */

let speed = 1
let reduced = false

const $ = <T extends HTMLElement = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector(sel) as T
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, el: ParentNode = document) => Array.from(el.querySelectorAll(sel)) as T[]
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms * speed))
const modeOf = (el: Element) => el.closest('[data-mode]')?.getAttribute('data-mode') ?? 'after'

// One animation. Reduced motion keeps only opacity and runs it short; the
// "before" side of a demo runs nothing and lands on the end state.
function anim (el: Element, frames: Keyframe[], ms: number, easing = EASE.standard, extra: KeyframeAnimationOptions = {}) {
  if (modeOf(el) === 'before') ms = 0
  if (reduced) {
    frames = frames.map(f => ({ opacity: f.opacity ?? 1, ...(f.visibility ? { visibility: f.visibility } : {}) }))
    ms = Math.min(ms, 120)
    easing = 'linear'
    delete extra.delay
  }
  return el.animate(frames, { duration: ms * speed, easing, fill: 'both', ...extra, delay: (Number(extra.delay) || 0) * speed })
}

// FLIP: change the layout, then move each child from where it was.
function flip (children: Element[], change: () => void, ms = SPRINGS.snappy.ms, easing = EASE.snappy) {
  const before = children.map(c => c.getBoundingClientRect())
  change()
  children.forEach((c, i) => {
    if (!c.isConnected) return
    const after = c.getBoundingClientRect()
    const dx = before[i].left - after.left
    const dy = before[i].top - after.top
    if (dx || dy) anim(c, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], ms, easing, { fill: 'none' })
  })
}

// Old text out upwards, new text in from below, inside a clipped box.
function swapText (box: HTMLElement, text: string) {
  const old = box.lastElementChild as HTMLElement | null
  if (old?.textContent === text) return
  const next = document.createElement('span')
  next.textContent = text
  box.append(next)
  if (old) anim(old, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-40%)' }], DUR.fast * 0.75, EASE.exit).finished.then(() => old.remove())
  anim(next, [{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], DUR.base, EASE.enter)
}

const ICON: Record<string, string> = {
  chevron: '<path d="M9 6l6 6-6 6"/>',
  wifi: '<path d="M5 12.5a10 10 0 0114 0M8 15.5a6 6 0 018 0"/><circle cx="12" cy="18.5" r="1"/>',
  cloud: '<path d="M7 18a4 4 0 01-.5-8 5.5 5.5 0 0110.6 1.2A3.5 3.5 0 0117 18z"/>',
  bluetooth: '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16v.5"/>',
  sync: '<path d="M4 12a8 8 0 0113.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 01-13.7 5.6L4 15M4 20v-5h5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  printer: '<rect x="5" y="4" width="14" height="16" rx="3"/><path d="M8.5 15h7M12 8v4"/>',
  more: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>'
}
const icon = (name: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`

const chips = (...names: string[]) => `<div class="chips">${names.map(n => `<span class="chip">${n}</span>`).join('')}</div>`
const beforeAfter = '<div class="seg ba" data-seg><button>Before</button><button class="on">After</button><i class="thumb"></i></div>'

/* --------------------------------------------------------------------- page */

const SECTIONS: [string, string][] = [
  ['tokens', 'Tokens'], ['controls', 'Press, hover, focus'], ['tabs', 'Pages and tabs'], ['panels', 'Panels'],
  ['overlays', 'Dialogs, menus, toasts'], ['loading', 'Loading'], ['connection', 'Printers and connection'],
  ['lifecycle', 'Print lifecycle'], ['numbers', 'Temperatures and numbers'], ['twin', '3D twin'], ['never', 'What never animates']
]

$('#app').innerHTML = `
<nav class="side">
  <h1>MUON3D</h1><p>Motion gallery · draft 1</p>
  ${SECTIONS.map(([id, name]) => `<a href="#${id}">${name}</a>`).join('')}
</nav>
<main class="main">
  <div class="bar">
    <div class="grp"><label>Speed</label><div class="seg" data-seg id="speed"><button class="on">1×</button><button>½×</button><button>⅒×</button><i class="thumb"></i></div></div>
    <div class="grp"><label>Theme</label><div class="seg" data-seg id="theme"><button class="on">Dark</button><button>Light</button><i class="thumb"></i></div></div>
    <div class="grp"><label>Width</label><div class="seg" data-seg id="width"><button class="on">Desktop</button><button>Phone</button><i class="thumb"></i></div></div>
    <div class="grp"><label>Reduce motion</label><button class="switch" id="reduce" aria-label="Reduce motion"><i></i></button></div>
  </div>

  <section id="tokens">
    <h2>Tokens</h2>
    <p class="lead">Six durations, three curves and three springs. Everything in Control, the printer screen, the app and the Library picks from these, so the products move like one thing.</p>
    <div class="cards">
      <div class="card"><header><h3>Durations</h3><button class="btn sm" data-play="durations">Play</button></header>
        <p class="rule">Small things are quick, big surfaces take longer. Exits run at three quarters of the enter.</p>
        <div id="durations"></div></div>
      <div class="card"><header><h3>Curves and springs</h3><button class="btn sm" data-play="easings">Play</button></header>
        <p class="rule">Standard for things that stay on screen, enter and exit for things that arrive and leave, springs for things you touch.</p>
        <div id="easings"></div></div>
      <div class="card wide"><div class="curves" id="curves"></div></div>
    </div>
  </section>

  <section id="controls">
    <h2>Press, hover, focus</h2>
    <p class="lead">A control answers the finger inside 80 ms, then springs back. Hover is a quiet tone change. The focus ring grows out of the control.</p>
    <div class="cards">
      <div class="card" data-mode="after"><header><h3>Buttons and tiles</h3>${beforeAfter}</header>
        <p class="rule">Press and hold to see the press state. Tab through for the focus ring.</p>
        <div class="stage">
          <div class="row"><button class="btn primary">Print</button><button class="btn">Pause</button><button class="btn icon" aria-label="More">${icon('more')}</button><button class="btn danger">Stop</button></div>
          <div class="row"><button class="tile"><span>Nozzle</span><b>215°</b></button><button class="tile"><span>Plate</span><b>60°</b></button></div>
        </div>${chips('motion-instant', 'spring-snappy', 'motion-fast')}</div>
      <div class="card" data-mode="after"><header><h3>Switches and segments</h3>${beforeAfter}</header>
        <p class="rule">The thumb slides on a spring with no overshoot; the colour follows.</p>
        <div class="stage">
          <div class="row"><button class="switch on" data-switch aria-label="Example"><i></i></button><button class="switch" data-switch aria-label="Example"><i></i></button></div>
          <div class="row"><div class="seg" data-seg><button class="on">Overview</button><button>Jog</button><button>Trackpad</button><i class="thumb"></i></div></div>
        </div>${chips('spring-snappy', 'motion-base')}</div>
    </div>
  </section>

  <section id="tabs">
    <h2>Pages and tabs</h2>
    <p class="lead">The old page fades out fast; the new one arrives from the side you moved towards. The underline slides to the new tab.</p>
    <div class="cards"><div class="card wide" data-mode="after"><header><h3>Tab change</h3>${beforeAfter}</header>
      <div class="stage"><div class="tabs" id="tabbar">${['Overview', 'Files', 'History', 'Settings'].map((t, i) => `<button class="${i ? '' : 'on'}">${t}</button>`).join('')}<i class="ink"></i></div><div class="panes" id="panes"></div></div>
      ${chips('motion-fast × 0.75 out', 'motion-base in', 'ease-exit', 'ease-enter', 'motion-slow ink')}</div></div>
  </section>

  <section id="panels">
    <h2>Panels</h2>
    <p class="lead">A panel opens by uncovering its content; the panels below slide out of the way. Layout is set once, then only transforms and a clip move.</p>
    <div class="cards"><div class="card wide" data-mode="after"><header><h3>Expand and collapse</h3>${beforeAfter}</header>
      <div class="stage" id="panelstack">${['Temperatures', 'Fans and outputs', 'Speed and flow'].map((t, i) => `<div class="panel ${i ? '' : 'open'}"><button>${t}${icon('chevron')}</button><div class="body">Nozzle 215 °C, plate 60 °C, chamber 31 °C. The content is in place from the first frame, so nothing jumps when the panel finishes opening.</div></div>`).join('')}</div>
      ${chips('motion-slow', 'ease-standard', 'transform + clip-path')}</div></div>
  </section>

  <section id="overlays">
    <h2>Dialogs, menus, toasts</h2>
    <p class="lead">Things that float arrive from where they were called and leave faster than they came. Nothing staggers; a menu is one object.</p>
    <div class="cards"><div class="card wide" data-mode="after"><header><h3>Floating surfaces</h3>${beforeAfter}</header>
      <div class="stage overlay-stage" id="ostage">
        <div class="row"><button class="btn" id="b-menu">Menu</button><button class="btn" id="b-dialog">Dialog</button><button class="btn" id="b-sheet">Phone sheet</button><button class="btn" id="b-toast">Toast</button><button class="btn" id="b-bad">Error toast</button></div>
        <div class="menu" id="menu"><div>Rename</div><div>Move to group</div><div>Share access</div><div>Remove printer</div></div>
        <div class="scrim" id="scrim"></div>
        <div class="dialog" id="dialog"><h4>Cancel this print?</h4><p>The plate cools and the head parks. You can't resume it.</p><div class="row"><button class="btn" data-close>Keep printing</button><button class="btn danger" data-close>Cancel print</button></div></div>
        <div class="sheet" id="sheet"><h4 style="margin:0 0 6px">Boxwood</h4><p class="muted" style="margin:0 0 14px">On this network · printing, 42 %</p><div class="row"><button class="btn primary" data-close>Open</button><button class="btn" data-close>Close</button></div></div>
        <div class="toasts" id="toasts"></div>
      </div>${chips('menu: motion-fast, from origin', 'dialog: spring-gentle', 'sheet: spring-gentle', 'toast: motion-base', 'exit × 0.75')}</div></div>
  </section>

  <section id="loading">
    <h2>Loading</h2>
    <p class="lead">Your note: “very glitchy when loading, with randomly named printers”. The fix: the page takes its final shape at once, a name is shown only when it is the real name, and content fades in where it will stay.</p>
    <div class="cards">
      <div class="card" data-mode="before"><header><h3>Printer list, now</h3><button class="btn sm" data-play="list-before">Play</button></header>
        <p class="rule">Rows pop in one at a time, ids stand in for names, the list jumps.</p>
        <div class="stage"><div class="plist" id="list-before"></div></div></div>
      <div class="card" data-mode="after"><header><h3>Printer list, proposed</h3><button class="btn sm" data-play="list-after">Play</button></header>
        <p class="rule">Skeleton rows hold the shape. Real rows fade in, 40 ms apart. Nothing moves.</p>
        <div class="stage"><div class="plist" id="list-after"></div></div>${chips('skeleton after 150 ms', 'motion-base', 'motion-stagger, 6 at most')}</div>
      <div class="card wide" data-mode="after"><header><h3>Overview, first paint</h3>${beforeAfter}<button class="btn sm" data-play="overview">Play</button></header>
        <p class="rule">Labels and layout are known before the printer answers, so they are there from frame one. Only the values wait.</p>
        <div class="stage"><div class="ogrid" id="ogrid"></div></div></div>
    </div>
  </section>

  <section id="connection">
    <h2>Printers and connection</h2>
    <p class="lead">A route change is calm: the chip rolls to the new route. Bad news is not animated. “Dropped” shows on the frame it is known.</p>
    <div class="cards">
      <div class="card" data-mode="after"><header><h3>Connection state</h3>${beforeAfter}</header>
        <div class="stage"><div class="phead"><div class="name"><span>Boxwood</span></div><div class="route" id="route" data-s="lan"><span class="in">${icon('wifi')}On this network</span></div></div>
          <div class="row" id="routes">${['LAN', 'Cloud', 'Bluetooth', 'Reconnecting', 'Dropped'].map(r => `<button class="btn sm">${r}</button>`).join('')}</div></div>
        ${chips('motion-base roll', 'reconnecting: 1.6 s breath', 'dropped: instant')}</div>
      <div class="card" data-mode="after"><header><h3>Printer switch</h3>${beforeAfter}</header>
        <div class="stage"><div class="phead"><div class="thumb" style="color:var(--m3d-accent);width:22px;height:22px">${icon('printer')}</div><div class="name" id="swname"><span>Boxwood</span></div><span class="muted" id="swstate">Printing</span></div>
          <div class="swlist" id="swlist"><i class="hl"></i>${[['Boxwood', 'Printing'], ['Walnut', 'Idle'], ['Sloe', 'Offline']].map(([n, s]) => `<button>${n}<small>${s}</small></button>`).join('')}</div></div>
        ${chips('highlight: spring-snappy', 'name: fast out, base in')}</div>
    </div>
  </section>

  <section id="lifecycle">
    <h2>Print lifecycle</h2>
    <p class="lead">Start draws the ring in. Progress moves at the printer's pace. A finished print gets the one bounce in the product. An error gets none.</p>
    <div class="cards"><div class="card wide" data-mode="after"><header><h3>Start, pause, finish, error</h3>${beforeAfter}</header>
      <div class="stage"><div class="life">
        <div class="ring" id="ring" data-s="idle"><svg viewBox="0 0 132 132"><circle class="bg" cx="66" cy="66" r="58"/><circle class="fg" cx="66" cy="66" r="58"/></svg>
          <div class="mid"><span class="pct" id="pct">0%</span>
            <svg class="glyph" id="g-done" viewBox="0 0 46 46"><path pathLength="1" d="M11 24l8.5 8.5L35 15"/></svg>
            <svg class="glyph" id="g-error" viewBox="0 0 46 46"><path d="M23 11v15M23 33v1"/></svg>
            <svg class="glyph" id="g-pause" viewBox="0 0 46 46"><path d="M17 13v20M29 13v20"/></svg></div></div>
        <div><h4 id="lifetitle"><span>Ready</span></h4><p id="lifesub">benchy.gcode · 1 h 12 min</p>
          <div class="row" id="lifebtns">${['Start', 'Pause', 'Resume', 'Finish', 'Error', 'Reset'].map(r => `<button class="btn sm">${r}</button>`).join('')}</div></div>
      </div></div>${chips('ring: linear between reports', 'finish: spring-bouncy, once', 'error: instant')}</div></div>
  </section>

  <section id="numbers">
    <h2>Temperatures and numbers</h2>
    <p class="lead">The number on screen is always the last value the printer sent. Digits roll and bars glide, but they finish before the next report, so nothing trails the truth.</p>
    <div class="cards">
      <div class="card" data-mode="after"><header><h3>Live temperature</h3>${beforeAfter}</header>
        <div class="stage"><div class="temp"><div class="big"><span id="tnum"></span><small>°C</small></div><div class="meter"><i id="tbar"></i></div><div class="truth" id="ttruth"></div></div>
          <div class="row"><button class="btn sm" id="heat">Heat to 215</button><button class="btn sm" id="cool">Cool</button></div></div>
        ${chips('digit roll: motion-fast', 'bar: one report, linear', 'text = truth, always')}</div>
      <div class="card" data-mode="after"><header><h3>Live graph</h3>${beforeAfter}</header>
        <p class="rule">The line scrolls between reports. The right edge is the real latest point.</p>
        <div class="stage"><canvas class="spark" id="spark"></canvas></div>${chips('scroll: linear, one report long')}</div>
    </div>
  </section>

  <section id="twin">
    <h2>3D twin</h2>
    <p class="lead">A sketch of the rules, not the M1 model. The real scene gets these in its own change: camera moves ease in and out, the still picture hands over to the live scene with no jump, and the head glides between reports without falling behind.</p>
    <div class="cards">
      <div class="card" data-mode="after"><header><h3>Camera and first frame</h3>${beforeAfter}</header>
        <div class="stage" style="padding:0"><div class="twin"><div class="cam" id="cam"><div class="floor"></div><div class="plate"></div>
          <div class="post" style="left:-12px;top:-12px"></div><div class="post" style="right:-12px;top:-12px"></div>
          <div class="ghost" id="ghost"></div><div class="head" id="head"></div></div><div class="poster" id="poster">Loading 3D…</div></div></div>
        <div class="row" style="margin-top:12px" id="cams">${['Home', 'Top', 'Front', 'Side'].map(r => `<button class="btn sm">${r}</button>`).join('')}<span class="grow"></span><button class="btn sm" data-play="firstframe">Replay load</button></div>
        ${chips('motion-camera', 'ease-standard', 'still → live: motion-base crossfade')}</div>
      <div class="card"><header><h3>Head follows the printer</h3></header>
        <p class="rule">Dashed: where the printer last said the head is. Solid: what we draw. Before snaps 4 times a second; after glides and is on the mark before the next report.</p>
        <div class="stage"><div class="truth" id="lag"></div><div class="row"><div class="seg" data-seg id="follow"><button>Snap</button><button class="on">Glide</button><i class="thumb"></i></div></div></div>
        ${chips('time constant ≤ ⅓ report interval')}</div>
    </div>
  </section>

  <section id="never">
    <h2>What never animates</h2>
    <div class="cards"><div class="card wide"><p class="rule" style="margin:0;font-size:14px;color:var(--m3d-text)">
      Stop and E-STOP: the press state is instant and nothing delays the command.<br>
      Faults, dropped connections and safety warnings: they appear on the frame they are known, with no bounce and no delay.<br>
      Live values: a temperature, position or progress number is never tweened towards the truth over more than one report.<br>
      Data updates: a stagger is for the first reveal only, never for a refresh.<br>
      With Reduce motion on: no movement and no springs, only short fades. Try the switch at the top.</p></div></div>
  </section>
</main>`

/* --------------------------------------------------------------- top controls */

function segment (seg: HTMLElement, onPick?: (index: number) => void) {
  const buttons = $$('button', seg)
  const thumb = $('.thumb', seg)
  const place = () => {
    const on = buttons.find(b => b.classList.contains('on')) ?? buttons[0]
    thumb.style.width = `${on.offsetWidth}px`
    thumb.style.transform = `translateX(${on.offsetLeft - 2}px)`
  }
  buttons.forEach((b, i) => b.addEventListener('click', () => {
    buttons.forEach(o => o.classList.toggle('on', o === b))
    place()
    onPick?.(i)
  }))
  place()
  new ResizeObserver(place).observe(seg)
}

$$('[data-seg]').forEach(seg => {
  if (seg.classList.contains('ba')) {
    segment(seg, i => seg.closest('.card')!.setAttribute('data-mode', i ? 'after' : 'before'))
  } else if (!seg.id) segment(seg)
})
segment($('#speed'), i => { speed = [1, 2, 10][i]; root.style.setProperty('--speed', String(speed)) })
segment($('#theme'), i => {
  const app = $('#app')
  app.classList.toggle('theme--dark', !i)
  app.classList.toggle('theme--light', !!i)
  app.style.setProperty('--v-primary-base', i ? '#2c8782' : '#80d6d1')
})
segment($('#width'), i => document.body.classList.toggle('phone', !!i))
$('#reduce').addEventListener('click', e => {
  reduced = !reduced
  ;(e.currentTarget as HTMLElement).classList.toggle('on', reduced)
  root.classList.toggle('reduced', reduced)
})
if (matchMedia('(prefers-reduced-motion: reduce)').matches) $('#reduce').click()
$$('[data-switch]').forEach(s => s.addEventListener('click', () => s.classList.toggle('on')))

const spy = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) $$('.side a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`))
}, { rootMargin: '-20% 0px -70% 0px' })
$$('section').forEach(s => spy.observe(s))

const plays: Record<string, () => void> = {}
document.addEventListener('click', e => {
  const key = (e.target as HTMLElement).closest<HTMLElement>('[data-play]')?.dataset.play
  if (key) plays[key]?.()
})

/* ------------------------------------------------------------------- tokens */

function trackRows (host: HTMLElement, rows: { name: string, note: string, ms: number, easing: string }[]) {
  host.innerHTML = rows.map(r => `<div class="trow"><div><code>${r.name}</code><small>${r.note}</small></div><div class="track"><i class="dot"></i></div></div>`).join('')
  return () => $$('.track', host).forEach((track, i) => {
    const x = track.clientWidth - 26
    track.firstElementChild!.animate([{ transform: 'none' }, { transform: `translateX(${x}px)` }], { duration: rows[i].ms * speed, easing: rows[i].easing, fill: 'both' })
  })
}

plays.durations = trackRows($('#durations'), [
  { name: 'motion-instant', note: '80 ms · press', ms: DUR.instant, easing: EASE.standard },
  { name: 'motion-fast', note: '160 ms · hover, toggles', ms: DUR.fast, easing: EASE.standard },
  { name: 'motion-base', note: '240 ms · menus, toasts', ms: DUR.base, easing: EASE.standard },
  { name: 'motion-slow', note: '340 ms · panels, pages', ms: DUR.slow, easing: EASE.standard },
  { name: 'motion-slower', note: '520 ms · large surfaces', ms: DUR.slower, easing: EASE.standard },
  { name: 'motion-camera', note: '800 ms · 3D camera', ms: DUR.camera, easing: EASE.standard }
])
plays.easings = trackRows($('#easings'), [
  { name: 'ease-standard', note: 'moves that stay', ms: 520, easing: EASE.standard },
  { name: 'ease-enter', note: 'arrivals', ms: 520, easing: EASE.enter },
  { name: 'ease-exit', note: 'departures', ms: 520, easing: EASE.exit },
  { name: 'spring-snappy', note: `${SPRINGS.snappy.ms} ms · no overshoot`, ms: SPRINGS.snappy.ms, easing: EASE.snappy },
  { name: 'spring-gentle', note: `${SPRINGS.gentle.ms} ms · 1.5 % over`, ms: SPRINGS.gentle.ms, easing: EASE.gentle },
  { name: 'spring-bouncy', note: `${SPRINGS.bouncy.ms} ms · 13 % over`, ms: SPRINGS.bouncy.ms, easing: EASE.bouncy }
])

function bezier (x1: number, y1: number, x2: number, y2: number) {
  const c = (t: number, a: number, b: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  return (x: number) => {
    let lo = 0; let hi = 1
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (c(mid, x1, x2) < x) lo = mid; else hi = mid }
    return c((lo + hi) / 2, y1, y2)
  }
}
const CURVES: [string, string, (p: number) => number][] = [
  ['ease-standard', '0.2, 0, 0, 1', bezier(0.2, 0, 0, 1)], ['ease-enter', '0.16, 1, 0.3, 1', bezier(0.16, 1, 0.3, 1)], ['ease-exit', '0.4, 0, 1, 1', bezier(0.4, 0, 1, 1)],
  ['spring-snappy', `${SPRINGS.snappy.ms} ms`, SPRINGS.snappy.fn], ['spring-gentle', `${SPRINGS.gentle.ms} ms`, SPRINGS.gentle.fn], ['spring-bouncy', `${SPRINGS.bouncy.ms} ms`, SPRINGS.bouncy.fn]
]
$('#curves').innerHTML = CURVES.map(([name, note, fn]) => {
  const d = Array.from({ length: 61 }, (_, i) => `${i ? 'L' : 'M'}${(i / 60 * 100).toFixed(1)} ${(78 - fn(i / 60) * 60).toFixed(1)}`).join(' ')
  return `<div class="curve"><svg viewBox="0 0 100 84"><line x1="0" y1="78" x2="100" y2="78"/><line x1="0" y1="18" x2="100" y2="18"/><path d="${d}"/></svg><b>${name}</b><span>${note}</span></div>`
}).join('')

/* --------------------------------------------------------------------- tabs */

{
  const bar = $('#tabbar'); const ink = $('.ink', bar); const panes = $('#panes')
  const buttons = $$('button', bar)
  const pane = (i: number) => {
    const p = document.createElement('div')
    p.className = 'pane'
    p.innerHTML = Array.from({ length: 6 }, (_, k) => `<div>${buttons[i].textContent} ${k + 1}</div>`).join('')
    return p
  }
  const placeInk = (b: HTMLElement) => { ink.style.transform = `translateX(${b.offsetLeft}px) scaleX(${b.offsetWidth / 100})` }
  let current = 0
  panes.append(pane(0))
  placeInk(buttons[0])
  new ResizeObserver(() => placeInk(buttons[current])).observe(bar)
  buttons.forEach((b, i) => b.addEventListener('click', () => {
    if (i === current) return
    const dir = i > current ? 1 : -1
    current = i
    buttons.forEach(o => o.classList.toggle('on', o === b))
    placeInk(b)
    const old = panes.firstElementChild as HTMLElement
    const next = pane(i)
    old.classList.add('leaving')
    panes.append(next)
    anim(old, [{ opacity: 1 }, { opacity: 0 }], DUR.fast * 0.75, EASE.exit).finished.then(() => old.remove())
    anim(next, [{ opacity: 0, transform: `translateX(${dir * 16}px)` }, { opacity: 1, transform: 'none' }], DUR.base, EASE.enter, { delay: DUR.instant })
  }))
}

/* ------------------------------------------------------------------- panels */

{
  const stack = $('#panelstack')
  const panels = $$('.panel', stack)
  panels.forEach((panel, index) => $('button', panel).addEventListener('click', () => {
    const body = $('.body', panel)
    const below = panels.slice(index + 1)
    const opening = !panel.classList.contains('open')
    if (opening) panel.classList.add('open')
    const d = body.offsetHeight
    const shut = `inset(0 0 ${d}px 0 round 16px)`; const open = 'inset(0 0 0 0 round 16px)'
    const opts = { fill: 'none' as FillMode }
    if (opening) {
      anim(panel, [{ clipPath: shut }, { clipPath: open }], DUR.slow, EASE.standard, opts)
      anim(body, [{ opacity: 0 }, { opacity: 1 }], DUR.base, EASE.standard, { ...opts, delay: DUR.instant })
      below.forEach(p => anim(p, [{ transform: `translateY(${-d}px)` }, { transform: 'none' }], DUR.slow, EASE.standard, opts))
    } else {
      anim(body, [{ opacity: 1 }, { opacity: 0 }], DUR.fast, EASE.exit, opts)
      below.forEach(p => anim(p, [{ transform: 'none' }, { transform: `translateY(${-d}px)` }], DUR.slow * 0.75, EASE.standard, opts))
      anim(panel, [{ clipPath: open }, { clipPath: shut }], DUR.slow * 0.75, EASE.standard, opts).finished.then(() => panel.classList.remove('open'))
    }
  }))
}

/* ----------------------------------------------------------------- overlays */

{
  const scrim = $('#scrim'); const menu = $('#menu'); const dialog = $('#dialog'); const sheet = $('#sheet'); const toasts = $('#toasts')
  const shown = new Set<HTMLElement>()
  const show = (el: HTMLElement, frames: Keyframe[], ms: number, easing: string, modal: boolean) => {
    if (shown.has(el)) return hide(el)
    shown.add(el)
    el.style.visibility = 'visible'
    anim(el, frames, ms, easing)
    if (modal) { scrim.style.pointerEvents = 'auto'; anim(scrim, [{ opacity: 0 }, { opacity: 1 }], DUR.base, EASE.standard) }
  }
  const hide = (el: HTMLElement) => {
    if (!shown.delete(el)) return
    const to: Keyframe = el === sheet ? { transform: 'translateY(110%)' } : el === menu ? { opacity: 0, transform: 'scale(0.96)' } : { opacity: 0, transform: 'scale(0.97)' }
    anim(el, [{}, to], (el === sheet ? DUR.slow : DUR.fast) * 0.75, EASE.exit).finished.then(() => { if (!shown.has(el)) el.style.visibility = 'hidden' })
    if (el !== menu) { scrim.style.pointerEvents = 'none'; anim(scrim, [{}, { opacity: 0 }], DUR.fast, EASE.exit) }
  }
  $('#b-menu').addEventListener('click', e => { e.stopPropagation(); show(menu, [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], DUR.fast, EASE.enter, false) })
  $('#b-dialog').addEventListener('click', () => show(dialog, [{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], SPRINGS.gentle.ms, EASE.gentle, true))
  $('#b-sheet').addEventListener('click', () => show(sheet, [{ transform: 'translateY(110%)' }, { transform: 'none' }], SPRINGS.gentle.ms, EASE.gentle, true))
  scrim.addEventListener('click', () => { hide(dialog); hide(sheet) })
  $('#ostage').addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('[data-close]')) { hide(dialog); hide(sheet) }
    hide(menu)
  })
  const toast = (text: string, bad: boolean) => {
    const t = document.createElement('div')
    t.className = `toast${bad ? ' bad' : ''}`
    t.innerHTML = `${icon(bad ? 'alert' : 'check')}${text}`
    flip($$('.toast', toasts), () => toasts.append(t))
    // Bad news does not slide: it is simply there.
    anim(t, bad ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(14px) scale(0.96)' }, { opacity: 1, transform: 'none' }], bad ? DUR.instant : DUR.base, EASE.enter)
    setTimeout(() => {
      anim(t, [{}, { opacity: 0, transform: 'scale(0.96)' }], DUR.fast * 0.75, EASE.exit).finished.then(() => flip($$('.toast', toasts), () => t.remove()))
    }, 2600 * speed)
  }
  let n = 0
  $('#b-toast').addEventListener('click', () => toast(['Sent to Boxwood', 'Plate at 60 °C', 'Saved'][n++ % 3], false))
  $('#b-bad').addEventListener('click', () => toast('Lost the printer', true))
}

/* ------------------------------------------------------------------ loading */

const PRINTERS = [['Boxwood', 'On this network', 'Printing 42 %'], ['Walnut', 'Cloud', 'Idle'], ['Sloe', 'Bluetooth', 'Idle']]
const prow = (name: string, route: string, state: string) => `<div class="prow"><div class="thumb">${icon('printer')}</div><div><b>${name}</b><span>${route}</span></div><div class="state">${state}</div></div>`
const skrow = '<div class="prow"><div class="sk box"></div><div><div class="sk line"></div><div class="sk line short"></div></div><div class="sk pill"></div></div>'

let runBefore = 0
plays['list-before'] = async () => {
  const run = ++runBefore
  const host = $('#list-before')
  host.innerHTML = '<span class="muted">◌ Loading…</span>'
  const ids = ['a3f29c1e', '7be0d44a', 'c91a02f7']
  await wait(500); if (run !== runBefore) return
  host.innerHTML = prow(ids[1], '…', '…')
  await wait(350); if (run !== runBefore) return
  host.innerHTML = prow(ids[0], '…', '…') + prow(ids[1], 'Cloud', 'Offline')
  await wait(300); if (run !== runBefore) return
  host.innerHTML = prow('Boxwood', '…', 'Offline') + prow(ids[1], 'Cloud', 'Idle') + prow(ids[2], '…', '…')
  await wait(400); if (run !== runBefore) return
  host.innerHTML = PRINTERS.map(p => prow(p[0], p[1], p[2])).join('')
}

let runAfter = 0
plays['list-after'] = async () => {
  const run = ++runAfter
  const host = $('#list-after')
  host.innerHTML = ''
  await wait(150); if (run !== runAfter) return
  host.innerHTML = skrow.repeat(3)
  $$('.prow', host).forEach(r => anim(r, [{ opacity: 0 }, { opacity: 1 }], DUR.fast))
  await wait(1400); if (run !== runAfter) return
  // Each row is replaced in place: same box, so the list never changes shape.
  $$('.prow', host).forEach((row, i) => {
    const holder = document.createElement('div')
    holder.innerHTML = prow(PRINTERS[i][0], PRINTERS[i][1], PRINTERS[i][2])
    const real = holder.firstElementChild as HTMLElement
    row.replaceWith(real)
    anim(real, [{ opacity: 0 }, { opacity: 1 }], DUR.base, EASE.standard, { delay: i * DUR.stagger })
  })
}

let runOverview = 0
plays.overview = async () => {
  const run = ++runOverview
  const host = $('#ogrid')
  const tiles = [['Nozzle', '215°'], ['Plate', '60°'], ['Progress', '42%'], ['Layer', '118'], ['Time left', '41 min'], ['Speed', '100%']]
  if (modeOf(host) === 'before') {
    host.innerHTML = ''
    for (const [label, value] of tiles.sort(() => Math.random() - 0.5)) {
      await wait(120 + Math.random() * 260); if (run !== runOverview) return
      host.insertAdjacentHTML('beforeend', `<div class="otile"><span>${label}</span><b>${value}</b></div>`)
    }
    return
  }
  host.innerHTML = tiles.map(([label]) => `<div class="otile"><span>${label}</span><div class="sk line"></div></div>`).join('')
  await wait(1200); if (run !== runOverview) return
  $$('.otile', host).forEach((tile, i) => {
    const b = document.createElement('b')
    b.textContent = tiles[i][1]
    $('.sk', tile).replaceWith(b)
    anim(b, [{ opacity: 0 }, { opacity: 1 }], DUR.base, EASE.standard, { delay: Math.min(i, 5) * DUR.stagger })
  })
}

/* --------------------------------------------------------------- connection */

{
  const route = $('#route')
  const states: [string, string, string][] = [['lan', 'wifi', 'On this network'], ['cloud', 'cloud', 'Cloud'], ['bluetooth', 'bluetooth', 'Bluetooth'], ['reconnecting', 'sync', 'Reconnecting…'], ['dropped', 'alert', 'Dropped']]
  $$('#routes button').forEach((b, i) => b.addEventListener('click', () => {
    const [s, ic, label] = states[i]
    if (route.dataset.s === s) return
    route.dataset.s = s
    const old = route.firstElementChild as HTMLElement
    const w0 = route.offsetWidth
    const next = document.createElement('span')
    next.className = 'in'
    next.innerHTML = icon(ic) + label
    if (s === 'dropped' || modeOf(route) === 'before' || reduced) { old.replaceWith(next); return }
    old.style.position = 'absolute'
    route.append(next)
    const w1 = route.offsetWidth
    // The chip is right-aligned: scale from the right so the far edge stays put.
    anim(route, [{ clipPath: `inset(0 0 0 ${w1 - w0}px round 999px)` }, { clipPath: 'inset(0 0 0 0 round 999px)' }], DUR.base, EASE.standard, { fill: 'none' })
    anim(old, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-60%)' }], DUR.fast * 0.75, EASE.exit).finished.then(() => old.remove())
    anim(next, [{ opacity: 0, transform: 'translateY(60%)' }, { opacity: 1, transform: 'none' }], DUR.base, EASE.enter)
  }))

  const list = $('#swlist'); const hl = $('.hl', list)
  $$('button', list).forEach(b => b.addEventListener('click', () => {
    hl.style.transform = `translateY(${b.offsetTop}px)`
    swapText($('#swname'), b.firstChild!.textContent!)
    $('#swstate').textContent = $('small', b).textContent
  }))
}

/* ---------------------------------------------------------------- lifecycle */

{
  const ring = $('#ring'); const fg = $('.fg', ring) as unknown as SVGCircleElement; const pct = $('#pct')
  const C = 364.4
  let progress = 0; let timer = 0
  const glyphs = { done: $('#g-done'), error: $('#g-error'), paused: $('#g-pause') }
  const set = (p: number) => { progress = p; fg.style.strokeDashoffset = String(C * (1 - p)); pct.textContent = `${Math.round(p * 100)}%` }
  const face = (which?: keyof typeof glyphs) => {
    const instant = which === 'error'
    for (const [name, g] of Object.entries(glyphs)) {
      const on = name === which
      if (+getComputedStyle(g).opacity > 0.5 === on) continue
      anim(g, on ? [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }] : [{}, { opacity: 0, transform: 'scale(0.8)' }],
        instant ? 0 : on ? (name === 'done' ? SPRINGS.bouncy.ms : SPRINGS.snappy.ms) : DUR.fast * 0.75, on ? (name === 'done' ? EASE.bouncy : EASE.snappy) : EASE.exit)
    }
    anim(pct, [{}, { opacity: which ? 0 : 1 }], instant ? 0 : DUR.fast)
  }
  const state = (s: string, title: string, sub: string) => { ring.dataset.s = s; swapText($('#lifetitle'), title); $('#lifesub').textContent = sub }
  const tick = () => { clearInterval(timer); timer = window.setInterval(() => { if (progress < 0.9) set(progress + 0.03) }, 520 * speed) }
  const act: Record<string, () => void> = {
    Start: () => { set(0); face(); state('printing', 'Printing', 'benchy.gcode · 1 h 12 min left'); tick() },
    Pause: () => { clearInterval(timer); face('paused'); state('paused', 'Paused', 'Head parked, plate held at 60 °C') },
    Resume: () => { face(); state('printing', 'Printing', 'benchy.gcode · 41 min left'); tick() },
    Finish: () => {
      clearInterval(timer); set(1); state('done', 'Finished', 'Took 1 h 9 min · plate cooling')
      face('done')
      anim(ring, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], SPRINGS.bouncy.ms, EASE.standard, { fill: 'none', delay: DUR.fast })
      anim($('path', glyphs.done), [{ strokeDasharray: '1', strokeDashoffset: '1' }, { strokeDasharray: '1', strokeDashoffset: '0' }], DUR.slow, EASE.standard, { delay: DUR.instant })
    },
    Error: () => { clearInterval(timer); face('error'); state('error', 'Stopped: heater fault', 'Nozzle heater did not reach 215 °C') },
    Reset: () => { clearInterval(timer); set(0); face(); state('idle', 'Ready', 'benchy.gcode · 1 h 12 min') }
  }
  $$('#lifebtns button').forEach(b => b.addEventListener('click', () => act[b.textContent!]()))
}

/* ------------------------------------------------------------------ numbers */

{
  const num = $('#tnum'); const bar = $('#tbar'); const truth = $('#ttruth')
  let value = 24.3; let target = 24; let shown = ''
  const draw = (text: string) => {
    const up = text > shown
    if (!num.children.length || text.length !== shown.length || modeOf(num) === 'before' || reduced) {
      num.innerHTML = [...text].map(c => `<span class="slot"><span>${c}</span></span>`).join('')
    } else {
      [...text].forEach((c, i) => {
        if (c === shown[i]) return
        const slot = num.children[i] as HTMLElement
        const old = slot.lastElementChild as HTMLElement
        const next = document.createElement('span')
        next.textContent = c
        old.classList.add('out')
        slot.append(next)
        const d = up ? 1 : -1
        anim(old, [{ transform: 'none', opacity: 1 }, { transform: `translateY(${-60 * d}%)`, opacity: 0 }], DUR.fast, EASE.standard).finished.then(() => old.remove())
        anim(next, [{ transform: `translateY(${60 * d}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], DUR.fast, EASE.standard)
      })
    }
    shown = text
    num.setAttribute('aria-label', text)
  }
  const report = () => {
    value += (target - value) * 0.09 + (Math.random() - 0.5) * 0.08
    const text = value.toFixed(1)
    draw(text)
    bar.style.transform = `scaleX(${Math.max(0.02, Math.min(1, value / 260))})`
    truth.textContent = `printer said ${text} °C · screen shows ${text} °C · 4 reports a second`
  }
  report()
  setInterval(report, 250)
  $('#heat').addEventListener('click', () => { target = 215 })
  $('#cool').addEventListener('click', () => { target = 24 })

  // The graph: one point per report; between reports the line scrolls.
  const canvas = $<HTMLCanvasElement>('#spark')
  const ctx = canvas.getContext('2d')!
  const points: number[] = Array.from({ length: 60 }, () => value)
  let last = performance.now()
  setInterval(() => { points.push(value); points.shift(); last = performance.now() }, 250)
  const frame = (now: number) => {
    const w = canvas.clientWidth; const h = canvas.clientHeight; const dpr = devicePixelRatio
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const step = w / (points.length - 2)
    const slide = modeOf(canvas) === 'before' || reduced ? 1 : Math.min(1, (now - last) / 250)
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = (i - slide) * step; const y = h - 8 - (p / 260) * (h - 16)
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
    })
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--m3d-warning') || '#ff9230'
    ctx.lineWidth = 2; ctx.lineJoin = 'round'
    ctx.stroke()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/* ----------------------------------------------------------------------- 3D */

{
  const cam = $('#cam')
  const views = ['rotateX(62deg) rotateZ(-38deg)', 'rotateX(0deg) rotateZ(0deg)', 'rotateX(78deg) rotateZ(0deg)', 'rotateX(74deg) rotateZ(-90deg)']
  $$('#cams button').forEach((b, i) => { if (i < views.length) b.addEventListener('click', () => { cam.style.transform = views[i] }) })

  const poster = $('#poster')
  plays.firstframe = async () => {
    if (modeOf(poster) === 'before') {
      poster.textContent = 'Loading 3D…'
      poster.style.background = ''
      poster.getAnimations().forEach(a => a.cancel())
      poster.style.opacity = '1'
      await wait(1500)
      poster.style.opacity = '0'
      return
    }
    // After: the still is a picture of this very view, so the swap is invisible.
    poster.textContent = ''
    poster.style.background = 'transparent'
    cam.style.filter = 'saturate(0.85)'
    await wait(1500)
    cam.style.transition = `filter ${DUR.base * speed}ms linear, transform var(--t-camera) var(--m3d-ease-standard)`
    cam.style.filter = ''
  }

  // The head: the printer reports 4 times a second; the drawing follows.
  const head = $('#head'); const ghost = $('#ghost'); const lag = $('#lag')
  let glide = true
  segment($('#follow'), i => { glide = !!i })
  const real = { x: 40, y: 40 }; const drawn = { x: 40, y: 40 }
  let t0 = performance.now(); let then = t0
  setInterval(() => {
    const t = (performance.now() - t0) / 1000
    real.x = 95 + Math.cos(t * 1.3) * 62
    real.y = 95 + Math.sin(t * 2.1) * 58
    ghost.style.transform = `translate3d(${real.x}px, ${real.y}px, 34px)`
    if (!glide || reduced) { drawn.x = real.x; drawn.y = real.y }
  }, 250)
  const frame = (now: number) => {
    const dt = now - then; then = now
    // Exponential approach, time constant 70 ms: 97 % there inside one report.
    const k = 1 - Math.exp(-dt / 70)
    drawn.x += (real.x - drawn.x) * k
    drawn.y += (real.y - drawn.y) * k
    head.style.transform = `translate3d(${drawn.x}px, ${drawn.y}px, 34px)`
    lag.textContent = `drawn is ${Math.hypot(real.x - drawn.x, real.y - drawn.y).toFixed(1)} mm from the last report`
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

plays['list-before']()
plays['list-after']()
plays.overview()
