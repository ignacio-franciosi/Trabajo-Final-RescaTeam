import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoScroll } from './useAutoScroll'

describe('useAutoScroll', () => {
  let mockContainer

  beforeEach(() => {
    mockContainer = {
      scrollHeight: 1000,
      scrollTop: 0,
      clientHeight: 500,
      scrollTo: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    global.requestAnimationFrame = vi.fn((cb) => {
      cb()
      return 1
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with atBottom = true', () => {
    const { result } = renderHook(() => useAutoScroll())

    expect(result.current.atBottom).toBe(true)
    expect(result.current.containerRef.current).toBe(null)
  })

  it('exposes public API', () => {
    const { result } = renderHook(() => useAutoScroll())

    expect(result.current).toMatchObject({
      containerRef: expect.any(Object),
      atBottom: expect.any(Boolean),
      scrollToBottom: expect.any(Function),
      onNewContent: expect.any(Function),
    })
  })

  it('scrolls to bottom when scrollToBottom is called', () => {
    const { result } = renderHook(() => useAutoScroll())

    result.current.containerRef.current = mockContainer
    result.current.scrollToBottom()

    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: mockContainer.scrollHeight,
      behavior: 'smooth',
    })
  })

  it('onNewContent scrolls when at bottom', () => {
    const { result } = renderHook(() => useAutoScroll())

    // Set up container to be near bottom (within threshold of 120)
    // scrollHeight: 1000, clientHeight: 500, so scrollTop should be >= 880
    // to be within 120px of bottom (1000 - 880 - 500 = 20 <= 120)
    mockContainer.scrollTop = 880
    result.current.containerRef.current = mockContainer
    result.current.onNewContent()

    expect(mockContainer.scrollTo).toHaveBeenCalled()
  })

  it('accepts custom threshold', () => {
    const { result } = renderHook(() =>
      useAutoScroll({ threshold: 200 })
    )

    expect(result.current.containerRef).toBeDefined()
  })
})
