import { Router } from 'express'
import { getAnalytics } from '../controllers/analytics.controller'

export const analyticsRoutes = () => {
  const router = Router()

  router.get('/', getAnalytics)

  return router
}