// Voice configuration types
export interface VoiceConfig {
  id: string
  name: string
  type: 'edge' | 'openai'
  description: string
  language?: string
}

// File upload types
export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  size: number
  uploadedAt: Date
  status: 'ready' | 'processing' | 'completed' | 'error'
  errorMessage?: string
}

// Generation job types
export interface GenerationJob {
  id: string
  fileId: string
  voiceType: 'edge' | 'openai'
  voiceId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  createdAt: Date
  completedAt?: Date
  outputPath?: string
  errorMessage?: string
}

// API request/response types
export interface GenerateRequest {
  voice_type: 'edge' | 'openai'
  voice: string
}

export interface GenerateResponse {
  success: boolean
  message: string
  filename: string
  jobId?: string
}

export interface FileListResponse {
  files: Array<{
    name: string
    size: number
    uploaded: string
    status: string
  }>
}

export interface StatusResponse {
  status: 'ready' | 'processing' | 'completed' | 'error'
  download_ready?: boolean
  completed_at?: string
  error?: string
}
