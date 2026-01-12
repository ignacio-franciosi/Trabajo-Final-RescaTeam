import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchUserName } from './UsersLookup'
import api from './axiosConfigUsers'

// Mock the axios config
vi.mock('./axiosConfigUsers', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('UsersLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchUserName', () => {
    it('should return full name when user is found', async () => {
      const mockUser = { name: 'John', surname: 'Doe' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('John Doe')
      expect(api.get).toHaveBeenCalledWith('/user/user123')
    })

    it('should return name only when surname is missing', async () => {
      const mockUser = { name: 'John', surname: '' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('John')
    })

    it('should return surname only when name is missing', async () => {
      const mockUser = { name: '', surname: 'Doe' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('Doe')
    })

    it('should return fallback when both name and surname are empty', async () => {
      const mockUser = { name: '', surname: '' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('Usuario user123')
    })

    it('should return fallback when user data is null', async () => {
      api.get.mockResolvedValue({ data: null })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('Usuario user123')
    })

    it('should handle errors gracefully and return fallback', async () => {
      api.get.mockRejectedValue(new Error('Not found'))

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(false)
      expect(result.fullName).toBe('Usuario user123')
    })

    it('should trim whitespace from name and surname', async () => {
      const mockUser = { name: '  John  ', surname: '  Doe  ' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('John Doe')
    })

    it('should handle undefined name/surname gracefully', async () => {
      const mockUser = { name: undefined, surname: undefined }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await fetchUserName('user123')

      expect(result.ok).toBe(true)
      expect(result.fullName).toBe('Usuario user123')
    })
  })
})

