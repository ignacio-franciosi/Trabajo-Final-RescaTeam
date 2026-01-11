import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import api from '../services/axiosConfigUsers'
import { initPush } from '../services/PushService'

// Mock dependencies
vi.mock('../services/axiosConfigUsers', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('../services/PushService', () => ({
  initPush: vi.fn().mockResolvedValue(undefined),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString() }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

global.localStorage = localStorageMock

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('AuthProvider', () => {
    it('should provide auth context', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('token')
      expect(result.current).toHaveProperty('login')
      expect(result.current).toHaveProperty('logout')
      expect(result.current).toHaveProperty('register')
      expect(result.current).toHaveProperty('initialized')
    })

    it('should initialize from localStorage', async () => {
      const savedToken = 'saved-token'
      const savedUser = { userId: '123', type: 'user', suspended: false }
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return savedToken
        if (key === 'user') return JSON.stringify(savedUser)
        return null
      })

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      expect(result.current.token).toBe(savedToken)
      expect(result.current.user).toEqual(savedUser)
    })

    it('should initialize as false when no saved data', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      expect(result.current.token).toBe(null)
      expect(result.current.user).toBe(null)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' }
      const mockResponse = {
        data: {
          token: 'token123',
          id_user: 'user123',
          type: 'user',
          suspended: false,
        },
      }
      api.post.mockResolvedValue(mockResponse)

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(loginData)
      })

      expect(loginResult.success).toBe(true)
      expect(result.current.token).toBe('token123')
      expect(result.current.user).toEqual({
        userId: 'user123',
        type: 'user',
        suspended: false,
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'token123')
      expect(initPush).toHaveBeenCalledWith('token123')
    })

    it('should handle login errors', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' }
      const error = {
        response: {
          data: { message: 'Invalid credentials' },
        },
      }
      api.post.mockRejectedValue(error)

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(loginData)
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.message).toBe('Invalid credentials')
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'John',
        surname: 'Doe',
      }
      const mockResponse = {
        data: {
          token: 'token456',
          id_user: 'user456',
          type: 'user',
          suspended: false,
        },
      }
      api.post.mockResolvedValue(mockResponse)

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(registerData)
      })

      expect(registerResult.success).toBe(true)
      expect(result.current.token).toBe('token456')
      expect(initPush).toHaveBeenCalledWith('token456')
    })

    it('should handle registration errors', async () => {
      const registerData = { email: 'invalid' }
      const error = {
        response: {
          data: { message: 'Email already exists' },
        },
      }
      api.post.mockRejectedValue(error)

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(registerData)
      })

      expect(registerResult.success).toBe(false)
      expect(registerResult.message).toBe('Email already exists')
    })
  })

  describe('logout', () => {
    it('should logout and clear state', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      // Set some auth state first
      await act(async () => {
        api.post.mockResolvedValue({
          data: {
            token: 'token123',
            id_user: 'user123',
            type: 'user',
            suspended: false,
          },
        })
        await result.current.login({ email: 'test@example.com', password: 'pass' })
      })

      expect(result.current.token).toBeTruthy()

      // Now logout
      act(() => {
        result.current.logout()
      })

      expect(result.current.token).toBe(null)
      expect(result.current.user).toBe(null)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('setAuth', () => {
    it('should update token and user', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      act(() => {
        result.current.setAuth('new-token', { userId: 'user789', type: 'admin' })
      })

      expect(result.current.token).toBe('new-token')
      expect(result.current.user).toEqual({ userId: 'user789', type: 'admin' })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token')
    })

    it('should update only token if user not provided', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      act(() => {
        result.current.setAuth('token-only', null)
      })

      expect(result.current.token).toBe('token-only')
    })

    it('should update only user if token not provided', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.initialized).toBe(true)
      })

      act(() => {
        result.current.setAuth(null, { userId: 'user999' })
      })

      expect(result.current.user).toEqual({ userId: 'user999' })
    })
  })
})

