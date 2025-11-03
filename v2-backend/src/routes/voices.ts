import { Hono } from 'hono'
import { EDGE_VOICES, OPENAI_VOICES } from '../lib/tts'

export const voiceRoutes = new Hono()

voiceRoutes.get('/', async (c) => {
  return c.json({
    edge: EDGE_VOICES,
    openai: OPENAI_VOICES,
    hasOpenAI: !!process.env.OPENAI_API_KEY
  })
})

voiceRoutes.get('/edge', async (c) => {
  return c.json(EDGE_VOICES)
})

voiceRoutes.get('/openai', async (c) => {
  return c.json({
    voices: OPENAI_VOICES,
    available: !!process.env.OPENAI_API_KEY
  })
})
