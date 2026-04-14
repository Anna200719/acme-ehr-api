import { Request, Response } from 'express'
import { asyncHandler } from '../lib/async-handler'
import { getStats } from '../services/analytics.service'

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const result = getStats()
  res.json(result)
})