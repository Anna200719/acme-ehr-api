import { db } from '../db/sqlite'
import { detectAnomalies } from '../lib/anomaly'
import { ANOMALY_CONFIG } from '../config/anomaly'
import type { AnomalyResult, DbRecordRow } from '../models/fhir.types'

type SessionRow = {
  total: number
  imported: number
  errors: string
}

type AnalyticsResult = {
  totalRecords: number
  byResourceType: Record<string, number>
  uniquePatients: number
  importSummary: {
    totalSessions: number
    totalErrors: number
  }
  anomalies: AnomalyResult[]
  highRiskPatients: Array<{ patientId: string; anomalyCount: number }>
}

const countByResourceType = (records: DbRecordRow[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const record of records) {
    counts[record.resource_type] = (counts[record.resource_type] ?? 0) + 1
  }
  return counts
}

const countUniquePatients = (records: DbRecordRow[]): number =>
  new Set(records.filter(r => r.subject).map(r => r.subject!)).size

const sumSessionErrors = (sessions: SessionRow[]): number =>
  sessions.reduce((total, session) => {
    try {
      const errors = JSON.parse(session.errors) as unknown[]
      return total + errors.length
    } catch {
      return total
    }
  }, 0)

const findHighRiskPatients = (
  anomalies: AnomalyResult[]
): Array<{ patientId: string; anomalyCount: number }> =>
  Object.entries(
    anomalies.reduce<Record<string, number>>((acc, anomaly) => {
      acc[anomaly.patientId] = (acc[anomaly.patientId] ?? 0) + 1
      return acc
    }, {})
  )
    .filter(([, count]) => count >= ANOMALY_CONFIG.MIN_ANOMALIES_FOR_HIGH_RISK)
    .map(([patientId, anomalyCount]) => ({ patientId, anomalyCount }))

export const getStats = (): AnalyticsResult => {
  const records = db.prepare('SELECT id, resource_type, subject, extracted FROM records').all() as DbRecordRow[]
  const sessions = db.prepare('SELECT total, imported, errors FROM import_sessions').all() as SessionRow[]
  const anomalies = detectAnomalies(records)

  return {
    totalRecords: records.length,
    byResourceType: countByResourceType(records),
    uniquePatients: countUniquePatients(records),
    importSummary: {
      totalSessions: sessions.length,
      totalErrors: sumSessionErrors(sessions),
    },
    anomalies,
    highRiskPatients: findHighRiskPatients(anomalies),
  }
}