/**
 * Stripe Service
 * Handles subscription management, payment processing, and usage tracking
 */

import Stripe from 'stripe';
import { AppError, ErrorCode } from '../../shared/errors.js';
import { logError } from '../utils/error-handler.js';

if (!process.env.STRIPE_SECRET_KEY) {
  logError(new Error('STRIPE_SECRET_KEY not set. Stripe features will be disabled.'), {
    level: 'warning',
    context: 'stripe_configuration',
  });
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover' as const,
      typescript: true,
    })
  : null;

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    aiAgentCalls: number; // Per month
    deepAnalysis: number; // Per month
    projects: number; // Total active projects
    teamMembers: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceId: '', // No price ID for free tier
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '10 AI agent calls per month',
      'Quick analysis depth',
      '1 active project',
      'Basic security reports',
    ],
    limits: {
      aiAgentCalls: 10,
      deepAnalysis: 0,
      projects: 1,
      teamMembers: 1,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_ID_STARTER || 'price_starter',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: [
      '100 AI agent calls per month',
      'Standard analysis depth',
      '5 active projects',
      'Advanced security reports',
      'Email support',
    ],
    limits: {
      aiAgentCalls: 100,
      deepAnalysis: 10,
      projects: 5,
      teamMembers: 3,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || 'price_professional',
    price: 99,
    currency: 'usd',
    interval: 'month',
    features: [
      '500 AI agent calls per month',
      'Deep analysis depth',
      'Unlimited projects',
      'Priority support',
      'Custom integrations',
      'Team collaboration',
    ],
    limits: {
      aiAgentCalls: 500,
      deepAnalysis: 100,
      projects: -1, // Unlimited
      teamMembers: 10,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise',
    price: 299,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited AI agent calls',
      'Deep analysis depth',
      'Unlimited projects',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'On-premise deployment option',
    ],
    limits: {
      aiAgentCalls: -1, // Unlimited
      deepAnalysis: -1, // Unlimited
      projects: -1, // Unlimited
      teamMembers: -1, // Unlimited
    },
  },
];

export interface UserSubscription {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    aiAgentCalls: number;
    deepAnalysis: number;
    periodStart: Date;
    periodEnd: Date;
  };
}

// In-memory storage (in production, use a database)
const userSubscriptions = new Map<string, UserSubscription>();
const usageTracking = new Map<string, { calls: number; deepAnalysis: number; periodStart: Date }>();

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateCustomer(
  userId: string,
  email?: string
): Promise<string> {
  try {
    if (!stripe) {
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Stripe is not configured',
        500
      );
    }

    const subscription = userSubscriptions.get(userId);
    if (subscription?.customerId) {
      return subscription.customerId;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Initialize user subscription
    if (!subscription) {
      userSubscriptions.set(userId, {
        userId,
        customerId: customer.id,
        subscriptionId: null,
        planId: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        usage: {
          aiAgentCalls: 0,
          deepAnalysis: 0,
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    } else {
      subscription.customerId = customer.id;
      userSubscriptions.set(userId, subscription);
    }

    return customer.id;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Failed to get or create customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      { userId, email }
    );
  }
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    if (!stripe) {
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Stripe is not configured',
        500
      );
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan || !plan.priceId) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid plan ID: ${planId}`,
        400
      );
    }

    const customerId = await getOrCreateCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    });

    return session.url || session.id;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      { userId, planId }
    );
  }
}

/**
 * Create portal session for subscription management
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  try {
    if (!stripe) {
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Stripe is not configured',
        500
      );
    }

    const subscription = userSubscriptions.get(userId);
    if (!subscription?.customerId) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'No customer found for user',
        404
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Failed to create portal session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      { userId }
    );
  }
}

/**
 * Get user subscription
 */
export function getUserSubscription(userId: string): UserSubscription {
  const subscription = userSubscriptions.get(userId);
  if (!subscription) {
    // Return free tier by default
    const defaultSub: UserSubscription = {
      userId,
      customerId: null,
      subscriptionId: null,
      planId: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      usage: {
        aiAgentCalls: 0,
        deepAnalysis: 0,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };
    userSubscriptions.set(userId, defaultSub);
    return defaultSub;
  }

  // Reset usage if period ended
  if (subscription.usage.periodEnd < new Date()) {
    subscription.usage = {
      aiAgentCalls: 0,
      deepAnalysis: 0,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  return subscription;
}

/**
 * Check if user can make AI agent call
 */
export function canMakeAICall(userId: string, isDeepAnalysis: boolean = false): {
  allowed: boolean;
  reason?: string;
} {
  const subscription = getUserSubscription(userId);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
  
  if (!plan) {
    return { allowed: false, reason: 'Invalid subscription plan' };
  }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return { allowed: false, reason: 'Subscription is not active' };
  }

  // Check deep analysis limit
  if (isDeepAnalysis && plan.limits.deepAnalysis !== -1) {
    if (subscription.usage.deepAnalysis >= plan.limits.deepAnalysis) {
      return {
        allowed: false,
        reason: 'Deep analysis limit reached. Upgrade your plan for more.',
      };
    }
  }

  // Check AI agent calls limit
  if (plan.limits.aiAgentCalls !== -1) {
    if (subscription.usage.aiAgentCalls >= plan.limits.aiAgentCalls) {
      return {
        allowed: false,
        reason: 'AI agent call limit reached. Upgrade your plan for more calls.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Track AI agent usage
 */
export function trackUsage(userId: string, isDeepAnalysis: boolean = false): void {
  const subscription = getUserSubscription(userId);
  
  subscription.usage.aiAgentCalls += 1;
  if (isDeepAnalysis) {
    subscription.usage.deepAnalysis += 1;
  }

  userSubscriptions.set(userId, subscription);
}

/**
 * Update subscription from webhook
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    if (!stripe) {
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Stripe is not configured',
        500
      );
    }

    switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      if (!userId) {
        logError(new Error('Subscription event missing userId metadata'), {
          level: 'warning',
          context: 'stripe_webhook',
          eventType: event.type,
        });
        return;
      }

      const planId = subscription.metadata?.planId || 'free';
      const sub = subscription as any; // Type cast for Stripe API compatibility
      const currentSub = userSubscriptions.get(userId) || {
        userId,
        customerId: subscription.customer as string,
        subscriptionId: subscription.id,
        planId,
        status: subscription.status as any,
        currentPeriodEnd: new Date((sub.current_period_end || sub.currentPeriodEnd || Date.now() / 1000) * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        usage: {
          aiAgentCalls: 0,
          deepAnalysis: 0,
          periodStart: new Date((sub.current_period_start || sub.currentPeriodStart || Date.now() / 1000) * 1000),
          periodEnd: new Date((sub.current_period_end || sub.currentPeriodEnd || Date.now() / 1000) * 1000),
        },
      };

      currentSub.subscriptionId = subscription.id;
      currentSub.status = subscription.status as any;
      currentSub.currentPeriodEnd = new Date((sub.current_period_end || sub.currentPeriodEnd || Date.now() / 1000) * 1000);
      currentSub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      currentSub.planId = planId;

      userSubscriptions.set(userId, currentSub);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      if (userId) {
        const currentSub = userSubscriptions.get(userId);
        if (currentSub) {
          currentSub.status = 'canceled';
          currentSub.planId = 'free'; // Downgrade to free
          currentSub.subscriptionId = null;
          userSubscriptions.set(userId, currentSub);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Failed to handle webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      { eventType: event.type }
    );
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Stripe is not configured',
      500
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'STRIPE_WEBHOOK_SECRET not configured',
      500
    );
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      400
    );
  }
}

export { stripe };
