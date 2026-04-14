import { Router } from 'express'
import { getRecords, getRecordById } from '../controllers/records.controller'

export const recordsRoutes = () => {
  const router = Router()

  router.get('/', getRecords)
  router.get('/:id', getRecordById)

  return router
}