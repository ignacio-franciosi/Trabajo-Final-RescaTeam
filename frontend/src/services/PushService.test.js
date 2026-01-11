import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initPush, unsubscribePush } from './PushService'
import { axiosChat } from './axiosConfigChat'

// Mock axios
vi.mock('./axiosConfigChat', () => ({
  axiosChat: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('PushService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset browser APIs
    global.navigator = {
      serviceWorker: undefined,
    }
    // Don't set PushManager to undefined - either don't set it or ensure window exists
    if (!global.window) {
      global.window = {}
    }
    global.window.Notification = undefined
    delete global.window.PushManager
  })

  describe('initPush', () => {
    it('should return early if serviceWorker not available', async () => {
      const result = await initPush('token123')
      expect(result).toBeUndefined()
      expect(axiosChat.get).not.toHaveBeenCalled()
    })

    it('should return early if PushManager not available', async () => {
      global.navigator.serviceWorker = {}
      const result = await initPush('token123')
      expect(result).toBeUndefined()
    })

    it('should return early if notification permission is denied', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('denied')
      const mockReg = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
          subscribe: vi.fn(),
        },
      }
      global.navigator.serviceWorker = {
        register: vi.fn().mockResolvedValue(mockReg),
        ready: Promise.resolve(mockReg),
      }
      
      // Create window object if it doesn't exist
      if (!global.window) {
        global.window = {}
      }
      
      // Set PushManager and Notification on window
      global.window.PushManager = class {}
      global.window.Notification = {
        requestPermission: requestPermissionMock,
      }

      const result = await initPush('token123')
      
      expect(requestPermissionMock).toHaveBeenCalled()
      expect(axiosChat.get).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      global.navigator.serviceWorker = {
        register: vi.fn().mockRejectedValue(new Error('SW error')),
      }
      global.window.PushManager = class {}

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      await initPush('token123')
      
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('unsubscribePush', () => {
    it('should return early if no registration', async () => {
      global.navigator.serviceWorker = {
        getRegistration: vi.fn().mockResolvedValue(null),
      }

      await unsubscribePush('token123')
      
      expect(axiosChat.delete).not.toHaveBeenCalled()
    })

    it('should return early if no subscription', async () => {
      global.navigator.serviceWorker = {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
          },
        }),
      }

      await unsubscribePush('token123')
      
      expect(axiosChat.delete).not.toHaveBeenCalled()
    })

    it('should unsubscribe successfully', async () => {
      const mockSub = {
        endpoint: 'https://example.com/endpoint',
        unsubscribe: vi.fn().mockResolvedValue(true),
        getKey: vi.fn(),
      }
      
      global.navigator.serviceWorker = {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(mockSub),
          },
        }),
      }
      
      axiosChat.delete.mockResolvedValue({})

      await unsubscribePush('token123')

      expect(axiosChat.delete).toHaveBeenCalled()
      expect(mockSub.unsubscribe).toHaveBeenCalled()
    })
  })
})

