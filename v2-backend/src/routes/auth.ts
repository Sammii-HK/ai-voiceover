import { Hono } from 'hono'
import { generateToken, verifyToken } from '../lib/auth'
import { isAdminUser } from '../lib/pricing'

export const authRoutes = new Hono()

// Sign up
authRoutes.post('/sign-up', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Check if user already exists (you'd check your database here)
    // For now, just create the user
    
    // Create simple user object (in production, save to database)
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      plan: isAdminUser(email) ? 'pro' : 'free',
      is_admin: isAdminUser(email),
      minutes_used_this_month: 0,
      created_at: new Date()
    }
    const token = generateToken(user)
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        isAdmin: user.is_admin,
        minutesUsed: user.minutes_used_this_month
      },
      token
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Failed to create account' }, 500)
  }
})

// Sign in
authRoutes.post('/sign-in', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // In production, verify password against database
    // For demo, just create/login the user
    const user = {
      id: `user_${Date.now()}`,
      email,
      plan: isAdminUser(email) ? 'pro' : 'free',
      is_admin: isAdminUser(email),
      minutes_used_this_month: 0,
      created_at: new Date()
    }
    const token = generateToken(user)
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        isAdmin: user.is_admin,
        minutesUsed: user.minutes_used_this_month
      },
      token
    })
    
  } catch (error) {
    console.error('Signin error:', error)
    return c.json({ error: 'Failed to sign in' }, 500)
  }
})

// Get current user
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const token = authHeader.slice(7)
    const authData = verifyToken(token)
    
    if (!authData) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    
    // In production, fetch fresh user data from database
    return c.json({
      success: true,
      user: {
        email: authData.email,
        plan: authData.plan,
        isAdmin: authData.isAdmin
      }
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Failed to get user data' }, 500)
  }
})

// Sign out (client-side token removal, but endpoint for consistency)
authRoutes.post('/sign-out', async (c) => {
  return c.json({ success: true, message: 'Signed out successfully' })
})
