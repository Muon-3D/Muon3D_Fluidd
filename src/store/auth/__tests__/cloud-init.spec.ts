import { beforeEach, describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { MANAGED_API_URL } from '@/services/muon-cloud/origin'

const http = vi.hoisted(() => ({
  accessCurrentUserGet: vi.fn(),
  accessUsersListGet: vi.fn(),
  accessApiKeyGet: vi.fn()
}))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))
vi.mock('@/router', () => ({ default: {} }))

const init = (apiUrl: string) => {
  const commit = vi.fn()
  const run = actions.init as (context: object) => Promise<void>
  return { commit, done: run({ commit, rootState: { config: { apiUrl } } }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  http.accessCurrentUserGet.mockResolvedValue({ data: { result: { username: 'jack' } } })
  http.accessUsersListGet.mockResolvedValue({ data: { result: { users: [] } } })
  http.accessApiKeyGet.mockResolvedValue({ data: { result: 'key' } })
})

describe('auth/init', () => {
  it('asks a cloud printer for none of the endpoints its gateway always refuses', async () => {
    const { commit, done } = init(MANAGED_API_URL)
    await done

    expect(http.accessCurrentUserGet).not.toHaveBeenCalled()
    expect(http.accessUsersListGet).not.toHaveBeenCalled()
    expect(http.accessApiKeyGet).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('still loads the user, the user list and the API key from a printer on the LAN', async () => {
    const { commit, done } = init('http://192.168.1.153')
    await done

    expect(http.accessCurrentUserGet).toHaveBeenCalledOnce()
    expect(http.accessUsersListGet).toHaveBeenCalledOnce()
    expect(http.accessApiKeyGet).toHaveBeenCalledOnce()
    expect(commit).toHaveBeenCalledWith('setCurrentUser', { username: 'jack' })
    expect(commit).toHaveBeenCalledWith('setUsers', [])
    expect(commit).toHaveBeenCalledWith('setApiKey', 'key')
  })
})
