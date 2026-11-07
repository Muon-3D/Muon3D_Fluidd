import { describe, expect, it } from 'vitest'
import { TERMS_LABEL, TERMS_VERSION, documentVersion, printerServesTerms, termsHtml, termsMarkdown } from '../terms'
import en from '@/locales/en.yaml'

// Written out, not imported: a new wording must change both on purpose.
const VERSION = 'dev-mode-terms-v1-draft'

describe('Developer Mode terms', () => {
  it('names the version the document declares', () => {
    expect(TERMS_VERSION).toBe(VERSION)
    expect(TERMS_LABEL).toBe('v1 draft')
    expect(documentVersion()).toBe(VERSION)
  })

  it('shows the customer the terms and nothing meant for the reviewer', () => {
    const md = termsMarkdown()
    expect(md).toMatch(/^\*\*Version 1 \(draft\), 16 October 2026\*\*/)
    expect(md).toContain('Turning on Developer Mode does not, on its own, end your warranty')
    expect(md).toContain('Consumer Rights Act 2015')
    expect(md).not.toContain('Notes for the reviewer')
    expect(md).not.toContain('terms:start')
  })

  it('reads a document checked out with Windows line endings', () => {
    const crlf = 'Version: x\r\n<!-- terms:start -->\r\n## Hello\r\n<!-- terms:end -->\r\n'
    expect(termsMarkdown(crlf)).toBe('## Hello')
    expect(documentVersion(crlf)).toBe('x')
  })

  it('shows nothing rather than the whole document when the markers are gone', () => {
    expect(termsMarkdown('# No markers')).toBe('')
  })

  it('sanitises the HTML it renders', () => {
    const html = termsHtml('<!-- terms:start -->\n<img src=x onerror=alert(1)>\n<!-- terms:end -->')
    expect(html).not.toContain('onerror')
  })

  it('knows when the printer serves these terms itself', () => {
    expect(printerServesTerms(VERSION)).toBe(true)
    expect(printerServesTerms(`${VERSION}-norecord`)).toBe(true)
    expect(printerServesTerms('2026-08-1-norecord')).toBe(false)
    expect(printerServesTerms('dev-mode-terms-v1-drafty')).toBe(false)
    expect(printerServesTerms(null)).toBe(false)
  })

  it('never tells a customer that developer mode voids the warranty', () => {
    const devMode = (en as any).app.general.dev_mode as Record<string, string>
    for (const text of Object.values(devMode)) expect(text).not.toMatch(/\bvoid/i)
    expect(devMode['modal-checkbox-message'].replace('{version}', 'v1 draft'))
      .toBe('I\'ve read and accept the Developer Mode terms (v1 draft).')
    expect(termsMarkdown()).not.toMatch(/\bvoid/i)
  })
})
