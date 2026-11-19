import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BluetoothWhyText from '@/components/printers/BluetoothWhyText.vue'
import {
  bluetoothWhy, isAppleTouchDevice, readBluetoothEnv, SECURE_CONTROL_URL,
  WHY_IFRAME, WHY_INSECURE, WHY_IOS, WHY_RADIO_OFF, WHY_UNSUPPORTED, type BluetoothEnv
} from '../unavailable'
import { bluetoothSupport } from '../webBluetooth'

const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0'

const env = (over: Partial<BluetoothEnv> = {}): BluetoothEnv => ({
  userAgent: CHROME_ANDROID,
  platform: 'Linux armv81',
  maxTouchPoints: 5,
  isSecureContext: true,
  hasWebBluetooth: true,
  inIframe: false,
  policyAllows: null,
  ...over
})

describe('why Bluetooth cannot be used (KAN-4802)', () => {
  it('is null on Chrome with Web Bluetooth on a secure page', () => {
    expect(bluetoothWhy(env())).toBeNull()
  })

  it('1. says iPhone and iPad browsers cannot, whatever the browser', () => {
    const why = bluetoothWhy(env({ userAgent: IPHONE_CHROME, platform: 'iPhone', hasWebBluetooth: false }))
    expect(why).toEqual({ kind: 'ios', text: WHY_IOS })
    expect(WHY_IOS).toBe("iPhone and iPad browsers can't use Bluetooth. Use the Muon app, or join the printer's hotspot.")
  })

  it('1. spots an iPad that claims to be a Mac by its touch points, and not a real Mac', () => {
    expect(bluetoothWhy(env({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 5, hasWebBluetooth: false }))?.kind).toBe('ios')
    expect(isAppleTouchDevice({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
    expect(bluetoothWhy(env({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 0, hasWebBluetooth: false }))?.kind).toBe('unsupported')
  })

  it('1. comes before the secure-page cause', () => {
    expect(bluetoothWhy(env({ userAgent: IPHONE_CHROME, platform: 'iPhone', isSecureContext: false, hasWebBluetooth: false }))?.kind).toBe('ios')
  })

  it('2. says an insecure page needs control.muon3d.com, with a link', () => {
    const why = bluetoothWhy(env({ isSecureContext: false, hasWebBluetooth: false }))
    expect(why).toEqual({ kind: 'insecure', text: WHY_INSECURE, link: { text: 'control.muon3d.com', href: SECURE_CONTROL_URL } })
    expect(WHY_INSECURE).toBe('Bluetooth needs a secure page. Open control.muon3d.com to connect over Bluetooth.')
  })

  it('3. says an iframe without Bluetooth permission cannot', () => {
    expect(bluetoothWhy(env({ inIframe: true, policyAllows: false }))).toEqual({ kind: 'iframe', text: WHY_IFRAME })
    expect(bluetoothWhy(env({ inIframe: true, policyAllows: true }))).toBeNull()
    expect(bluetoothWhy(env({ inIframe: true, policyAllows: null }))).toBeNull()
    expect(bluetoothWhy(env({ inIframe: false, policyAllows: false }))).toBeNull()
  })

  it('4. tells a Chromium browser with the radio off to turn it on and allow Chrome', () => {
    expect(bluetoothWhy(env(), true)).toEqual({ kind: 'radio-off', text: WHY_RADIO_OFF })
    expect(WHY_RADIO_OFF).toBe('Turn on Bluetooth on this device, and allow Chrome to use it (Android: Settings › Apps › Chrome › Permissions › Nearby devices).')
  })

  it('5. says a browser without Web Bluetooth is unsupported, and names the ones that work', () => {
    const why = bluetoothWhy(env({ userAgent: FIREFOX, platform: 'Linux x86_64', maxTouchPoints: 0, hasWebBluetooth: false }))
    expect(why).toEqual({ kind: 'unsupported', text: WHY_UNSUPPORTED })
    expect(WHY_UNSUPPORTED).toBe("This browser can't use Bluetooth. Use Chrome, Edge, Opera or Samsung Internet, or the Muon app.")
  })

  it('never says Chrome or Edge is needed', () => {
    for (const t of [WHY_IOS, WHY_INSECURE, WHY_IFRAME, WHY_RADIO_OFF, WHY_UNSUPPORTED]) expect(t).not.toMatch(/needs Chrome or Edge/i)
  })
})

describe('reading the real browser', () => {
  it('reads the stubbed navigator, isSecureContext and user agent', () => {
    const nav = navigator
    const realUa = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(nav), 'userAgent')
    Object.defineProperty(nav, 'userAgent', { configurable: true, value: IPHONE_CHROME })
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    try {
      expect(readBluetoothEnv()).toMatchObject({ userAgent: IPHONE_CHROME, isSecureContext: false, hasWebBluetooth: false })
      expect(bluetoothSupport()).toEqual({ supported: false, reason: 'ios' })
    } finally {
      delete (nav as unknown as Record<string, unknown>).userAgent
      Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
      expect(realUa).toBeDefined()
    }
  })

  it('negative control: a secure Chromium page with Web Bluetooth is supported', () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: { requestDevice: async () => ({}) } })
    try {
      expect(bluetoothSupport()).toEqual({ supported: true })
    } finally {
      delete (navigator as unknown as Record<string, unknown>).bluetooth
    }
  })
})

describe('the text on the page', () => {
  it('links control.muon3d.com in the same tab inside the insecure sentence', () => {
    const w = shallowMount(BluetoothWhyText, { propsData: { why: bluetoothWhy(env({ isSecureContext: false })) } })
    expect(w.text()).toBe(WHY_INSECURE)
    const a = w.find('a')
    expect(a.attributes('href')).toBe(SECURE_CONTROL_URL)
    expect(a.attributes('target')).toBe('_self')
    expect(a.text()).toBe('control.muon3d.com')
  })

  it('shows other reasons as plain text with no link', () => {
    const w = shallowMount(BluetoothWhyText, { propsData: { why: bluetoothWhy(env({ userAgent: IPHONE_CHROME, platform: 'iPhone' })) } })
    expect(w.text()).toBe(WHY_IOS)
    expect(w.find('a').exists()).toBe(false)
  })
})
