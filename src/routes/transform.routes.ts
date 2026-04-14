import { Router } from 'express'
import { handleTransform } from '../controllers/transform.controller'

export const transformRoutes = () => {
  const router = Router()

  router.post('/', handleTransform)

  return router
}