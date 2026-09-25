// The account console is part of the Fluidd shell now: sign-in is a dialog,
// linking is a dialog, and Fleet is an ordinary page. Only first-run setup
// hides the chrome: it runs in a phone's captive-portal window, before the
// printer is set up, and shows every error itself.
const MANAGED_CONSOLE_PATHS = new Set<string>(['/setup'])

export function isManagedConsolePath (path: string): boolean {
  return MANAGED_CONSOLE_PATHS.has(path)
}
