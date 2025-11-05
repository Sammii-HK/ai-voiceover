// Simplified pricing strategy: 3 tiers + overage
export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'gbp',
    minutes_per_month: 10,
    voices: ['edge'],
    features: [
      'Up to 10 minutes of audio/month',
      'Basic Edge TTS voices (UK/US)', 
      '5MB file limit',
      'Personal use only',
      '£0.15/min overage available'
    ],
    limits: {
      minutes_per_month: 10,
      max_file_size: 5 * 1024 * 1024, // 5MB
      voices: ['edge'],
      allow_overage: true
    }
  },
  
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 900, // £9/month
    price_annual: 9000, // £90/year (save 2 months)
    stripe_price_id: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    stripe_annual_price_id: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
    currency: 'gbp',
    minutes_per_month: 100,
    voices: ['edge', 'openai'],
    features: [
      'Up to 100 minutes of audio/month',
      'All Edge TTS + OpenAI premium voices',
      '15MB file limit',
      'Personal & educational use',
      'Priority processing',
      '£0.12/min overage (20% discount)'
    ],
    limits: {
      minutes_per_month: 100,
      max_file_size: 15 * 1024 * 1024, // 15MB
      voices: ['edge', 'openai'],
      allow_overage: true,
      overage_rate: 12 // £0.12 per minute
    }
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 1900, // £19/month
    price_annual: 19000, // £190/year (save 2.5 months)
    stripe_price_id: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripe_annual_price_id: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    currency: 'gbp',
    minutes_per_month: 300,
    voices: ['edge', 'openai'],
    features: [
      'Up to 300 minutes of audio/month',
      'All premium voices + future releases',
      '50MB file limit',
      'Commercial use license included',
      'Priority processing',
      'Email support',
      '£0.10/min overage (33% discount)'
    ],
    limits: {
      minutes_per_month: 300,
      max_file_size: 50 * 1024 * 1024, // 50MB
      voices: ['edge', 'openai'],
      commercial_use: true,
      allow_overage: true,
      overage_rate: 10 // £0.10 per minute
    }
  }
}

// Overage pricing (applies to all plans)
export const OVERAGE_PRICING = {
  default_rate: 15, // £0.15 per minute for free tier
  basic_rate: 12,   // £0.12 per minute for basic (20% discount)
  pro_rate: 10      // £0.10 per minute for pro (33% discount)
}

export interface UserAccount {
  id: string
  email: string
  name?: string
  stripe_customer_id: string
  plan: keyof typeof PRICING_PLANS
  subscription_id?: string
  minutes_used_this_month: number
  total_minutes_generated: number
  is_admin: boolean
  created_at: Date
  last_active: Date
}

export interface UsageRecord {
  id: string
  user_id: string
  file_name: string
  voice_type: 'edge' | 'openai'
  voice_id: string
  audio_duration_minutes: number
  cost_gbp: number
  created_at: Date
}

// Calculate audio duration from text (rough estimate)
export function estimateAudioDuration(text: string): number {
  // Average speaking rate: 150-160 words per minute
  // Add pauses for questions/answers
  const words = text.split(/\s+/).length
  const baseMinutes = words / 150
  const pauseMinutes = 0.5 // Pauses between Q&A
  return Math.max(0.1, baseMinutes + pauseMinutes) // Minimum 0.1 minutes
}

// Check if user can generate audio
export function canUserGenerate(
  user: UserAccount, 
  estimatedMinutes: number
): { allowed: boolean; reason?: string } {
  
  const plan = PRICING_PLANS[user.plan]
  
  if (user.is_admin) {
    return { allowed: true }
  }
  
  if (user.plan === 'payperuse') {
    return { allowed: true } // Will charge per use
  }
  
  const remainingMinutes = plan.limits.minutes_per_month - user.minutes_used_this_month
  
  if (remainingMinutes < estimatedMinutes) {
    return { 
      allowed: false, 
      reason: `Insufficient minutes. Need ${estimatedMinutes.toFixed(1)} minutes, have ${remainingMinutes.toFixed(1)} remaining.`
    }
  }
  
  return { allowed: true }
}

// Calculate cost for pay-per-use
export function calculatePayPerUseCost(minutes: number): number {
  return Math.ceil(minutes * PRICING_PLANS.payperuse.price_per_minute)
}

// Check if user is admin
export function isAdminUser(email: string): boolean {
  const adminEmail = process.env.ADMIN_USER?.toLowerCase()
  return adminEmail === email.toLowerCase()
}
