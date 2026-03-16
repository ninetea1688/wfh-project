import { Response } from 'express'

export const ok = (res: Response, data: unknown, message = 'success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message })

export const created = (res: Response, data: unknown, message = 'created') =>
  res.status(201).json({ success: true, data, message })

export const fail = (res: Response, code: number, error: string) =>
  res.status(code).json({ success: false, error, code })
