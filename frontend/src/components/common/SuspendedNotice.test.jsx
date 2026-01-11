import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SuspendedNotice from './SuspendedNotice'

describe('SuspendedNotice', () => {
  it('should render the suspended notice message', () => {
    render(<SuspendedNotice />)
    
    expect(screen.getByText('Cuenta suspendida')).toBeInTheDocument()
    expect(screen.getByText(/Tu cuenta se encuentra suspendida temporalmente/i)).toBeInTheDocument()
    expect(screen.getByText(/rescateam2025@gmail.com/i)).toBeInTheDocument()
  })

  it('should apply default styling (large size)', () => {
    const { container } = render(<SuspendedNotice />)
    const notice = container.firstChild
    
    expect(notice).toHaveClass('p-6')
    expect(notice).not.toHaveClass('p-3', 'text-sm')
  })

  it('should apply small styling when small prop is true', () => {
    const { container } = render(<SuspendedNotice small={true} />)
    const notice = container.firstChild
    
    expect(notice).toHaveClass('p-3', 'text-sm')
    expect(notice).not.toHaveClass('p-6')
  })

  it('should render with red border and background', () => {
    const { container } = render(<SuspendedNotice />)
    const notice = container.firstChild
    
    expect(notice).toHaveClass('border-red-300', 'bg-red-50', 'text-red-700')
  })
})

