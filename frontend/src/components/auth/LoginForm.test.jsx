import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginForm from './LoginForm'
import { AuthContext } from '../../context/AuthContext'

// Mocks
const mockNavigate = vi.fn()
const mockLogin = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helpers
const renderWithProviders = (loginMock = mockLogin) => {
  const authValue = {
    user: null,
    token: null,
    login: loginMock,
    logout: vi.fn(),
    register: vi.fn(),
    initialized: true,
    setAuth: vi.fn(),
  }

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <LoginForm />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

// Tests
describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form with all fields', () => {
    renderWithProviders()
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('renders links to forgot password and register', () => {
    renderWithProviders()
    expect(screen.getByRole('link', { name: /¿olvidaste tu contraseña\?/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /registrarme/i })).toBeInTheDocument()
  })

  it('updates email and password fields on input', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
    })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('calls login with credentials on submit', async () => {
    const user = userEvent.setup()
    const loginMock = vi.fn().mockResolvedValue({ success: true })
    renderWithProviders(loginMock)

    await act(async () => {
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ingresar/i }))
    })

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('navigates to home when login succeeds', async () => {
    const user = userEvent.setup()
    const loginMock = vi.fn().mockResolvedValue({ success: true })
    renderWithProviders(loginMock)

    await act(async () => {
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ingresar/i }))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('navigates to redirect path from localStorage when login succeeds', async () => {
    const user = userEvent.setup()
    const loginMock = vi.fn().mockResolvedValue({ success: true })
    localStorage.setItem('redirectAfterLogin', '/some-path')
    renderWithProviders(loginMock)

    await act(async () => {
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ingresar/i }))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/some-path')
      expect(localStorage.getItem('redirectAfterLogin')).toBeNull()
    })
  })

  it('displays error message when login fails', async () => {
    const user = userEvent.setup()
    const loginMock = vi.fn().mockResolvedValue({
      success: false,
      message: 'Credenciales inválidas',
    })
    renderWithProviders(loginMock)

    await act(async () => {
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /ingresar/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('displays default error message when login fails without message', async () => {
    const user = userEvent.setup()
    const loginMock = vi.fn().mockResolvedValue({ success: false })
    renderWithProviders(loginMock)

    await act(async () => {
      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /ingresar/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })
  })

  it('requires email and password fields', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /ingresar/i }))
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })
})
