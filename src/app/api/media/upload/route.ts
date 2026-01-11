import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Media upload directory (in public folder for easy serving)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Generate a unique ID using crypto (built-in Node.js module)
function generateId(): string {
  return crypto.randomUUID()
}

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch {
    // Directory might already exist
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name).toLowerCase()
    const filename = `${generateId()}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      filename,
      url: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
