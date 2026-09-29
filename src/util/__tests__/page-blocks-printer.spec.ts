import { describe, expect, it } from 'vitest'
import { escapeHtml, pageBlocksPrinter, printerPageUrl } from '../page-blocks-printer'

describe('pageBlocksPrinter', () => {
  it('is the browser when an HTTPS page asks a plain-HTTP printer', () => {
    expect(pageBlocksPrinter('http://192.168.1.153', 'https:')).toBe(true)
  })

  it('is not the browser from the printer\'s own plain-HTTP page', () => {
    expect(pageBlocksPrinter('http://192.168.1.153', 'http:')).toBe(false)
  })

  it('is not the browser for a printer that serves HTTPS itself', () => {
    expect(pageBlocksPrinter('https://printer.example', 'https:')).toBe(false)
  })
})

describe('printerPageUrl', () => {
  it('is the root of the API address, with one trailing slash', () => {
    expect(printerPageUrl('http://192.168.1.153')).toBe('http://192.168.1.153/')
    expect(printerPageUrl('http://192.168.1.153//')).toBe('http://192.168.1.153/')
  })
})

describe('escapeHtml', () => {
  it('cannot close the attribute the link sits in', () => {
    expect(escapeHtml('http://x/"><img src=x onerror=alert(1)>'))
      .toBe('http://x/&quot;&gt;&lt;img src=x onerror=alert(1)&gt;')
  })

  it('leaves an ordinary address alone', () => {
    expect(escapeHtml('http://192.168.1.153/')).toBe('http://192.168.1.153/')
  })
})
