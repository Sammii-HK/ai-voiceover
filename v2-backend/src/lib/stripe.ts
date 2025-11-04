import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
})

// Pricing configuration
export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    generations_per_month: 3,
    voices: ['edge'],
    features: ['Basic Edge TTS voices', '5MB file limit']
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 999, // $9.99 in cents
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID,
    generations_per_month: -1, // unlimited
    voices: ['edge', 'openai'],
    features: ['All voice options', 'Unlimited generations', '10MB files', 'Priority processing']
  },
  payperuse: {
    id: 'payperuse', 
    name: 'Pay-per-Use',
    price_per_generation: 2, // $0.02 in cents
    voices: ['edge', 'openai'],
    features: ['All voices', 'No monthly commitment', 'Pay only for what you use']
  }
}

export interface User {
  id: string
  email: string
  stripe_customer_id?: string
  subscription_status: 'free' | 'premium' | 'payperuse'
  generations_used_this_month: number
  created_at: Date
}

export async function createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      app: 'ai-voiceover'
    }
  })
}

export async function createSubscription(
  customerId: string, 
  priceId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price: priceId,
    }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function createPaymentIntent(
  amount: number,
  customerId?: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId,
    metadata: {
      type: 'pay_per_use_generation'
    }
  })
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function handleWebhook(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

export async function getCustomerUsage(customerId: string): Promise<{
  subscription_status: string
  generations_used: number
  generations_remaining: number
}> {
  // Get customer's subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  })
  
  const hasActiveSubscription = subscriptions.data.length > 0
  
  // This would typically come from your database
  // For now, return mock data
  return {
    subscription_status: hasActiveSubscription ? 'premium' : 'free',
    generations_used: 0, // Query from your database
    generations_remaining: hasActiveSubscription ? -1 : 3 // unlimited vs free limit
  }
}

export { stripe }
