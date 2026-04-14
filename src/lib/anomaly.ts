import { REFERENCE_RANGES, METRIC_FIELD_MAP, ANOMALY_CONFIG } from '../config/anomaly'
import { calculateMean, calculateStdDev, calculateZScore } from './stats'
import type { AnomalyResult, DbRecordRow } from '../models/fhir.types'

type MetricValue = {
  metric: string
  value: number
}

type PatientMetrics = Record<string, Record<string, number[]>>

// Primary LOINC code is always first in coding array per FHIR convention
const getPrimaryLoincCode = (coding: unknown[]): string | undefined =>
  (coding?.[0] as Record<string, unknown>)?.code as string | undefined

const extractMetricValue = (extracted: Record<string, unknown>): MetricValue | null => {
  const valueQuantity = extracted.valueQuantity as Record<string, unknown> | undefined
  if (!valueQuantity?.value) return null

  const code = extracted.code as Record<string, unknown> | undefined
  const coding = code?.coding as unknown[] | undefined
  const loincCode = getPrimaryLoincCode(coding ?? [])

  if (!loincCode || !(loincCode in METRIC_FIELD_MAP)) return null

  return {
    metric: METRIC_FIELD_MAP[loincCode as keyof typeof METRIC_FIELD_MAP],
    value: Number(valueQuantity.value),
  }
}

const buildPatientMetrics = (observations: DbRecordRow[]): PatientMetrics => {
  const patientMetrics: PatientMetrics = {}

  for (const row of observations) {
    const extracted = JSON.parse(row.extracted) as Record<string, unknown>
    const metricValue = extractMetricValue(extracted)
    if (!metricValue || !row.subject) continue

    patientMetrics[row.subject] ??= {}
    patientMetrics[row.subject][metricValue.metric] ??= []
    patientMetrics[row.subject][metricValue.metric].push(metricValue.value)
  }

  return patientMetrics
}

const checkZScore = (
  value: number,
  metric: string,
  history: number[]
): Omit<AnomalyResult, 'patientId' | 'recordId' | 'metric' | 'value'> | null => {
  const avg = calculateMean(history)
  const std = calculateStdDev(history)
  const score = calculateZScore(value, avg, std)

  if (score <= ANOMALY_CONFIG.ZSCORE_THRESHOLD) return null

  return {
    reason: `Z-score ${score.toFixed(2)} exceeds threshold of ${ANOMALY_CONFIG.ZSCORE_THRESHOLD}`,
    method: 'z-score',
  }
}

const checkReferenceRange = (
  value: number,
  metric: string
): Omit<AnomalyResult, 'patientId' | 'recordId' | 'metric' | 'value'> | null => {
  const range = REFERENCE_RANGES[metric as keyof typeof REFERENCE_RANGES]
  if (!range) return null

  if (value >= range.min && value <= range.max) return null

  return {
    reason: `Value ${value} outside reference range [${range.min}, ${range.max}]`,
    method: 'reference-range',
  }
}

// Hybrid detection: z-score when enough patient history, reference-range fallback
const detectSingleAnomaly = (
  value: number,
  metric: string,
  history: number[]
): Omit<AnomalyResult, 'patientId' | 'recordId' | 'metric' | 'value'> | null =>
  history.length >= ANOMALY_CONFIG.MIN_SAMPLES_FOR_ZSCORE
    ? checkZScore(value, metric, history)
    : checkReferenceRange(value, metric)

export const detectAnomalies = (rows: DbRecordRow[]): AnomalyResult[] => {
  const observations = rows.filter(row => row.resource_type === 'Observation')
  const patientMetrics = buildPatientMetrics(observations)
  const anomalies: AnomalyResult[] = []

  for (const row of observations) {
    const extracted = JSON.parse(row.extracted) as Record<string, unknown>
    const metricValue = extractMetricValue(extracted)
    if (!metricValue || !row.subject) continue

    const history = patientMetrics[row.subject]?.[metricValue.metric] ?? []
    const anomaly = detectSingleAnomaly(metricValue.value, metricValue.metric, history)

    if (anomaly) {
      anomalies.push({
        ...anomaly,
        patientId: row.subject,
        recordId: row.id,
        metric: metricValue.metric,
        value: metricValue.value,
      })
    }
  }

  return anomalies
}