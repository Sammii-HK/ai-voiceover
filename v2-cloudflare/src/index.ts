import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Cloudflare Workers environment
interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  OPENAI_API_KEY: string
  ENVIRONMENT: string
}

// Initialize Hono app with Cloudflare Workers types
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: ['https://ai-voiceover-three.vercel.app', 'https://ai-voiceover.pages.dev', 'http://localhost:3000', 'http://localhost:4173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Health check with edge info
app.get('/health', (c) => {
  const cf = c.req.raw.cf
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    runtime: 'cloudflare-workers',
    framework: 'hono',
    datacenter: cf?.colo || 'unknown',
    country: cf?.country || 'unknown',
    environment: c.env.ENVIRONMENT || 'development'
  })
})

// Voice configuration endpoint with preview support
app.get('/api/voices', (c) => {
  const voices = {
    edge: {
      'en-GB-LibbyNeural': 'UK Female - Libby (Natural)',
      'en-GB-SoniaNeural': 'UK Female - Sonia (Professional)',
      'en-GB-RyanNeural': 'UK Male - Ryan',
      'en-US-JennyNeural': 'US Female - Jenny',
      'en-US-GuyNeural': 'US Male - Guy'
    },
    openai: {
      'alloy': 'Neutral - Alloy (Clean, Apple-like)',
      'echo': 'Male - Echo',
      'fable': 'British Accent - Fable',
      'onyx': 'Deep Male - Onyx',
      'nova': 'Young Female - Nova (Most Natural)',
      'shimmer': 'Soft Female - Shimmer'
    }
  }
  
  // Add preview URLs
  const voicesWithPreviews = {
    edge: {},
    openai: {},
    hasOpenAI: !!c.env.OPENAI_API_KEY
  }
  
  // Add Edge TTS voices with preview URLs
  for (const [voiceId, description] of Object.entries(voices.edge)) {
    voicesWithPreviews.edge[voiceId] = {
      description,
      previewUrl: `/api/voices/preview/edge/${voiceId}`,
      isPremium: false
    }
  }
  
  // Add OpenAI voices with preview URLs  
  for (const [voiceId, description] of Object.entries(voices.openai)) {
    voicesWithPreviews.openai[voiceId] = {
      description,
      previewUrl: `/api/voices/preview/openai/${voiceId}`,
      isPremium: true
    }
  }
  
  return c.json(voicesWithPreviews)
})

// Voice preview endpoint
app.get('/api/voices/preview/:type/:voiceId', async (c) => {
  try {
    const voiceType = c.req.param('type') as 'edge' | 'openai'
    const voiceId = c.req.param('voiceId')
    
    if (!['edge', 'openai'].includes(voiceType)) {
      return c.json({ error: 'Invalid voice type' }, 400)
    }
    
    const previewKey = `${voiceType}_${voiceId}`
    
    // Check if preview already exists in R2
    const existingPreview = await c.env.STORAGE.get(`previews/${previewKey}.mp3`)
    
    if (existingPreview) {
      // Return cached preview
      return new Response(existingPreview.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000', // 1 year
          'X-Preview-Source': 'cached'
        }
      })
    }
    
    // Generate new preview (simplified for edge)
    const sampleText = "This is a preview of this voice. Clear, natural speech perfect for learning."
    
    if (voiceType === 'openai' && !c.env.OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI not configured' }, 400)
    }
    
    // Generate preview using OpenAI API directly (for OpenAI voices)
    if (voiceType === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: voiceId,
            input: sampleText,
            speed: 1.0
          })
        })
        
        if (response.ok) {
          const audioBuffer = await response.arrayBuffer()
          
          // Cache in R2 for future use
          await c.env.STORAGE.put(`previews/${previewKey}.mp3`, audioBuffer, {
            httpMetadata: {
              contentType: 'audio/mpeg',
              cacheControl: 'public, max-age=31536000'
            }
          })
          
          return new Response(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=31536000',
              'X-Preview-Source': 'generated'
            }
          })
        }
      } catch (error) {
        console.error('OpenAI TTS error:', error)
      }
    }
    
    // For Edge TTS, return a message that it needs server-side generation
    return c.json({
      error: 'Edge TTS previews require server-side generation',
      message: 'OpenAI previews work instantly, Edge TTS previews coming soon',
      voiceType,
      voiceId
    }, 501)
    
  } catch (error) {
    console.error('Preview generation error:', error)
    return c.json({ error: 'Failed to generate preview' }, 500)
  }
})

// File upload endpoint (simplified for edge)
app.post('/api/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    if (!file.name.endsWith('.csv')) {
      return c.json({ error: 'Only CSV files are allowed' }, 400)
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit for edge
      return c.json({ error: 'File too large (max 5MB for edge deployment)' }, 400)
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${timestamp}_${safeFilename}`
    
    // Store in R2 (Cloudflare's S3-compatible storage)
    const arrayBuffer = await file.arrayBuffer()
    await c.env.STORAGE.put(uniqueFilename, arrayBuffer, {
      httpMetadata: {
        contentType: 'text/csv',
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      }
    })
    
    // Basic CSV validation
    const content = new TextDecoder().decode(arrayBuffer)
    const lines = content.trim().split('\n')
    
    if (lines.length < 2) {
      await c.env.STORAGE.delete(uniqueFilename)
      return c.json({ error: 'CSV must have at least a header row and one data row' }, 400)
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    if (!headers.includes('Front') || !headers.includes('Back')) {
      await c.env.STORAGE.delete(uniqueFilename)
      return c.json({ error: 'CSV must have "Front" and "Back" columns' }, 400)
    }
    
    // Store metadata in D1 database
    await c.env.DB.prepare(`
      INSERT INTO files (id, filename, original_name, size, uploaded_at, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      uniqueFilename,
      uniqueFilename,
      file.name,
      file.size,
      Date.now(),
      'ready'
    ).run()
    
    return c.json({
      success: true,
      filename: uniqueFilename,
      original_name: file.name,
      message: 'File uploaded successfully to edge storage'
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Upload failed' }, 500)
  }
})

// List files endpoint
app.get('/api/files', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT filename, original_name, size, uploaded_at, status 
      FROM files 
      ORDER BY uploaded_at DESC
    `).all()
    
    const files = results.map((file: any) => ({
      name: file.filename,
      size: file.size,
      uploaded: new Date(file.uploaded_at).toLocaleTimeString(),
      status: file.status
    }))
    
    return c.json({ files })
  } catch (error) {
    console.error('Error listing files:', error)
    return c.json({ error: 'Failed to list files' }, 500)
  }
})

// Simple auth endpoints for admin access
app.post('/api/auth/sign-up', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Check if admin user
    const isAdmin = email.toLowerCase() === c.env.ADMIN_USER?.toLowerCase()
    
    console.log(`Auth check: ${email} vs ${c.env.ADMIN_USER} = Admin: ${isAdmin}`)
    
    // Create user object (in production, save to database)
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      plan: isAdmin ? 'admin' : 'free', // Use 'admin' plan for admins
      isAdmin: isAdmin,
      minutesUsed: isAdmin ? -1 : 0 // -1 = unlimited for admin
    }
    
    // Create simple JWT token
    const token = btoa(JSON.stringify({ ...user, exp: Date.now() + (7 * 24 * 60 * 60 * 1000) }))
    
    return c.json({
      success: true,
      user,
      token
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Failed to create account' }, 500)
  }
})

app.post('/api/auth/sign-in', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Check if admin user
    const isAdmin = email.toLowerCase() === c.env.ADMIN_USER?.toLowerCase()
    
    console.log(`Auth check: ${email} vs ${c.env.ADMIN_USER} = Admin: ${isAdmin}`)
    
    const user = {
      id: `user_${Date.now()}`,
      email,
      plan: isAdmin ? 'admin' : 'free', // Use 'admin' plan for admins
      isAdmin: isAdmin,
      minutesUsed: isAdmin ? -1 : 0 // -1 = unlimited for admin
    }
    
    const token = btoa(JSON.stringify({ ...user, exp: Date.now() + (7 * 24 * 60 * 60 * 1000) }))
    
    return c.json({
      success: true,
      user,
      token
    })
    
  } catch (error) {
    console.error('Signin error:', error)
    return c.json({ error: 'Failed to sign in' }, 500)
  }
})

app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const token = authHeader.slice(7)
    const userData = JSON.parse(atob(token))
    
    if (!userData || userData.exp < Date.now()) {
      return c.json({ error: 'Token expired' }, 401)
    }
    
    return c.json({
      success: true,
      user: {
        email: userData.email,
        plan: userData.plan,
        isAdmin: userData.isAdmin,
        minutesUsed: userData.minutesUsed
      }
    })
    
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// Generate audio endpoint (simplified - would use Durable Objects for full processing)
app.post('/api/generate/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    const body = await c.req.json()
    
    if (!body.voice_type || !body.voice) {
      return c.json({ error: 'Missing voice_type or voice' }, 400)
    }
    
    // Check if file exists in R2
    const fileObject = await c.env.STORAGE.get(filename)
    if (!fileObject) {
      return c.json({ error: 'File not found' }, 404)
    }
    
    // For edge deployment, we'll use a simplified approach
    // In production, this would trigger a Durable Object for processing
    
    return c.json({
      success: true,
      message: 'Audio generation started on edge',
      filename: filename,
      note: 'Edge processing is optimized for speed - full implementation would use Durable Objects'
    })
    
  } catch (error) {
    console.error('Generate error:', error)
    return c.json({ error: 'Generation failed' }, 500)
  }
})

// Status endpoint
app.get('/api/status/:filename', async (c) => {
  const filename = c.req.param('filename')
  
  // Simple status response - in production would check Durable Object state
  return c.json({ 
    status: 'ready',
    note: 'Edge status checking - full implementation would use real-time updates'
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not found',
    edge_info: {
      datacenter: c.req.raw.cf?.colo || 'unknown',
      country: c.req.raw.cf?.country || 'unknown'
    }
  }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Edge error:', err)
  return c.json({ 
    error: 'Internal server error',
    edge_info: {
      datacenter: c.req.raw.cf?.colo || 'unknown',
      country: c.req.raw.cf?.country || 'unknown'
    }
  }, 500)
})

export default app
