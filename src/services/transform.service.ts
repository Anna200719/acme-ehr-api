import { db } from '../db/sqlite'
import { getNestedValue } from '../lib/field-extractor'

const ARRAY_NOTATION_PATTERN = /\[.*?\]/g
const DOT_PATTERN = /\./g

const toFlatPrefix = (field: string): string =>
  field.replace(ARRAY_NOTATION_PATTERN, '').replace(DOT_PATTERN, '_')

type TransformAction =
  | { action: 'extract'; field: string; as: string }
  | { action: 'flatten'; field: string }

type TransformRequest = {
  resourceTypes?: string[]
  transformations: TransformAction[]
  filters?: {
    subject?: string
  }
}

type RecordRow = {
  raw: string
}

type TransformRecord = Record<string, unknown>

const applyFlatten = (
  result: TransformRecord,
  raw: TransformRecord,
  field: string
): void => {
  const value = getNestedValue(raw, field)
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return

  const prefix = toFlatPrefix(field)
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    result[`${prefix}_${key}`] = nestedValue
  }
}

const applyExtract = (
  result: TransformRecord,
  raw: TransformRecord,
  field: string,
  as: string
): void => {
  const value = getNestedValue(raw, field)
  if (value !== undefined) result[as] = value
}

const applyTransformations = (
  raw: TransformRecord,
  transformations: TransformAction[]
): TransformRecord => {
  const result: TransformRecord = {
    id: raw.id,
    resourceType: raw.resourceType,
  }

  for (const transformation of transformations) {
    switch (transformation.action) {
      case 'flatten':
        applyFlatten(result, raw, transformation.field)
        break
      case 'extract':
        applyExtract(result, raw, transformation.field, transformation.as)
        break
    }
  }

  return result
}

const buildQuery = (request: TransformRequest): { query: string; params: string[] } => {
  let query = 'SELECT raw FROM records WHERE 1=1'
  const params: string[] = []

  if (request.resourceTypes?.length) {
    query += ` AND resource_type IN (${request.resourceTypes.map(() => '?').join(',')})`
    params.push(...request.resourceTypes)
  }

  if (request.filters?.subject) {
    query += ' AND subject = ?'
    params.push(request.filters.subject)
  }

  return { query, params }
}

export const applyTransform = (request: TransformRequest): TransformRecord[] => {
  const { query, params } = buildQuery(request)
  const rows = db.prepare(query).all(...params) as RecordRow[]

  return rows.map(({ raw }) => {
    const parsed = JSON.parse(raw) as TransformRecord
    return applyTransformations(parsed, request.transformations)
  })
}