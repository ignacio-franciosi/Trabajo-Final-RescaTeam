import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildPostImageUrl,
  createPost,
  autocompletePostFromImage,
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
  getPostByIdForChat,
  getImagesByPostIdForChat,
} from './PostService'
import apiAdoption from './axiosConfigPost'

// Mock the axios config
vi.mock('./axiosConfigPost', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:8080',
    },
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

describe('PostService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.getItem.mockReturnValue('mock-token')
  })

  describe('buildPostImageUrl', () => {
    it('should return empty string for empty filepath', () => {
      expect(buildPostImageUrl('')).toBe('')
      expect(buildPostImageUrl(null)).toBe('')
      expect(buildPostImageUrl(undefined)).toBe('')
    })

    it('should return full URL for HTTP/HTTPS paths', () => {
      expect(buildPostImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
      expect(buildPostImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
    })

    it('should build URL from relative path', () => {
      const result = buildPostImageUrl('images/test.jpg')
      expect(result).toBe('http://localhost:8080/images/test.jpg')
    })

    it('should handle absolute paths', () => {
      const result = buildPostImageUrl('/images/test.jpg')
      expect(result).toBe('http://localhost:8080/images/test.jpg')
    })
  })

  describe('createPost', () => {
    it('should create post successfully', async () => {
      const formData = new FormData()
      apiAdoption.post.mockResolvedValue({ data: { id: '123' } })

      const result = await createPost(formData)

      expect(result.success).toBe(true)
      expect(apiAdoption.post).toHaveBeenCalledWith(
        '/post',
        formData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    it('should handle errors when creating post', async () => {
      apiAdoption.post.mockRejectedValue(new Error('Failed'))

      const result = await createPost(new FormData())

      expect(result.success).toBe(false)
      expect(result.message).toBeTruthy()
    })
  })

  describe('autocompletePostFromImage', () => {
    it('should autocomplete post from image successfully', async () => {
      const imageFile = new File([''], 'test.jpg')
      const formData = new FormData()
      formData.append('image', imageFile)
      apiAdoption.post.mockResolvedValue({ data: { title: 'Auto title' } })

      const result = await autocompletePostFromImage(imageFile)

      expect(result.success).toBe(true)
      expect(apiAdoption.post).toHaveBeenCalledWith(
        '/post/autocomplete',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      )
    })

    it('should handle errors when autocompleting', async () => {
      apiAdoption.post.mockRejectedValue(new Error('Failed'))

      const result = await autocompletePostFromImage(new File([''], 'test.jpg'))

      expect(result.success).toBe(false)
      expect(result.message).toBeTruthy()
    })
  })

  describe('getPostById', () => {
    it('should get post by id successfully', async () => {
      apiAdoption.get.mockResolvedValue({ data: { id: '123' } })

      const result = await getPostById('123')

      expect(result.success).toBe(true)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post/123')
    })
  })

  describe('getAllPosts', () => {
    it('should get all posts with type', async () => {
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getAllPosts('adoption')

      expect(result.success).toBe(true)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post?type=adoption')
    })

    it('should get all posts without type', async () => {
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getAllPosts()

      expect(result.success).toBe(true)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post')
    })
  })

  describe('getImagesByPostId', () => {
    it('should get images successfully', async () => {
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getImagesByPostId('123')

      expect(result.success).toBe(true)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post/images/123')
    })
  })

  describe('getPostsByUserId', () => {
    it('should get posts by user id successfully', async () => {
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getPostsByUserId('user123')

      expect(result.success).toBe(true)
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
  })

  describe('getAllPostsByUserId', () => {
    it('should get all posts by user id successfully', async () => {
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getAllPostsByUserId('user123')

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
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
      apiAdoption.put.mockResolvedValue({ data: { id: '123', updated: true } })

      const result = await updatePost('123', { title: 'Updated' })

      expect(result.success).toBe(true)
      expect(apiAdoption.put).toHaveBeenCalledWith('/post/123', { title: 'Updated' })
    })
  })

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      apiAdoption.post.mockResolvedValue({ data: { id: 'img1' } })

      const result = await uploadImage('post123', new File([''], 'test.jpg'))

      expect(result.success).toBe(true)
      expect(apiAdoption.post).toHaveBeenCalled()
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
      apiAdoption.get.mockResolvedValue({ data: [{ id: '1' }] })

      const result = await getFilteredPosts({ postType: 'adoption', species: 'dog' })

      expect(result.success).toBe(true)
      const callUrl = apiAdoption.get.mock.calls[0][0]
      expect(callUrl).toContain('postType=adoption')
      expect(callUrl).toContain('species=dog')
    })
  })

  describe('getPostByIdForChat', () => {
    it('should get post data for chat', async () => {
      const mockData = { id: '123', title: 'Test' }
      apiAdoption.get.mockResolvedValue({ data: mockData })

      const result = await getPostByIdForChat('123')

      expect(result).toEqual(mockData)
      expect(apiAdoption.get).toHaveBeenCalledWith('/post/123')
    })
  })

  describe('getImagesByPostIdForChat', () => {
    it('should get images array for chat', async () => {
      const mockImages = [{ id: '1' }, { id: '2' }]
      apiAdoption.get.mockResolvedValue({ data: mockImages })

      const result = await getImagesByPostIdForChat('123')

      expect(result).toEqual(mockImages)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array for non-array response', async () => {
      apiAdoption.get.mockResolvedValue({ data: { message: 'No images' } })

      const result = await getImagesByPostIdForChat('123')

      expect(result).toEqual([])
    })
  })
})

