import { describe, it, expect } from 'vitest'
import {
  HUMAN_MOCK_UNITS,
  isHumanMockUnit,
  validateHumanMockEntry,
  type HumanMockEntry,
} from '@/lib/interview'

// ─── HUMAN_MOCK_UNITS constant ────────────────────────────────────────────────

describe('HUMAN_MOCK_UNITS', () => {
  it('has exactly 2 entries', () => {
    expect(HUMAN_MOCK_UNITS).toHaveLength(2)
  })

  it('contains unit 26', () => {
    expect(HUMAN_MOCK_UNITS).toContain(26)
  })

  it('contains unit 32', () => {
    expect(HUMAN_MOCK_UNITS).toContain(32)
  })

  it('both entries are within valid curriculum range (1–34)', () => {
    for (const unit of HUMAN_MOCK_UNITS) {
      expect(unit).toBeGreaterThanOrEqual(1)
      expect(unit).toBeLessThanOrEqual(34)
    }
  })
})

// ─── isHumanMockUnit ──────────────────────────────────────────────────────────

describe('isHumanMockUnit', () => {
  it('returns true for unit 26', () => {
    expect(isHumanMockUnit(26)).toBe(true)
  })

  it('returns true for unit 32', () => {
    expect(isHumanMockUnit(32)).toBe(true)
  })

  it('returns false for unit 1', () => {
    expect(isHumanMockUnit(1)).toBe(false)
  })

  it('returns false for unit 34', () => {
    expect(isHumanMockUnit(34)).toBe(false)
  })

  it('returns false for unit 25 (one before first mock)', () => {
    expect(isHumanMockUnit(25)).toBe(false)
  })

  it('returns false for unit 27 (one after first mock)', () => {
    expect(isHumanMockUnit(27)).toBe(false)
  })

  it('returns false for unit 31 (one before second mock)', () => {
    expect(isHumanMockUnit(31)).toBe(false)
  })

  it('returns false for unit 33 (one after second mock)', () => {
    expect(isHumanMockUnit(33)).toBe(false)
  })

  it('returns false for unit 0 (out of range)', () => {
    expect(isHumanMockUnit(0)).toBe(false)
  })

  it('returns false for unit 35 (past curriculum end)', () => {
    expect(isHumanMockUnit(35)).toBe(false)
  })

  it('exactly 2 units in 1–34 range are human mock', () => {
    const mockUnits = Array.from({ length: 34 }, (_, i) => i + 1).filter(isHumanMockUnit)
    expect(mockUnits).toHaveLength(2)
  })
})

// ─── validateHumanMockEntry ───────────────────────────────────────────────────

const VALID_ENTRY: HumanMockEntry = {
  contact_name: 'Priya Sharma',
  company_context: 'Senior PM at Google, worked on Maps logistics',
  key_learning: 'Need to lead with the outcome before the context in every behavioral answer',
}

describe('validateHumanMockEntry', () => {
  it('returns valid for a complete entry', () => {
    const result = validateHumanMockEntry(VALID_ENTRY)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns invalid for null', () => {
    const result = validateHumanMockEntry(null)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns invalid for non-object', () => {
    expect(validateHumanMockEntry('string').valid).toBe(false)
    expect(validateHumanMockEntry(42).valid).toBe(false)
  })

  it('returns error when contact_name is missing', () => {
    const { contact_name: _, ...noName } = VALID_ENTRY
    const result = validateHumanMockEntry(noName)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('contact_name'))).toBe(true)
  })

  it('returns error when contact_name is empty string', () => {
    const result = validateHumanMockEntry({ ...VALID_ENTRY, contact_name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('contact_name'))).toBe(true)
  })

  it('returns error when contact_name is whitespace only', () => {
    const result = validateHumanMockEntry({ ...VALID_ENTRY, contact_name: '   ' })
    expect(result.valid).toBe(false)
  })

  it('returns error when company_context is missing', () => {
    const { company_context: _, ...noContext } = VALID_ENTRY
    const result = validateHumanMockEntry(noContext)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('company_context'))).toBe(true)
  })

  it('returns error when key_learning is missing', () => {
    const { key_learning: _, ...noLearning } = VALID_ENTRY
    const result = validateHumanMockEntry(noLearning)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('key_learning'))).toBe(true)
  })

  it('reports all missing fields at once', () => {
    const result = validateHumanMockEntry({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })

  it('returns valid for entry with extra fields (permissive validation)', () => {
    const withExtra = { ...VALID_ENTRY, extra_field: 'ignored' }
    const result = validateHumanMockEntry(withExtra)
    expect(result.valid).toBe(true)
  })
})
