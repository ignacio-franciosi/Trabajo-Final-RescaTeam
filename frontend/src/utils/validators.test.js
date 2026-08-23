import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validateRequiredFields } from './validators'

describe('validators', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('test @example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(validateEmail('Test@Example.COM')).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('should return null for valid passwords', () => {
      expect(validatePassword('Password123')).toBe(null)
      expect(validatePassword('MyStr0ngP@ss')).toBe(null)
      expect(validatePassword('Test1234')).toBe(null)
    })

    it('should return error message for passwords shorter than 8 characters', () => {
      expect(validatePassword('Short1')).toBe('La contraseña debe tener al menos 8 caracteres.')
      expect(validatePassword('Abc12')).toBe('La contraseña debe tener al menos 8 caracteres.')
    })

    it('should return error message for passwords without uppercase', () => {
      expect(validatePassword('password123')).toBe('La contraseña debe contener al menos una mayúscula.')
    })

    it('should return error message for passwords without lowercase', () => {
      expect(validatePassword('PASSWORD123')).toBe('La contraseña debe contener al menos una minúscula.')
    })

    it('should return error message for passwords without numbers', () => {
      expect(validatePassword('Password')).toBe('La contraseña debe contener al menos un número.')
    })

    it('should return first error found when multiple errors exist', () => {
      const result = validatePassword('short')
      expect(result).toBe('La contraseña debe tener al menos 8 caracteres.')
    })
  })

  describe('validateRequiredFields', () => {
    it('should return empty object when all required fields are present', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      }
      const requiredFields = ['name', 'email', 'phone']
      
      expect(validateRequiredFields(formData, requiredFields)).toEqual({})
    })

    it('should return errors for missing required fields', () => {
      const formData = {
        name: 'John Doe',
        email: '',
        phone: '1234567890',
      }
      const requiredFields = ['name', 'email', 'phone']
      
      const errors = validateRequiredFields(formData, requiredFields)
      expect(errors).toHaveProperty('email')
      expect(errors.email).toBe('email es obligatorio.')
    })

    it('should return errors for fields with only whitespace', () => {
      const formData = {
        name: '   ',
        email: 'john@example.com',
      }
      const requiredFields = ['name', 'email']
      
      const errors = validateRequiredFields(formData, requiredFields)
      expect(errors).toHaveProperty('name')
      expect(errors.name).toBe('name es obligatorio.')
    })

    it('should return errors for undefined or null fields', () => {
      const formData = {
        name: undefined,
        email: null,
        phone: '1234567890',
      }
      const requiredFields = ['name', 'email', 'phone']
      
      const errors = validateRequiredFields(formData, requiredFields)
      expect(errors).toHaveProperty('name')
      expect(errors).toHaveProperty('email')
      expect(errors).not.toHaveProperty('phone')
    })

    it('should handle empty requiredFields array', () => {
      const formData = { name: 'John', email: 'john@example.com' }
      expect(validateRequiredFields(formData, [])).toEqual({})
    })
  })
})

