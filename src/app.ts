import express from 'express'
import { errorHandler } from './middleware/error-handler'
import { importRoutes } from './routes/import.routes'
import { recordsRoutes } from './routes/records.routes'
import { transformRoutes } from './routes/transform.routes'
import { analyticsRoutes } from './routes/analytics.routes'

export const createApp = () => {
  const app = express()

  app.use(express.json())
  app.use(express.text({ type: 'text/plain', limit: '10mb' }))

  app.use('/import', importRoutes())
  app.use('/records', recordsRoutes())
  app.use('/transform', transformRoutes())
  app.use('/analytics', analyticsRoutes())

  app.use(errorHandler)

  return app
}