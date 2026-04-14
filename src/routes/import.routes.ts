import { Router } from 'express'
import { handleImport } from '../controllers/import.controller'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

export const importRoutes = () => {
  const router = Router()

  router.post('/', upload.single('file'), handleImport)

  return router
}