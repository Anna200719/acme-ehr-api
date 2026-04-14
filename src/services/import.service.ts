import { randomUUID } from 'crypto'
import { db } from '../db/sqlite'
import { extractionConfig } from '../config/extraction'
import { getNestedValue, extractFields } from '../lib/field-extractor'
import { FhirResource, ResourceType, ImportResult, ValidationIssue } from '../models/fhir.types'
import { requiredFields, validStatuses, expectedFields } from '../config/validation'
const BOM = '\uFEFF'

const stripBom = (content: string): string =>
  content.startsWith(BOM) ? content.slice(1) : content

const parseLines = (content: string): Array<{ line: number; raw: string }> =>
  stripBom(content)
    .split('\n')
    .map((raw, index) => ({ line: index + 1, raw: raw.trim() }))
    .filter(({ raw }) => raw.length > 0)

const asRecord = (resource: FhirResource): Record<string, unknown> =>
  resource as Record<string, unknown>

const appliesToResource = (scope: 'all' | readonly ResourceType[], resourceType: ResourceType): boolean =>
  scope === 'all' || scope.includes(resourceType)

const getApplicableFields = (resourceType: ResourceType): string[] =>
  Object.entries(extractionConfig)
    .filter(([, scope]) => appliesToResource(scope, resourceType))
    .map(([field]) => field)

const validateResource = (resource: FhirResource, line: number): ValidationIssue[] => {
  const errors: ValidationIssue[] = []
  const resourceType = resource.resourceType as ResourceType
  const required = requiredFields[resourceType]

  if (!required) {
    errors.push({ line, field: 'resourceType', message: `Unknown resourceType: ${resource.resourceType}` })
    return errors
  }

  const record = asRecord(resource)

  for (const field of required) {
    if (getNestedValue(record, field) === undefined) {
      errors.push({ line, id: resource.id, field, message: `Missing required field: ${field}` })
    }
  }

  const statuses = validStatuses[resourceType as keyof typeof validStatuses]
  const status = resource.status

  if (statuses && status && !statuses.includes(status as never)) {
    errors.push({ line, id: resource.id, field: 'status', message: `Invalid status: ${status}` })
  }

  return errors
}

const checkWarnings = (resource: FhirResource, line: number): ValidationIssue[] => {
  const resourceType = resource.resourceType as ResourceType
  const expected = expectedFields[resourceType]
  if (!expected?.length) return []

  const record = asRecord(resource)

  return expected
    .filter(field => getNestedValue(record, field) === undefined)
    .map(field => ({ line, id: resource.id, field, message: `Missing expected field: ${field}` }))
}

const extractForResource = (resource: FhirResource): Record<string, unknown> =>
  extractFields(asRecord(resource), getApplicableFields(resource.resourceType as ResourceType))

type RecordBatch = Array<{ resource: FhirResource; extracted: Record<string, unknown> }>

const insertBatch = db.transaction((batch: RecordBatch) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO records (id, resource_type, subject, extracted, raw)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const { resource, extracted } of batch) {
    stmt.run(
      resource.id,
      resource.resourceType,
      resource.subject?.reference ?? null,
      JSON.stringify(extracted),
      JSON.stringify(resource)
    )
  }
})

export const processImport = (content: string): ImportResult => {
  const lines = parseLines(content)
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const stats: Record<string, number> = {}
  const patients = new Set<string>()
  const batch: RecordBatch = []

  for (const { line, raw } of lines) {
    let resource: FhirResource

    try {
      resource = JSON.parse(raw) as FhirResource
    } catch {
      errors.push({ line, field: 'json', message: 'Invalid JSON' })
      continue
    }

    const validationErrors = validateResource(resource, line)
    if (validationErrors.length > 0) {
      errors.push(...validationErrors)
      continue
    }

    warnings.push(...checkWarnings(resource, line))
    batch.push({ resource, extracted: extractForResource(resource) })

    stats[resource.resourceType] = (stats[resource.resourceType] ?? 0) + 1
    if (resource.subject?.reference) patients.add(resource.subject.reference)
  }

  insertBatch(batch)

  db.prepare(`
    INSERT INTO import_sessions (id, total, imported, errors, warnings)
    VALUES (?, ?, ?, ?, ?)
  `).run(randomUUID(), lines.length, batch.length, JSON.stringify(errors), JSON.stringify(warnings))

  return {
    total: lines.length,
    imported: batch.length,
    errors,
    warnings,
    stats: {
      byResourceType: stats,
      uniquePatients: patients.size,
    },
  }
}