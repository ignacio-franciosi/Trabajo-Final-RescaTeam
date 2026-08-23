import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWebSocketChat } from './useWebSocketChat'

/* -------------------- Mock WebSocket -------------------- */

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
    this.onclose?.()
  }

  send() {}
}

global.WebSocket = vi.fn((url) => {
  const ws = new MockWebSocket(url)
  Promise.resolve().then(() => {
    ws.readyState = WebSocket.OPEN
    ws.onopen?.()
  })
  return ws
})

Object.assign(global.WebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
})

vi.stubGlobal('import.meta', {
  env: { VITE_CHAT_WS_URL: 'ws://localhost:8083' },
})

// Helpers

const renderOpenHook = async () => {
  const hook = renderHook(() => useWebSocketChat('test-token'))
  await waitFor(() => expect(hook.result.current.status).toBe('open'))
  return hook
}

const getLastWS = () =>
  vi.mocked(WebSocket).mock.results.at(-1)?.value

// Tests

describe('useWebSocketChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes idle when no token', () => {
    const { result } = renderHook(() => useWebSocketChat(null))

    expect(result.current.status).toBe('idle')
    expect(result.current.events).toEqual([])
  })

  it('connects when token is provided', async () => {
    const { result } = await renderOpenHook()
    expect(result.current.status).toBe('open')
  })

  it('handles incoming messages', async () => {
    const { result } = await renderOpenHook()
    const ws = getLastWS()

    act(() => {
      ws.onmessage({
        data: JSON.stringify({ type: 'test', payload: { message: 'hello' } }),
      })
    })

    await waitFor(() =>
      expect(result.current.events).toEqual([
        { type: 'test', payload: { message: 'hello' } },
      ])
    )
  })

  it('ignores invalid JSON messages', async () => {
    const { result } = await renderOpenHook()
    const ws = getLastWS()

    act(() => {
      ws.onmessage({ data: 'invalid json' })
    })

    expect(result.current.events).toHaveLength(0)
  })

  it('sends message when socket is open', async () => {
    const { result } = await renderOpenHook()
    const ws = getLastWS()
    const sendSpy = vi.spyOn(ws, 'send')

    result.current.sendMessage({
      chatId: '123',
      receiverId: '456',
      postId: '789',
      content: 'Hello',
    })

    expect(sendSpy).toHaveBeenCalledOnce()

    const payload = JSON.parse(sendSpy.mock.calls[0][0])
    expect(payload).toEqual({
      type: 'send_message',
      payload: {
        chatId: '123',
        receiverId: '456',
        postId: '789',
        content: 'Hello',
      },
    })
  })

  it('does not send message when socket is closed', () => {
    const { result } = renderHook(() => useWebSocketChat(null))
    const ws = getLastWS()

    if (!ws) return

    ws.readyState = WebSocket.CLOSED
    const sendSpy = vi.spyOn(ws, 'send')

    result.current.sendMessage({ content: 'Hello' })
    expect(sendSpy).not.toHaveBeenCalled()
  })

  it('cleans up WebSocket on unmount', async () => {
    const { unmount } = await renderOpenHook()
    const ws = getLastWS()
    const closeSpy = vi.spyOn(ws, 'close')

    unmount()
    expect(closeSpy).toHaveBeenCalledOnce()
  })

  it('sends custom event with sendEvent', async () => {
    const { result } = await renderOpenHook()
    const ws = getLastWS()
    const sendSpy = vi.spyOn(ws, 'send')

    result.current.sendEvent('custom_type', { foo: 'bar' })

    const payload = JSON.parse(sendSpy.mock.calls[0][0])
    expect(payload).toEqual({
      type: 'custom_type',
      payload: { foo: 'bar' },
    })
  })
})
