import { Router, Request, Response } from 'express'
import multer from 'multer'
import {
  ALLOWED_TYPES,
  MAX_VIDEO_SIZE,
  isValidMediaType,
  isImageType,
  getMaxSizeForType,
  saveMediaFile,
  deleteMediaFile,
  getMediaPath,
  mediaFileExists,
  getMimeTypeFromFilename,
} from '../media.js'
import fs from 'fs'

export const mediaRouter = Router()

// Configure multer for memory storage (so we can validate before saving)
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use max video size as upper bound
  },
  fileFilter: (req, file, cb) => {
    if (!isValidMediaType(file.mimetype)) {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_TYPES.join(', ')}`))
      return
    }

    // Check file size against type-specific limit
    const maxSize = getMaxSizeForType(file.mimetype)
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)

    if (contentLength > maxSize) {
      const maxMB = maxSize / (1024 * 1024)
      cb(new Error(`File too large. Maximum size for ${isImageType(file.mimetype) ? 'images' : 'videos'} is ${maxMB}MB`))
      return
    }

    cb(null, true)
  },
})

// Error handler for multer errors
function handleMulterError(error: unknown, req: Request, res: Response, next: () => void) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: `File too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB` })
      return
    }
    res.status(400).json({ error: error.message })
    return
  }
  if (error instanceof Error) {
    res.status(400).json({ error: error.message })
    return
  }
  next()
}

/**
 * POST /api/media/upload
 * Upload a single media file
 * Returns: { success: true, filename: string, url: string }
 */
mediaRouter.post('/upload', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const { buffer, mimetype, size } = req.file

    // Double-check file size (multer may not catch it in all cases)
    const maxSize = getMaxSizeForType(mimetype)
    if (size > maxSize) {
      const maxMB = maxSize / (1024 * 1024)
      res.status(400).json({
        error: `File too large (${(size / (1024 * 1024)).toFixed(1)}MB). Maximum size for ${isImageType(mimetype) ? 'images' : 'videos'} is ${maxMB}MB`,
      })
      return
    }

    // Save the file
    const filename = await saveMediaFile(buffer, mimetype)

    res.status(201).json({
      success: true,
      filename,
      url: `/api/media/${filename}`,
    })
  } catch (error) {
    console.error('Error uploading media:', error)
    res.status(500).json({ error: 'Failed to upload media' })
  }
})

/**
 * GET /api/media/:filename
 * Serve a media file
 */
mediaRouter.get('/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }

    if (!mediaFileExists(filename)) {
      res.status(404).json({ error: 'Media not found' })
      return
    }

    const filepath = getMediaPath(filename)
    const mimetype = getMimeTypeFromFilename(filename)

    if (mimetype) {
      res.setHeader('Content-Type', mimetype)
    }

    // Set cache headers for media files
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    // Stream the file
    const stream = fs.createReadStream(filepath)
    stream.pipe(res)
  } catch (error) {
    console.error('Error serving media:', error)
    res.status(500).json({ error: 'Failed to serve media' })
  }
})

/**
 * DELETE /api/media/:filename
 * Delete a media file
 */
mediaRouter.delete('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }

    const deleted = await deleteMediaFile(filename)

    if (!deleted) {
      res.status(404).json({ error: 'Media not found' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    res.status(500).json({ error: 'Failed to delete media' })
  }
})
