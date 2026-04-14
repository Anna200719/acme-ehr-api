export const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export const calculateStdDev = (values: number[]): number => {
  const avg = calculateMean(values)
  const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}

export const calculateZScore = (value: number, avg: number, stdDev: number): number =>
  stdDev === 0 ? 0 : Math.abs((value - avg) / stdDev)