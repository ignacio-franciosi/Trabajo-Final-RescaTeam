import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUserById, updateUser, deleteUser } from './UserService'
import api from './axiosConfigUsers'

// Mock the axios config
vi.mock('./axiosConfigUsers', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserById', () => {
    it('should return user data on successful request', async () => {
      const mockUser = { id: '123', name: 'John Doe', email: 'john@example.com' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await getUserById('123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(api.get).toHaveBeenCalledWith('/user/123')
    })

    it('should return error on failed request', async () => {
      api.get.mockRejectedValue(new Error('Not found'))

      const result = await getUserById('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Usuario no encontrado')
    })
  })

  describe('updateUser', () => {
    it('should return updated user data on successful request', async () => {
      const updateData = { name: 'Jane Doe' }
      const updatedUser = { id: '123', name: 'Jane Doe', email: 'john@example.com' }
      api.patch.mockResolvedValue({ data: updatedUser })

      const result = await updateUser('123', updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedUser)
      expect(api.patch).toHaveBeenCalledWith('/user/123', updateData)
    })

    it('should return error message on failed request', async () => {
      const error = {
        response: {
          data: { error: 'Validation failed' },
        },
      }
      api.patch.mockRejectedValue(error)

      const result = await updateUser('123', {})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Validation failed')
    })

    it('should return default error message when no error response', async () => {
      api.patch.mockRejectedValue(new Error('Network error'))

      const result = await updateUser('123', {})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al actualizar el usuario')
    })
  })

  describe('deleteUser', () => {
    it('should return success message on successful deletion', async () => {
      api.delete.mockResolvedValue({ data: { message: 'Usuario eliminado' } })

      const result = await deleteUser('123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Usuario eliminado')
      expect(api.delete).toHaveBeenCalledWith('/user/123')
    })

    it('should return error message on failed deletion', async () => {
      const error = {
        response: {
          data: { error: 'No autorizado' },
        },
      }
      api.delete.mockRejectedValue(error)

      const result = await deleteUser('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('No autorizado')
    })

    it('should return default error message when no error response', async () => {
      api.delete.mockRejectedValue(new Error('Network error'))

      const result = await deleteUser('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al eliminar el usuario')
    })
  })
})

