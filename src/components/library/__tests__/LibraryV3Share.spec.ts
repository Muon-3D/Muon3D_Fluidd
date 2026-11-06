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
