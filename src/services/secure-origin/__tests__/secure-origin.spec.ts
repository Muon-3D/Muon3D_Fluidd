/**
 * @vitest-environment-options { "url": "http://192.168.1.50/" }
 *
 * KAN-2198: a plain-HTTP printer page offers its secure address only after
 * proving, from this browser, that the address answers as a Muon printer.
 * Every failure ends the same way: null, and the page stays where it is.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PROBE_MARKER,
  asksToStay,
  candidateOrigins,
  couldHaveSecureAddress,
  declinedSwitch,
  findSecureOrigin,
  printerName,
  printerNameZone,
  probe,
  secureUrl,
  setSwitchesAutomatically,
  switchesAutomatically
} from '..'

const LABEL = 'abcdefghijklmnopqrst'
const NAME = `${LABEL}.lan.muon3d.com`
const PAGE = { protocol: 'http:', hostname: '192.168.1.50' }

type Answer = { status?: number, body?: string, fail?: boolean, stall?: boolean }

const inits: RequestInit[] = []

/** A network where each URL answers as told, and everything else fails. Records what was asked. */
function network (answers: Record<string, Answer>): string[] {
  const asked: string[] = []
  inits.length = 0
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    asked.push(String(url))
    inits.push(init ?? {})
    const answer = answers[String(url)]
    if (!answer || answer.fail) throw new TypeError('Failed to fetch')
    const status = answer.status ?? 200
    // A stalled body: headers arrive, the text never does.
    const text = answer.stall ? () => new Promise<string>(() => undefined) : async () => answer.body ?? ''
    return { ok: status >= 200 && status < 300, status, text, json: async () => JSON.parse(answer.body ?? '') } as Response
  }))
  return asked
}

const description = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ version: 1, name: NAME, origin: `https://${NAME}`, probe: '/muon/secure-probe.txt', not_after: 2_000_000_000, ...over })

const NOW = 1_800_000_000_000

beforeEach(() => localStorage.clear())
afterEach(() => { vi.unstubAllGlobals() })

describe('which pages look for a secure address', () => {
  it('only a plain-HTTP page that is not loopback and not the hotspot', () => {
    expect(couldHaveSecureAddress({ protocol: 'http:', hostname: 'muon3d.local' })).toBe(true)
    expect(couldHaveSecureAddress({ protocol: 'http:', hostname: '192.168.1.50' })).toBe(true)
    expect(couldHaveSecureAddress({ protocol: 'https:', hostname: NAME })).toBe(false)
    expect(couldHaveSecureAddress({ protocol: 'https:', hostname: 'control.muon3d.com' })).toBe(false)
    expect(couldHaveSecureAddress({ protocol: 'http:', hostname: 'localhost' })).toBe(false)
    expect(couldHaveSecureAddress({ protocol: 'http:', hostname: '10.42.0.1' })).toBe(false)
  })

  it('asks nothing at all on a page that could not have one', async () => {
    const asked = network({})
    expect(await findSecureOrigin({ protocol: 'https:', hostname: 'control.muon3d.com' }, NOW)).toBeNull()
    expect(await findSecureOrigin({ protocol: 'http:', hostname: '10.42.0.1' }, NOW)).toBeNull()
    expect(asked).toEqual([])
  })
})

describe('the zone setting', () => {
  it('takes a DNS zone and falls back to the default for anything else', () => {
    expect(printerNameZone('Lan.Example.NET ')).toBe('lan.example.net')
    for (const bad of [undefined, '', '   ', 'com', 'a..b.com', 'evil.com/x', 'x.c0m', '*.example.com']) {
      expect(printerNameZone(bad)).toBe('lan.muon3d.com')
    }
  })
})

describe('which names are printer names', () => {
  it('a 20-character label directly under a known zone, and nothing else', () => {
    expect(printerName(NAME)).toBe(NAME)
    expect(printerName(NAME.toUpperCase())).toBe(NAME)
    for (const bad of [
      // Not registered to Muon3D: never a printer name until it is.
      `${LABEL}.muonlan.net`,
      'control.muon3d.com',
      `${LABEL}.lan.muon3d.com.attacker.example`,
      `attacker.example/${NAME}`,
      `x.${NAME}`,
      'short.lan.muon3d.com',
      `${LABEL}.lan.example.com`,
      `${LABEL}xlan.muon3d.com`,
      '',
      null,
      42
    ]) {
      expect(printerName(bad), String(bad)).toBeNull()
    }
  })

  it('tries the stable name first, then this page\'s own address written into the name', () => {
    expect(candidateOrigins(NAME, '192.168.1.50')).toEqual([`https://${NAME}`, `https://192-168-1-50.${NAME}`])
    expect(candidateOrigins(NAME, 'muon3d.local')).toEqual([`https://${NAME}`])
    expect(candidateOrigins(NAME, '999.1.1.1')).toEqual([`https://${NAME}`])
  })
})

describe('the proof', () => {
  it('accepts only the fixed marker from the probe location', async () => {
    network({
      'https://good.example/muon/secure-probe.txt': { body: `${PROBE_MARKER}\n` },
      'https://other.example/muon/secure-probe.txt': { body: '<html>a router login page</html>' },
      'https://error.example/muon/secure-probe.txt': { status: 502, body: PROBE_MARKER }
    })
    expect(await probe('https://good.example')).toBe(true)
    expect(await probe('https://other.example')).toBe(false)
    expect(await probe('https://error.example')).toBe(false)
    expect(await probe('https://unreachable.example')).toBe(false)
  })

  it('finds the stable name when it answers', async () => {
    const asked = network({
      '/muon/secure-origin.json': { body: description() },
      [`https://${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
    })
    expect(await findSecureOrigin(PAGE, NOW)).toBe(`https://${NAME}`)
    expect(asked).toEqual(['/muon/secure-origin.json', `https://${NAME}/muon/secure-probe.txt`])
  })

  it('falls back to the address-in-name form when the stable name does not resolve here', async () => {
    network({
      '/muon/secure-origin.json': { body: description() },
      [`https://192-168-1-50.${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
    })
    expect(await findSecureOrigin(PAGE, NOW)).toBe(`https://192-168-1-50.${NAME}`)
  })

  it('stays put when the router refuses the name: no probe answers', async () => {
    network({ '/muon/secure-origin.json': { body: description() } })
    expect(await findSecureOrigin(PAGE, NOW)).toBeNull()
  })

  it('stays put when the printer has no secure address', async () => {
    const asked = network({ '/muon/secure-origin.json': { status: 404 } })
    expect(await findSecureOrigin(PAGE, NOW)).toBeNull()
    expect(asked).toEqual(['/muon/secure-origin.json'])
  })

  it('stays put when the certificate in the description has already lapsed', async () => {
    const asked = network({
      '/muon/secure-origin.json': { body: description({ not_after: 1_700_000_000 }) },
      [`https://${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
    })
    expect(await findSecureOrigin(PAGE, NOW)).toBeNull()
    expect(asked).toEqual(['/muon/secure-origin.json'])
  })

  it('never follows a description that names anything but a printer name', async () => {
    for (const name of ['attacker.example', `${LABEL}.lan.muon3d.com.attacker.example`, 'control.muon3d.com']) {
      const asked = network({
        '/muon/secure-origin.json': { body: description({ name, origin: `https://${name}` }) },
        [`https://${name}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
      })
      expect(await findSecureOrigin(PAGE, NOW), name).toBeNull()
      // Not even a probe: a spoofed page must not make this browser call a host of its choosing.
      expect(asked).toEqual(['/muon/secure-origin.json'])
    }
  })

  it('ignores the description\'s own `origin` and builds the address from the checked name', async () => {
    const asked = network({
      '/muon/secure-origin.json': { body: description({ origin: 'https://attacker.example' }) },
      [`https://${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER },
      'https://attacker.example/muon/secure-probe.txt': { body: PROBE_MARKER }
    })
    expect(await findSecureOrigin(PAGE, NOW)).toBe(`https://${NAME}`)
    expect(asked.some(url => url.includes('attacker.example'))).toBe(false)
  })

  it('stays put on a description it cannot read', async () => {
    network({ '/muon/secure-origin.json': { body: '<html>not json</html>' } })
    expect(await findSecureOrigin(PAGE, NOW)).toBeNull()
    const asked = network({
      '/muon/secure-origin.json': { body: description({ version: 2 }) },
      [`https://${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
    })
    expect(await findSecureOrigin(PAGE, NOW)).toBeNull()
    expect(asked).toEqual(['/muon/secure-origin.json'])
  })

  it('sends no credentials and follows no redirect', async () => {
    network({
      '/muon/secure-origin.json': { body: description() },
      [`https://${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
    })
    expect(await findSecureOrigin(PAGE, NOW)).toBe(`https://${NAME}`)
    expect(inits).toHaveLength(2)
    for (const init of inits) {
      expect(init).toMatchObject({ credentials: 'omit', redirect: 'error', cache: 'no-store' })
    }
  })

  it('gives up on a probe whose body stalls, and tries the next address', async () => {
    vi.useFakeTimers()
    try {
      network({
        '/muon/secure-origin.json': { body: description() },
        [`https://${NAME}/muon/secure-probe.txt`]: { stall: true },
        [`https://192-168-1-50.${NAME}/muon/secure-probe.txt`]: { body: PROBE_MARKER }
      })
      const found = findSecureOrigin(PAGE, NOW)
      await vi.advanceTimersByTimeAsync(1600)
      expect(await found).toBe(`https://192-168-1-50.${NAME}`)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('the switch', () => {
  it('keeps the route, the query and the hash', () => {
    expect(secureUrl(`https://${NAME}`, { pathname: '/', search: '?x=1', hash: '#/settings' })).toBe(`https://${NAME}/?x=1#/settings`)
  })

  it('an address with secure=off asks to stay, in the query or in the hash route', () => {
    expect(asksToStay({ search: '?secure=off', hash: '' })).toBe(true)
    expect(asksToStay({ search: '', hash: '#/settings?secure=off' })).toBe(true)
    expect(asksToStay({ search: '?secure=on', hash: '#/settings' })).toBe(false)
    expect(asksToStay({ search: '', hash: '#/secure=off' })).toBe(false)
  })

  it('asks the first time, remembers a yes, and remembers a no', () => {
    expect(switchesAutomatically()).toBe(false)
    expect(declinedSwitch()).toBe(false)
    setSwitchesAutomatically(true)
    expect(switchesAutomatically()).toBe(true)
    expect(declinedSwitch()).toBe(false)
    setSwitchesAutomatically(false)
    expect(switchesAutomatically()).toBe(false)
    expect(declinedSwitch()).toBe(true)
  })
})
