// The account console is part of the Fluidd shell now: sign-in is a dialog,
// linking is a dialog, and Fleet is an ordinary page. Nothing hides the chrome.
const MANAGED_CONSOLE_PATHS = new Set<string>([])

export function isManagedConsolePath (path: string): boolean {
  return MANAGED_CONSOLE_PATHS.has(path)
}
