# Stripe Monetization Integration

## Overview

NullAudit now includes comprehensive Stripe monetization features that integrate seamlessly with the AI agent functionality. This allows you to monetize the platform through subscription-based pricing with usage tracking.

## Features

### 1. Subscription Plans

Four subscription tiers are available:

- **Free**: 10 AI agent calls/month, quick analysis only
- **Starter** ($29/month): 100 AI agent calls/month, standard analysis
- **Professional** ($99/month): 500 AI agent calls/month, deep analysis
- **Enterprise** ($299/month): Unlimited calls, all features

### 2. Usage-Based Billing

- Tracks AI agent calls per subscription period
- Different limits for quick, standard, and deep analysis
- Automatic usage tracking after successful AI agent invocations
- Usage resets at the start of each billing period

### 3. Subscription Management

- Stripe Checkout for new subscriptions
- Customer Portal for subscription management
- Webhook handling for subscription updates
- Automatic plan downgrade on cancellation

### 4. AI Agent Integration

- Subscription checks before allowing AI agent calls
- Usage tracking integrated with MCP tool invocations
- Graceful error messages when limits are reached
- Upgrade prompts when limits are exceeded

## Setup Instructions

### 1. Install Dependencies

The Stripe package has already been added:
```bash
pnpm add stripe
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key (optional, for frontend)
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_STARTER=price_...  # Starter plan price ID
STRIPE_PRICE_ID_PROFESSIONAL=price_...  # Professional plan price ID
STRIPE_PRICE_ID_ENTERPRISE=price_...  # Enterprise plan price ID
```

### 3. Create Stripe Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create products for each subscription tier:
   - Starter ($29/month)
   - Professional ($99/month)
   - Enterprise ($299/month)
3. Copy the Price IDs and add them to your environment variables

### 4. Configure Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Test the Integration

For local testing, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will provide a webhook signing secret for local testing.

## API Endpoints

### Subscription Management

- `GET /api/stripe/plans` - Get available subscription plans
- `GET /api/stripe/subscription` - Get current user subscription
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create customer portal session
- `POST /api/stripe/track-usage` - Track AI agent usage
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Example: Checkout Flow

```typescript
// Frontend
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  },
  body: JSON.stringify({ planId: 'professional' }),
});

const { sessionUrl } = await response.json();
window.location.href = sessionUrl;
```

## Usage Tracking

Usage is automatically tracked when AI agent tools are invoked:

```typescript
// In MCP route handler
const response = await mcpToolRegistry.invoke(invocation);
trackUsage(userId, isDeepAnalysis); // Track after successful call
```

Usage limits are checked before allowing the call:

```typescript
const canCall = canMakeAICall(userId, isDeepAnalysis);
if (!canCall.allowed) {
  throw new ForbiddenError(canCall.reason);
}
```

## Frontend Integration

### Pricing Page

Visit `/pricing` to see available plans and subscribe.

### Settings Page

Visit `/settings` → **Billing** tab to:
- View current subscription
- Manage payment methods
- Cancel or resume subscription
- View usage statistics

### Stripe Context

Use the `useStripeContext` hook to access subscription data:

```typescript
import { useStripeContext } from '@/contexts/StripeContext';

function MyComponent() {
  const { subscription, isLoading, error } = useStripeContext();
  
  if (subscription) {
    // Show subscription info
  }
}
```

## Architecture

### Service Layer

- `server/services/stripe-service.ts` - Core Stripe business logic
  - Subscription management
  - Usage tracking
  - Plan validation
  - Webhook handling

### Routes

- `server/routes/stripe.ts` - Subscription and checkout routes
- `server/routes/stripe-webhook.ts` - Webhook handler (raw body)

### Middleware

- `server/middleware/subscription.ts` - Subscription validation middleware
  - `requireSubscription` - Check if user can make AI calls
  - `attachSubscription` - Attach subscription info to request

### Frontend Components

- `client/src/pages/Pricing.tsx` - Pricing page
- `client/src/contexts/StripeContext.tsx` - Stripe React context
- `client/src/pages/Settings.tsx` - Subscription management (Billing tab)

## Database Integration (Optional)

Currently, subscription data is stored in-memory. For production, you should:

1. Create a database schema for subscriptions and usage
2. Update `stripe-service.ts` to use database instead of Map
3. Store user IDs, customer IDs, subscription IDs, and usage data

Example schema:
```sql
CREATE TABLE subscriptions (
  user_id VARCHAR PRIMARY KEY,
  customer_id VARCHAR,
  subscription_id VARCHAR,
  plan_id VARCHAR,
  status VARCHAR,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN
);

CREATE TABLE usage_tracking (
  user_id VARCHAR,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  ai_agent_calls INTEGER,
  deep_analysis INTEGER,
  PRIMARY KEY (user_id, period_start)
);
```

## Security Considerations

1. **User Authentication**: Replace `x-user-id` header with proper authentication
2. **Webhook Verification**: Always verify webhook signatures
3. **Rate Limiting**: Implement rate limiting on checkout endpoints
4. **Environment Variables**: Never commit Stripe keys to version control

## Testing

### Test Mode

Use Stripe test mode for development:
- Test cards: https://stripe.com/docs/testing
- Test webhooks via Stripe CLI

### Test Scenarios

1. **Subscription Creation**: Subscribe to a plan
2. **Usage Tracking**: Make AI agent calls and verify usage increments
3. **Limit Enforcement**: Exceed limits and verify error messages
4. **Webhook Handling**: Cancel subscription and verify downgrade
5. **Portal Access**: Open customer portal and manage subscription

## Troubleshooting

### Webhook Not Receiving Events

- Check webhook endpoint URL is correct
- Verify webhook secret is set correctly
- Use Stripe CLI for local testing
- Check server logs for webhook errors

### Usage Not Tracking

- Verify `trackUsage` is called after successful AI calls
- Check subscription status is active
- Verify user ID is passed correctly

### Subscription Not Updating

- Check webhook events are being received
- Verify webhook secret matches
- Check webhook handler logs for errors

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com/)

## Next Steps

1. Set up Stripe account and configure products
2. Add environment variables
3. Test subscription flow in test mode
4. Configure webhook endpoint
5. Deploy and test in production mode