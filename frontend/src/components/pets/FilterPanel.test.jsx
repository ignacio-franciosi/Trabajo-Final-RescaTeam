import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterPanel from './FilterPanel'

// Helper to get element by name attribute
const getByName = (name) => screen.getByRole('combobox', { name: new RegExp(name, 'i') }) || document.querySelector(`[name="${name}"]`)

// Mocks
const mockOnFilterChange = vi.fn()

vi.mock('./ZoneSelect', () => ({
  default: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid="zone-select"
      >
        <option value="">Seleccionar zona</option>
        <option value="Centro">Centro</option>
        <option value="Villa Allende">Villa Allende</option>
      </select>
    </div>
  ),
}))

// Tests
describe('FilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter panel with all fields', () => {
    const { container } = render(<FilterPanel onFilterChange={mockOnFilterChange} postType="adoption" />)

    expect(screen.getByText(/filtrar mascotas/i)).toBeInTheDocument()
    expect(container.querySelector('select[name="especie"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="raza"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="edad"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="tamaño"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="sexo"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="castrado"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="vacunas"]')).toBeInTheDocument()
    expect(screen.getByTestId('zone-select')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aplicar filtros/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument()
  })

  it('shows adoption-specific filters when postType is adoption', () => {
    const { container } = render(<FilterPanel onFilterChange={mockOnFilterChange} postType="adoption" />)

    expect(container.querySelector('select[name="edad"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="castrado"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="vacunas"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="estadoSalud"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[name="colorCollar"]')).not.toBeInTheDocument()
  })

  it('shows lost/found-specific filters when postType is not adoption', () => {
    const { container } = render(<FilterPanel onFilterChange={mockOnFilterChange} postType="lost" />)

    expect(container.querySelector('select[name="edad"]')).not.toBeInTheDocument()
    expect(container.querySelector('select[name="castrado"]')).not.toBeInTheDocument()
    expect(container.querySelector('select[name="vacunas"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[name="estadoSalud"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="colorCollar"]')).toBeInTheDocument()
  })

  it('updates filter values on input', async () => {
    const user = userEvent.setup()
    const { container } = render(<FilterPanel onFilterChange={mockOnFilterChange} postType="adoption" />)

    const especieSelect = container.querySelector('select[name="especie"]')
    const razaInput = container.querySelector('input[name="raza"]')

    await act(async () => {
      await user.selectOptions(especieSelect, 'perro')
      await user.type(razaInput, 'Labrador')
    })

    expect(especieSelect).toHaveValue('perro')
    expect(razaInput).toHaveValue('Labrador')
  })

  it('calls onFilterChange when apply filters button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<FilterPanel onFilterChange={mockOnFilterChange} postType="adoption" />)

    const especieSelect = container.querySelector('select[name="especie"]')
    const tamañoSelect = container.querySelector('select[name="tamaño"]')

    await act(async () => {
      await user.selectOptions(especieSelect, 'gato')
      await user.selectOptions(tamañoSelect, 'pequeño')
      await user.click(screen.getByRole('button', { name: /aplicar filtros/i }))
    })

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        especie: 'gato',
        tamaño: 'pequeño',
      })
    )
  })

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<FilterPanel onFilterChange={mockOnFilterChange} postType="adoption" />)

    const especieSelect = container.querySelector('select[name="especie"]')
    const razaInput = container.querySelector('input[name="raza"]')
    const edadSelect = container.querySelector('select[name="edad"]')

    await act(async () => {
      await user.selectOptions(especieSelect, 'perro')
      await user.type(razaInput, 'Labrador')
      await user.selectOptions(edadSelect, '2-3')
      await user.click(screen.getByRole('button', { name: /limpiar/i }))
    })

    expect(especieSelect).toHaveValue('')
    expect(razaInput).toHaveValue('')
    expect(edadSelect).toHaveValue('')
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      especie: '',
      edad: '',
      tamaño: '',
      sexo: '',
      castrado: '',
      vacunas: '',
      zona: '',
      raza: '',
      estadoSalud: '',
      colorCollar: '',
    })
  })

  it('updates zone filter via ZoneSelect', async () => {
    const user = userEvent.setup()
    render(<FilterPanel onFilterChange={mockOnFilterChange} postType="adoption" />)

    const zoneSelect = screen.getByTestId('zone-select')

    await act(async () => {
      await user.selectOptions(zoneSelect, 'Centro')
      await user.click(screen.getByRole('button', { name: /aplicar filtros/i }))
    })

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        zona: 'Centro',
      })
    )
  })
})