import { db } from '../db/sqlite'
import { notFound } from '../middleware/error-handler'
import { extractFields } from '../lib/field-extractor'

type RecordRow = {
  id: string
  resource_type: string
  subject: string | null
  extracted: string
}

type QueryParams = {
  resourceType?: string
  subject?: string
  fields?: string[]
}

const applyProjection = (extracted: Record<string, unknown>, fields?: string[]): Record<string, unknown> =>
  fields ? extractFields(extracted, fields) : extracted

const parseExtracted = (row: RecordRow): Record<string, unknown> =>
  JSON.parse(row.extracted) as Record<string, unknown>

export const findRecords = ({ resourceType, subject, fields }: QueryParams): Record<string, unknown>[] => {
  let query = 'SELECT id, resource_type, subject, extracted FROM records WHERE 1=1'
  const params: string[] = []

  if (resourceType) {
    query += ' AND resource_type = ?'
    params.push(resourceType)
  }

  if (subject) {
    query += ' AND subject = ?'
    params.push(subject)
  }

  const rows = db.prepare(query).all(...params) as RecordRow[]

  return rows.map(row => applyProjection(parseExtracted(row), fields))
}

export const findRecordById = (id: string, fields?: string[]): Record<string, unknown> => {
  const row = db.prepare(
    'SELECT id, resource_type, subject, extracted FROM records WHERE id = ?'
  ).get(id) as RecordRow | undefined

  if (!row) throw notFound(`Record not found: ${id}`)

  return applyProjection(parseExtracted(row), fields)
}