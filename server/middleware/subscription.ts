/**
 * Subscription Middleware
 * Checks subscription status before allowing AI agent usage
 */

import type { Request, Response, NextFunction } from 'express';
import {
  getUserSubscription,
  canMakeAICall,
  SUBSCRIPTION_PLANS,
} from '../services/stripe-service.js';
import { ForbiddenError } from '../../shared/errors.js';

/**
 * Middleware to check if user can make AI agent calls
 */
export function requireSubscription(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const isDeepAnalysis = req.body?.depth === 'deep' || req.query?.depth === 'deep';
  
  const canCall = canMakeAICall(userId, isDeepAnalysis);
  
  if (!canCall.allowed) {
    const subscription = getUserSubscription(userId);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
    
    throw new ForbiddenError(
      canCall.reason || 'Subscription required for AI agent usage',
      {
        subscription,
        plan,
        upgradeRequired: true,
      }
    );
  }
  
  next();
}

/**
 * Middleware to attach subscription info to request
 */
export function attachSubscription(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  
  const subscription = getUserSubscription(userId);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
  
  (req as any).subscription = subscription;
  (req as any).plan = plan;
  
  next();
}

