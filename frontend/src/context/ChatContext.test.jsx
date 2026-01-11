import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ChatProvider, ChatContext } from './ChatContext'
import { useWebSocketChat } from '../hooks/useWebSocketChat'
import ChatService from '../services/ChatService'
import { useAuth } from './AuthContext'
import { getUserPublicById } from '../services/UserService'

// Mock dependencies
vi.mock('../hooks/useWebSocketChat')
vi.mock('../services/ChatService', () => ({
  default: {
    listChats: vi.fn(),
    listMessages: vi.fn(),
    markRead: vi.fn(),
  },
}))
vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}))
vi.mock('../services/UserService', () => ({
  getUserPublicById: vi.fn(),
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

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Default mocks
    vi.mocked(useAuth).mockReturnValue({ token: 'test-token' })
    vi.mocked(useWebSocketChat).mockReturnValue({
      status: 'open',
      events: [],
      sendMessage: vi.fn(),
      sendEvent: vi.fn(),
    })
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ userId: 'myUserId' })
      return null
    })
  })

  it('should provide chat context', () => {
    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('status')
    expect(result.current).toHaveProperty('chats')
    expect(result.current).toHaveProperty('messagesByChat')
    expect(result.current).toHaveProperty('unreadByChat')
    expect(result.current).toHaveProperty('sendMessage')
    expect(result.current).toHaveProperty('getChatById')
    expect(result.current).toHaveProperty('setActiveChat')
  })

  it('should load chats on mount when token is available', async () => {
    const mockChats = [
      {
        chatId: 'chat1',
        participants: ['myUserId', 'otherUserId'],
      },
    ]
    ChatService.listChats.mockResolvedValue({ data: mockChats })
    getUserPublicById.mockResolvedValue({ name: 'John', surname: 'Doe' })

    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    await waitFor(() => {
      expect(ChatService.listChats).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(result.current.chats.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should not load chats when token is not available', async () => {
    vi.mocked(useAuth).mockReturnValue({ token: null })

    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    await waitFor(() => {
      expect(ChatService.listChats).not.toHaveBeenCalled()
    })
  })

  it('should provide getChatById function', () => {
    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    expect(typeof result.current.getChatById).toBe('function')
    
    const chat = result.current.getChatById('nonexistent')
    expect(chat).toBeNull()
  })

  it('should handle setActiveChat', async () => {
    const mockMessages = [{ id: 'msg1', content: 'Hello', senderId: 'otherUserId' }]
    ChatService.listMessages.mockResolvedValue({ data: mockMessages })
    ChatService.markRead.mockResolvedValue({})

    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })

    act(() => {
      result.current.setActiveChat('chat123')
    })

    await waitFor(() => {
      expect(ChatService.markRead).toHaveBeenCalledWith('test-token', 'chat123')
    })
  })

  it('should handle message events from WebSocket', async () => {
    const mockMessage = {
      type: 'message',
      payload: {
        chatId: 'chat1',
        senderId: 'otherUserId',
        content: 'Hello',
        timestamp: Date.now(),
      },
    }

    vi.mocked(useWebSocketChat).mockReturnValue({
      status: 'open',
      events: [mockMessage],
      sendMessage: vi.fn(),
      sendEvent: vi.fn(),
    })

    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    await waitFor(() => {
      const messages = result.current.messagesByChat['chat1']
      expect(messages).toBeDefined()
      expect(messages.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should update unread count for messages from others', async () => {
    const mockMessage = {
      type: 'message',
      payload: {
        chatId: 'chat1',
        senderId: 'otherUserId',
        content: 'Hello',
        timestamp: Date.now(),
      },
    }

    vi.mocked(useWebSocketChat).mockReturnValue({
      status: 'open',
      events: [mockMessage],
      sendMessage: vi.fn(),
      sendEvent: vi.fn(),
    })

    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    await waitFor(() => {
      const unread = result.current.unreadByChat['chat1']
      expect(unread).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should provide reloadChats function', () => {
    ChatService.listChats.mockResolvedValue({ data: [] })

    const wrapper = ({ children }) => <ChatProvider>{children}</ChatProvider>
    const { result } = renderHook(() => {
      const context = React.useContext(ChatContext)
      return context
    }, { wrapper })

    expect(typeof result.current.reloadChats).toBe('function')

    act(async () => {
      await result.current.reloadChats()
    })

    expect(ChatService.listChats).toHaveBeenCalled()
  })

})

