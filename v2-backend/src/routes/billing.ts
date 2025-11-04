import { Hono } from 'hono'
import { createCustomer, createSubscription, createPaymentIntent, createBillingPortalSession, handleWebhook, getCustomerUsage, PRICING_PLANS } from '../lib/stripe'

export const billingRoutes = new Hono()

// Get pricing plans
billingRoutes.get('/plans', async (c) => {
  return c.json({
    plans: PRICING_PLANS,
    success: true
  })
})

// Create customer
billingRoutes.post('/customer', async (c) => {
  try {
    const { email, name } = await c.req.json()
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }
    
    const customer = await createCustomer(email, name)
    
    return c.json({
      customer_id: customer.id,
      success: true
    })
    
  } catch (error) {
    console.error('Customer creation error:', error)
    return c.json({ error: 'Failed to create customer' }, 500)
  }
})

// Create subscription
billingRoutes.post('/subscribe', async (c) => {
  try {
    const { customer_id, plan } = await c.req.json()
    
    if (!customer_id || !plan) {
      return c.json({ error: 'Customer ID and plan are required' }, 400)
    }
    
    const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS]
    if (!planConfig || !planConfig.stripe_price_id) {
      return c.json({ error: 'Invalid plan' }, 400)
    }
    
    const subscription = await createSubscription(customer_id, planConfig.stripe_price_id)
    
    return c.json({
      subscription_id: subscription.id,
      client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      success: true
    })
    
  } catch (error) {
    console.error('Subscription creation error:', error)
    return c.json({ error: 'Failed to create subscription' }, 500)
  }
})

// Create one-time payment for pay-per-use
billingRoutes.post('/pay-per-use', async (c) => {
  try {
    const { customer_id, generations } = await c.req.json()
    
    if (!generations || generations < 1) {
      return c.json({ error: 'Invalid generation count' }, 400)
    }
    
    const amount = generations * PRICING_PLANS.payperuse.price_per_generation
    
    const paymentIntent = await createPaymentIntent(amount, customer_id)
    
    return c.json({
      client_secret: paymentIntent.client_secret,
      amount,
      generations,
      success: true
    })
    
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return c.json({ error: 'Failed to create payment' }, 500)
  }
})

// Get customer usage/billing info
billingRoutes.get('/usage/:customer_id', async (c) => {
  try {
    const customerId = c.req.param('customer_id')
    
    const usage = await getCustomerUsage(customerId)
    
    return c.json({
      ...usage,
      plans: PRICING_PLANS,
      success: true
    })
    
  } catch (error) {
    console.error('Usage lookup error:', error)
    return c.json({ error: 'Failed to get usage data' }, 500)
  }
})

// Create billing portal session
billingRoutes.post('/portal', async (c) => {
  try {
    const { customer_id, return_url } = await c.req.json()
    
    if (!customer_id) {
      return c.json({ error: 'Customer ID is required' }, 400)
    }
    
    const session = await createBillingPortalSession(
      customer_id, 
      return_url || 'https://your-app.vercel.app'
    )
    
    return c.json({
      url: session.url,
      success: true
    })
    
  } catch (error) {
    console.error('Billing portal error:', error)
    return c.json({ error: 'Failed to create billing portal' }, 500)
  }
})

// Stripe webhook handler
billingRoutes.post('/webhook', async (c) => {
  try {
    const payload = await c.req.text()
    const signature = c.req.header('stripe-signature')
    
    if (!signature) {
      return c.json({ error: 'Missing Stripe signature' }, 400)
    }
    
    const event = await handleWebhook(payload, signature)
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any
        console.log('Payment succeeded:', paymentIntent.id)
        // Update user's generation credits
        break
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any
        console.log('Subscription payment succeeded:', invoice.id)
        // Reset monthly generation count
        break
        
      case 'customer.subscription.updated':
        const subscription = event.data.object as any
        console.log('Subscription updated:', subscription.id)
        // Update user's plan status
        break
        
      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as any
        console.log('Subscription cancelled:', deletedSub.id)
        // Downgrade user to free plan
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return c.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ error: 'Webhook processing failed' }, 400)
  }
})
