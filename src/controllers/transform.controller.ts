import { Request, Response } from 'express'
import { asyncHandler } from '../lib/async-handler'
import { applyTransform } from '../services/transform.service'

export const handleTransform = asyncHandler(async (req: Request, res: Response) => {
  const result = applyTransform(req.body)
  res.json(result)
})