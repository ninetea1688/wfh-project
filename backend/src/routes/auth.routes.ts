import { Router } from 'express'
import { login, logout, me, changePassword } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/login', login)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)
router.patch('/change-password', authenticate, changePassword)

export default router
