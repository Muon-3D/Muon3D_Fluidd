import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import AccountPrivacy from '../AccountPrivacy.vue'
import { AccountError } from '@/services/account/client'

const { exportLibrary, requestExport, exportsList } = vi.hoisted(() => ({ exportLibrary: vi.fn(), requestExport: vi.fn(), exportsList: vi.fn() }))
vi.mock('@/services/library/export', () => ({ exportLibrary }))
vi.mock('@/services/account/state', () => ({ accountState: { me: null }, loadMe: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/account/api', () => ({ accountApi: { retention: async () => ({}), requestExport, exports: exportsList } }))
exportsList.mockResolvedValue([])
const mount = () => shallowMount(AccountPrivacy, { propsData: { linkTo: (id: string) => '/account/' + id }, stubs: { RouterLink: true } })
const tick = () => new Promise(resolve => setTimeout(resolve))
afterEach(() => { vi.clearAllMocks(); exportsList.mockReset(); exportsList.mockResolvedValue([]) })

describe('Library data export', () => {
  it('uses a native keyboard-operable button beside account data', () => {
    const w = mount(); const button = w.find('[data-tid="privacy-library-download"]')
    expect(button.element.tagName).toBe('BUTTON'); expect(button.attributes('type')).toBe('button'); expect(w.text()).toContain('as one .tar'); w.destroy()
  })
  it('lets row labels shrink inside the flex layout', () => {
    const accountStyles = readFileSync(`${process.cwd()}/src/scss/muon3d-account.scss`, 'utf8')
    expect(accountStyles).toMatch(/\.acct-row__label\s*\{[\s\S]*?min-width:\s*0;/)
    const w = mount(); expect(w.findAll('.acct-row__label').length).toBeGreaterThan(0); w.destroy()
  })
  it('disables both downloads and cannot double-start while one runs', async () => {
    let finish!: () => void; exportLibrary.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const w = mount(); const button = w.find('[data-tid="privacy-library-download"]'); await button.trigger('click'); await button.trigger('click')
    expect(exportLibrary).toHaveBeenCalledOnce(); expect(button.attributes('disabled')).toBe('disabled'); expect(button.text()).toContain('Downloading')
    finish(); await tick(); w.destroy()
  })
  it('announces progress and completion through a polite live region', async () => {
    exportLibrary.mockImplementation(async (_signal, progress) => { progress(1048576, 2097152); return null })
    const w = mount(); await w.find('[data-tid="privacy-library-download"]').trigger('click'); await tick()
    const status = w.find('[data-tid="privacy-download-status"]'); expect(status.attributes('aria-live')).toBe('polite'); expect(status.attributes('aria-atomic')).toBe('true'); expect(status.text()).toContain('ready'); w.destroy()
  })
  it('bounds live-region announcements during a 100-chunk download', async () => {
    const w = mount()
    const chunkAnnouncements = new Set<string>()
    exportLibrary.mockImplementation(async (_signal, progress) => {
      for (let chunk = 1; chunk <= 100; chunk++) {
        progress(chunk * 1024 * 1024, 100 * 1024 * 1024)
        await w.vm.$nextTick()
        const announced = (w.vm as any).announcedProgress
        if (announced.includes('Downloading')) chunkAnnouncements.add(announced)
      }
      return null
    })
    await w.find('[data-tid="privacy-library-download"]').trigger('click')
    while ((w.vm as any).busy) await w.vm.$nextTick()
    expect(chunkAnnouncements.size).toBe(10)
    expect(w.find('[data-tid="privacy-download-status"]').text()).toContain('ready')
    w.destroy()
  })
  it('aborts an in-flight download when leaving the page', async () => {
    let signal!: AbortSignal; exportLibrary.mockImplementation((value) => { signal = value; return new Promise(() => {}) })
    const w = mount(); await w.find('[data-tid="privacy-library-download"]').trigger('click'); w.destroy(); expect(signal.aborted).toBe(true)
  })
  it('explains picker cancellation and never announces success', async () => {
    exportLibrary.mockRejectedValue(new DOMException('Cancelled', 'AbortError')); const w = mount(); await w.find('[data-tid="privacy-library-download"]').trigger('click'); await tick()
    expect(w.find('[role="alert"]').text()).toContain('cancelled'); expect(w.text()).not.toContain('archive is ready'); w.destroy()
  })
})

describe('Emailed data export', () => {
  const ask = async (w: ReturnType<typeof mount>) => { await w.find('[data-tid="privacy-email-export"]').trigger('click'); await tick(); await tick() }
  const note = (w: ReturnType<typeof mount>) => w.find('[data-tid="privacy-export-note"]')

  it('requests the export and says we will email', async () => {
    exportsList.mockResolvedValue([]); requestExport.mockResolvedValue({ id: 'e1', status: 'queued' })
    const w = mount(); await tick(); await ask(w)
    expect(requestExport).toHaveBeenCalledWith({})
    expect(note(w).text()).toContain("We'll email you")
    expect(w.find('[data-tid="privacy-email-export"]').attributes('disabled')).toBe('disabled'); w.destroy()
  })
  it.each([404, 405, 501])('says coming soon on %i', async (status) => {
    exportsList.mockResolvedValue([]); requestExport.mockRejectedValue(new AccountError('x', status))
    const w = mount(); await tick(); await ask(w)
    expect(note(w).text()).toContain('coming soon'); expect(w.find('[role="alert"]').exists()).toBe(false); w.destroy()
  })
  it('says it is already requested on 409', async () => {
    exportsList.mockResolvedValue([]); requestExport.mockRejectedValue(new AccountError('one is open', 409))
    const w = mount(); await tick(); await ask(w)
    expect(note(w).text()).toContain('already asked'); w.destroy()
  })
  it('shows an open request from the list, in either list shape and time format', async () => {
    exportsList.mockResolvedValue({ exports: [{ id: 'e1', status: 'building', requested_at: new Date(2026, 10, 3, 12).toISOString() }, { id: 'e0', status: 'ready' }] })
    const w = mount(); await tick()
    expect(note(w).text()).toContain('already asked'); expect(note(w).text()).toContain('3 Nov')
    expect(w.find('[data-tid="privacy-email-export"]').attributes('disabled')).toBe('disabled'); w.destroy()
  })
  it('lets a finished request be followed by a new one', async () => {
    exportsList.mockResolvedValue([{ id: 'e0', status: 'ready', requested_at: 1 }])
    const w = mount(); await tick()
    expect(note(w).exists()).toBe(false); expect(w.find('[data-tid="privacy-email-export"]').attributes('disabled')).toBeUndefined(); w.destroy()
  })
  it('says once a day on 429, and a real error otherwise', async () => {
    exportsList.mockResolvedValue([]); requestExport.mockRejectedValue(new AccountError('slow down', 429))
    let w = mount(); await tick(); await ask(w)
    expect(note(w).text()).toContain('once a day'); w.destroy()
    requestExport.mockRejectedValue(new AccountError('The Muon3D service answered 500.', 500))
    w = mount(); await tick(); await ask(w)
    expect(w.find('[role="alert"]').text()).toContain('answered 500'); expect(note(w).exists()).toBe(false); w.destroy()
  })
  it('still works when the list cannot be read', async () => {
    exportsList.mockRejectedValue(new AccountError('x', 500)); requestExport.mockResolvedValue({ id: 'e1', status: 'queued' })
    const w = mount(); await tick(); await ask(w)
    expect(note(w).text()).toContain("We'll email you"); w.destroy()
  })
})
