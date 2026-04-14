// Clinical reference ranges — fallback when insufficient patient history
// for PROD: replace with dynamic baselines built from longitudinal patient data
export const REFERENCE_RANGES = {
  glucose:     { min: 70,  max: 100 },
  cholesterol: { min: 0,   max: 200 },
  weight:      { min: 20,  max: 300 },
  heartRate:   { min: 40,  max: 100 },
  hba1c:       { min: 0,   max: 5.7 },
  systolic:    { min: 90,  max: 120 },
  diastolic:   { min: 60,  max: 80  },
} as const

// LOINC codes mapped to metric names
export const METRIC_FIELD_MAP = {
  '2339-0':  'glucose',
  '2093-3':  'cholesterol',
  '29463-7': 'weight',
  '8867-4':  'heartRate',
  '4548-4':  'hba1c',
  '8480-6':  'systolic',
  '8462-4':  'diastolic',
} as const

// Hybrid anomaly detection thresholds
// for PROD: z-score should be primary method with sufficient patient history
export const ANOMALY_CONFIG = {
  MIN_SAMPLES_FOR_ZSCORE: 3,
  ZSCORE_THRESHOLD: 2,
  MIN_ANOMALIES_FOR_HIGH_RISK: 2,
} as const