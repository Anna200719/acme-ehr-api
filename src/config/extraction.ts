import { ResourceType } from '../models/fhir.types'

type FieldScope = 'all' | readonly ResourceType[]

export const extractionConfig = {
  id: 'all',
  resourceType: 'all',
  subject: ['Observation', 'Procedure', 'Condition', 'MedicationRequest'],
  code: ['Observation', 'Procedure', 'Condition', 'MedicationRequest'],
  status: ['Observation', 'Procedure', 'Condition', 'MedicationRequest'],
  effectiveDateTime: ['Observation'],
  performedDateTime: ['Procedure'],
  valueQuantity: ['Observation'],
  dosageInstruction: ['MedicationRequest'],
  medicationCodeableConcept: ['MedicationRequest'],
  component: ['Observation'],
} as const satisfies Record<string, FieldScope>

export type ExtractionKey = keyof typeof extractionConfig