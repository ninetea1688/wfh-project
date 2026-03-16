import { Router } from 'express'
import {
  checkIn, checkOut, getToday, getHistory, getById, uploadImages
} from '../controllers/attendance.controller'
import { authenticate } from '../middleware/auth.middleware'
import { uploadImages as multerUpload } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

router.post('/checkin', checkIn)
router.patch('/checkout', checkOut)
router.get('/today', getToday)
router.get('/history', getHistory)
router.get('/:id', getById)
router.post('/:id/images', multerUpload.array('images', 3), uploadImages)

export default router
