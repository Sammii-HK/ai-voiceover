import { Hono } from 'hono'
import { promises as fs } from 'fs'
import { join } from 'path'
import { generateVoicePreview, getAllVoicesWithPreviews, PREVIEW_SAMPLES } from '../lib/voice-previews'

export const previewRoutes = new Hono()

const PREVIEW_CACHE_DIR = join(process.cwd(), 'preview_cache')

// Ensure cache directory exists
fs.mkdir(PREVIEW_CACHE_DIR, { recursive: true }).catch(() => {})

// Get all voices with preview info
previewRoutes.get('/', async (c) => {
  try {
    const voices = getAllVoicesWithPreviews()
    
    return c.json({
      voices,
      samples: PREVIEW_SAMPLES,
      cacheInfo: {
        directory: PREVIEW_CACHE_DIR,
        note: 'Previews are generated once and cached for reuse'
      }
    })
  } catch (error) {
    console.error('Error getting voices:', error)
    return c.json({ error: 'Failed to get voices' }, 500)
  }
})

// Generate or serve voice preview
previewRoutes.get('/:type/:voiceId', async (c) => {
  try {
    const voiceType = c.req.param('type') as 'edge' | 'openai'
    const voiceId = c.req.param('voiceId')
    
    if (!['edge', 'openai'].includes(voiceType)) {
      return c.json({ error: 'Invalid voice type' }, 400)
    }
    
    const previewKey = `${voiceType}_${voiceId}`
    const cachedFile = join(PREVIEW_CACHE_DIR, `${previewKey}.mp3`)
    
    // Check if cached preview exists
    try {
      await fs.access(cachedFile)
      
      // Serve cached preview
      const audioBuffer = await fs.readFile(cachedFile)
      
      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000', // 1 year
          'X-Preview-Source': 'cached',
          'Content-Length': audioBuffer.length.toString()
        }
      })
      
    } catch {
      // Preview doesn't exist, generate it
      console.log(`Generating preview for ${voiceType}:${voiceId}`)
      
      if (voiceType === 'openai' && !process.env.OPENAI_API_KEY) {
        return c.json({ error: 'OpenAI not configured' }, 400)
      }
      
      try {
        const audioBuffer = await generateVoicePreview(
          voiceId,
          voiceType,
          PREVIEW_SAMPLES.default
        )
        
        // Cache the preview
        await fs.writeFile(cachedFile, audioBuffer)
        
        console.log(`✅ Preview cached: ${previewKey}`)
        
        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000',
            'X-Preview-Source': 'generated',
            'Content-Length': audioBuffer.length.toString()
          }
        })
        
      } catch (error) {
        console.error(`Failed to generate preview for ${voiceType}:${voiceId}:`, error)
        return c.json({ 
          error: 'Failed to generate preview',
          voiceType,
          voiceId,
          details: error.message
        }, 500)
      }
    }
    
  } catch (error) {
    console.error('Preview endpoint error:', error)
    return c.json({ error: 'Preview request failed' }, 500)
  }
})

// Regenerate all previews (admin only)
previewRoutes.post('/regenerate', async (c) => {
  try {
    // Check admin auth (simplified)
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Admin access required' }, 401)
    }
    
    console.log('🔄 Regenerating all voice previews...')
    
    const voices = getAllVoicesWithPreviews()
    const results = []
    
    for (const voice of voices) {
      try {
        const audioBuffer = await generateVoicePreview(
          voice.id,
          voice.type,
          PREVIEW_SAMPLES.default
        )
        
        const cachedFile = join(PREVIEW_CACHE_DIR, `${voice.previewKey}.mp3`)
        await fs.writeFile(cachedFile, audioBuffer)
        
        results.push({ voice: voice.id, status: 'success' })
        console.log(`✅ Generated preview: ${voice.id}`)
        
      } catch (error) {
        results.push({ voice: voice.id, status: 'error', error: error.message })
        console.log(`❌ Failed preview: ${voice.id}`)
      }
    }
    
    return c.json({
      success: true,
      message: 'Preview regeneration completed',
      results
    })
    
  } catch (error) {
    console.error('Regenerate error:', error)
    return c.json({ error: 'Failed to regenerate previews' }, 500)
  }
})
