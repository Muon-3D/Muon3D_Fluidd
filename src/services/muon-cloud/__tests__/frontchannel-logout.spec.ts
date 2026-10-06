import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { beforeEach, expect, it } from 'vitest'

const script = readFileSync(resolve('public/auth/logout.js'), 'utf8')
const origin = 'https://control.muon3d.com'
const keys = ['muon.cloud.token', 'muon.cloud.refresh', 'muon.cloud.active', 'muon.cloud.key']

beforeEach(() => {
  localStorage.clear()
  for (const key of keys) localStorage.setItem(key, 'saved')
  localStorage.setItem('printer-setting', 'kept')
})

function load (issuer: string, referrer: string, framed = true) {
  const frame: any = { location: { origin, search: `?iss=${encodeURIComponent(issuer)}` }, localStorage }
  frame.parent = framed ? {} : frame
  runInNewContext(script, { window: frame, document: { referrer }, URL, URLSearchParams })
}

it('clears the Fluidd session when the console frames its logout page', () => {
  load(origin, `${origin}/logout`)
  for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
  expect(localStorage.getItem('printer-setting')).toBe('kept')
})

it.each([
  ['https://evil.test', `${origin}/logout`, true],
  [origin, 'https://evil.test/logout', true],
  [origin, '', true],
  [origin, `${origin}/logout`, false]
])('ignores an unrelated logout request', (issuer, referrer, framed) => {
  load(issuer as string, referrer as string, framed as boolean)
  expect(localStorage.getItem('muon.cloud.token')).toBe('saved')
})
