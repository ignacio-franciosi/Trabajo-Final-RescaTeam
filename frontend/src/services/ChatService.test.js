import { describe, it, expect, beforeEach, vi } from 'vitest'
import ChatService from './ChatService'
import apiChat from './axiosConfigChat'

// Mock the axios config
vi.mock('./axiosConfigChat', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('startChat', () => {
    it('should start a chat successfully', async () => {
      const mockResponse = { data: { chatId: '123' } }
      apiChat.post.mockResolvedValue(mockResponse)

      const result = await ChatService.startChat('token123', {
        receiverId: 'user456',
        postId: 'post789',
      })

      expect(result).toEqual(mockResponse)
      expect(apiChat.post).toHaveBeenCalledWith(
        '/api/chat/start',
        { receiverId: 'user456', postId: 'post789' },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })
  })

  describe('listChats', () => {
    it('should list chats with default limit', async () => {
      const mockResponse = { data: [{ id: '1' }, { id: '2' }] }
      apiChat.get.mockResolvedValue(mockResponse)

      const result = await ChatService.listChats('token123')

      expect(result).toEqual(mockResponse)
      expect(apiChat.get).toHaveBeenCalledWith(
        '/api/chat/list?limit=20',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })

    it('should list chats with custom limit', async () => {
      const mockResponse = { data: [{ id: '1' }] }
      apiChat.get.mockResolvedValue(mockResponse)

      const result = await ChatService.listChats('token123', 10)

      expect(result).toEqual(mockResponse)
      expect(apiChat.get).toHaveBeenCalledWith(
        '/api/chat/list?limit=10',
        expect.any(Object)
      )
    })
  })

  describe('listMessages', () => {
    it('should list messages with default limit', async () => {
      const mockResponse = { data: [{ id: '1', content: 'Hello' }] }
      apiChat.get.mockResolvedValue(mockResponse)

      const result = await ChatService.listMessages('token123', 'chat456')

      expect(result).toEqual(mockResponse)
      expect(apiChat.get).toHaveBeenCalledWith(
        '/api/chat/chat456/messages?limit=50',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })

    it('should list messages with custom limit', async () => {
      const mockResponse = { data: [] }
      apiChat.get.mockResolvedValue(mockResponse)

      const result = await ChatService.listMessages('token123', 'chat456', 100)

      expect(result).toEqual(mockResponse)
      expect(apiChat.get).toHaveBeenCalledWith(
        '/api/chat/chat456/messages?limit=100',
        expect.any(Object)
      )
    })
  })

  describe('markRead', () => {
    it('should mark chat as read', async () => {
      const mockResponse = { data: { read: true } }
      apiChat.post.mockResolvedValue(mockResponse)

      const result = await ChatService.markRead('token123', 'chat456')

      expect(result).toEqual(mockResponse)
      expect(apiChat.post).toHaveBeenCalledWith(
        '/api/chat/chat456/read',
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })
  })

  describe('sendHttp', () => {
    it('should send HTTP message', async () => {
      const mockResponse = { data: { id: 'msg1', content: 'Hello' } }
      apiChat.post.mockResolvedValue(mockResponse)

      const result = await ChatService.sendHttp('token123', 'chat456', 'Hello')

      expect(result).toEqual(mockResponse)
      expect(apiChat.post).toHaveBeenCalledWith(
        '/api/chat/chat456/send',
        { content: 'Hello' },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })
  })
})

