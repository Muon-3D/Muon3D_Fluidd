import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryFollowingShelf from '../v2/LibraryFollowingShelf.vue'
import LibraryPublicCollectionPage from '../v2/LibraryPublicCollectionPage.vue'
import MuonLibrary from '../v2/MuonLibrary.vue'
import { setLibraryClient } from '@/services/library/store'
import { LibraryError } from '@/services/library/api'

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
  vi.unstubAllGlobals()
})

const col = (id: string, name: string, n = 2) => ({ id, name, description: '', visibility: 'public' as const, created_at: '', updated_at: '', item_count: n })
const stubs = { 'frame-icon': true }

describe('Following shelf', () => {
  function shelf (client: Record<string, unknown>, propsData: Record<string, unknown> = {}) {
    setLibraryClient({ followedCollections: vi.fn(async () => ({ collections: [] })), unfollowCollection: vi.fn(async () => null), ...client } as never)
    const w = mount(LibraryFollowingShelf, { stubs, propsData, attachTo: document.body })
    wrappers.push(w)
    return w
  }

  it('lists the collections you follow with their name and count; one opens its public view', async () => {
    const w = shelf({ followedCollections: vi.fn(async () => ({ collections: [col('c1', 'Desk things', 3), col('c2', 'One only', 1)] })) })
    await flush()
    expect(w.find('[data-tid="library-following-c1"]').text()).toContain('Desk things')
    expect(w.find('[data-tid="library-following-c1"]').text()).toContain('3 prints')
    expect(w.find('[data-tid="library-following-c2"]').text()).toContain('1 print')
    await w.find('[data-tid="library-following-open-c2"]').trigger('click')
    expect(w.emitted('open-collection')).toEqual([['c2']])
  })

  it('says so when you follow none, with a way to Discover', async () => {
    const w = shelf({})
    await flush()
    expect(w.find('[data-tid="library-shelf-following-empty"]').text()).toContain('You don\'t follow any collections yet.')
    await w.find('[data-tid="library-shelf-following-empty-action"]').trigger('click')
    expect(w.emitted('go-discover')).toHaveLength(1)
  })

  it('a failed read says so with Try again, and Retry reads it again', async () => {
    const followed = vi.fn()
      .mockRejectedValueOnce(new LibraryError('offline', 'x'))
      .mockResolvedValueOnce({ collections: [col('c1', 'Back again')] })
    const w = shelf({ followedCollections: followed })
    await flush()
    expect(w.find('[data-tid="library-shelf-following-error"]').text()).toContain('Check this computer\'s internet connection.')
    await w.find('[data-tid="library-shelf-following-error"] button').trigger('click')
    await flush()
    expect(w.find('[data-tid="library-following-c1"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-shelf-following-error"]').exists()).toBe(false)
  })

  it('signed out it is hidden and reads nothing', async () => {
    const followedCollections = vi.fn(async () => ({ collections: [] }))
    const w = shelf({ followedCollections }, { signedIn: false })
    await flush()
    expect(w.find('[data-tid="library-following"]').exists()).toBe(false)
    expect(followedCollections).not.toHaveBeenCalled()
  })

  it('Unfollow takes it off the shelf at once; a refusal puts it back and says why', async () => {
    const unfollowCollection = vi.fn()
      .mockRejectedValueOnce(new LibraryError('boom', 'The Library is busy.'))
      .mockResolvedValueOnce(null)
    const w = shelf({ followedCollections: vi.fn(async () => ({ collections: [col('c1', 'Desk things')] })), unfollowCollection })
    await flush()
    await w.find('[data-tid="library-following-unfollow-c1"]').trigger('click')
    await flush()
    expect(unfollowCollection).toHaveBeenCalledWith('c1')
    expect(w.find('[data-tid="library-following-c1"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-following-note"]').text()).toBe('Couldn\'t unfollow Desk things. The Library is busy.')
    await w.find('[data-tid="library-following-unfollow-c1"]').trigger('click')
    await flush()
    expect(w.find('[data-tid="library-following-c1"]').exists()).toBe(false)
    expect(w.find('[data-tid="library-shelf-following-empty"]').exists()).toBe(true)
  })

  it('a name from the service is text, never markup', async () => {
    const name = '<img src=x onerror="window.pwned=1">Evil'
    const w = shelf({ followedCollections: vi.fn(async () => ({ collections: [col('c1', name)] })) })
    await flush()
    expect(w.find('[data-tid="library-following-c1"] img').exists()).toBe(false)
    expect(w.find('[data-tid="library-following-c1"] strong').text()).toBe(name)
  })
})

const detail = (over: Record<string, unknown> = {}) => ({
  ...col('c9', 'Maker picks', 1),
  description: 'Things I like',
  items: [{ save_id: 'pub-p1', target: { kind: 'publication', id: 'p1' }, card: { title: 'Print p1', thumbnail_url: 'https://library.muon3d.com/models/x/p1.png', creator: 'Okoro', url: '/p/print-p1', availability: 'available' } }],
  ...over
})

function publicFetch (body: unknown, status = 200) {
  const fetcher = vi.fn<[string, RequestInit?], Promise<Response>>(async url => String(url).includes('/v1/public/collections/')
    ? new Response(JSON.stringify(body), { status })
    : new Response(JSON.stringify({ images: [] }), { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

describe('Someone else\'s public collection', () => {
  function view (client: Record<string, unknown>, propsData: Record<string, unknown> = {}) {
    setLibraryClient({ followedCollections: vi.fn(async () => ({ collections: [] })), followCollection: vi.fn(async () => null), unfollowCollection: vi.fn(async () => null), ...client } as never)
    const w = mount(LibraryPublicCollectionPage, { stubs, propsData: { collectionId: 'c9', signedIn: true, canFollow: true, ...propsData }, attachTo: document.body })
    wrappers.push(w)
    return w
  }
  const follow = (w: ReturnType<typeof view>) => w.find('[data-tid="library-collection-follow"]')

  it('shows its name, description and prints read-only, reading it with no account, and focuses the heading', async () => {
    const fetcher = publicFetch(detail())
    const w = view({})
    await flush()
    expect(fetcher.mock.calls[0][0]).toBe('https://library.muon3d.com/models/v1/public/collections/c9')
    expect(fetcher.mock.calls[0][1]?.credentials).toBe('omit')
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Maker picks')
    expect(w.find('[data-tid="library-collection-description"]').text()).toBe('Things I like')
    expect(w.find('.mcard__title').text()).toBe('Print p1')
    expect(w.find('[data-tid="library-collection-rename"]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('[data-tid="library-collection-title"]').element)
  })

  it('Follow is optimistic and becomes Following (aria-pressed); Following unfollows', async () => {
    publicFetch(detail())
    const followCollection = vi.fn(async () => null)
    const unfollowCollection = vi.fn(async () => null)
    const w = view({ followCollection, unfollowCollection })
    await flush()
    expect(follow(w).text()).toBe('Follow')
    expect(follow(w).attributes('aria-pressed')).toBe('false')
    await follow(w).trigger('click')
    expect(follow(w).text()).toBe('Following')
    expect(follow(w).attributes('aria-pressed')).toBe('true')
    await flush()
    expect(followCollection).toHaveBeenCalledWith('c9')
    await follow(w).trigger('click')
    await flush()
    expect(unfollowCollection).toHaveBeenCalledWith('c9')
    expect(follow(w).text()).toBe('Follow')
  })

  it('already following shows Following', async () => {
    publicFetch(detail())
    const w = view({ followedCollections: vi.fn(async () => ({ collections: [col('c9', 'Maker picks')] })) })
    await flush()
    expect(follow(w).text()).toBe('Following')
  })

  it('a 500 puts Follow back and says what failed', async () => {
    publicFetch(detail())
    const w = view({ followCollection: vi.fn(async () => { throw new LibraryError('http-500', 'The Library answered 500.', 500) }) })
    await flush()
    await follow(w).trigger('click')
    await flush()
    expect(follow(w).text()).toBe('Follow')
    expect(follow(w).attributes('aria-pressed')).toBe('false')
    expect(w.find('[data-tid="library-collection-note"]').text()).toBe('Couldn\'t follow this collection. The Library answered 500.')
  })

  it('at the 500-follow limit it shows the service\'s own words', async () => {
    publicFetch(detail())
    const w = view({ followCollection: vi.fn(async () => { throw new LibraryError('follow_limit', 'You can follow up to 500 collections.', 400) }) })
    await flush()
    await follow(w).trigger('click')
    await flush()
    expect(follow(w).text()).toBe('Follow')
    expect(w.find('[data-tid="library-collection-note"]').text()).toBe('You can follow up to 500 collections.')
  })

  it('your own collection has no Follow button', async () => {
    publicFetch(detail())
    const w = view({}, { canFollow: false })
    await flush()
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Maker picks')
    expect(follow(w).exists()).toBe(false)
    expect(w.find('[data-tid="library-collection-sign-in"]').exists()).toBe(false)
  })

  it('signed out it says Sign in to follow, and asks to sign in; it never reads who you follow', async () => {
    publicFetch(detail())
    const followedCollections = vi.fn(async () => ({ collections: [] }))
    const w = view({ followedCollections }, { signedIn: false, canFollow: false })
    await flush()
    expect(follow(w).exists()).toBe(false)
    const button = w.find('[data-tid="library-collection-sign-in"]')
    expect(button.text()).toBe('Sign in to follow')
    await button.trigger('click')
    expect(w.emitted('sign-in')).toHaveLength(1)
    expect(followedCollections).not.toHaveBeenCalled()
  })

  it('a missing or private collection says it is not available, with no Follow', async () => {
    publicFetch({ error: { code: 'not_found' } }, 404)
    const w = view({})
    await flush()
    expect(w.find('[data-tid="library-collection-unavailable"]').text()).toContain('This collection is not available.')
    expect(follow(w).exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('[data-tid="library-collection-title"]').element)
  })

  it('another failure says so with Try again', async () => {
    const fetcher = publicFetch({}, 503)
    const w = view({})
    await flush()
    expect(w.find('[data-tid="library-collection-error"]').text()).toContain('The Library didn\'t answer. Try again.')
    fetcher.mockImplementation(async () => new Response(JSON.stringify(detail()), { status: 200 }))
    await w.find('[data-tid="library-collection-error"] button').trigger('click')
    await flush()
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Maker picks')
  })

  it('a title and description with markup stay text', async () => {
    const evil = '<img src=x onerror="window.pwned=1">'
    publicFetch(detail({ name: evil, description: evil }))
    const w = view({})
    await flush()
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe(evil)
    expect(w.find('[data-tid="library-collection-description"]').text()).toBe(evil)
    expect(w.find('[data-tid="library-collection-title"] img').exists()).toBe(false)
    expect(w.find('[data-tid="library-collection-description"] img').exists()).toBe(false)
  })
})

describe('Which page a collection opens', () => {
  function library (collections: unknown[], propsData: Record<string, unknown>) {
    setLibraryClient({
      collections: vi.fn(async () => ({ collections })),
      collection: vi.fn(async () => ({ ...col('mine', 'My own'), visibility: 'private', items: [] })),
      followedCollections: vi.fn(async () => ({ collections: [] })),
      saved: vi.fn(async () => ({ saves: [], next_cursor: null }))
    } as never)
    publicFetch(detail({ id: 'theirs' }))
    const w = mount(MuonLibrary, {
      stubs: { ...stubs, 'library-yours-shelves': true },
      propsData: { tab: 'yours', ...propsData },
      mocks: { $vuetify: { breakpoint: { xsOnly: false } } },
      attachTo: document.body
    })
    wrappers.push(w)
    return w
  }

  it('one in your own list is your page; one that is not is the public view with Follow', async () => {
    const own = library([col('mine', 'My own')], { signedIn: true, collection: 'mine' })
    await flush()
    expect(own.find('[data-tid="library-collection-page"]').exists()).toBe(true)
    expect(own.find('[data-tid="library-public-collection"]').exists()).toBe(false)
    const other = library([col('mine', 'My own')], { signedIn: true, collection: 'theirs' })
    await flush()
    expect(other.find('[data-tid="library-public-collection"]').exists()).toBe(true)
    expect(other.find('[data-tid="library-collection-follow"]').exists()).toBe(true)
  })

  it('signed out it is the public view with Sign in to follow', async () => {
    const w = library([], { signedIn: false, collection: 'theirs' })
    await flush()
    expect(w.find('[data-tid="library-public-collection"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-collection-sign-in"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-collection-follow"]').exists()).toBe(false)
  })
})
