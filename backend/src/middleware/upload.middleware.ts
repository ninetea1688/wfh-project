import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? '5242880') // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png']

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeExt = ['.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.jpg'
    cb(null, `${uuidv4()}${safeExt}`)
  },
})

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'))
  }
}

export const uploadImages = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 3,
  },
  fileFilter,
})
