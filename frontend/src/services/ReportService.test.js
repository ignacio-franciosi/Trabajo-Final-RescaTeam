import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createReport,
  getReportById,
  deleteReport,
  getReportsByUserId,
  getReportsByComplainingUserId,
  updateReport,
  getAllReports,
  getAllReportsByStatus,
} from './ReportService'
import apiUsers from './axiosConfigUsers'

// Mock the axios config
vi.mock('./axiosConfigUsers', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('ReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createReport', () => {
    it('should create report successfully', async () => {
      const payload = { postId: '123', reason: 'Spam' }
      const mockResponse = { data: { id: 'report1', ...payload } }
      apiUsers.post.mockResolvedValue(mockResponse)

      const result = await createReport(payload)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(apiUsers.post).toHaveBeenCalledWith('/report', payload)
    })

    it('should handle errors when creating report', async () => {
      const error = { response: { data: { error: 'Validation failed' } } }
      apiUsers.post.mockRejectedValue(error)

      const result = await createReport({})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Validation failed')
    })

    it('should handle errors without response data', async () => {
      apiUsers.post.mockRejectedValue(new Error('Network error'))

      const result = await createReport({})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error al crear el reporte')
    })
  })

  describe('getReportById', () => {
    it('should get report by id successfully', async () => {
      const mockReport = { id: 'report1', postId: '123' }
      apiUsers.get.mockResolvedValue({ data: mockReport })

      const result = await getReportById('report1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReport)
      expect(apiUsers.get).toHaveBeenCalledWith('/report/report1')
    })

    it('should handle errors when getting report', async () => {
      const error = { response: { data: { error: 'Not found' } } }
      apiUsers.get.mockRejectedValue(error)

      const result = await getReportById('report1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Not found')
    })
  })

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      apiUsers.delete.mockResolvedValue({ data: { message: 'Deleted' } })

      const result = await deleteReport('report1')

      expect(result.success).toBe(true)
      expect(apiUsers.delete).toHaveBeenCalledWith('/report/report1')
    })

    it('should handle errors when deleting report', async () => {
      const error = { response: { data: { error: 'Unauthorized' } } }
      apiUsers.delete.mockRejectedValue(error)

      const result = await deleteReport('report1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Unauthorized')
    })
  })

  describe('getReportsByUserId', () => {
    it('should get reports by user id successfully', async () => {
      const mockReports = [{ id: '1' }, { id: '2' }]
      apiUsers.get.mockResolvedValue({ data: mockReports })

      const result = await getReportsByUserId('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReports)
      expect(apiUsers.get).toHaveBeenCalledWith('/report/user/user123')
    })

    it('should return empty array for non-array response', async () => {
      apiUsers.get.mockResolvedValue({ data: { message: 'No reports' } })

      const result = await getReportsByUserId('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle errors when getting reports', async () => {
      const error = { response: { data: { error: 'Server error' } } }
      apiUsers.get.mockRejectedValue(error)

      const result = await getReportsByUserId('user123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Server error')
    })
  })

  describe('getReportsByComplainingUserId', () => {
    it('should get reports by complaining user id successfully', async () => {
      const mockReports = [{ id: '1' }]
      apiUsers.get.mockResolvedValue({ data: mockReports })

      const result = await getReportsByComplainingUserId('user456')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReports)
      expect(apiUsers.get).toHaveBeenCalledWith('/report/complainingUser/user456')
    })

    it('should return empty array for non-array response', async () => {
      apiUsers.get.mockResolvedValue({ data: null })

      const result = await getReportsByComplainingUserId('user456')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('updateReport', () => {
    it('should update report successfully', async () => {
      const payload = { status: 'resolved' }
      apiUsers.patch.mockResolvedValue({ data: { id: 'report1', ...payload } })

      const result = await updateReport('report1', payload)

      expect(result.success).toBe(true)
      expect(apiUsers.patch).toHaveBeenCalledWith('/report/report1', payload)
    })

    it('should handle errors when updating report', async () => {
      const error = { response: { data: { error: 'Not found' } } }
      apiUsers.patch.mockRejectedValue(error)

      const result = await updateReport('report1', {})

      expect(result.success).toBe(false)
      expect(result.message).toBe('Not found')
    })
  })

  describe('getAllReports', () => {
    it('should get all reports successfully', async () => {
      const mockReports = [{ id: '1' }, { id: '2' }]
      apiUsers.get.mockResolvedValue({ data: mockReports })

      const result = await getAllReports()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReports)
      expect(apiUsers.get).toHaveBeenCalledWith('/report/all')
    })

    it('should return empty array for non-array response', async () => {
      apiUsers.get.mockResolvedValue({ data: null })

      const result = await getAllReports()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle errors when getting all reports', async () => {
      const error = { response: { data: { error: 'Unauthorized' } } }
      apiUsers.get.mockRejectedValue(error)

      const result = await getAllReports()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Unauthorized')
    })
  })

  describe('getAllReportsByStatus', () => {
    it('should get reports by status successfully', async () => {
      const mockReports = [{ id: '1', status: 'pending' }]
      apiUsers.get.mockResolvedValue({ data: mockReports })

      const result = await getAllReportsByStatus('pending')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReports)
      expect(apiUsers.get).toHaveBeenCalledWith('/report/all/pending')
    })

    it('should encode status in URL', async () => {
      apiUsers.get.mockResolvedValue({ data: [] })

      await getAllReportsByStatus('in progress')

      expect(apiUsers.get).toHaveBeenCalledWith('/report/all/in%20progress')
    })

    it('should handle errors when getting reports by status', async () => {
      const error = { response: { data: { error: 'Invalid status' } } }
      apiUsers.get.mockRejectedValue(error)

      const result = await getAllReportsByStatus('invalid')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid status')
    })
  })
})

