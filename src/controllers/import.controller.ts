import { Request, Response } from 'express'
import { asyncHandler } from '../lib/async-handler'
import { processImport } from '../services/import.service'

const TEXT_ENCODING = 'utf-8' as const

export const handleImport = asyncHandler(async (req: Request, res: Response) => {
  let content: string

if (req.file) {
  content = req.file.buffer.toString(TEXT_ENCODING)
} else if (typeof req.body === 'string' && req.body.trim().length > 0) {
  content = req.body
} else {
  res.status(400).json({ error: 'No content provided — send a file or raw JSONL body' })
  return
}

  const result = processImport(content)
  res.status(200).json(result)
})