import { ResourceType } from '../models/fhir.types'

export const validStatuses = {
  Observation: ['final', 'preliminary', 'amended', 'cancelled'],
  Procedure: ['completed', 'in-progress', 'stopped'],
  Condition: ['active', 'inactive', 'resolved'],
  MedicationRequest: ['active', 'stopped', 'completed', 'cancelled'],
} as const satisfies Record<string, readonly string[]>

export const requiredFields = {
  Observation: ['id', 'resourceType', 'subject', 'code', 'status'],
  MedicationRequest: ['id', 'resourceType', 'subject', 'medicationCodeableConcept', 'status'],
  Procedure: ['id', 'resourceType', 'subject'],
  Condition: ['id', 'resourceType', 'subject'],
  Patient: ['id', 'resourceType'],
} as const satisfies Record<ResourceType, readonly string[]>

export const expectedFields: Partial<Record<ResourceType, string[]>> = {
  Observation: ['valueQuantity', 'effectiveDateTime'],
  MedicationRequest: ['dosageInstruction'],
  Procedure: ['performedDateTime'],
  Condition: [],
  Patient: [],
}