import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'
import { OpenAI } from 'openai'

// Voice configurations
export const EDGE_VOICES = {
  'en-GB-LibbyNeural': 'UK Female - Libby (Natural)',
  'en-GB-SoniaNeural': 'UK Female - Sonia (Professional)',
  'en-GB-RyanNeural': 'UK Male - Ryan',
  'en-US-JennyNeural': 'US Female - Jenny',
  'en-US-GuyNeural': 'US Male - Guy'
}

export const OPENAI_VOICES = {
  'alloy': 'Neutral - Alloy (Clean, Apple-like)',
  'echo': 'Male - Echo',
  'fable': 'British Accent - Fable',
  'onyx': 'Deep Male - Onyx',
  'nova': 'Young Female - Nova (Most Natural)',
  'shimmer': 'Soft Female - Shimmer'
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CSVRow {
  Front: string
  Back: string
}

export async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const content = await fs.readFile(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  if (!headers.includes('Front') || !headers.includes('Back')) {
    throw new Error('CSV must have "Front" and "Back" columns')
  }
  
  const frontIndex = headers.indexOf('Front')
  const backIndex = headers.indexOf('Back')
  
  const rows: CSVRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    
    if (values.length > Math.max(frontIndex, backIndex)) {
      const front = values[frontIndex]?.trim()
      const back = values[backIndex]?.trim()
      
      if (front && back) {
        rows.push({ Front: front, Back: back })
      }
    }
  }
  
  if (rows.length === 0) {
    throw new Error('No valid question/answer pairs found in CSV')
  }
  
  return rows
}

export async function generateSilence(outputPath: string, seconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-t', seconds.toString(),
      '-acodec', 'libmp3lame',
      '-b:a', '192k',
      outputPath
    ])
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`))
      }
    })
    
    ffmpeg.on('error', reject)
  })
}

export async function concatenateAudio(inputFiles: string[], outputPath: string): Promise<void> {
  const listFile = outputPath + '.list'
  
  // Create concat list file
  const listContent = inputFiles
    .map(file => `file '${file.replace(/'/g, "'\"'\"'")}'`)
    .join('\n')
  
  await fs.writeFile(listFile, listContent)
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '192k',
      outputPath
    ])
    
    ffmpeg.on('close', async (code) => {
      // Clean up list file
      try {
        await fs.unlink(listFile)
      } catch {}
      
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg concat failed with code ${code}`))
      }
    })
    
    ffmpeg.on('error', reject)
  })
}

export async function generateEdgeTTS(
  text: string,
  voice: string,
  outputPath: string,
  rate: string = '+0%'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const edgeTTS = spawn('edge-tts', [
      '--voice', voice,
      '--rate', rate,
      '--text', text,
      '--write-media', outputPath
    ])
    
    edgeTTS.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Edge TTS failed with code ${code}`))
      }
    })
    
    edgeTTS.on('error', (err) => {
      reject(new Error(`Edge TTS error: ${err.message}`))
    })
  })
}

export async function generateOpenAITTS(
  text: string,
  voice: keyof typeof OPENAI_VOICES,
  outputPath: string,
  speed: number = 1.0
): Promise<void> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice,
      input: text,
      speed: speed
    })
    
    const buffer = Buffer.from(await mp3.arrayBuffer())
    await fs.writeFile(outputPath, buffer)
  } catch (error) {
    throw new Error(`OpenAI TTS failed: ${error.message}`)
  }
}

export async function generateAudioFromCSV(
  csvPath: string,
  voiceType: 'edge' | 'openai',
  voiceId: string,
  outputPath: string,
  onProgress?: (progress: number, total: number) => void
): Promise<void> {
  // Parse CSV
  const rows = await parseCSV(csvPath)
  const tempDir = join(process.cwd(), 'temp', Date.now().toString())
  
  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true })
    
    const audioFiles: string[] = []
    
    // Generate silence files
    const silenceQA = join(tempDir, 'silence_qa.mp3')
    const silenceCard = join(tempDir, 'silence_card.mp3')
    
    await generateSilence(silenceQA, 1.5)
    await generateSilence(silenceCard, 2.0)
    
    // Process each Q&A pair
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const questionPath = join(tempDir, `q_${i + 1}.mp3`)
      const answerPath = join(tempDir, `a_${i + 1}.mp3`)
      
      const questionText = `Question ${i + 1}: ${row.Front}`
      const answerText = `Answer: ${row.Back}`
      
      // Generate TTS
      if (voiceType === 'edge') {
        await generateEdgeTTS(questionText, voiceId, questionPath, '+0%')
        await generateEdgeTTS(answerText, voiceId, answerPath, '-5%')
      } else {
        await generateOpenAITTS(questionText, voiceId as keyof typeof OPENAI_VOICES, questionPath, 1.0)
        await generateOpenAITTS(answerText, voiceId as keyof typeof OPENAI_VOICES, answerPath, 0.9)
      }
      
      // Add to audio files list
      audioFiles.push(questionPath, silenceQA, answerPath, silenceCard)
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, rows.length)
      }
    }
    
    // Concatenate all audio files
    await concatenateAudio(audioFiles, outputPath)
    
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {}
  }
}
