/**
 * Stripe Webhook Route
 * Handles Stripe webhook events (needs raw body for signature verification)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler, logError } from '../utils/error-handler.js';
import {
  handleWebhookEvent,
  verifyWebhookSignature,
} from '../services/stripe-service.js';

const router = Router();

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Raw body is a Buffer when using express.raw()
  const rawBody = req.body as Buffer;
  
  try {
    const event = verifyWebhookSignature(rawBody, signature as string);
    await handleWebhookEvent(event);
    
    res.json({ received: true });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Webhook processing failed',
    });
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    });
  }
}));

export default router;
