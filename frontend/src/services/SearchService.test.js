import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSimilarPets } from './SearchService'
import apiSearch from './axiosConfigSearch'

// Mock the axios config
vi.mock('./axiosConfigSearch', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSimilarPets', () => {
    it('should get similar pets successfully', async () => {
      const mockResponse = { data: [{ id: '1' }, { id: '2' }] }
      apiSearch.get.mockResolvedValue(mockResponse)

      const result = await getSimilarPets('post123', 'adoption', 'perro')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(apiSearch.get).toHaveBeenCalledWith('/vectors/search?post_id=post123&post_type=adoption&species=perro')
    })

    it('should handle different post types', async () => {
      const mockResponse = { data: [{ id: '1' }] }
      apiSearch.get.mockResolvedValue(mockResponse)

      const result = await getSimilarPets('post456', 'lost', 'gato')

      expect(result.success).toBe(true)
      expect(apiSearch.get).toHaveBeenCalledWith('/vectors/search?post_id=post456&post_type=lost&species=gato')
    })

    it('should handle errors when getting similar pets', async () => {
      apiSearch.get.mockRejectedValue(new Error('Server error'))

      const result = await getSimilarPets('post123', 'adoption', 'perro')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al obtener publicaciones parecidas')
    })

    it('should handle network errors', async () => {
      apiSearch.get.mockRejectedValue(new Error('Network error'))

      const result = await getSimilarPets('post123', 'adoption', 'perro')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al obtener publicaciones parecidas')
    })
  })
})

