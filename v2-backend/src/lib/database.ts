import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core'
import { eq } from 'drizzle-orm'

// Database schema
export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  size: integer('size').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('ready'),
  errorMessage: text('error_message'),
})

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  voiceType: text('voice_type').notNull(),
  voiceId: text('voice_id').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  outputPath: text('output_path'),
  errorMessage: text('error_message'),
})

// Initialize database
const sqlite = new Database('./data.db')

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite)

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready',
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL REFERENCES files(id),
    voice_type TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    output_path TEXT,
    error_message TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_file_id ON jobs(file_id);
`)

console.log('🗄️  Database initialized with SQLite + Drizzle ORM')

// Helper functions
export async function createFile(data: {
  id: string
  filename: string
  originalName: string
  size: number
}) {
  return await db.insert(files).values({
    ...data,
    uploadedAt: new Date(),
  }).returning()
}

export async function getFileById(id: string) {
  const result = await db.select().from(files).where(eq(files.id, id)).limit(1)
  return result[0] || null
}

export async function getAllFiles() {
  return await db.select().from(files).orderBy(files.uploadedAt)
}

export async function updateFileStatus(id: string, status: string, errorMessage?: string) {
  return await db.update(files)
    .set({ status, errorMessage })
    .where(eq(files.id, id))
}

export async function deleteFile(id: string) {
  return await db.delete(files).where(eq(files.id, id))
}

export async function createJob(data: {
  id: string
  fileId: string
  voiceType: string
  voiceId: string
}) {
  return await db.insert(jobs).values({
    ...data,
    createdAt: new Date(),
  }).returning()
}

export async function getJobById(id: string) {
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1)
  return result[0] || null
}

export async function updateJobStatus(
  id: string, 
  status: string, 
  outputPath?: string, 
  errorMessage?: string
) {
  return await db.update(jobs)
    .set({ 
      status, 
      outputPath, 
      errorMessage,
      completedAt: status === 'completed' ? new Date() : undefined
    })
    .where(eq(jobs.id, id))
}
