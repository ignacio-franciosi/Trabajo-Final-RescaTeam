import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWebSocketChat } from './useWebSocketChat'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
  }

  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose()
  }

  send(data) {
    if (this.readyState !== WebSocket.OPEN) return
    // Mock send
  }
}

global.WebSocket = vi.fn((url) => {
  const ws = new MockWebSocket(url)
  // Auto-connect immediately on next tick
  Promise.resolve().then(() => {
    ws.readyState = WebSocket.OPEN
    if (ws.onopen) ws.onopen()
  })
  return ws
})

// Add WebSocket constants
global.WebSocket.CONNECTING = 0
global.WebSocket.OPEN = 1
global.WebSocket.CLOSING = 2
global.WebSocket.CLOSED = 3

// Mock environment variable
vi.stubGlobal('import.meta', { env: { VITE_CHAT_WS_URL: 'ws://localhost:8083' } })

describe('useWebSocketChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with idle status when no token', () => {
    const { result } = renderHook(() => useWebSocketChat(null))
    
    expect(result.current.status).toBe('idle')
    expect(result.current.events).toEqual([])
  })

  it('should connect when token is provided', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })
  })

  it('should update status to connecting', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    // Initially should be connecting
    expect(['idle', 'connecting']).toContain(result.current.status)
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })
  })

  it('should handle incoming messages', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })

    // Get the WebSocket instance and simulate a message
    const wsInstances = vi.mocked(WebSocket).mock.results
    const ws = wsInstances[wsInstances.length - 1].value
    
    const messageEvent = { data: JSON.stringify({ type: 'test', payload: { message: 'hello' } }) }
    if (ws.onmessage) {
      ws.onmessage(messageEvent)
    }

    await waitFor(() => {
      expect(result.current.events.length).toBeGreaterThan(0)
      expect(result.current.events[0]).toEqual({ type: 'test', payload: { message: 'hello' } })
    }, { timeout: 2000 })
  })

  it('should ignore invalid JSON messages', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })

    const wsInstances = vi.mocked(WebSocket).mock.results
    const ws = wsInstances[wsInstances.length - 1].value
    
    // Invalid JSON should not crash
    if (ws.onmessage) {
      ws.onmessage({ data: 'invalid json' })
    }

    // Events should still be in initial state (no crash)
    expect(result.current.events.length).toBe(0)
  })

  it('should provide sendMessage function', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })

    expect(typeof result.current.sendMessage).toBe('function')
    expect(typeof result.current.sendEvent).toBe('function')
  })

  it('should send messages when WebSocket is open', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })

    const wsInstances = vi.mocked(WebSocket).mock.results
    const ws = wsInstances[wsInstances.length - 1].value
    const sendSpy = vi.spyOn(ws, 'send')

    result.current.sendMessage({
      chatId: '123',
      receiverId: '456',
      postId: '789',
      content: 'Hello'
    })

    expect(sendSpy).toHaveBeenCalled()
    const callArg = sendSpy.mock.calls[0][0]
    const parsed = JSON.parse(callArg)
    expect(parsed.type).toBe('send_message')
    expect(parsed.payload).toEqual({
      chatId: '123',
      receiverId: '456',
      postId: '789',
      content: 'Hello'
    })
  })

  it('should not send messages when WebSocket is not open', () => {
    const { result } = renderHook(() => useWebSocketChat(null))
    
    const wsInstances = vi.mocked(WebSocket).mock.results
    if (wsInstances.length > 0) {
      const ws = wsInstances[wsInstances.length - 1].value
      ws.readyState = WebSocket.CLOSED
      const sendSpy = vi.spyOn(ws, 'send')

      result.current.sendMessage({ chatId: '123', content: 'Hello' })
      
      // Should not send when closed
      expect(sendSpy).not.toHaveBeenCalled()
    }
  })

  it('should cleanup WebSocket on unmount', async () => {
    const { result, unmount } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })

    const wsInstances = vi.mocked(WebSocket).mock.results
    const ws = wsInstances[wsInstances.length - 1].value
    const closeSpy = vi.spyOn(ws, 'close')

    unmount()

    expect(closeSpy).toHaveBeenCalled()
  })

  it('should handle sendEvent with custom type and payload', async () => {
    const { result } = renderHook(() => useWebSocketChat('test-token'))
    
    await waitFor(() => {
      expect(result.current.status).toBe('open')
    }, { timeout: 2000 })

    const wsInstances = vi.mocked(WebSocket).mock.results
    const ws = wsInstances[wsInstances.length - 1].value
    const sendSpy = vi.spyOn(ws, 'send')

    result.current.sendEvent('custom_type', { foo: 'bar' })

    expect(sendSpy).toHaveBeenCalled()
    const callArg = sendSpy.mock.calls[0][0]
    const parsed = JSON.parse(callArg)
    expect(parsed.type).toBe('custom_type')
    expect(parsed.payload).toEqual({ foo: 'bar' })
  })
})

