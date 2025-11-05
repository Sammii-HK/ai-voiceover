import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Import route handlers
import { uploadRoutes } from './routes/upload'
import { generateRoutes } from './routes/generate'
import { fileRoutes } from './routes/files'
import { voiceRoutes } from './routes/voices'
import { billingRoutes } from './routes/billing'
import { authRoutes } from './routes/auth'

// Initialize Hono app
const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // SvelteKit dev servers
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    runtime: 'bun',
    framework: 'hono'
  })
})

// API routes
app.route('/api/upload', uploadRoutes)
app.route('/api/generate', generateRoutes)  
app.route('/api/files', fileRoutes)
app.route('/api/voices', voiceRoutes)
app.route('/api/billing', billingRoutes)
app.route('/api/previews', previewRoutes)
app.route('/api/auth', authRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '8000')

console.log(`🔥 Bun + Hono server starting on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
