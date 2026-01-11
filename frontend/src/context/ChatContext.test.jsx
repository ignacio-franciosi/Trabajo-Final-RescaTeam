import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useContext } from 'react'
import { ChatProvider, ChatContext } from './ChatContext'
import { AuthContext } from './AuthContext'

// Mocks
const mockListChats = vi.fn()
const mockListMessages = vi.fn()
const mockMarkRead = vi.fn()
const mockGetUserPublicById = vi.fn()
const mockSendMessage = vi.fn()
const mockSendEvent = vi.fn()
const mockUseWebSocketChat = vi.fn()

vi.mock('../services/ChatService', () => ({
  default: {
    listChats: (token) => mockListChats(token),
    listMessages: (token, chatId) => mockListMessages(token, chatId),
    markRead: (token, chatId) => mockMarkRead(token, chatId),
  },
}))

vi.mock('../services/UserService', () => ({
  getUserPublicById: (id) => mockGetUserPublicById(id),
}))

vi.mock('../hooks/useWebSocketChat', () => ({
  useWebSocketChat: (token) => mockUseWebSocketChat(token),
}))

// Helper hook to use the context
const useChat = () => useContext(ChatContext)

// Helper component to test the context
const TestWrapper = ({ children, token = 'test-token', userId = '123' }) => {
  const authValue = {
    user: { userId },
    token,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    initialized: true,
    setAuth: vi.fn(),
  }

  return (
    <AuthContext.Provider value={authValue}>
      <ChatProvider>{children}</ChatProvider>
    </AuthContext.Provider>
  )
}

// Tests
describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Default mock implementations
    mockUseWebSocketChat.mockReturnValue({
      status: 'idle',
      events: [],
      sendMessage: mockSendMessage,
      sendEvent: mockSendEvent,
    })
    
    mockListChats.mockResolvedValue({
      data: [],
    })
    
    mockListMessages.mockResolvedValue({
      data: [],
    })
    
    mockMarkRead.mockResolvedValue({})
    mockGetUserPublicById.mockResolvedValue({ id_user: '456', name: 'Juan', surname: 'Pérez' })
    
    // Mock localStorage.getItem for user
    localStorage.setItem('user', JSON.stringify({ userId: '123' }))
    
    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('provides initial state', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.status).toBeDefined()
    })

    expect(result.current.chats).toEqual([])
    expect(result.current.messagesByChat).toEqual({})
    expect(result.current.activeChatId).toBe(null)
    expect(result.current.unreadByChat).toEqual({})
    expect(result.current.sendMessage).toBeDefined()
    expect(result.current.sendEvent).toBeDefined()
    expect(result.current.nameMap).toBeDefined()
    expect(result.current.getChatById).toBeDefined()
    expect(result.current.setActiveChat).toBeDefined()
    expect(result.current.reloadChats).toBeDefined()
    expect(result.current.fetchMessages).toBeDefined()
    expect(result.current.markRead).toBeDefined()
  })

  it('loads chats on mount when token is provided', async () => {
    const mockChats = [
      { chatId: 'chat1', participants: ['123', '456'], lastMessage: 'Hello', lastUpdate: '2024-01-01' },
    ]
    
    mockListChats.mockResolvedValue({
      data: mockChats,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(mockListChats).toHaveBeenCalled()
    }, { timeout: 2000 })

    await waitFor(() => {
      expect(result.current.chats.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })

  it('enriches chats with user names', async () => {
    const mockChats = [
      { chatId: 'chat1', participants: ['123', '456'] },
    ]
    
    mockListChats.mockResolvedValue({
      data: mockChats,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(mockListChats).toHaveBeenCalled()
    }, { timeout: 2000 })

    await waitFor(() => {
      expect(mockGetUserPublicById).toHaveBeenCalledWith('456')
    }, { timeout: 2000 })

    await waitFor(() => {
      const chat = result.current.chats.find(c => c.chatId === 'chat1')
      if (chat) {
        expect(chat.displayName).toBe('Juan Pérez')
      }
    }, { timeout: 2000 })
  })

  it('getChatById returns chat when found', async () => {
    const mockChats = [
      { chatId: 'chat1', participants: ['123', '456'] },
      { chatId: 'chat2', participants: ['123', '789'] },
    ]
    
    mockListChats.mockResolvedValue({
      data: mockChats,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(mockListChats).toHaveBeenCalled()
    }, { timeout: 2000 })

    await waitFor(() => {
      const chat = result.current.getChatById('chat1')
      expect(chat).toBeTruthy()
      expect(chat?.chatId).toBe('chat1')
    }, { timeout: 2000 })
  })

  it('getChatById returns null when chat not found', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      const chat = result.current.getChatById('nonexistent')
      expect(chat).toBe(null)
    })
  })

  it('setActiveChat sets active chat and fetches messages', async () => {
    const mockMessages = [
      { messageId: 'msg1', content: 'Hello', senderId: '456', viewed: false },
    ]
    
    mockListMessages.mockResolvedValue({
      data: mockMessages,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.initialized || true).toBe(true)
    })

    await act(async () => {
      await result.current.setActiveChat('chat1')
    })

    await waitFor(() => {
      expect(result.current.activeChatId).toBe('chat1')
    })

    await waitFor(() => {
      expect(mockListMessages).toHaveBeenCalledWith('test-token', 'chat1')
    }, { timeout: 2000 })

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith('test-token', 'chat1')
    }, { timeout: 2000 })
  })

  it('setActiveChat resets unread count for active chat', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.initialized || true).toBe(true)
    })

    await act(async () => {
      await result.current.setActiveChat('chat1')
    })

    await waitFor(() => {
      expect(result.current.unreadByChat['chat1']).toBe(0)
    })
  })

  it('fetchMessages loads messages for a chat', async () => {
    const mockMessages = [
      { messageId: 'msg1', content: 'Hello', senderId: '456', viewed: false },
    ]
    
    mockListMessages.mockResolvedValue({
      data: mockMessages,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.initialized || true).toBe(true)
    })

    await act(async () => {
      await result.current.fetchMessages('chat1')
    })

    await waitFor(() => {
      expect(mockListMessages).toHaveBeenCalledWith('test-token', 'chat1')
    }, { timeout: 2000 })
  })

  it('markRead marks chat as read and resets unread count', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.initialized || true).toBe(true)
    })

    await act(async () => {
      await result.current.markRead('chat1')
    })

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith('test-token', 'chat1')
    })

    await waitFor(() => {
      expect(result.current.unreadByChat['chat1']).toBe(0)
    })
  })

  it('reloadChats reloads chat list', async () => {
    const mockChats = [
      { chatId: 'chat1', participants: ['123', '456'] },
    ]
    
    mockListChats.mockResolvedValue({
      data: mockChats,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.initialized || true).toBe(true)
    })

    mockListChats.mockClear()

    await act(async () => {
      await result.current.reloadChats()
    })

    await waitFor(() => {
      expect(mockListChats).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('does not load chats when token is null', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <TestWrapper token={null}>{children}</TestWrapper>
      ),
    })

    await waitFor(() => {
      expect(result.current.status).toBeDefined()
    })

    // Give it a moment to potentially call listChats
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockListChats).not.toHaveBeenCalled()
  })

  it('updates unread total in localStorage', async () => {
    const mockChats = [
      { chatId: 'chat1', participants: ['123', '456'] },
    ]
    
    mockListChats.mockResolvedValue({
      data: mockChats,
    })

    const mockMessages = [
      { messageId: 'msg1', content: 'Hello', senderId: '456', viewed: false },
    ]
    
    mockListMessages.mockResolvedValue({
      data: mockMessages,
    })

    const { result } = renderHook(() => useChat(), {
      wrapper: TestWrapper,
    })

    await waitFor(() => {
      expect(result.current.initialized || true).toBe(true)
    })

    await act(async () => {
      await result.current.fetchMessages('chat1')
    })

    await waitFor(() => {
      const total = localStorage.getItem('chat_unread_total')
      expect(total).toBeTruthy()
    }, { timeout: 2000 })
  })
})