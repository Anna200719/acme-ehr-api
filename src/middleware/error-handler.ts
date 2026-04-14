import { Request, Response, NextFunction } from 'express'

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL: 500,
} as const

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export const notFound = (message = 'Resource not found') =>
  new AppError(HTTP_STATUS.NOT_FOUND, message)

export const badRequest = (message = 'Bad request') =>
  new AppError(HTTP_STATUS.BAD_REQUEST, message)

const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (isAppError(err)) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  console.error(err)
  res.status(HTTP_STATUS.INTERNAL).json({ error: 'Internal server error' })
}