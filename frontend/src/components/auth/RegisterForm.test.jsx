import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import RegisterForm from './RegisterForm'
import { AuthContext } from '../../context/AuthContext'

// Mocks

const mockNavigate = vi.fn()
const mockRegister = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock validators
vi.mock('../../utils/validators', () => ({
  validateEmail: vi.fn((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  }),
  validatePassword: vi.fn((password) => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una mayúscula.'
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe contener al menos una minúscula.'
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe contener al menos un número.'
    }
    return null
  }),
  validateRequiredFields: vi.fn((formData, requiredFields) => {
    const errors = {}
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = 'Este campo es obligatorio.'
      }
    })
    return errors
  }),
}))

// Helpers

const renderWithProviders = (registerMock = mockRegister) => {
  const authValue = {
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: registerMock,
    initialized: true,
    setAuth: vi.fn(),
  }

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <RegisterForm />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

const fillForm = async (user, formData) => {
  // Map field names to more specific label patterns or use getByRole/getById
  const fieldSelectors = {
    password: () => screen.getByLabelText(/^contraseña$/i), // Exact match, not "Confirmar Contraseña"
    confirmPassword: () => screen.getByLabelText(/confirmar contraseña/i),
    nombre: () => screen.getByLabelText(/^nombre$/i),
    apellido: () => screen.getByLabelText(/^apellido$/i),
    dni: () => screen.getByLabelText(/^dni$/i),
    email: () => screen.getByLabelText(/^email$/i),
  }
  
  for (const [field, value] of Object.entries(formData)) {
    const getInput = fieldSelectors[field] || (() => screen.getByLabelText(new RegExp(field, 'i')))
    const input = getInput()
    await user.clear(input)
    await user.type(input, value)
  }
}

// Tests

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders register form with all required fields', () => {
    renderWithProviders()

    expect(screen.getByRole('heading', { level: 2, name: /registrarse/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^apellido$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^dni$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    renderWithProviders()
    expect(screen.getByRole('link', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('updates form fields on input', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
    })

    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Juan')
    expect(screen.getByLabelText(/^apellido$/i)).toHaveValue('Pérez')
    expect(screen.getByLabelText(/^dni$/i)).toHaveValue('12345678')
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('juan@example.com')
    expect(screen.getByLabelText(/^contraseña$/i)).toHaveValue('Password123')
  })

  it('clears field error when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const nombreInput = screen.getByLabelText(/nombre/i)
    await act(async () => {
      await fillForm(user, {
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/este campo es obligatorio/i)).toBeInTheDocument()
    })

    await act(async () => {
      await user.type(nombreInput, 'Juan')
    })

    await waitFor(() => {
      expect(screen.queryByText(/este campo es obligatorio/i)).not.toBeInTheDocument()
    })
  })

  it('validates required fields on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      const errors = screen.getAllByText(/este campo es obligatorio/i)
      expect(errors.length).toBeGreaterThan(0)
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('validates password strength', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'weak',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(
        screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)
      ).toBeInTheDocument()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('calls register with correct payload on valid submit', async () => {
    const user = userEvent.setup()
    const registerMock = vi.fn().mockResolvedValue({ success: true })
    renderWithProviders(registerMock)

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'Juan',
        surname: 'Pérez',
        dni: 12345678,
        email: 'juan@example.com',
        password: 'Password123',
        type: false,
        suspended: false,
      })
    })
  })

  it('navigates to home when registration succeeds', async () => {
    const user = userEvent.setup()
    const registerMock = vi.fn().mockResolvedValue({ success: true })
    renderWithProviders(registerMock)

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled()
    })

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      },
      { timeout: 1000 }
    )
  })

  it('navigates to redirect path from localStorage when registration succeeds', async () => {
    const user = userEvent.setup()
    const registerMock = vi.fn().mockResolvedValue({ success: true })
    localStorage.setItem('redirectAfterLogin', '/some-path')
    renderWithProviders(registerMock)

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled()
    })

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/some-path')
        expect(localStorage.getItem('redirectAfterLogin')).toBeNull()
      },
      { timeout: 1000 }
    )
  })

  it('displays backend error message when registration fails', async () => {
    const user = userEvent.setup()
    const registerMock = vi.fn().mockResolvedValue({
      success: false,
      message: 'Email ya registrado',
    })
    renderWithProviders(registerMock)

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Email ya registrado')).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('displays default error message when registration fails without message', async () => {
    const user = userEvent.setup()
    const registerMock = vi.fn().mockResolvedValue({ success: false })
    renderWithProviders(registerMock)

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Error al registrarse')).toBeInTheDocument()
    })
  })

  it('clears backend error when form is resubmitted', async () => {
    const user = userEvent.setup()
    const registerMock = vi
      .fn()
      .mockResolvedValueOnce({ success: false, message: 'Error' })
      .mockResolvedValueOnce({ success: true })
    renderWithProviders(registerMock)

    await act(async () => {
      await fillForm(user, {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /registrarse/i }))
    })

    await waitFor(() => {
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })
  })
})
