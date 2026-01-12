import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
  suspendUser,
  reactivateUser,
  getSuspendedUsers,
  getUserPublicById,
} from './UserService'
import api from './axiosConfigUsers'

// Mock the axios config
vi.mock('./axiosConfigUsers', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
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


  describe('getUserByEmail', () => {
    it('should return user data on successful request', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await getUserByEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(api.get).toHaveBeenCalledWith('/user/email/test@example.com')
    })

    it('should return error message on failed request', async () => {
      api.get.mockRejectedValue(new Error('Not found'))

      const result = await getUserByEmail('test@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email no encontrado')
    })
  })

  describe('suspendUser', () => {
    it('should return suspended user data on successful request', async () => {
      const mockUser = { id: '123', suspended: true }
      api.patch.mockResolvedValue({ data: mockUser })

      const result = await suspendUser('123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(api.patch).toHaveBeenCalledWith('/user/suspend/123')
    })

    it('should return error message on failed request', async () => {
      const error = {
        response: {
          data: { error: 'No autorizado' },
        },
      }
      api.patch.mockRejectedValue(error)

      const result = await suspendUser('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('No autorizado')
    })

    it('should return default error message when no error response', async () => {
      api.patch.mockRejectedValue(new Error('Network error'))

      const result = await suspendUser('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al suspender usuario')
    })
  })

  describe('reactivateUser', () => {
    it('should return reactivated user data on successful request', async () => {
      const mockUser = { id: '123', suspended: false }
      api.patch.mockResolvedValue({ data: mockUser })

      const result = await reactivateUser('123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(api.patch).toHaveBeenCalledWith('/user/reactivate/123')
    })

    it('should return error message on failed request', async () => {
      const error = {
        response: {
          data: { error: 'Usuario no encontrado' },
        },
      }
      api.patch.mockRejectedValue(error)

      const result = await reactivateUser('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Usuario no encontrado')
    })

    it('should return default error message when no error response', async () => {
      api.patch.mockRejectedValue(new Error('Network error'))

      const result = await reactivateUser('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al reactivar usuario')
    })
  })

  describe('getSuspendedUsers', () => {
    it('should return suspended users list on successful request', async () => {
      const mockUsers = [
        { id: '123', name: 'User 1', suspended: true },
        { id: '456', name: 'User 2', suspended: true },
      ]
      api.get.mockResolvedValue({ data: mockUsers })

      const result = await getSuspendedUsers()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUsers)
      expect(api.get).toHaveBeenCalledWith('/user/suspended')
    })

    it('should return error message on failed request', async () => {
      const error = {
        response: {
          data: { error: 'No autorizado' },
        },
      }
      api.get.mockRejectedValue(error)

      const result = await getSuspendedUsers()

      expect(result.success).toBe(false)
      expect(result.message).toBe('No autorizado')
    })

    it('should return default error message when no error response', async () => {
      api.get.mockRejectedValue(new Error('Network error'))

      const result = await getSuspendedUsers()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al obtener usuarios suspendidos')
    })
  })

  describe('getUserPublicById', () => {
    it('should return public user data on successful request', async () => {
      const mockUser = { id_user: '123', name: 'John', surname: 'Doe' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await getUserPublicById('123')

      expect(result).toEqual(mockUser)
      expect(api.get).toHaveBeenCalledWith('/user/public/123')
    })

    it('should throw error on failed request', async () => {
      api.get.mockRejectedValue(new Error('Not found'))

      await expect(getUserPublicById('123')).rejects.toThrow('Not found')
    })
  })

})
