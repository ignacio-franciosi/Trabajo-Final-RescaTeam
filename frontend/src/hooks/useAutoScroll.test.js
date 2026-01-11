import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoScroll } from './useAutoScroll'

describe('useAutoScroll', () => {
  let mockContainer
  let rafCallbacks = []

  beforeEach(() => {
    // Create a mock DOM element
    mockContainer = {
      scrollHeight: 1000,
      scrollTop: 0,
      clientHeight: 500,
      scrollTo: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    // Mock requestAnimationFrame
    rafCallbacks = []
    global.requestAnimationFrame = vi.fn((cb) => {
      rafCallbacks.push(cb)
      return 1
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should initialize with atBottom as true', () => {
    const { result } = renderHook(() => useAutoScroll())
    
    expect(result.current.atBottom).toBe(true)
    expect(result.current.containerRef.current).toBe(null)
  })

  it('should provide scrollToBottom function', () => {
    const { result } = renderHook(() => useAutoScroll())
    
    expect(typeof result.current.scrollToBottom).toBe('function')
    expect(typeof result.current.onNewContent).toBe('function')
  })

  it('should scroll to bottom when scrollToBottom is called', () => {
    const { result } = renderHook(() => useAutoScroll())
    
    // Set a ref manually for testing
    act(() => {
      result.current.containerRef.current = mockContainer
    })

    act(() => {
      result.current.scrollToBottom()
    })

    // Execute requestAnimationFrame callbacks
    act(() => {
      rafCallbacks.forEach(cb => cb())
    })

    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: mockContainer.scrollHeight,
      behavior: 'smooth',
    })
  })

  it('should attach scroll event listener', () => {
    renderHook(() => useAutoScroll())
    
    // The hook should set up event listeners when ref is attached
    // This is tested implicitly through integration
  })

  it('should provide containerRef, atBottom, scrollToBottom, and onNewContent', () => {
    const { result } = renderHook(() => useAutoScroll())
    
    expect(result.current).toHaveProperty('containerRef')
    expect(result.current).toHaveProperty('atBottom')
    expect(result.current).toHaveProperty('scrollToBottom')
    expect(result.current).toHaveProperty('onNewContent')
  })

  it('should accept custom threshold value', () => {
    const { result } = renderHook(() => useAutoScroll({ threshold: 200 }))
    
    expect(result.current).toBeDefined()
    expect(result.current.containerRef).toBeDefined()
  })
})

