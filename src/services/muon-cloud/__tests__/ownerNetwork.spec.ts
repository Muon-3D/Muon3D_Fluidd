import Vue from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONFIRM_SECONDS,
  ConfirmUnavailable,
  OwnerNetworkError,
  confirmNetworkChange,
  confirmRouteSupported,
  describeHotspotOutcome,
  explainNetworkError,
  getNetworkSettings,
  hotspotChange,
  hotspotChangeState,
  networkErrorOf,
  passwordProblemOf,
  putNetworkSettings,
  ssidProblemOf,
  warningFor,
  wifiConnect,
  wifiCurrent,
  wifiForget,
  wifiSaved,
  wifiScan
} from '../ownerNetwork'

const request = vi.fn()

/** What axios rejects with for a non-2xx answer. */
const failure = (status: number, data?: unknown) => Object.assign(new Error(`status ${status}`), { response: { status, data } })

const SETTINGS = { network_from_ble: 'allow', network_from_direct: 'allow', network_from_relay: 'reauth', current_path: 'local' }

beforeEach(() => {
  request.mockReset()
  ;(Vue as unknown as { $httpClient: unknown }).$httpClient = { request }
})

describe('the owner network client: routes', () => {
  it('reads the three rules and the path', async () => {
    request.mockResolvedValue({ status: 200, data: SETTINGS })
    expect(await getNetworkSettings()).toEqual({ fromBle: 'allow', fromLocal: 'allow', fromRelay: 'reauth', currentPath: 'local' })
    expect(request.mock.calls[0][0]).toMatchObject({ method: 'GET', url: '/muon-link/network/settings' })
  })

  it('reads the rules whether they sit at the top or under settings, and unwraps result', async () => {
    request.mockResolvedValue({ status: 200, data: { result: { settings: SETTINGS, current_path: 'ble' } } })
    expect((await getNetworkSettings()).currentPath).toBe('ble')
  })

  it('falls back to the device defaults for a rule it was not given', async () => {
    request.mockResolvedValue({ status: 200, data: { current_path: 'relay' } })
    expect(await getNetworkSettings()).toMatchObject({ fromBle: 'allow', fromLocal: 'allow', fromRelay: 'reauth' })
  })

  it('treats an answer with no known path as a failure', async () => {
    request.mockResolvedValue({ status: 200, data: { ...SETTINGS, current_path: 'carrier-pigeon' } })
    await expect(getNetworkSettings()).rejects.toMatchObject({ kind: 'failed' })
  })

  it('PUTs only the rules it was given, under the contract names', async () => {
    request.mockResolvedValue({ status: 200, data: { ...SETTINGS, network_from_relay: 'deny' } })
    const next = await putNetworkSettings({ fromRelay: 'deny' })
    expect(request.mock.calls[0][0]).toMatchObject({ method: 'PUT', url: '/muon-link/network/settings', data: { network_from_relay: 'deny' } })
    expect(next.fromRelay).toBe('deny')
  })

  it('reads the rules back when a PUT answers with none', async () => {
    request.mockResolvedValueOnce({ status: 200, data: { ok: true } })
    request.mockResolvedValueOnce({ status: 200, data: SETTINGS })
    await putNetworkSettings({ fromBle: 'deny' })
    expect(request.mock.calls[1][0]).toMatchObject({ method: 'GET', url: '/muon-link/network/settings' })
  })

  it('scans: drops hidden networks, merges repeats by name, keeps the strongest', async () => {
    request.mockResolvedValue({
      status: 200,
      data: [
        { ssid: 'Home', signal: 40, security: 'WPA2', in_use: false },
        { ssid: 'Home', signal: 80, security: 'WPA2', in_use: true },
        { ssid: '', signal: 90, security: '' },
        { ssid: 'Cafe', signal: 20, security: 'Open' }
      ]
    })
    expect(await wifiScan()).toEqual([
      { ssid: 'Home', signal: 80, secured: true, inUse: true },
      { ssid: 'Cafe', signal: 20, secured: false, inUse: false }
    ])
    expect(request.mock.calls[0][0]).toMatchObject({ method: 'GET', url: '/muon-link/network/wifi/scan' })
  })

  it('lists saved networks by name, from profiles or plain names', async () => {
    request.mockResolvedValue({ status: 200, data: [{ name: 'Home', uuid: 'u1', device: 'wlan0' }, 'Cafe', { nope: 1 }] })
    expect(await wifiSaved()).toEqual(['Home', 'Cafe'])
  })

  it('reads the current network, or none', async () => {
    request.mockResolvedValueOnce({ status: 200, data: { ssid: 'Home', signal: 70 } })
    expect(await wifiCurrent()).toEqual({ ssid: 'Home', signal: 70 })
    request.mockResolvedValueOnce({ status: 200, data: null })
    expect(await wifiCurrent()).toBeNull()
  })

  it('connects with the password in the body only, and says when the printer went back', async () => {
    request.mockResolvedValue({ status: 200, data: { status: 'restored', ssid: 'Old' } })
    expect(await wifiConnect('New', 'hunter2hunter2')).toEqual({ restored: true, ssid: 'Old' })
    const config = request.mock.calls[0][0]
    expect(config).toMatchObject({ method: 'POST', url: '/muon-link/network/wifi/connect', data: { ssid: 'New', password: 'hunter2hunter2' } })
    expect(config.url).not.toContain('hunter2')
    expect(config.params).toBeUndefined()
  })

  it('connects to an open network with no password key', async () => {
    request.mockResolvedValue({ status: 200, data: { status: 'connecting', ssid: 'Cafe' } })
    expect(await wifiConnect('Cafe')).toEqual({ restored: false, ssid: 'Cafe' })
    expect(request.mock.calls[0][0].data).toEqual({ ssid: 'Cafe' })
  })

  it('forgets with the name percent-encoded in the query', async () => {
    request.mockResolvedValue({ status: 200, data: {} })
    await wifiForget('Café & Bar')
    expect(request.mock.calls[0][0]).toMatchObject({ method: 'DELETE', url: '/muon-link/network/wifi/forget?ssid=Caf%C3%A9%20%26%20Bar' })
  })

  it('asks for a hotspot change and gets the challenge (202)', async () => {
    request.mockResolvedValue({ status: 202, data: { challenge_id: 'abc_123-XYZ', expires_at: 1800000000 } })
    expect(await hotspotChange({ ssid: 'Muon-Lab', password: 'correct horse' })).toEqual({ id: 'abc_123-XYZ', expiresAt: 1800000000 })
    expect(request.mock.calls[0][0]).toMatchObject({ method: 'POST', url: '/muon-link/network/hotspot/change', data: { ssid: 'Muon-Lab', password: 'correct horse' } })
  })

  it('asks for a generated key without sending a password', async () => {
    request.mockResolvedValue({ status: 202, data: { challenge_id: 'abc', expires_at: 1 } })
    await hotspotChange({ generate: true })
    expect(request.mock.calls[0][0].data).toEqual({ generate: true })
  })

  it('refuses a challenge id that is not 1 to 64 of A-Za-z0-9_-, and never sends it', async () => {
    request.mockResolvedValue({ status: 202, data: { challenge_id: '../../etc', expires_at: 1 } })
    await expect(hotspotChange({ generate: true })).rejects.toMatchObject({ kind: 'failed' })
    request.mockClear()
    await expect(hotspotChangeState('a/b')).rejects.toBeInstanceOf(OwnerNetworkError)
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['waiting', 'applied', 'refused', 'expired', 'failed'] as const)('polls a change and reads %s', async state => {
    request.mockResolvedValue({ status: 200, data: { state } })
    expect(await hotspotChangeState('abc_123')).toBe(state)
    expect(request.mock.calls[0][0]).toMatchObject({ method: 'GET', url: '/muon-link/network/hotspot/change/abc_123' })
  })

  it('treats an unknown change state as a failure', async () => {
    request.mockResolvedValue({ status: 200, data: { state: 'dancing' } })
    await expect(hotspotChangeState('abc')).rejects.toMatchObject({ kind: 'failed' })
  })

  it('says every outcome in plain words', () => {
    expect(describeHotspotOutcome('waiting')).toBe('Press the knob on the printer to approve.')
    for (const s of ['applied', 'refused', 'expired', 'failed'] as const) expect(describeHotspotOutcome(s).length).toBeGreaterThan(10)
  })
})

describe('the owner network client: every status and error', () => {
  const kindOf = async (status: number, data?: unknown) => {
    request.mockRejectedValue(failure(status, data))
    return networkErrorOf(await getNetworkSettings().catch(e => e))
  }

  it('404 is an older muon-link', async () => {
    expect((await kindOf(404, 'not found')).kind).toBe('not_available')
    expect((await kindOf(404)).kind).toBe('not_available')
  })

  it('403 forbidden is a session that is not the owner', async () => {
    expect((await kindOf(403, { error: 'forbidden' })).kind).toBe('not_owner')
  })

  it('403 reauth_required asks to sign in again', async () => {
    const e = await kindOf(403, { error: 'reauth_required' })
    expect(e.kind).toBe('reauth_required')
    expect(e.message).toBe('Sign in again required to change Wi-Fi over the internet.')
  })

  it('403 path_disabled is blocked in the owner settings', async () => {
    const e = await kindOf(403, { error: 'path_disabled' })
    expect(e.kind).toBe('path_disabled')
    expect(e.message).toBe('Blocked in your network settings.')
  })

  it('reads the code from a body that arrives as a JSON string', async () => {
    expect((await kindOf(403, '{"error":"path_disabled"}')).kind).toBe('path_disabled')
  })

  it('any other 403 is a refusal, not a guess', async () => {
    expect((await kindOf(403, { detail: 'nope' })).kind).toBe('refused')
  })

  it('502 is aux_unavailable and 504 is aux_timeout', async () => {
    expect((await kindOf(502, { error: 'aux_unavailable' })).kind).toBe('aux_unavailable')
    expect((await kindOf(504, { error: 'aux_timeout' })).kind).toBe('aux_timeout')
  })

  it('a 4xx from the Aux API keeps its own words', async () => {
    const e = await kindOf(422, { detail: { code: 'ssid_invalid', message: 'the hotspot name must start with Muon-' } })
    expect(e.kind).toBe('refused')
    expect(e.message).toBe('the hotspot name must start with Muon-')
  })

  it('a join failure code is put in plain words, never echoing the raw body', async () => {
    const e = await kindOf(400, { detail: { code: 'wrong_password', message: "Could not connect: psk 'hunter2' bad" } })
    expect(e.message).toBe("That password didn't work.")
    expect(JSON.stringify(e)).not.toContain('hunter2')
  })

  it('a 500, or a dropped connection, is failed', async () => {
    expect((await kindOf(500, 'boom')).kind).toBe('failed')
    request.mockRejectedValue(new Error('network down'))
    expect((await getNetworkSettings().catch(e => e)).kind).toBe('failed')
  })

  it('has a plain sentence for every kind', () => {
    for (const kind of ['not_available', 'not_owner', 'reauth_required', 'path_disabled', 'aux_unavailable', 'aux_timeout', 'refused', 'failed'] as const) {
      expect(explainNetworkError(kind).length).toBeGreaterThan(10)
    }
  })
})

describe('what to say before a change', () => {
  it('Bluetooth is safe, and says so', () => {
    const w = warningFor({ kind: 'wifi_connect', path: 'ble' })
    expect(w).toMatchObject({ mayDropLink: false, level: 'safe', title: 'Safe over Bluetooth' })
  })

  it('joining another Wi-Fi on the local network may drop the connection', () => {
    expect(warningFor({ kind: 'wifi_connect', path: 'local' })).toMatchObject({ mayDropLink: true, level: 'warn' })
  })

  it('over the internet, joining another network cuts the link until the printer is back', () => {
    for (const path of ['relay', 'direct_wan'] as const) {
      const w = warningFor({ kind: 'wifi_connect', path })
      expect(w).toMatchObject({ mayDropLink: true, level: 'warn' })
      expect(w.message).toContain('until the printer is back online')
    }
  })

  it('forgetting the network the printer is on warns; forgetting another does not', () => {
    expect(warningFor({ kind: 'wifi_forget', path: 'local', isCurrentNetwork: true }).mayDropLink).toBe(true)
    expect(warningFor({ kind: 'wifi_forget', path: 'local', isCurrentNetwork: false })).toMatchObject({ mayDropLink: false, level: 'safe' })
  })

  it('a hotspot change while on the hotspot always warns, on any path', () => {
    for (const path of ['ble', 'local', 'direct_wan', 'relay'] as const) {
      expect(warningFor({ kind: 'hotspot_change', path, onHotspot: true })).toMatchObject({ mayDropLink: true, level: 'warn' })
    }
  })

  it('a hotspot change off the hotspot keeps the link, and says someone must approve', () => {
    const w = warningFor({ kind: 'hotspot_change', path: 'relay', onHotspot: false })
    expect(w).toMatchObject({ mayDropLink: false, level: 'safe' })
    expect(w.message).toContain('knob')
  })
})

describe('the confirm-or-revert route (KAN-1565: not defined yet)', () => {
  it('is 90 seconds, and the route is reported as absent', () => {
    expect(CONFIRM_SECONDS).toBe(90)
    expect(confirmRouteSupported()).toBe(false)
  })

  it('confirmNetworkChange sends nothing while the route is undefined', async () => {
    await expect(confirmNetworkChange()).rejects.toBeInstanceOf(ConfirmUnavailable)
    expect(request).not.toHaveBeenCalled()
  })
})

describe('the hotspot name and password rules', () => {
  it('names must start Muon- and be 6 to 32 bytes', () => {
    expect(ssidProblemOf('')).toBe('')
    expect(ssidProblemOf('Muon-Lab')).toBe('')
    expect(ssidProblemOf('Home')).toContain('Muon-')
    expect(ssidProblemOf('Muon-')).toContain('6 to 32')
    expect(ssidProblemOf('Muon-' + 'x'.repeat(28))).toContain('6 to 32')
  })

  it('passwords are 8 to 63 printable characters, or 64 hex digits', () => {
    expect(passwordProblemOf('')).toBe('')
    expect(passwordProblemOf('short')).toContain('at least 8')
    expect(passwordProblemOf('x'.repeat(64))).toContain('at most 63')
    expect(passwordProblemOf('a'.repeat(64))).toBe('')
    expect(passwordProblemOf('pässwörd1')).toContain('letters')
    expect(passwordProblemOf('correct horse')).toBe('')
  })
})
