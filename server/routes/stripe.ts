/**
 * Stripe Routes
 * Handles subscription, checkout, and webhook endpoints
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/error-handler.js';
import {
  createCheckoutSession,
  createPortalSession,
  getUserSubscription,
  SUBSCRIPTION_PLANS,
  trackUsage,
} from '../services/stripe-service.js';
import { ValidationError } from '../../shared/errors.js';

const router = Router();

/**
 * GET /api/stripe/plans
 * Get available subscription plans
 */
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  res.json({ plans: SUBSCRIPTION_PLANS });
}));

/**
 * GET /api/stripe/subscription
 * Get current user subscription
 */
router.get('/subscription', asyncHandler(async (req: Request, res: Response) => {
  // In a real app, get userId from session/auth
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  
  const subscription = getUserSubscription(userId);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
  
  res.json({
    subscription,
    plan,
    usage: subscription.usage,
  });
}));

/**
 * POST /api/stripe/checkout
 * Create checkout session for subscription
 */
router.post('/checkout', asyncHandler(async (req: Request, res: Response) => {
  const { planId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  
  if (!planId) {
    throw new ValidationError('planId is required', 'planId');
  }

  const origin = req.get('origin') || 'http://localhost:3000';
  const successUrl = `${origin}/settings?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/pricing?canceled=true`;

  const sessionUrl = await createCheckoutSession(userId, planId, successUrl, cancelUrl);
  
  res.json({
    success: true,
    sessionUrl,
  });
}));

/**
 * POST /api/stripe/portal
 * Create customer portal session for subscription management
 */
router.post('/portal', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  
  const origin = req.get('origin') || 'http://localhost:3000';
  const returnUrl = `${origin}/settings`;

  const portalUrl = await createPortalSession(userId, returnUrl);
  
  res.json({
    success: true,
    portalUrl,
  });
}));


/**
 * POST /api/stripe/track-usage
 * Track AI agent usage (called after successful AI call)
 */
router.post('/track-usage', asyncHandler(async (req: Request, res: Response) => {
  const { isDeepAnalysis } = req.body;
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  
  trackUsage(userId, isDeepAnalysis === true);
  
  const subscription = getUserSubscription(userId);
  
  res.json({
    success: true,
    usage: subscription.usage,
  });
}));

export default router;
