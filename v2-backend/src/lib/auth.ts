import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createCustomer } from './stripe'
import { db, createFile } from './database'
import { isAdminUser } from './pricing'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface User {
  id: string
  email: string
  name?: string
  stripe_customer_id: string
  plan: 'free' | 'basic' | 'pro' | 'team' | 'payperuse'
  minutes_used_this_month: number
  total_minutes_generated: number
  is_admin: boolean
  created_at: Date
  last_active: Date
}

export interface AuthToken {
  userId: string
  email: string
  isAdmin: boolean
  plan: string
}

// Create user account with Stripe customer
export async function createUser(email: string, name?: string): Promise<User> {
  // Check if admin
  const isAdmin = isAdminUser(email)
  
  // Create Stripe customer
  const stripeCustomer = await createCustomer(email, name)
  
  // Create user record (you'd use your database here)
  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    name,
    stripe_customer_id: stripeCustomer.id,
    plan: isAdmin ? 'team' : 'free', // Admins get team plan
    minutes_used_this_month: 0,
    total_minutes_generated: 0,
    is_admin: isAdmin,
    created_at: new Date(),
    last_active: new Date()
  }
  
  // In production, save to database
  console.log('Created user:', user)
  
  return user
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: AuthToken = {
    userId: user.id,
    email: user.email,
    isAdmin: user.is_admin,
    plan: user.plan
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken
  } catch {
    return null
  }
}

// Middleware to check authentication
export function requireAuth(requiredPlan?: string) {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const token = authHeader.slice(7)
    const authData = verifyToken(token)
    
    if (!authData) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    
    // Check plan requirement
    if (requiredPlan && authData.plan !== requiredPlan && !authData.isAdmin) {
      return c.json({ error: 'Insufficient plan' }, 403)
    }
    
    // Add user data to context
    c.set('user', authData)
    
    await next()
  }
}

// Admin middleware
export function requireAdmin() {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const token = authHeader.slice(7)
    const authData = verifyToken(token)
    
    if (!authData || !authData.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    c.set('user', authData)
    await next()
  }
}

// Simple email/password hash for demo (in production use proper auth)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
