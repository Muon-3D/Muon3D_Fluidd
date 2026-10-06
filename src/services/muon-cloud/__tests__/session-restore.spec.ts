/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, expect, it, vi } from 'vitest'
import { cloudApi, storeToken, storedToken } from '../api'
import { initCloud, signOut } from '../state'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear() })

it('keeps the refreshed token when the saved session needed refreshing to load the account', async () => {
  vi.useFakeTimers()
  storeToken('expired')
  vi.spyOn(cloudApi, 'me').mockImplementation(async () => {
    storeToken('fresh')
    return { account: { id: 'account', name: 'Jack', email: 'jack@example.test', created_at: 1 }, endpoint_id: null }
  })
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  await initCloud()
  expect(storedToken()).toBe('fresh')
})

it('reports the pending central logout navigation so the caller does not reload over its form post', async () => {
  const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
  expect(await signOut()).toBe(true)
  expect(submit).toHaveBeenCalledOnce()
  const form = document.querySelector('form')!
  expect(form.action).toBe('https://control.muon3d.com/logout')
  expect(form.method).toBe('post')
  expect(new FormData(form).get('client_id')).toBe('fluidd')
  form.remove()
})
