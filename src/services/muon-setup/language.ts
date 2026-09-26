/**
 * The setup page's language (05-phone-setup-page.md §9).
 *
 * Once the language step is done, the page speaks the owner's choice. Until
 * then it takes the first setup language the browser prefers, or English, and
 * the header switcher can change it, which also posts the step.
 */
import type { SetupState } from './types'

/** A BCP 47 tag's primary language, lower case: "de-AT" gives "de". */
const primary = (tag: string) => tag.toLowerCase().split(/[-_]/)[0]

export const pageLanguageFor = (
  state: SetupState | null,
  offered: string[],
  preferred: readonly string[],
  chosen: string | null
): string => {
  const language = state?.steps.language
  if (language?.status === 'done' && language.value) return language.value
  if (chosen && offered.includes(chosen)) return chosen
  for (const tag of preferred) {
    const match = offered.find(code => code.toLowerCase() === tag.toLowerCase()) ??
      offered.find(code => primary(code) === primary(tag))
    if (match) return match
  }
  return 'en'
}
