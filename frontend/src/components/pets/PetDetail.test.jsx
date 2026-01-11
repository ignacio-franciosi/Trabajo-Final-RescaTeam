import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import PetDetail from './PetDetail'
import { AuthContext } from '../../context/AuthContext'

// Mocks
const mockNavigate = vi.fn()
const mockStartChat = vi.fn()
const mockSearchBarrioOverpassPoint = vi.fn()
const mockUseLocation = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  }
})

vi.mock('../../services/ChatService', () => ({
  default: {
    startChat: (token, payload) => mockStartChat(token, payload),
  },
}))

vi.mock('../../services/overpass', () => ({
  searchBarrioOverpassPoint: (zone, options) => mockSearchBarrioOverpassPoint(zone, options),
}))

vi.mock('../reports/ReportPostModal', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? <div data-testid="report-modal">Report Modal</div> : null
  ),
}))

vi.mock('../map/MiniLeafletMap', () => ({
  default: ({ barrioPoint, userPos }) => (
    <div data-testid="mini-map">
      {barrioPoint && <div>Map with barrio point</div>}
      {userPos && <div>Map with user position</div>}
    </div>
  ),
}))

vi.mock('./SimilarPetsCarousel', () => ({
  default: ({ postId, postType }) => (
    <div data-testid="similar-pets-carousel">
      Similar pets for {postType} post {postId}
    </div>
  ),
}))

// Mock geolocation - se ejecuta después del render para evitar warnings
Object.defineProperty(global.navigator, 'geolocation', {
  writable: true,
  configurable: true,
  value: {
    getCurrentPosition: vi.fn((success) => {
      // Usar setTimeout para ejecutar después del render
      setTimeout(() => {
        success({
          coords: {
            latitude: -31.4201,
            longitude: -64.1888,
          },
        })
      }, 0)
    }),
  },
})

// Helpers
const renderWithProviders = (pet, user = { userId: '123', suspended: false }) => {
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
        <PetDetail pet={pet} />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

// Tests
describe('PetDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStartChat.mockResolvedValue({
      data: { chatId: 'chat123' },
    })
    // Mock searchBarrioOverpassPoint para que no se ejecute automáticamente
    mockSearchBarrioOverpassPoint.mockImplementation(() => Promise.resolve([-31.4201, -64.1888]))
    mockUseLocation.mockReturnValue({
      pathname: '/mascota/123',
      search: '',
      hash: '',
      state: null,
    })
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders adoption pet detail with title', () => {
    const pet = {
      postId: '123',
      name: 'Lola',
      postType: 'adoption',
      species: 'perro',
      age: 5,
      size: 'mediano',
      sex: 'hembra',
      color: 'blanco',
    }

    renderWithProviders(pet)

    expect(screen.getByRole('heading', { level: 1, name: /mascota en adopción/i })).toBeInTheDocument()
    expect(screen.getByText('Lola')).toBeInTheDocument()
  })

  it('renders lost pet detail with title', () => {
    const pet = {
      postId: '456',
      name: 'Max',
      postType: 'lost',
      species: 'gato',
    }

    renderWithProviders(pet)

    expect(screen.getByRole('heading', { level: 1, name: /mascota perdida/i })).toBeInTheDocument()
  })

  it('renders found pet detail with title', () => {
    const pet = {
      postId: '789',
      name: 'Bella',
      postType: 'found',
      species: 'perro',
    }

    renderWithProviders(pet)

    expect(screen.getByRole('heading', { level: 1, name: /mascota encontrada/i })).toBeInTheDocument()
  })
})