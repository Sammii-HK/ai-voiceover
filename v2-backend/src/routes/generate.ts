import { Hono } from 'hono'
import { promises as fs } from 'fs'
import { join } from 'path'
import { getFileById, createJob, updateJobStatus, getJobById } from '../lib/database'
import { generateAudioFromCSV, EDGE_VOICES, OPENAI_VOICES } from '../lib/tts'
import type { GenerateRequest } from '../types'

export const generateRoutes = new Hono()

const UPLOAD_DIR = join(process.cwd(), 'temp_uploads')
const OUTPUT_DIR = join(process.cwd(), 'temp_output')

// Ensure output directory exists
fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(() => {})

// In-memory job tracking (in production, use Redis or database)
const activeJobs = new Map<string, any>()

generateRoutes.post('/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    const body = await c.req.json() as GenerateRequest
    
    // Validate request
    if (!body.voice_type || !body.voice) {
      return c.json({ error: 'Missing voice_type or voice' }, 400)
    }
    
    // Validate voice
    if (body.voice_type === 'edge' && !EDGE_VOICES[body.voice]) {
      return c.json({ error: 'Invalid Edge TTS voice' }, 400)
    }
    
    if (body.voice_type === 'openai') {
      if (!OPENAI_VOICES[body.voice]) {
        return c.json({ error: 'Invalid OpenAI voice' }, 400)
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return c.json({ error: 'OpenAI API key not configured' }, 400)
      }
    }
    
    // Get file record
    const file = await getFileById(filename)
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    // Check if file exists
    const inputPath = join(UPLOAD_DIR, filename)
    try {
      await fs.access(inputPath)
    } catch {
      return c.json({ error: 'File not found on disk' }, 404)
    }
    
    // Check if already processing
    if (activeJobs.has(filename)) {
      return c.json({ error: 'File is already being processed' }, 400)
    }
    
    // Create job record
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await createJob({
      id: jobId,
      fileId: filename,
      voiceType: body.voice_type,
      voiceId: body.voice
    })
    
    // Start background processing
    const outputPath = join(OUTPUT_DIR, `${filename.replace('.csv', '')}_${body.voice}.mp3`)
    
    // Mark as active
    activeJobs.set(filename, { jobId, status: 'processing' })
    
    // Process in background (non-blocking)
    processAudioGeneration(filename, inputPath, outputPath, body.voice_type, body.voice, jobId)
      .catch(error => {
        console.error('Background processing error:', error)
        activeJobs.delete(filename)
        updateJobStatus(jobId, 'error', undefined, error.message)
      })
    
    return c.json({
      success: true,
      message: 'Audio generation started',
      filename: filename,
      jobId: jobId
    })
    
  } catch (error) {
    console.error('Generate error:', error)
    return c.json({ error: 'Generation failed' }, 500)
  }
})

async function processAudioGeneration(
  filename: string,
  inputPath: string,
  outputPath: string,
  voiceType: 'edge' | 'openai',
  voiceId: string,
  jobId: string
) {
  try {
    console.log(`🎧 Starting audio generation for ${filename} with ${voiceType}:${voiceId}`)
    
    await generateAudioFromCSV(
      inputPath,
      voiceType,
      voiceId,
      outputPath,
      (progress, total) => {
        console.log(`Progress: ${progress}/${total} cards processed`)
      }
    )
    
    // Update job status
    await updateJobStatus(jobId, 'completed', outputPath)
    activeJobs.set(filename, { 
      jobId, 
      status: 'completed', 
      outputPath,
      completedAt: new Date()
    })
    
    console.log(`✅ Audio generation completed for ${filename}`)
    
  } catch (error) {
    console.error(`❌ Audio generation failed for ${filename}:`, error)
    await updateJobStatus(jobId, 'error', undefined, error.message)
    activeJobs.delete(filename)
  }
}

generateRoutes.get('/status/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    
    const job = activeJobs.get(filename)
    if (!job) {
      return c.json({ status: 'ready' })
    }
    
    if (job.status === 'completed') {
      return c.json({
        status: 'completed',
        download_ready: true,
        completed_at: job.completedAt?.toLocaleTimeString()
      })
    } else if (job.status === 'error') {
      return c.json({
        status: 'error',
        error: job.error || 'Unknown error'
      })
    } else {
      return c.json({ status: 'processing' })
    }
    
  } catch (error) {
    console.error('Status check error:', error)
    return c.json({ error: 'Status check failed' }, 500)
  }
})

generateRoutes.get('/download/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    
    const job = activeJobs.get(filename)
    if (!job || job.status !== 'completed' || !job.outputPath) {
      return c.json({ error: 'File not ready for download' }, 400)
    }
    
    // Check if file exists
    try {
      await fs.access(job.outputPath)
    } catch {
      return c.json({ error: 'Generated file not found' }, 404)
    }
    
    // Read file and send
    const fileBuffer = await fs.readFile(job.outputPath)
    const downloadName = `${filename.replace('.csv', '')}_${job.voiceId || 'audio'}.mp3`
    
    // Clean up after sending
    setTimeout(async () => {
      try {
        await fs.unlink(job.outputPath)
        await fs.unlink(join(UPLOAD_DIR, filename))
        activeJobs.delete(filename)
      } catch {}
    }, 5000) // 5 second delay to ensure download completes
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${downloadName}"`
      }
    })
    
  } catch (error) {
    console.error('Download error:', error)
    return c.json({ error: 'Download failed' }, 500)
  }
})
