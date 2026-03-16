import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { fail } from '../utils/response'

export const errorHandler = (
  err: Error & { code?: string; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    fail(res, 400, err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '))
    return
  }

  if (err.message === 'Invalid file type. Only JPEG and PNG are allowed.') {
    fail(res, 400, err.message)
    return
  }

  if (err.code === 'P2002') {
    fail(res, 409, 'Duplicate entry: Record already exists')
    return
  }

  if (err.code === 'P2025') {
    fail(res, 404, 'Record not found')
    return
  }

  console.error('[Error]', err.message)
  fail(res, err.status ?? 500, err.message ?? 'Internal server error')
}
