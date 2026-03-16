import { Router } from 'express'
import { getDashboard, getReports, exportExcel, exportPdf } from '../controllers/reports.controller'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/dashboard', getDashboard)
router.get('/', getReports)
router.get('/export/excel', exportExcel)
router.get('/export/pdf', exportPdf)

export default router
