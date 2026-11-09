import { Marked } from 'marked'
import DOMPurify from 'dompurify'
import termsSource from '../../../docs/legal/developer-mode-terms.md?raw'

/**
 * The Developer Mode terms, read from docs/legal/developer-mode-terms.md so
 * the page and the document can't drift apart. Only the part between the
 * terms:start and terms:end markers is shown; the draft banner and the notes
 * for the reviewer stay in the document.
 */

/** Which terms these are. A new wording gets a new id here and in the document. */
export const TERMS_VERSION = 'dev-mode-terms-v1-draft'

/** How the checkbox names this version. */
export const TERMS_LABEL = 'v1 draft'

/** The part of the document a customer reads, or '' if the markers are missing. */
export function termsMarkdown (source: string = termsSource): string {
  const text = source.replace(/\r\n?/g, '\n')
  const match = /<!-- terms:start -->\n([\s\S]*?)\n<!-- terms:end -->/.exec(text)
  return match ? match[1].trim() : ''
}

/** The version id the document declares, so a test can hold it to TERMS_VERSION. */
export function documentVersion (source: string = termsSource): string | null {
  return /^Version: (\S+)$/m.exec(source.replace(/\r\n?/g, '\n'))?.[1] ?? null
}

/** The terms as HTML for the enable dialog. Sanitised even though the source is ours. */
export function termsHtml (source: string = termsSource): string {
  const html = new Marked().parse(termsMarkdown(source), { async: false }) as string
  return DOMPurify.sanitize(html)
}

/**
 * Whether the printer already serves these terms as its own waiver (any
 * variant of this version, such as one without the hardware-record clause).
 * Then the dialog shows the printer's text alone, because that is what the
 * acceptance is recorded against.
 */
export function printerServesTerms (printerVersion: string | null | undefined): boolean {
  return !!printerVersion && (printerVersion === TERMS_VERSION || printerVersion.startsWith(`${TERMS_VERSION}-`))
}
