import { getNestedValue, extractFields } from '../../src/lib/field-extractor'

describe('getNestedValue', () => {
  const obj = {
    id: 'obs-001',
    code: {
      text: 'Blood Pressure',
      coding: [
        { system: 'http://loinc.org', code: '85354-9' }
      ]
    },
    valueQuantity: { value: 95, unit: 'mg/dL' }
  }

  it('returns top-level value', () => {
    expect(getNestedValue(obj, 'id')).toBe('obs-001')
  })

  it('returns nested value via dot notation', () => {
    expect(getNestedValue(obj, 'code.text')).toBe('Blood Pressure')
  })

  it('returns value via array indexing', () => {
    expect(getNestedValue(obj, 'code.coding[0].code')).toBe('85354-9')
  })

  it('returns undefined for missing field', () => {
    expect(getNestedValue(obj, 'status')).toBeUndefined()
  })

  it('returns undefined for deeply missing path', () => {
    expect(getNestedValue(obj, 'code.nonexistent.field')).toBeUndefined()
  })
})

describe('extractFields', () => {
  const obj = { id: 'obs-001', status: 'final', code: { text: 'Glucose' } }

  it('extracts requested fields', () => {
    const result = extractFields(obj, ['id', 'status'])
    expect(result).toEqual({ id: 'obs-001', status: 'final' })
  })

  it('includes undefined for missing fields', () => {
    const result = extractFields(obj, ['id', 'nonexistent'])
    expect(result).toHaveProperty('nonexistent', undefined)
  })
})