import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createPost,
  getPostById,
  getAllPosts,
  getImagesByPostId,
  getPostsByUserId,
  getAllPostsByUserId,
  updatePost,
  uploadImage,
  deleteImageById,
  deletePost,
  deleteAllImagesByPostId,
  markAsResolved,
  getFilteredPosts,
} from './AdoptionService'
import apiAdoption from './axiosConfigAdoption'

// Mock the axios config
vi.mock('./axiosConfigAdoption', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
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

describe('AdoptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.getItem.mockReturnValue('mock-token')
  })

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const mockFormData = new FormData()
      const mockResponse = { data: { id: '123', message: 'Post created' } }
      apiAdoption.post.mockResolvedValue(mockResponse)

      const result = await createPost(mockFormData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(apiAdoption.post).toHaveBeenCalledWith(
        '/post',
        mockFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    it('should handle errors when creating post', async () => {
      const error = { response: { data: { error: 'Validation failed' } } }
      apiAdoption.post.mockRejectedValue(error)

      const result = await createPost(new FormData())

      expect(result.success).toBe(false)
      expect(result.message).toBeTruthy()
    })
  })

  describe('getPostById', () => {
    it('should get post by id successfully', async () => {
      const mockPost = { id: '123', title: 'Test Post' }
      apiAdoption.get.mockResolvedValue({ data: mockPost })

      const result = await getPostById('123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPost)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post/123')
    })

    it('should handle errors when getting post', async () => {
      apiAdoption.get.mockRejectedValue(new Error('Not found'))

      const result = await getPostById('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al obtener publicación')
    })
  })

  describe('getAllPosts', () => {
    it('should get all posts with type filter', async () => {
      const mockPosts = [{ id: '1' }, { id: '2' }]
      apiAdoption.get.mockResolvedValue({ data: mockPosts })

      const result = await getAllPosts('adoption')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPosts)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post?type=adoption')
    })

    it('should get all posts without type filter', async () => {
      const mockPosts = [{ id: '1' }]
      apiAdoption.get.mockResolvedValue({ data: mockPosts })

      const result = await getAllPosts()

      expect(result.success).toBe(true)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post?type=adoption')
    })

    it('should handle errors when getting all posts', async () => {
      const error = { response: { data: { error: 'Server error' } } }
      apiAdoption.get.mockRejectedValue(error)

      const result = await getAllPosts()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Server error')
    })
  })

  describe('getImagesByPostId', () => {
    it('should get images successfully', async () => {
      const mockImages = [{ id: '1', url: 'image1.jpg' }]
      apiAdoption.get.mockResolvedValue({ data: mockImages })

      const result = await getImagesByPostId('123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockImages)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post/images/123')
    })

    it('should handle errors when getting images', async () => {
      apiAdoption.get.mockRejectedValue(new Error())

      const result = await getImagesByPostId('123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al obtener imágenes')
    })
  })

  describe('getPostsByUserId', () => {
    it('should get posts by user id successfully', async () => {
      const mockPosts = [{ id: '1' }]
      apiAdoption.get.mockResolvedValue({ data: mockPosts })

      const result = await getPostsByUserId('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPosts)
      expect(apiAdoption.get).toHaveBeenCalledWith(
        '/post/user/user123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    it('should return empty array when no posts message', async () => {
      apiAdoption.get.mockResolvedValue({ data: { message: 'Aún no hay publicaciones.' } })

      const result = await getPostsByUserId('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle errors when getting user posts', async () => {
      const error = { response: { data: { error: 'Unauthorized' } } }
      apiAdoption.get.mockRejectedValue(error)

      const result = await getPostsByUserId('user123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Unauthorized')
    })
  })

  describe('getAllPostsByUserId', () => {
    it('should get all posts by user id successfully', async () => {
      const mockPosts = [{ id: '1' }, { id: '2' }]
      apiAdoption.get.mockResolvedValue({ data: mockPosts })

      const result = await getAllPostsByUserId('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPosts)
    })

    it('should handle non-array response', async () => {
      apiAdoption.get.mockResolvedValue({ data: { message: 'No posts' } })

      const result = await getAllPostsByUserId('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      const updateData = { title: 'Updated' }
      apiAdoption.put.mockResolvedValue({ data: { id: '123', ...updateData } })

      const result = await updatePost('123', updateData)

      expect(result.success).toBe(true)
      expect(apiAdoption.put).toHaveBeenCalledWith('/post/123', updateData)
    })

    it('should handle errors when updating post', async () => {
      const error = { response: { data: { error: 'Not found' } } }
      apiAdoption.put.mockRejectedValue(error)

      const result = await updatePost('123', {})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Not found')
    })
  })

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const formData = new FormData()
      formData.append('image', new File([''], 'test.jpg'))
      apiAdoption.post.mockResolvedValue({ data: { id: 'img1' } })

      const result = await uploadImage('post123', formData.get('image'))

      expect(result.success).toBe(true)
      expect(apiAdoption.post).toHaveBeenCalledWith(
        '/post/images/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      )
    })
  })

  describe('deleteImageById', () => {
    it('should delete image successfully', async () => {
      apiAdoption.delete.mockResolvedValue({ data: { message: 'Deleted' } })

      const result = await deleteImageById('img123')

      expect(result.success).toBe(true)
      expect(apiAdoption.delete).toHaveBeenCalledWith('/post/images/img123')
    })
  })

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      apiAdoption.delete.mockResolvedValue({ data: { message: 'Deleted' } })

      const result = await deletePost('123')

      expect(result.success).toBe(true)
      expect(apiAdoption.delete).toHaveBeenCalledWith('/post/123')
    })
  })

  describe('deleteAllImagesByPostId', () => {
    it('should delete all images successfully', async () => {
      apiAdoption.delete.mockResolvedValue({ data: { message: 'Deleted' } })

      const result = await deleteAllImagesByPostId('post123')

      expect(result.success).toBe(true)
      expect(apiAdoption.delete).toHaveBeenCalledWith('/post/images/deleteall/post123')
    })
  })

  describe('markAsResolved', () => {
    it('should mark post as resolved successfully', async () => {
      apiAdoption.put.mockResolvedValue({ data: { id: '123', resolved: true } })

      const result = await markAsResolved('123')

      expect(result.success).toBe(true)
      expect(apiAdoption.put).toHaveBeenCalledWith('/post/resolved/123')
    })
  })

  describe('getFilteredPosts', () => {
    it('should get filtered posts successfully', async () => {
      const filters = {
        postType: 'adoption',
        species: 'dog',
        age: 'adult',
      }
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getFilteredPosts(filters)

      expect(result.success).toBe(true)
      expect(apiAdoption.get).toHaveBeenCalled()
      const callUrl = apiAdoption.get.mock.calls[0][0]
      expect(callUrl).toContain('postType=adoption')
      expect(callUrl).toContain('species=dog')
      expect(callUrl).toContain('age=adult')
    })

    it('should handle all filter types', async () => {
      const filters = {
        especie: 'cat',
        edad: 'young',
        tamaño: 'small',
        sexo: 'female',
        castrado: true,
        vacunas: true,
        zona: 'Centro',
      }
      apiAdoption.get.mockResolvedValue({ data: [] })

      const result = await getFilteredPosts(filters)

      expect(result.success).toBe(true)
      const callUrl = apiAdoption.get.mock.calls[0][0]
      expect(callUrl).toContain('species=cat')
      expect(callUrl).toContain('age=young')
    })

    it('should handle errors when filtering', async () => {
      const error = { response: { data: { error: 'Invalid filters' } } }
      apiAdoption.get.mockRejectedValue(error)

      const result = await getFilteredPosts({})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid filters')
    })
  })
})

