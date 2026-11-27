import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

const profile = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/community', () => ({ communityApi: { profile } }))

// eslint-disable-next-line import/first
import LibrarySharePage, { cleanTag } from '../v2/LibrarySharePage.vue'
// eslint-disable-next-line import/first
import { setLibraryClient } from '@/services/library/store'
// eslint-disable-next-line import/first
import { LibraryError, type LibraryItem } from '@/services/library/api'

const item = (id: string, over: Partial<LibraryItem> = {}): LibraryItem => ({
  id,
  kind: 'plate',
  format: '3mf',
  name: `Print ${id}`,
  size_bytes: 1,
  has_thumbnail: false,
  state: 'ready',
  rev: 1,
  created_at: '',
  updated_at: '',
  deleted_at: null,
  versioned: true,
  version: 3,
  setups: [{ printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PETG', print_seconds: 600, filament_g: 3, file_id: 'g' }],
  ...over
})

const ready = { handle: 'jack', public_name: 'Jack', identity_public: true, can_community: true, can_public: true, page_on: true, bio: null }

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
  profile.mockReset()
})

// Any mock: each test gives Publish its own answer (or refusal).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Publish = any

async function page (props: Record<string, unknown>, publish: Publish = vi.fn(async () => ({ id: 's1', state: 'pending', audience: 'public', title: 'Print a', version: 3 })), now: Partial<LibraryItem> = {}) {
  // The Library's answer for the print at Publish (its version now).
  setLibraryClient({ publish, item: vi.fn(async (id: string) => item(id, now)) } as never)
  const w = mount(LibrarySharePage, { propsData: { items: [item('a'), item('b', { setups: [] })], ...props }, stubs: { 'frame-icon': true, 'router-link': { template: '<a><slot /></a>' } } })
  wrappers.push(w)
  await flush()
  return { w, publish }
}

const tid = (w: Awaited<ReturnType<typeof page>>['w'], id: string) => w.find(`[data-tid="${id}"]`)

describe('Library v3 Share a print', () => {
  it('keeps tags as the service does: lowercase words joined by dashes', () => {
    expect(cleanTag(' #Desk Clamp! ')).toBe('desk-clamp')
    expect(cleanTag('---')).toBe('')
  })

  it('publishes only a sliced print with a title and the rights confirmed, and sends what was chosen', async () => {
    profile.mockResolvedValue(ready)
    const { w, publish } = await page({ itemId: 'a' })
    expect((tid(w, 'library-share-title').element as HTMLInputElement).value).toBe('Print a')
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    await tid(w, 'library-share-rights').find('input').setChecked(true)
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBeUndefined()
    await tid(w, 'library-share-title').setValue('')
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    await tid(w, 'library-share-title').setValue('Bracket')
    await tid(w, 'library-share-category-tools').trigger('click')
    await tid(w, 'library-share-tag').setValue('desk')
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(publish).toHaveBeenCalledWith('a', { version: 3, title: 'Bracket', publication: { licence: 'CC-BY-4.0', rights_confirmed: true, category: 'tools', tags: ['desk'], ai_generated: 'no' } })
    expect(tid(w, 'library-share-done').text()).toContain('Sent for review')
    expect(w.emitted('published')).toEqual([['s1']])
  })

  it('a print with no G-code cannot be published; choosing another fills in its name', async () => {
    profile.mockResolvedValue(ready)
    const { w } = await page({})
    await tid(w, 'library-share-choose').setValue('b')
    await tid(w, 'library-share-rights').find('input').setChecked(true)
    expect(tid(w, 'library-share-files').text()).toContain('no G-code yet')
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    await w.findAll('button').filter(b => b.text() === 'Change').at(0).trigger('click')
    await tid(w, 'library-share-choose').setValue('a')
    expect((tid(w, 'library-share-title').element as HTMLInputElement).value).toBe('Print a')
  })

  it('without a public profile (or one not public) says where to set it up, and offers no Publish', async () => {
    profile.mockRejectedValue(new LibraryError('community_setup_required', 'Set up your public profile first.', 403))
    const none = await page({ itemId: 'a' })
    expect(tid(none.w, 'library-share-setup').text()).toContain('Set up your public profile first')
    expect(tid(none.w, 'library-share-publish').exists()).toBe(false)
    profile.mockResolvedValue({ ...ready, can_public: false })
    const notPublic = await page({ itemId: 'a' })
    expect(tid(notPublic.w, 'library-share-setup').exists()).toBe(true)
  })

  it('an unconfirmed email says so; any other refusal says why and nothing is shown as sent', async () => {
    profile.mockResolvedValue(ready)
    const email = await page({ itemId: 'a' }, vi.fn(async () => { throw new LibraryError('email_unverified', 'Confirm your email.', 403) }))
    await tid(email.w, 'library-share-rights').find('input').setChecked(true)
    await tid(email.w, 'library-share-publish').trigger('click')
    await flush()
    expect(tid(email.w, 'library-share-setup').text()).toContain('Confirm your email first')
    const other = await page({ itemId: 'a' }, vi.fn(async () => { throw new LibraryError('share_limit', 'You have shared too many prints today.', 429) }))
    await tid(other.w, 'library-share-rights').find('input').setChecked(true)
    await tid(other.w, 'library-share-publish').trigger('click')
    await flush()
    expect(tid(other.w, 'library-share-error').text()).toContain('too many')
    expect(tid(other.w, 'library-share-done').exists()).toBe(false)
  })

  it('Only me sends nothing', async () => {
    profile.mockResolvedValue(ready)
    const { w, publish } = await page({ itemId: 'a' })
    await tid(w, 'library-share-audience-private').trigger('click')
    await tid(w, 'library-share-publish').trigger('click')
    expect(publish).not.toHaveBeenCalled()
    expect(w.emitted('back')).toHaveLength(1)
  })

  it('sends the version the Library has now, not the one this page read', async () => {
    profile.mockResolvedValue(ready)
    const { w, publish } = await page({ itemId: 'a' }, undefined, { version: 4 })
    await tid(w, 'library-share-rights').find('input').setChecked(true)
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(publish.mock.calls[0][1].version).toBe(4)
  })

  it('a profile whose page is off is not enough, and Check again looks again', async () => {
    profile.mockResolvedValue({ ...ready, page_on: false })
    const { w } = await page({ itemId: 'a' })
    expect(tid(w, 'library-share-setup').exists()).toBe(true)
    expect(tid(w, 'library-share-publish').exists()).toBe(false)
    profile.mockResolvedValue(ready)
    await tid(w, 'library-share-check-again').trigger('click')
    await flush()
    expect(tid(w, 'library-share-setup').exists()).toBe(false)
  })

  it('a print imported from someone else is not yours to share; Publish says what it still needs', async () => {
    profile.mockResolvedValue(ready)
    const { w } = await page({ itemId: 'i', items: [item('i', { origin: 'import' }), item('a')] })
    expect(tid(w, 'library-share-not-yours').text()).toContain('came from someone else')
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    await tid(w, 'library-share-choose').setValue('a')
    expect(tid(w, 'library-share-needs').text()).toBe('Confirm you made it, or may share it.')
    await tid(w, 'library-share-title').setValue('   ')
    expect(tid(w, 'library-share-needs').text()).toBe('Give it a title.')
  })

  it('says Made with AI as chosen', async () => {
    profile.mockResolvedValue(ready)
    const { w, publish } = await page({ itemId: 'a' })
    await tid(w, 'library-share-ai').setValue('partly')
    await tid(w, 'library-share-rights').find('input').setChecked(true)
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(publish.mock.calls[0][1].publication.ai_generated).toBe('partly')
  })

  it('the arrow keys move through Who can see it', async () => {
    profile.mockResolvedValue(ready)
    const { w } = await page({ itemId: 'a' })
    await tid(w, 'library-share-audience').find('[role="radiogroup"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(tid(w, 'library-share-audience-private').attributes('aria-checked')).toBe('true')
  })

  it('a print named in the address that is not in Yours says so, and offers a choice', async () => {
    profile.mockResolvedValue(ready)
    const { w } = await page({ itemId: 'zzz' })
    expect(tid(w, 'library-share-unknown').exists()).toBe(true)
    expect(tid(w, 'library-share-choose').exists()).toBe(true)
  })

  it('a print with no saved version says so beside Publish', async () => {
    profile.mockResolvedValue(ready)
    const { w } = await page({ itemId: 'v', items: [item('v', { version: null })] })
    await tid(w, 'library-share-rights').find('input').setChecked(true)
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    expect(tid(w, 'library-share-needs').text()).toBe('It needs a saved version: save it from Slice.')
  })
})

describe('Library v3 Share with people you choose, and by link', () => {
  const shareMock = (over: Record<string, unknown> = {}) => vi.fn(async (body: { audience: string }) => ({ id: 'sh1', state: 'active', audience: body.audience, title: 'Print a', version: 3, ...over }))

  async function sharePage (share: Publish, props: Record<string, unknown> = { itemId: 'a' }) {
    profile.mockResolvedValue(ready)
    const publish = vi.fn()
    setLibraryClient({ publish, share, item: vi.fn(async (id: string) => item(id)) } as never)
    const w = mount(LibrarySharePage, { propsData: { items: [item('a'), item('b', { setups: [] })], ...props }, stubs: { 'frame-icon': true, 'router-link': { template: '<a><slot /></a>' } } })
    wrappers.push(w)
    await flush()
    return { w, publish }
  }

  it('shows all four audiences, Only me and Everyone included', async () => {
    const { w } = await sharePage(shareMock())
    for (const id of ['private', 'direct', 'link', 'public']) expect(tid(w, `library-share-audience-${id}`).exists()).toBe(true)
    expect(tid(w, 'library-share-audience-direct').text()).toBe('People you choose')
    expect(tid(w, 'library-share-audience-link').text()).toBe('Anyone with the link')
  })

  it('says the G-code is not shared and a 3MF keeps its metadata', async () => {
    const { w } = await sharePage(shareMock())
    await tid(w, 'library-share-audience-link').trigger('click')
    expect(tid(w, 'library-share-what').text()).toContain('G-code is not shared')
    expect(tid(w, 'library-share-what').text()).toContain('metadata')
    expect(tid(w, 'library-share-what').text()).toContain('7 days')
  })

  it('sends audience direct with the recipient handle and nothing else (no publication, no email)', async () => {
    const share = shareMock()
    const { w, publish } = await sharePage(share)
    await tid(w, 'library-share-audience-direct').trigger('click')
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    expect(tid(w, 'library-share-needs').text()).toBe('Type at least one handle.')
    await tid(w, 'library-share-handles').setValue('@Maker.One')
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(share).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledWith({ item: 'a', version: 3, title: 'Print a', audience: 'direct', recipient: 'maker.one' })
    expect(publish).not.toHaveBeenCalled()
    expect(tid(w, 'library-share-done').text()).toContain('@maker.one')
  })

  it('shares with several handles, one share each, and refuses an email as a handle', async () => {
    const share = shareMock()
    const { w } = await sharePage(share)
    await tid(w, 'library-share-audience-direct').trigger('click')
    await tid(w, 'library-share-handles').setValue('me@example.com')
    expect(tid(w, 'library-share-needs').text()).toContain('a handle')
    expect(tid(w, 'library-share-publish').attributes('disabled')).toBe('disabled')
    await tid(w, 'library-share-handles').setValue('anna, @ben  anna')
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(share.mock.calls.map((c: unknown[]) => (c[0] as { recipient: string }).recipient)).toEqual(['anna', 'ben'])
  })

  it('link audience shows the key once as a fragment URL, and Copy copies it', async () => {
    const share = shareMock({ key: 'd9a1c2b3000040008000123456789abc' })
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { w } = await sharePage(share)
    await tid(w, 'library-share-audience-link').trigger('click')
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(share).toHaveBeenCalledWith({ item: 'a', version: 3, title: 'Print a', audience: 'link' })
    const url = (tid(w, 'library-share-link-url').element as HTMLInputElement).value
    expect(url).toBe('https://library.muon3d.com/p/sh1#d9a1c2b3000040008000123456789abc')
    const parsed = new URL(url)
    expect(parsed.search).toBe('')
    expect(parsed.pathname).not.toContain('d9a1c2b3')
    expect(tid(w, 'library-share-link-once').text()).toContain('shown once')
    await tid(w, 'library-share-link-copy').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith(url)
    expect(tid(w, 'library-share-link-done').text()).toContain('Link copied')
    await tid(w, 'library-share-link-done-back').trigger('click')
    expect(w.emitted('back')).toHaveLength(1)
  })

  it('shows the server refusal in plain words: unknown handle, blocked, rate limit', async () => {
    const refuse = (code: string, message: string, status: number) => vi.fn(async () => { throw new LibraryError(code, message, status) })
    const cases: Array<[Publish, string]> = [
      [refuse('recipient_not_found', 'no such recipient', 404), 'No one has the handle @ghost'],
      [refuse('blocked', 'blocked', 403), '@ghost can\'t be shared with'],
      [refuse('rate_limited', 'slow down', 429), 'Wait a while']
    ]
    for (const [share, text] of cases) {
      const { w } = await sharePage(share)
      await tid(w, 'library-share-audience-direct').trigger('click')
      await tid(w, 'library-share-handles').setValue('ghost')
      await tid(w, 'library-share-publish').trigger('click')
      await flush()
      expect(tid(w, 'library-share-error').text()).toContain(text)
      expect(tid(w, 'library-share-done').exists()).toBe(false)
    }
  })

  it('a link refusal is shown and no link appears', async () => {
    const { w } = await sharePage(vi.fn(async () => { throw new LibraryError('share_limit', 'You have 100 shares open.', 429) }))
    await tid(w, 'library-share-audience-link').trigger('click')
    await tid(w, 'library-share-publish').trigger('click')
    await flush()
    expect(tid(w, 'library-share-error').exists()).toBe(true)
    expect(tid(w, 'library-share-link-done').exists()).toBe(false)
  })

  it('Everyone still publishes for review and Only me still sends nothing', async () => {
    const share = shareMock()
    const { w, publish } = await sharePage(share)
    await tid(w, 'library-share-audience-private').trigger('click')
    await tid(w, 'library-share-publish').trigger('click')
    expect(share).not.toHaveBeenCalled()
    expect(publish).not.toHaveBeenCalled()
    expect(w.emitted('back')).toHaveLength(1)
    expect(tid(w, 'library-share-licence').exists()).toBe(false)
    await tid(w, 'library-share-audience-public').trigger('click')
    expect(tid(w, 'library-share-licence').exists()).toBe(true)
    expect(tid(w, 'library-share-audience-line').text()).toContain('reviewed first')
  })
})
