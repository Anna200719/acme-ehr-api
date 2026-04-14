export type ResourceType = 'Observation' | 'Condition' | 'MedicationRequest' | 'Procedure' | 'Patient'

export interface FhirCoding {
  system: string
  code: string
  display?: string
}

export interface FhirCodeableConcept {
  coding: FhirCoding[]
  text?: string
}

export interface FhirReference {
  reference: string
  display?: string
}

export interface FhirQuantity {
  value: number
  unit: string
}

export interface FhirResource {
  id: string
  resourceType: ResourceType
  subject?: FhirReference
  code?: FhirCodeableConcept
  status?: string
  [key: string]: unknown
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation'
  effectiveDateTime?: string
  valueQuantity?: FhirQuantity
  component?: Array<{
    code: FhirCodeableConcept
    valueQuantity?: FhirQuantity
  }>
}

export interface FhirProcedure extends FhirResource {
  resourceType: 'Procedure'
  performedDateTime?: string
}

export interface FhirMedicationRequest extends FhirResource {
  resourceType: 'MedicationRequest'
  medicationCodeableConcept?: FhirCodeableConcept
  dosageInstruction?: Array<{ text: string }>
}

export interface AnomalyResult {
  patientId: string
  recordId: string
  metric: string
  value: number
  reason: string
  method: 'z-score' | 'reference-range'
}

export interface ValidationIssue {
  line: number
  id?: string
  field: string
  message: string
}

export interface ImportResult {
  total: number
  imported: number
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  stats: {
    byResourceType: Record<string, number>
    uniquePatients: number
  }
}

export type DbRecordRow = {
  id: string
  resource_type: string
  subject: string | null
  extracted: string
}