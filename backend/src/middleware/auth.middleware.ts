import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../utils/jwt'
import { fail } from '../utils/response'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    fail(res, 401, 'Unauthorized: Missing token')
    return
  }

  const token = authHeader.substring(7)
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    fail(res, 401, 'Unauthorized: Invalid or expired token')
  }
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    fail(res, 403, 'Forbidden: Admin access required')
    return
  }
  next()
}
