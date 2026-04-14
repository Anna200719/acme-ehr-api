import { calculateMean, calculateStdDev, calculateZScore } from '../../src/lib/stats'

describe('calculateMean', () => {
  it('calculates mean correctly', () => {
    expect(calculateMean([2, 4, 6])).toBe(4)
  })

  it('returns 0 for empty array', () => {
    expect(calculateMean([])).toBe(0)
  })
})

describe('calculateStdDev', () => {
  it('returns 0 for identical values', () => {
    expect(calculateStdDev([5, 5, 5])).toBe(0)
  })

  it('calculates stdDev correctly', () => {
    expect(calculateStdDev([2, 4, 6])).toBeCloseTo(1.63, 1)
  })
})

describe('calculateZScore', () => {
  it('returns 0 when stdDev is 0', () => {
    expect(calculateZScore(5, 5, 0)).toBe(0)
  })

  it('calculates z-score correctly', () => {
    expect(calculateZScore(8, 5, 2)).toBeCloseTo(1.5)
  })
})