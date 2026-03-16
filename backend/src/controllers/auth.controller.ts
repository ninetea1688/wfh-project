import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { comparePassword } from '../utils/password'
import { hashPassword } from '../utils/password'
import { signToken } from '../utils/jwt'
import { ok, fail } from '../utils/response'
import { AuthRequest } from '../middleware/auth.middleware'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
})

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findFirst({
      where: { username, isActive: true },
      include: { department: true },
    })

    if (!user) {
      fail(res, 401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      return
    }

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      fail(res, 401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      return
    }

    const token = signToken({ userId: user.id, username: user.username, role: user.role })

    ok(res, {
      token,
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        position: user.position,
        phone: user.phone,
        department: user.department ? { id: user.department.id, name: user.department.name } : null,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const logout = (_req: Request, res: Response): void => {
  ok(res, null, 'Logged out successfully')
}

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { department: true },
    })

    if (!user || !user.isActive) {
      fail(res, 401, 'User not found or inactive')
      return
    }

    const { passwordHash: _, ...safeUser } = user
    ok(res, safeUser)
  } catch (err) {
    next(err)
  }
}

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(6),
      newPassword: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่และตัวเลข'),
    })
    const { currentPassword, newPassword } = schema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) { fail(res, 404, 'User not found'); return }

    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) { fail(res, 400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง'); return }

    const newHash = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

    ok(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ')
  } catch (err) {
    next(err)
  }
}
