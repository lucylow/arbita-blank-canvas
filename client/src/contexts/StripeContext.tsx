import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Stripe } from '@stripe/stripe-js';
import { logError } from '@/lib/error-handler';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  plan: {
    id: string;
    name: string;
    amount: number;
    interval: 'month' | 'year';
  };
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

interface BillingHistoryItem {
  id: string;
  date: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

interface StripeContextType {
  stripe: Stripe | null;
  subscription: Subscription | null;
  billingHistory: BillingHistoryItem[];
  isLoading: boolean;
  error: string | null;
  createCheckoutSession: (priceId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  updatePaymentMethod: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchBillingHistory: () => Promise<void>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ 
  children, 
  stripe 
}: { 
  children: ReactNode;
  stripe: Stripe | null;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setError(null);
      const response = await fetch('/api/stripe/subscription', {
        credentials: 'include',
        headers: {
          'x-user-id': 'demo-user', // In real app, get from auth
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform backend format to frontend format
        if (data.subscription && data.plan) {
          setSubscription({
            id: data.subscription.subscriptionId || 'free',
            status: data.subscription.status,
            plan: {
              id: data.plan.id,
              name: data.plan.name,
              amount: data.plan.price * 100, // Convert to cents
              interval: data.plan.interval,
            },
            currentPeriodEnd: data.subscription.currentPeriodEnd 
              ? Math.floor(new Date(data.subscription.currentPeriodEnd).getTime() / 1000)
              : 0,
            cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd || false,
          });
        } else {
          setSubscription(null);
        }
      } else if (response.status === 404) {
        setSubscription(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to fetch subscription: ${response.statusText}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logError(error, { method: 'fetchSubscription' });
      setError(error.message);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const response = await fetch('/api/stripe/billing-history', {
        credentials: 'include',
        headers: {
          'x-user-id': 'demo-user',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(Array.isArray(data) ? data : []);
      } else {
        // Non-critical error, just log it
        const errorData = await response.json().catch(() => ({}));
        logError(new Error(errorData.error?.message || `Failed to fetch billing history: ${response.statusText}`), {
          method: 'fetchBillingHistory',
          status: response.status,
        });
        setBillingHistory([]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logError(error, { method: 'fetchBillingHistory' });
      // For demo purposes, set empty array - don't show error to user
      setBillingHistory([]);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      setError(null);
      
      if (!priceId || typeof priceId !== 'string') {
        throw new Error('Invalid plan ID provided');
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user', // In real app, get from auth
        },
        credentials: 'include',
        body: JSON.stringify({ planId: priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const sessionUrl = data.sessionUrl || data.url;
      
      // Redirect to Stripe Checkout
      if (sessionUrl && typeof sessionUrl === 'string') {
        window.location.href = sessionUrl;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logError(error, { method: 'createCheckoutSession', priceId });
      setError(error.message);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    try {
      setError(null);
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-user-id': 'demo-user',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      await fetchSubscription();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logError(error, { method: 'cancelSubscription' });
      setError(error.message);
      throw error;
    }
  };

  const resumeSubscription = async () => {
    try {
      setError(null);
      const response = await fetch('/api/stripe/resume-subscription', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      await fetchSubscription();
    } catch (err: any) {
      setError(err.message || 'Failed to resume subscription');
      throw err;
    }
  };

  const updatePaymentMethod = async () => {
    try {
      setError(null);
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'x-user-id': 'demo-user', // In real app, get from auth
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { portalUrl } = await response.json();
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update payment method');
      throw err;
    }
  };

  useEffect(() => {
    // Fetch initial subscription data
    fetchSubscription();
    fetchBillingHistory();
    setIsLoading(false);
  }, []);

  return (
    <StripeContext.Provider
      value={{
        stripe,
        subscription,
        billingHistory,
        isLoading,
        error,
        createCheckoutSession,
        cancelSubscription,
        resumeSubscription,
        updatePaymentMethod,
        fetchSubscription,
        fetchBillingHistory,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
}

export function useStripeContext() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
}

