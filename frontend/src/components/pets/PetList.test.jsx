import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import PetList from './PetList'

// Mocks
const mockGetAllPosts = vi.fn()
const mockGetFilteredPosts = vi.fn()
const mockGetImagesByPostId = vi.fn()

vi.mock('../../services/PostService', () => ({
  getAllPosts: (...args) => mockGetAllPosts(...args),
  getFilteredPosts: (...args) => mockGetFilteredPosts(...args),
  getImagesByPostId: (...args) => mockGetImagesByPostId(...args),
}))

vi.mock('./PetCard', () => ({
  default: ({ pet }) => <div data-testid={`pet-card-${pet.postId || pet.id}`}>{pet.name || 'Sin nombre'}</div>,
}))

// Tests
describe('PetList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetAllPosts.mockImplementation(() => new Promise(() => {})) // Never resolves
    mockGetImagesByPostId.mockImplementation(() => new Promise(() => {}))

    render(<PetList />)

    expect(screen.getByText(/cargando mascotas/i)).toBeInTheDocument()
  })

  it('uses getFilteredPosts when filters are provided', async () => {
    const mockPets = [
      { postId: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    const filters = { especie: 'perro' }

    mockGetFilteredPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: false,
      data: [],
    })

    render(<PetList filters={filters} />)

    await waitFor(() => {
      expect(mockGetFilteredPosts).toHaveBeenCalledWith(filters)
      expect(mockGetAllPosts).not.toHaveBeenCalled()
    })
  })

  it('uses getAllPosts when no filters are provided', async () => {
    const mockPets = [
      { postId: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    mockGetAllPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: false,
      data: [],
    })

    render(<PetList />)

    await waitFor(() => {
      expect(mockGetAllPosts).toHaveBeenCalled()
      expect(mockGetFilteredPosts).not.toHaveBeenCalled()
    })
  })

  it('uses getAllPosts when filters are empty', async () => {
    const mockPets = [
      { postId: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    mockGetAllPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: false,
      data: [],
    })

    render(<PetList filters={{}} />)

    await waitFor(() => {
      expect(mockGetAllPosts).toHaveBeenCalled()
      expect(mockGetFilteredPosts).not.toHaveBeenCalled()
    })
  })

  it('assigns image URL when image is available', async () => {
    const mockPets = [
      { postId: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    mockGetAllPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: true,
      data: [{ filepath: '/images/test.jpg' }],
    })

    render(<PetList />)

    await waitFor(() => {
      expect(mockGetImagesByPostId).toHaveBeenCalledWith('1')
    })
  })

  it('uses full URL when image path starts with http', async () => {
    const mockPets = [
      { postId: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    mockGetAllPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: true,
      data: [{ filepath: 'https://s3.amazonaws.com/image.jpg' }],
    })

    render(<PetList />)

    await waitFor(() => {
      expect(mockGetImagesByPostId).toHaveBeenCalledWith('1')
    })
  })

  it('uses id when postId is not available', async () => {
    const mockPets = [
      { id: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    mockGetAllPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: false,
      data: [],
    })

    render(<PetList />)

    await waitFor(() => {
      expect(mockGetImagesByPostId).toHaveBeenCalledWith('1')
    })
  })

  it('re-fetches when filters change', async () => {
    const mockPets = [
      { postId: '1', name: 'Lola', species: 'perro', postType: 'adoption' },
    ]

    mockGetFilteredPosts.mockResolvedValue({
      success: true,
      data: mockPets,
    })

    mockGetImagesByPostId.mockResolvedValue({
      success: false,
      data: [],
    })

    const { rerender } = render(<PetList filters={{ especie: 'perro' }} />)

    await waitFor(() => {
      expect(mockGetFilteredPosts).toHaveBeenCalledTimes(1)
    })

    mockGetFilteredPosts.mockClear()

    rerender(<PetList filters={{ especie: 'gato' }} />)

    await waitFor(() => {
      expect(mockGetFilteredPosts).toHaveBeenCalledTimes(1)
    })
  })
})