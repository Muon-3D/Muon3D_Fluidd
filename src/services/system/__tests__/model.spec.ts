import { describe, expect, it, test } from 'vitest'
import { diskUse, frequency, interfaceIp, latest, loadBars, loadHealth, networkLines, osName, servicesLine, serviceState, signalWord } from '../model'

describe('a service', () => {
  test.each([
    ['active', 'running', 'Running', 'ok'],
    ['active', 'exited', 'Exited', 'ok'],
    ['activating', 'start', 'Starting', 'run'],
    ['failed', 'failed', 'Failed', 'err'],
    ['inactive', 'dead', 'Stopped', 'off']
  ])('%s (%s) is %s', (active, sub, text, tone) => {
    expect(serviceState(active, sub)).toEqual({ text, tone })
  })
})

describe('the host', () => {
  it('names the OS, leaving out a version in the name\'s place and using the id for #', () => {
    expect(osName({ name: 'Debian GNU/Linux', release_info: { version_id: '12' } })).toBe('Debian GNU/Linux 12')
    expect(osName({ name: '#MuonOS', id: 'muonos' })).toBe('muonos')
    expect(osName({ name: '0.3.1' })).toBeNull()
    expect(osName(undefined)).toBeNull()
  })

  it('lists each interface with its IPv4 addresses, or IPv6 when it has no IPv4', () => {
    expect(networkLines({
      wlan0: { ip_addresses: [{ family: 'ipv4', address: '192.168.1.153' }, { family: 'ipv6', address: 'fe80::1' }] },
      eth0: { ip_addresses: [{ family: 'ipv6', address: 'fe80::2' }] },
      ap0: {}
    })).toEqual(['wlan0 · 192.168.1.153', 'eth0 · fe80::2', 'ap0'])
  })

  test.each([[520_000_000, '520 MHz'], [1_800_000_000, '1.8 GHz'], [12_000, '12 kHz']])('%d Hz is %s', (hz, text) => {
    expect(frequency(hz)).toBe(text)
  })
})

describe('the disk', () => {
  const size = (b: number) => `${Math.round(b / 1e9)} GB`

  it('says how full it is', () => {
    expect(diskUse({ total: 29e9, used: 6e9, free: 23e9 }, size)).toEqual({ share: 6 / 29, text: '6 GB of 29 GB used · 23 GB free' })
  })

  it('works out what Moonraker leaves out', () => {
    expect(diskUse({ total: 10e9, free: 4e9 }, size)?.text).toBe('6 GB of 10 GB used · 4 GB free')
    expect(diskUse({}, size)).toBeNull()
  })
})

describe('usage', () => {
  it('reads the latest point, which the chart store keeps as a string', () => {
    expect(latest([{ load: '0.40' }, { load: '1.25' }], 'load')).toBe(1.25)
    expect(latest([], 'load')).toBeNull()
    expect(latest([{ load: 'x' }], 'load')).toBeNull()
  })
})

describe('the load bars', () => {
  const size = (b: number) => `${Math.round(b / 1024 ** 3)} GB`
  const input = { load: 0.72, cores: 4, memoryPercent: 27, memoryTotalKb: 4 * 1024 * 1024, disk: { share: 0.34, text: '9 of 28 GB used' }, temperature: 47 }

  it('puts the processor against its cores, memory against its total, disk and temperature as they are', () => {
    const bars = loadBars(input, size)
    expect(bars.map(b => [b.key, b.value])).toEqual([['cpu', '18%'], ['memory', '27%'], ['disk', '34%'], ['temperature', '47 °C']])
    expect(bars[1].sub).toBe('of 4 GB')
    expect(bars[3].share).toBeCloseTo(47 / 85)
  })

  it('shows a dash and an empty bar for what the printer has not reported', () => {
    const bars = loadBars({ ...input, load: null, memoryPercent: null, disk: null, temperature: null }, size)
    expect(bars.map(b => [b.value, b.share])).toEqual([['—', 0], ['—', 0], ['—', 0], ['—', 0]])
  })

  it('never fills past the end', () => {
    expect(loadBars({ ...input, load: 9 }, size)[0].share).toBe(1)
  })

  it('is healthy until something is nearly full', () => {
    expect(loadHealth(loadBars(input, size))).toEqual({ text: 'Healthy', tone: 'ok' })
    expect(loadHealth(loadBars({ ...input, load: 3.8 }, size))).toEqual({ text: 'Busy', tone: 'warn' })
  })
})

describe('the services line', () => {
  const on = { inactive: false, state: { tone: 'ok' as const } }
  it('says what is not right, else that all run', () => {
    expect(servicesLine([])).toBe('')
    expect(servicesLine([on, on])).toBe('all services running')
    expect(servicesLine([on, { inactive: true, state: { tone: 'off' as const } }])).toBe('1 service stopped')
    expect(servicesLine([on, { inactive: false, state: { tone: 'err' as const } }])).toBe('1 service has failed')
  })
})

describe('the network interfaces', () => {
  const network = {
    lo: { ip_addresses: [{ family: 'ipv4', address: '127.0.0.1' }] },
    eth0: { ip_addresses: [{ family: 'ipv6', address: 'fe80::1' }] },
    wlan0: { ip_addresses: [{ family: 'ipv6', address: 'fe80::2' }, { family: 'ipv4', address: '192.168.1.42' }] }
  }

  it('finds an interface by its name and gives its IPv4 address', () => {
    expect(interfaceIp(network, ['wlan', 'wl'])).toEqual({ name: 'wlan0', ip: '192.168.1.42' })
  })

  it('finds nothing for a cable that has no address', () => {
    expect(interfaceIp(network, ['eth', 'en'])).toBeNull()
    expect(interfaceIp(undefined, ['eth'])).toBeNull()
  })

  it('puts a signal in a word', () => {
    expect([90, 60, 30, 5].map(signalWord)).toEqual(['Excellent', 'Good', 'Fair', 'Weak'])
  })
})
