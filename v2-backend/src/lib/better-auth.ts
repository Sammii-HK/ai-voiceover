import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./database"
import { isAdminUser } from "./pricing"
import { createCustomer } from "./stripe"

// Better Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for demo, enable in production
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
  
  user: {
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        required: false,
      },
      plan: {
        type: "string",
        defaultValue: "free",
      },
      minutesUsedThisMonth: {
        type: "number",
        defaultValue: 0,
      },
      totalMinutesGenerated: {
        type: "number", 
        defaultValue: 0,
      },
      isAdmin: {
        type: "boolean",
        defaultValue: false,
      }
    }
  },
  
  callbacks: {
    after: {
      signUp: async (user) => {
        try {
          // Check if admin user
          const isAdmin = isAdminUser(user.email)
          
          // Create Stripe customer
          const stripeCustomer = await createCustomer(user.email, user.name)
          
          // Update user with Stripe customer ID and admin status
          await db.update(users).set({
            stripeCustomerId: stripeCustomer.id,
            isAdmin: isAdmin,
            plan: isAdmin ? 'pro' : 'free' // Admins get Pro plan
          }).where(eq(users.id, user.id))
          
          console.log(`User created: ${user.email} (Admin: ${isAdmin})`)
        } catch (error) {
          console.error('Error in signup callback:', error)
        }
      }
    }
  },
  
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:4173", 
    "https://ai-voiceover-three.vercel.app",
    "https://your-custom-domain.com"
  ]
})

// Database schema for Better Auth (add to your database.ts)
export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
  
  // Custom fields
  stripeCustomerId: text('stripeCustomerId'),
  plan: text('plan').notNull().default('free'),
  minutesUsedThisMonth: integer('minutesUsedThisMonth').notNull().default(0),
  totalMinutesGenerated: integer('totalMinutesGenerated').notNull().default(0),
  isAdmin: integer('isAdmin', { mode: 'boolean' }).notNull().default(false),
})

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})

// Middleware for protected routes
export function requireAuth() {
  return async (c: any, next: any) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    })
    
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    c.set('user', session.user)
    c.set('session', session.session)
    await next()
  }
}

// Middleware for admin routes
export function requireAdmin() {
  return async (c: any, next: any) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    })
    
    if (!session || !session.user.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    c.set('user', session.user)
    c.set('session', session.session)
    await next()
  }
}
