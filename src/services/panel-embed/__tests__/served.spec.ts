import { describe, expect, it } from 'vitest'
import { panelOnPrinter } from '../served'

const html = { 'content-type': 'text/html; charset=utf-8' }

describe('whether the printer has its screen (KAN-3595)', () => {
  it('asks the printer\'s route for /panel/index.html, not the page', async () => {
    const asked: string[] = []
    const answer = await panelOnPrinter(async url => { asked.push(url); return { status: 200, headers: html } })
    expect(answer).toBe('yes')
    expect(asked).toEqual(['/panel/index.html'])
  })

  it('says "no" (needs an update) only when the printer answers that it has none', async () => {
    expect(await panelOnPrinter(async () => ({ status: 404 }))).toBe('no')
    expect(await panelOnPrinter(async () => ({ status: 200, headers: { 'content-type': 'application/json' } }))).toBe('no')
  })

  it('makes no claim when the route gives no answer', async () => {
    expect(await panelOnPrinter(async () => { throw new Error('offline') })).toBe('unknown')
    expect(await panelOnPrinter(async () => ({ status: 502 }))).toBe('unknown')
    expect(await panelOnPrinter(async () => ({ status: 401 }))).toBe('unknown')
  })
})
