import { promises as fs } from 'fs'
import { join } from 'path'
import { generateEdgeTTS, generateOpenAITTS, EDGE_VOICES, OPENAI_VOICES } from './tts'

// Preview text samples - short and representative
export const PREVIEW_SAMPLES = {
  // Educational/study context samples
  question: "Question 1: What is the capital of France?",
  answer: "Answer: The capital of France is Paris, located in the north-central part of the country.",
  
  // Alternative samples for variety
  greeting: "Hello! This is a sample of this voice. Perfect for creating study materials and educational content.",
  study: "Let's review today's lesson. This voice will help you learn while on the go.",
  
  // Default sample (most neutral)
  default: "This is a preview of this voice. Clear, natural speech perfect for learning."
}

export interface VoicePreview {
  voiceId: string
  voiceType: 'edge' | 'openai'
  sampleText: string
  audioUrl?: string
  duration?: number
  generated: boolean
}

// Generate preview for a specific voice
export async function generateVoicePreview(
  voiceId: string,
  voiceType: 'edge' | 'openai',
  sampleText: string = PREVIEW_SAMPLES.default
): Promise<Buffer> {
  
  const tempDir = join(process.cwd(), 'temp')
  await fs.mkdir(tempDir, { recursive: true })
  
  const tempFile = join(tempDir, `preview_${voiceId}_${Date.now()}.mp3`)
  
  try {
    if (voiceType === 'edge') {
      await generateEdgeTTS(sampleText, voiceId, tempFile, '+0%')
    } else {
      await generateOpenAITTS(sampleText, voiceId as keyof typeof OPENAI_VOICES, tempFile, 1.0)
    }
    
    // Read the generated file
    const audioBuffer = await fs.readFile(tempFile)
    
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {})
    
    return audioBuffer
    
  } catch (error) {
    // Clean up on error
    await fs.unlink(tempFile).catch(() => {})
    throw error
  }
}

// Get all voice configurations with preview info
export function getAllVoicesWithPreviews(): Array<{
  id: string
  name: string
  type: 'edge' | 'openai'
  description: string
  previewKey: string
  isPremium: boolean
}> {
  const voices = []
  
  // Edge TTS voices (free)
  for (const [voiceId, description] of Object.entries(EDGE_VOICES)) {
    voices.push({
      id: voiceId,
      name: description,
      type: 'edge' as const,
      description,
      previewKey: `edge_${voiceId}`,
      isPremium: false
    })
  }
  
  // OpenAI voices (premium)
  for (const [voiceId, description] of Object.entries(OPENAI_VOICES)) {
    voices.push({
      id: voiceId,
      name: description,
      type: 'openai' as const,
      description,
      previewKey: `openai_${voiceId}`,
      isPremium: true
    })
  }
  
  return voices
}

// Check if preview exists in storage
export async function previewExists(r2Storage: any, previewKey: string): Promise<boolean> {
  try {
    const object = await r2Storage.get(`previews/${previewKey}.mp3`)
    return object !== null
  } catch {
    return false
  }
}

// Store preview in R2
export async function storePreview(
  r2Storage: any, 
  previewKey: string, 
  audioBuffer: Buffer
): Promise<void> {
  await r2Storage.put(`previews/${previewKey}.mp3`, audioBuffer, {
    httpMetadata: {
      contentType: 'audio/mpeg',
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
    customMetadata: {
      generatedAt: new Date().toISOString(),
      type: 'voice_preview'
    }
  })
}

// Get preview URL from R2
export function getPreviewUrl(previewKey: string): string {
  // This would be your R2 public URL or signed URL
  return `https://ai-voiceover-temp.your-account.r2.cloudflarestorage.com/previews/${previewKey}.mp3`
}
