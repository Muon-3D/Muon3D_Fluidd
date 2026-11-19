/**
 * Why this page cannot use Bluetooth, said plainly (KAN-4802).
 *
 * One place decides the cause, and every hint, tooltip and banner reads it.
 * The causes are checked in the order a person could fix them, and each says
 * what to do, not just what is missing.
 */

export type BluetoothWhyKind = 'ios' | 'insecure' | 'iframe' | 'radio-off' | 'unsupported'

export interface BluetoothWhy {
  kind: BluetoothWhyKind;
  text: string;
  /** A part of `text` that is a link, opened in the same tab. */
  link?: { text: string, href: string };
}

/** What the decision reads from the browser. Tests pass their own. */
export interface BluetoothEnv {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  isSecureContext: boolean;
  /** `navigator.bluetooth` exists. */
  hasWebBluetooth: boolean;
  inIframe: boolean;
  /** Whether the permissions policy allows Bluetooth here; null when the browser cannot say. */
  policyAllows: boolean | null;
}

export const SECURE_CONTROL_URL = 'https://control.muon3d.com/'

export const WHY_IOS = "iPhone and iPad browsers can't use Bluetooth. Use the Muon app, or join the printer's hotspot."
export const WHY_INSECURE = 'Bluetooth needs a secure page. Open control.muon3d.com to connect over Bluetooth.'
export const WHY_IFRAME = 'Bluetooth is blocked inside this embedded page. Open Control in its own tab.'
export const WHY_RADIO_OFF = 'Turn on Bluetooth on this device, and allow Chrome to use it (Android: Settings › Apps › Chrome › Permissions › Nearby devices).'
export const WHY_UNSUPPORTED = "This browser can't use Bluetooth. Use Chrome, Edge, Opera or Samsung Internet, or the Muon app."

/** Reads the real browser. */
export function readBluetoothEnv (): BluetoothEnv {
  const nav = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & {
    bluetooth?: unknown;
  }) | null
  const win = (typeof window !== 'undefined' ? window : null)
  const doc = (typeof document !== 'undefined' ? document : null) as (Document & {
    permissionsPolicy?: { allowsFeature?: (f: string) => boolean };
    featurePolicy?: { allowsFeature?: (f: string) => boolean };
  }) | null
  let inIframe = false
  try {
    inIframe = !!win && win.self !== win.top
  } catch {
    inIframe = true
  }
  let policyAllows: boolean | null = null
  try {
    const policy = doc?.permissionsPolicy ?? doc?.featurePolicy
    if (policy && typeof policy.allowsFeature === 'function') policyAllows = policy.allowsFeature('bluetooth')
  } catch { /* the browser cannot say */ }
  return {
    userAgent: nav?.userAgent ?? '',
    platform: nav?.platform ?? '',
    maxTouchPoints: nav?.maxTouchPoints ?? 0,
    isSecureContext: win ? win.isSecureContext !== false : true,
    hasWebBluetooth: !!nav?.bluetooth,
    inIframe,
    policyAllows
  }
}

/** Every iPhone and iPad browser is WebKit, so none has Web Bluetooth; iPadOS also claims to be a Mac. */
export function isAppleTouchDevice (env: Pick<BluetoothEnv, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  if (/iPhone|iPad|iPod/i.test(env.userAgent)) return true
  return (/Mac/i.test(env.platform) || /Macintosh/i.test(env.userAgent)) && env.maxTouchPoints > 1
}

/**
 * Why Bluetooth cannot be used, or null when it can. `radioOff` is true when
 * the browser says the adapter is off or the browser may not use it.
 */
export function bluetoothWhy (env: BluetoothEnv = readBluetoothEnv(), radioOff = false): BluetoothWhy | null {
  if (isAppleTouchDevice(env)) return { kind: 'ios', text: WHY_IOS }
  if (!env.isSecureContext) {
    return { kind: 'insecure', text: WHY_INSECURE, link: { text: 'control.muon3d.com', href: SECURE_CONTROL_URL } }
  }
  if (env.inIframe && env.policyAllows === false) return { kind: 'iframe', text: WHY_IFRAME }
  if (!env.hasWebBluetooth) return { kind: 'unsupported', text: WHY_UNSUPPORTED }
  if (radioOff) return { kind: 'radio-off', text: WHY_RADIO_OFF }
  return null
}
