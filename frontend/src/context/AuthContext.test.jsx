import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mocks
const mockInitPush = vi.fn()
const mockApiPost = vi.fn()
const mockApiGet = vi.fn()

vi.mock('../services/PushService', () => ({
  initPush: (token) => mockInitPush(token),
}))

vi.mock('../services/axiosConfigUsers', () => ({
  default: {
    post: (url, data) => mockApiPost(url, data),
    get: (url) => mockApiGet(url),
  },
}))

// Helper component to test the context
const TestComponent = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>
}

// Tests
describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockInitPush.mockResolvedValue(undefined)
    // Mock api.get to return user data with suspended status
    mockApiGet.mockResolvedValue({
      data: { suspended: false },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('provides initial state when no token in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    expect(result.current.user).toBe(null)
    expect(result.current.token).toBe(null)
    expect(result.current.login).toBeDefined()
    expect(result.current.logout).toBeDefined()
    expect(result.current.register).toBeDefined()
    expect(result.current.setAuth).toBeDefined()
    expect(mockInitPush).not.toHaveBeenCalled()
  })

  it('initializes from localStorage on mount', async () => {
    const savedToken = 'test-token-123'
    const savedUser = { userId: '123', type: false, suspended: false }
    localStorage.setItem('token', savedToken)
    localStorage.setItem('user', JSON.stringify(savedUser))

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    expect(result.current.token).toBe(savedToken)
    expect(result.current.user).toEqual(savedUser)
    expect(mockInitPush).toHaveBeenCalledWith(savedToken)
  })

  it('login sets token and user on success', async () => {
    const mockToken = 'new-token-456'
    const mockUserData = { id_user: '456', type: true, suspended: false }
    mockApiPost.mockResolvedValue({
      data: {
        token: mockToken,
        ...mockUserData,
      },
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(response.success).toBe(true)
    })

    expect(mockApiPost).toHaveBeenCalledWith('/login', {
      email: 'test@example.com',
      password: 'password123',
    })

    await waitFor(() => {
      expect(result.current.token).toBe(mockToken)
      expect(result.current.user).toEqual({
        userId: mockUserData.id_user,
        type: mockUserData.type,
        suspended: mockUserData.suspended,
      })
      expect(localStorage.getItem('token')).toBe(mockToken)
      expect(JSON.parse(localStorage.getItem('user'))).toEqual({
        userId: mockUserData.id_user,
        type: mockUserData.type,
        suspended: mockUserData.suspended,
      })
    })

    expect(mockInitPush).toHaveBeenCalledWith(mockToken)
  })

  it('login returns error on failure', async () => {
    const errorMessage = 'Credenciales inválidas'
    mockApiPost.mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe(errorMessage)
    })

    expect(result.current.token).toBe(null)
    expect(result.current.user).toBe(null)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('login returns default error message when no error message provided', async () => {
    mockApiPost.mockRejectedValue({})

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe('Error al iniciar sesión.')
    })
  })

  it('register sets token and user on success', async () => {
    const mockToken = 'register-token-789'
    const mockUserData = { id_user: '789', type: false, suspended: false }
    mockApiPost.mockResolvedValue({
      data: {
        token: mockToken,
        ...mockUserData,
      },
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    const registerData = {
      name: 'Juan',
      surname: 'Pérez',
      dni: 12345678,
      email: 'juan@example.com',
      password: 'Password123',
    }

    await act(async () => {
      const response = await result.current.register(registerData)

      expect(response.success).toBe(true)
    })

    expect(mockApiPost).toHaveBeenCalledWith('/register', registerData)

    await waitFor(() => {
      expect(result.current.token).toBe(mockToken)
      expect(result.current.user).toEqual({
        userId: mockUserData.id_user,
        type: mockUserData.type,
        suspended: mockUserData.suspended,
      })
      expect(localStorage.getItem('token')).toBe(mockToken)
    })

    expect(mockInitPush).toHaveBeenCalledWith(mockToken)
  })

  it('register returns error on failure', async () => {
    const errorMessage = 'Email ya registrado'
    mockApiPost.mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    await act(async () => {
      const response = await result.current.register({
        email: 'test@example.com',
        password: 'Password123',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe(errorMessage)
    })

    expect(result.current.token).toBe(null)
    expect(result.current.user).toBe(null)
  })

  it('register returns default error message when no error message provided', async () => {
    mockApiPost.mockRejectedValue({})

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    await act(async () => {
      const response = await result.current.register({
        email: 'test@example.com',
        password: 'Password123',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe('Error al registrarse.')
    })
  })

  it('logout clears token and user', async () => {
    const savedToken = 'test-token-123'
    const savedUser = { userId: '123', type: false, suspended: false }
    localStorage.setItem('token', savedToken)
    localStorage.setItem('user', JSON.stringify(savedUser))

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
      expect(result.current.token).toBe(savedToken)
    })

    await act(() => {
      result.current.logout()
    })

    expect(result.current.token).toBe(null)
    expect(result.current.user).toBe(null)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('setAuth updates token and user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    const newToken = 'new-token-999'
    const newUser = { userId: '999', type: true, suspended: false }

    await act(() => {
      result.current.setAuth(newToken, newUser)
    })

    await waitFor(() => {
      expect(result.current.token).toBe(newToken)
      expect(result.current.user).toEqual(newUser)
      expect(localStorage.getItem('token')).toBe(newToken)
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(newUser)
    })

    expect(mockInitPush).toHaveBeenCalledWith(newToken)
  })

  it('setAuth updates only token when user is not provided', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    const newToken = 'new-token-only'

    await act(() => {
      result.current.setAuth(newToken, null)
    })

    await waitFor(() => {
      expect(result.current.token).toBe(newToken)
      expect(localStorage.getItem('token')).toBe(newToken)
    })
  })

  it('setAuth updates only user when token is not provided', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestComponent,
    })

    await waitFor(() => {
      expect(result.current.initialized).toBe(true)
    })

    const newUser = { userId: '888', type: false, suspended: false }

    await act(() => {
      result.current.setAuth(null, newUser)
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(newUser)
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(newUser)
    })
  })
})