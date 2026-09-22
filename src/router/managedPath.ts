const MANAGED_CONSOLE_PATHS = new Set([
  '/managed/sign-in',
  '/onboarding',
  '/fleet',
  '/link-printer'
])

export function isManagedConsolePath (path: string): boolean {
  return MANAGED_CONSOLE_PATHS.has(path)
}
