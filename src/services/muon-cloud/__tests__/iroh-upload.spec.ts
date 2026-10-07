/**
 * @vitest-environment node
 */
// jsdom's FormData is not one Node's Response can encode (it is sent as the
// text "[object FormData]"), so this runs where FormData and Response are both
// the Fetch standard's, as they are in a browser.
import { describe, expect, it, vi } from 'vitest'
import { IrohPrinter } from '../iroh'

interface Sent {
  method: string;
  path: string;
  headers: string[];
  body: Uint8Array;
}

function relay () {
  const sent: Sent[] = []
  const printer = {
    printerId: () => 'printer',
    fetch: vi.fn(async (method: string, path: string, headers: string[], body: Uint8Array) => {
      sent.push({ method, path, headers, body })
      return { status: 201, headers: ['content-type', 'application/json'], body: new TextEncoder().encode('{}') }
    }),
    openWebSocket: vi.fn(),
    close: vi.fn()
  }
  return { relay: new IrohPrinter(printer as any), sent }
}

const latin1 = (bytes: Uint8Array) => Array.from(bytes, b => String.fromCharCode(b)).join('')
const bytesOf = (text: string) => Uint8Array.from(text, c => c.charCodeAt(0))

/** Every byte value, and a line that starts like a delimiter but is not one. */
const GCODE = new Uint8Array([
  ...new TextEncoder().encode('G28\r\n--not-the-boundary\r\n; ü\r\n'),
  ...Array.from({ length: 256 }, (_, i) => i)
])

/** The form Fluidd's `serverFilesUploadPost` builds, with the checksum the gateway also takes. */
function uploadForm () {
  const form = new FormData()
  form.append('file', new File([GCODE], 'benchy.gcode'), 'benchy.gcode')
  form.append('path', '/')
  form.append('root', 'gcodes')
  form.append('print', 'true')
  form.append('checksum', 'a'.repeat(64))
  return form
}

/** How axios hands Fluidd's upload to the transport: a multipart type with no boundary. */
const UPLOAD_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'multipart/form-data',
  Authorization: 'Bearer token'
}

const PARTS = ['root', 'path', 'print', 'checksum']

/** The longest part header block, and the longest text field, the gateway reads. */
const MAX_PART_HEAD_LEN = 2048
const MAX_FIELD_LEN = 1024

/** Reads latin1 text back as the UTF-8 it must be, or throws `reason`. */
function utf8 (text: string, reason: string) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytesOf(text))
  } catch {
    throw new Error(reason)
  }
}

/**
 * The printer gateway's reading of an upload, as strict as it is: one
 * multipart type whose only parameter is a boundary of 1-70 RFC 2046
 * characters; no preamble; parts whose UTF-8 header block of at most 2048
 * bytes holds only Content-Disposition and Content-Type; `root` (gcodes only),
 * `path` (UTF-8), `print`, `checksum` and `file`, each at most once, every
 * text value at most 1024 bytes; and an epilogue of nothing or one CRLF.
 * Throws the gateway's reason for anything else.
 */
function gatewayReads (headers: string[], body: Uint8Array) {
  const pairs: Array<[string, string]> = []
  for (let i = 0; i + 1 < headers.length; i += 2) pairs.push([headers[i].toLowerCase(), headers[i + 1]])
  const types = pairs.filter(([name]) => name === 'content-type')
  if (types.length !== 1) throw new Error('an upload needs exactly one Content-Type')
  if (pairs.some(([name]) => name === 'content-encoding')) throw new Error('an upload may not be content-encoded')
  const [kind, ...params] = types[0][1].split(';').map(p => p.trim())
  if (kind.toLowerCase() !== 'multipart/form-data') throw new Error('an upload must be multipart/form-data')
  if (params.length !== 1) throw new Error("an upload's Content-Type must carry a boundary and nothing else")
  const param = /^boundary\s*=\s*(.*)$/i.exec(params[0])
  if (!param) throw new Error("an upload's Content-Type has no boundary")
  const boundary = param[1].replace(/^"(.*)"$/, '$1')
  if (!/^[0-9A-Za-z'()+_,\-./:=?]{1,70}$/.test(boundary)) throw new Error("an upload's boundary is not usable")

  const text = latin1(body)
  const delimiter = `\r\n--${boundary}`
  if (!text.startsWith(delimiter.slice(2))) throw new Error('the body does not open with its boundary')
  let at = delimiter.length - 2
  const fields: Record<string, string> = {}
  let file: { name: string, content: string } | null = null
  for (;;) {
    const after = text.slice(at, at + 2)
    at += 2
    if (after === '--') break
    if (after !== '\r\n') throw new Error('a boundary is followed by something other than CRLF or --')
    const headEnd = text.indexOf('\r\n\r\n', at)
    if (headEnd < 0) throw new Error('the body ends inside a part')
    if (headEnd - at > MAX_PART_HEAD_LEN) throw new Error('an upload part is over-long')
    const part = partHead(utf8(text.slice(at, headEnd), "an upload part's headers are not UTF-8"))
    const end = text.indexOf(delimiter, headEnd + 4)
    if (end < 0) throw new Error('the body ends inside a part')
    const value = text.slice(headEnd + 4, end)
    at = end + delimiter.length
    if (part.filename !== undefined) {
      if (file) throw new Error('the upload has two files')
      file = { name: part.filename, content: value }
      continue
    }
    if (value.length > MAX_FIELD_LEN) throw new Error('an upload part is over-long')
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(value)) throw new Error('an upload field contains a control character')
    if (part.name in fields) throw new Error(part.name === 'root' ? 'the upload names its root twice' : 'an upload field is repeated')
    if (part.name === 'root' && value !== 'gcodes') throw new Error('a remote session uploads to the gcodes root only')
    if (part.name === 'path' && hasDotSegment(utf8(value, 'the upload path is not UTF-8'))) {
      throw new Error('an upload path may not leave the gcodes root')
    }
    fields[part.name] = value
  }
  const rest = text.slice(at)
  if (rest !== '' && rest !== '\r\n') throw new Error('the body continues after its closing boundary')
  if (!file) throw new Error('the upload has no file')
  return { fields, file }
}

function partHead (head: string): { name: string, filename?: string } {
  let disposition: string | undefined
  let contentType = false
  for (const line of head.split('\r\n')) {
    const colon = line.indexOf(':')
    const name = line.slice(0, colon).toLowerCase()
    // eslint-disable-next-line no-control-regex
    if (colon <= 0 || /\s/.test(name) || /[\x00-\x08\x0a-\x1f\x7f]/.test(line.slice(colon + 1))) {
      throw new Error('an upload part has a malformed header')
    }
    if (name === 'content-disposition') {
      if (disposition !== undefined) throw new Error('an upload part has two Content-Disposition headers')
      disposition = line.slice(colon + 1).trim()
    } else if (name === 'content-type') {
      if (contentType) throw new Error('an upload part has two Content-Type headers')
      contentType = true
    } else {
      throw new Error('an upload part has a header other than Content-Disposition and Content-Type')
    }
  }
  if (disposition === undefined) throw new Error('an upload part has no Content-Disposition')
  const match = /^form-data;\s*name="([^"\\\x00-\x1f\x7f]*)"(?:;\s*filename="([^"\\\x00-\x1f\x7f]*)")?$/i.exec(disposition) // eslint-disable-line no-control-regex
  if (!match) throw new Error("an upload part's Content-Disposition is not usable")
  const [, name, filename] = match
  if (name === 'file') {
    if (filename === undefined) throw new Error("an upload part's Content-Disposition is not usable")
    if (filename.trim() === '' || filename.includes('/') || hasDotSegment(filename)) {
      throw new Error("an upload's file name must be a plain name in the gcodes root")
    }
    return { name, filename }
  }
  if (filename !== undefined) throw new Error("an upload part's Content-Disposition is not usable")
  if (!PARTS.includes(name)) throw new Error("an upload part is not one Moonraker's upload reads")
  return { name }
}

function hasDotSegment (path: string) {
  return path.split(/[/\\]/).some(segment => segment === '.' || segment === '..') || path.includes('\\')
}

function boundaryOf (type: string) {
  return /boundary=(.*)$/.exec(type)?.[1]
}

describe('IrohPrinter.fetch, uploading a FormData', () => {
  it('sends one Content-Type, whose boundary is the one the body is framed with', async () => {
    const { relay: printer, sent } = relay()
    await printer.fetch('/server/files/upload', { method: 'POST', headers: UPLOAD_HEADERS, body: uploadForm() })

    expect(sent).toHaveLength(1)
    const { method, path, headers, body } = sent[0]
    expect([method, path]).toEqual(['POST', '/server/files/upload'])
    const types = headers.filter((h, n) => n % 2 === 0 && h.toLowerCase() === 'content-type')
    expect(types).toHaveLength(1)
    const type = headers[headers.indexOf(types[0]) + 1]
    const boundary = boundaryOf(type)
    expect(type).toMatch(/^multipart\/form-data; boundary=/)
    expect(latin1(body).startsWith(`--${boundary}\r\n`)).toBe(true)
    expect(latin1(body).endsWith(`\r\n--${boundary}--\r\n`)).toBe(true)
    // The gateway sets its own credentials.
    expect(headers.map(h => h.toLowerCase())).not.toContain('authorization')
  })

  it('passes the gateway\'s parser, every part read back unchanged', async () => {
    const { relay: printer, sent } = relay()
    await printer.fetch('/server/files/upload', { method: 'POST', headers: UPLOAD_HEADERS, body: uploadForm() })

    const { fields, file } = gatewayReads(sent[0].headers, sent[0].body)
    expect(fields).toEqual({ root: 'gcodes', path: '/', print: 'true', checksum: 'a'.repeat(64) })
    expect(file.name).toBe('benchy.gcode')
    expect(file.content).toBe(latin1(GCODE))
  })

  it('would be refused encoded twice, as it was: the header\'s boundary is not the body\'s', async () => {
    // The old fetch: the bytes from one Response, the type from another.
    const form = uploadForm()
    const body = new Uint8Array(await new Response(form).arrayBuffer())
    const type = new Response(form).headers.get('content-type') ?? ''

    expect(latin1(body).startsWith(`--${boundaryOf(type)}\r\n`)).toBe(false)
    expect(() => gatewayReads(['content-type', type], body)).toThrow('the body does not open with its boundary')
  })

  it('still sends a string body as it is, typed as JSON when no type was given', async () => {
    const { relay: printer, sent } = relay()
    await printer.fetch('/printer/gcode/script', { method: 'POST', body: '{"script":"G28"}' })

    expect(sent[0].headers).toEqual(['content-type', 'application/json'])
    expect(new TextDecoder().decode(sent[0].body)).toBe('{"script":"G28"}')
  })
})

describe('the gateway\'s parser in this spec', () => {
  const headers = ['content-type', 'multipart/form-data; boundary=b0']
  const file = '--b0\r\nContent-Disposition: form-data; name="file"; filename="a.gcode"\r\n\r\nG28\r\n'

  it.each([
    ['a root other than gcodes', `--b0\r\nContent-Disposition: form-data; name="root"\r\n\r\nconfig\r\n${file}--b0--\r\n`, 'gcodes root only'],
    ['a part Moonraker does not read', `--b0\r\nContent-Disposition: form-data; name="extra"\r\n\r\nx\r\n${file}--b0--\r\n`, 'not one Moonraker'],
    ['a preamble', `hello\r\n${file}--b0--\r\n`, 'does not open with its boundary'],
    ['a repeated field', `--b0\r\nContent-Disposition: form-data; name="print"\r\n\r\ntrue\r\n--b0\r\nContent-Disposition: form-data; name="print"\r\n\r\ntrue\r\n${file}--b0--\r\n`, 'repeated'],
    ['a file name with a path', `${file.replace('a.gcode', 'x/a.gcode')}--b0--\r\n`, 'plain name'],
    ['an epilogue', `${file}--b0--\r\nmore`, 'continues after its closing boundary'],
    ['a field over 1024 bytes', `--b0\r\nContent-Disposition: form-data; name="path"\r\n\r\n${'d/'.repeat(513)}\r\n${file}--b0--\r\n`, 'over-long'],
    ['a part header block over 2048 bytes', `--b0\r\nContent-Disposition: form-data; name="print"\r\nContent-Type: text/plain; x=${'x'.repeat(2048)}\r\n\r\ntrue\r\n${file}--b0--\r\n`, 'over-long'],
    ['a path that is not UTF-8', `--b0\r\nContent-Disposition: form-data; name="path"\r\n\r\n\xff\r\n${file}--b0--\r\n`, 'path is not UTF-8'],
    ['part headers that are not UTF-8', `${file.replace('a.gcode', '\xe9.gcode')}--b0--\r\n`, 'headers are not UTF-8']
  ])('refuses %s', (_case, body, reason) => {
    expect(() => gatewayReads(headers, bytesOf(body))).toThrow(reason)
  })

  it('refuses a Content-Type with a parameter besides the boundary', () => {
    const body = bytesOf(`${file}--b0--\r\n`)
    expect(gatewayReads(headers, body).file.content).toBe('G28')
    expect(() => gatewayReads(['content-type', 'multipart/form-data; boundary=b0; charset=utf-8'], body))
      .toThrow('a boundary and nothing else')
  })
})
