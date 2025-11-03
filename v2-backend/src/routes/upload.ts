import { Hono } from 'hono'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createFile, getFileById } from '../lib/database'
import { parseCSV } from '../lib/tts'

export const uploadRoutes = new Hono()

// Ensure upload directory exists
const UPLOAD_DIR = join(process.cwd(), 'temp_uploads')
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {})

uploadRoutes.post('/', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    if (!file.name.endsWith('.csv')) {
      return c.json({ error: 'Only CSV files are allowed' }, 400)
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return c.json({ error: 'File too large (max 10MB)' }, 400)
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${timestamp}_${safeFilename}`
    const filePath = join(UPLOAD_DIR, uniqueFilename)
    
    // Save file
    const arrayBuffer = await file.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(arrayBuffer))
    
    // Validate CSV structure
    try {
      await parseCSV(filePath)
    } catch (error) {
      // Clean up invalid file
      await fs.unlink(filePath).catch(() => {})
      return c.json({ error: `Invalid CSV: ${error.message}` }, 400)
    }
    
    // Store in database
    const fileRecord = await createFile({
      id: uniqueFilename,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size
    })
    
    return c.json({
      success: true,
      filename: uniqueFilename,
      original_name: file.name,
      message: 'File uploaded successfully'
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Upload failed' }, 500)
  }
})
