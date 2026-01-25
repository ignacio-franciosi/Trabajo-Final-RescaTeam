import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AdoptionForm from './AdoptionForm'
import { AuthContext } from '../../context/AuthContext'

// Mocks
const mockNavigate = vi.fn()
const mockCreatePost = vi.fn()
const mockAutocompletePostFromImage = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/PostService', () => ({
  createPost: (formData) => mockCreatePost(formData),
  autocompletePostFromImage: (file) => mockAutocompletePostFromImage(file),
}))

vi.mock('./ZoneSelect', () => ({
  default: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid="zone-select"
      >
        <option value="">Seleccionar barrio</option>
        <option value="Centro">Centro</option>
        <option value="Villa Allende">Villa Allende</option>
      </select>
    </div>
  ),
}))

// Helpers
const renderWithProviders = (user = { id: '123', suspended: false }) => {
  const authValue = {
    user,
    token: 'test-token',
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    initialized: true,
    setAuth: vi.fn(),
  }

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <AdoptionForm />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

// Tests
describe('AdoptionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', 'test-token')
    
    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = vi.fn()
    
    // Mock URL.createObjectURL for file previews
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders adoption form with all required fields', () => {
    renderWithProviders()

    expect(screen.getByRole('heading', { level: 2, name: /publicar mascota en adopción/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre.*opcional/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/especie/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/edad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/raza.*opcional/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tamaño/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sexo/i)).toBeInTheDocument()
    expect(screen.getByTestId('zone-select')).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción.*opcional/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
  })

  it('renders SuspendedNotice when user is suspended', () => {
    renderWithProviders({ id: '123', suspended: true })
    
    expect(screen.queryByRole('heading', { level: 2, name: /publicar mascota en adopción/i })).not.toBeInTheDocument()
  })

  it('updates form fields on input', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const nameInput = screen.getByLabelText(/nombre.*opcional/i)
    const ageInput = screen.getByLabelText(/edad/i)
    const colorInput = screen.getByLabelText(/color/i)

    await act(async () => {
      await user.type(nameInput, 'Lola')
      await user.type(ageInput, '5')
      await user.type(colorInput, 'Blanco')
    })

    expect(nameInput).toHaveValue('Lola')
    expect(ageInput).toHaveValue(5)
    expect(colorInput).toHaveValue('Blanco')
  })

  it('validates required fields on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /publicar/i }))
    })

    await waitFor(() => {
      const errors = screen.getAllByText(/obligatorio/i)
      expect(errors.length).toBeGreaterThan(0)
    })

    expect(mockCreatePost).not.toHaveBeenCalled()
  })

  it('validates age is a valid number', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const ageInput = screen.getByLabelText(/edad/i)

    await act(async () => {
      await user.type(ageInput, '-5')
    })

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /publicar/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/edad inválida/i)).toBeInTheDocument()
    })

    expect(mockCreatePost).not.toHaveBeenCalled()
  })

  it('calls createPost with correct payload on valid submit', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockResolvedValue({ success: true, data: { id: '123' } })
    renderWithProviders()

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const ageInput = screen.getByLabelText(/edad/i)
      const colorInput = screen.getByLabelText(/color/i)
      const zoneSelect = screen.getByTestId('zone-select')
      const fileInput = document.getElementById('adoption-file-input')

      await user.type(ageInput, '5')
      await user.type(colorInput, 'Blanco')
      await user.selectOptions(zoneSelect, 'Centro')
      
      // Add image file (required for form submission)
      await user.upload(fileInput, file)
    })

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /publicar/i }))
    })

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled()
    })

    const formData = mockCreatePost.mock.calls[0][0]
    expect(formData).toBeInstanceOf(FormData)
  })

  it('navigates to mis-publicaciones when post is created successfully', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockResolvedValue({ success: true, data: { id: '123' } })
    renderWithProviders()

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const ageInput = screen.getByLabelText(/edad/i)
      const colorInput = screen.getByLabelText(/color/i)
      const zoneSelect = screen.getByTestId('zone-select')
      const fileInput = document.getElementById('adoption-file-input')

      await user.type(ageInput, '5')
      await user.type(colorInput, 'Blanco')
      await user.selectOptions(zoneSelect, 'Centro')
      
      // Add image file (required for form submission)
      await user.upload(fileInput, file)
      
      await user.click(screen.getByRole('button', { name: /publicar/i }))
    })

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled()
    })

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/mis-publicaciones?type=adoption')
      },
      { timeout: 2000 }
    )
  })

  it('displays default error message when post creation fails without message', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockResolvedValue({ success: false })
    renderWithProviders()

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const ageInput = screen.getByLabelText(/edad/i)
      const colorInput = screen.getByLabelText(/color/i)
      const zoneSelect = screen.getByTestId('zone-select')
      const fileInput = document.getElementById('adoption-file-input')

      await user.type(ageInput, '5')
      await user.type(colorInput, 'Blanco')
      await user.selectOptions(zoneSelect, 'Centro')
      
      // Add image file (required for form submission)
      await user.upload(fileInput, file)
      
      await user.click(screen.getByRole('button', { name: /publicar/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/error al crear publicación/i)).toBeInTheDocument()
    })
  })

  it('allows toggling checkboxes', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const neuteredCheckbox = screen.getByLabelText(/castrado/i)
    const vaccinesCheckbox = screen.getByLabelText(/vacunas completas/i)

    await act(async () => {
      await user.click(neuteredCheckbox)
      await user.click(vaccinesCheckbox)
    })

    expect(neuteredCheckbox).toBeChecked()
    expect(vaccinesCheckbox).toBeChecked()
  })

  it('shows success message when post is created', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockResolvedValue({ success: true, data: { id: '123' } })
    renderWithProviders()

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await act(async () => {
      const ageInput = screen.getByLabelText(/edad/i)
      const colorInput = screen.getByLabelText(/color/i)
      const zoneSelect = screen.getByTestId('zone-select')
      const fileInput = document.getElementById('adoption-file-input')

      await user.type(ageInput, '5')
      await user.type(colorInput, 'Blanco')
      await user.selectOptions(zoneSelect, 'Centro')
      
      // Add image file
      await user.upload(fileInput, file)
      
      await user.click(screen.getByRole('button', { name: /publicar/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/publicación creada correctamente/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
