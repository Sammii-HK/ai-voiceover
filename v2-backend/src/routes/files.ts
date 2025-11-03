import { Hono } from 'hono'
import { promises as fs } from 'fs'
import { join } from 'path'
import { getAllFiles, deleteFile, getFileById } from '../lib/database'

export const fileRoutes = new Hono()

const UPLOAD_DIR = join(process.cwd(), 'temp_uploads')

fileRoutes.get('/', async (c) => {
  try {
    const files = await getAllFiles()
    
    const fileList = files.map(file => ({
      name: file.filename,
      size: file.size,
      uploaded: new Date(file.uploadedAt).toLocaleTimeString(),
      status: file.status
    }))
    
    return c.json({ files: fileList })
  } catch (error) {
    console.error('Error listing files:', error)
    return c.json({ error: 'Failed to list files' }, 500)
  }
})

fileRoutes.delete('/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    
    // Get file record
    const file = await getFileById(filename)
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    // Check if file is being processed
    if (file.status === 'processing') {
      return c.json({ error: 'File is currently being processed' }, 400)
    }
    
    // Delete physical file
    const filePath = join(UPLOAD_DIR, filename)
    try {
      await fs.unlink(filePath)
    } catch {
      // File might already be deleted, continue with database cleanup
    }
    
    // Delete from database
    await deleteFile(filename)
    
    return c.json({ success: true, message: 'File deleted' })
    
  } catch (error) {
    console.error('Error deleting file:', error)
    return c.json({ error: 'Failed to delete file' }, 500)
  }
})
