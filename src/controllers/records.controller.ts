import { Request, Response } from 'express'
import { asyncHandler } from '../lib/async-handler'
import { findRecords, findRecordById } from '../services/records.service'

const parseCsv = (value: unknown): string[] | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export const getRecords = asyncHandler(async (req: Request, res: Response) => {
  const { resourceType, subject, fields } = req.query
  const result = findRecords({
    resourceType: resourceType as string | undefined,
    subject: subject as string | undefined,
    fields: parseCsv(fields),
  })
  res.json(result)
})

export const getRecordById = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = findRecordById(id, parseCsv(req.query.fields))
  res.json(result)
})