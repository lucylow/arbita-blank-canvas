import { useState, FormEvent } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { showSuccessNotification, showErrorNotification } from "@/lib/error-handler";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  amount: number;
  description: string;
}

export default function PaymentForm({ onSuccess, onCancel, amount, description }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
          address: {
            line1: billingDetails.address,
            city: billingDetails.city,
            state: billingDetails.state,
            postal_code: billingDetails.zip,
            country: billingDetails.country,
          },
        },
      });

      if (pmError) {
        throw pmError;
      }

      if (!paymentMethod) {
        throw new Error("Failed to create payment method");
      }

      // In a real app, you would send paymentMethod.id to your backend
      // to create a payment intent or subscription
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          amount: amount * 100, // Convert to cents
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process payment");
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        throw confirmError;
      }

      showSuccessNotification("Payment successful!");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Payment failed");
      showErrorNotification(err, { title: "Payment Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "Space Mono, monospace",
        "::placeholder": {
          color: "#666666",
        },
      },
      invalid: {
        color: "#ff003c",
        iconColor: "#ff003c",
      },
    },
    hidePostalCode: false,
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <CreditCard className="w-4 h-4 text-primary" />
          PAYMENT INFORMATION
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          Secure payment processed by Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">FULL NAME</Label>
                <Input
                  value={billingDetails.name}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, name: e.target.value })
                  }
                  required
                  className="bg-background/50 font-mono"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">EMAIL</Label>
                <Input
                  type="email"
                  value={billingDetails.email}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, email: e.target.value })
                  }
                  required
                  className="bg-background/50 font-mono"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">ADDRESS</Label>
              <Input
                value={billingDetails.address}
                onChange={(e) =>
                  setBillingDetails({ ...billingDetails, address: e.target.value })
                }
                required
                className="bg-background/50 font-mono"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">CITY</Label>
                <Input
                  value={billingDetails.city}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, city: e.target.value })
                  }
                  required
                  className="bg-background/50 font-mono"
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">STATE</Label>
                <Input
                  value={billingDetails.state}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, state: e.target.value })
                  }
                  required
                  className="bg-background/50 font-mono"
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">ZIP CODE</Label>
                <Input
                  value={billingDetails.zip}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, zip: e.target.value })
                  }
                  required
                  className="bg-background/50 font-mono"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Card Element */}
          <div className="space-y-2">
            <Label className="font-mono text-xs">CARD DETAILS</Label>
            <div className="p-4 bg-background/50 border border-border rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-mono">
              {error}
            </div>
          )}

          {/* Amount Display */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 border border-border">
            <span className="font-mono text-sm text-muted-foreground">TOTAL AMOUNT</span>
            <span className="font-mono text-xl font-bold">${amount.toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1 font-mono"
              >
                CANCEL
              </Button>
            )}
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className={cn(
                "flex-1 font-mono",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  PAY ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground font-mono text-center">
            Your payment information is encrypted and secure
          </p>
        </form>
      </CardContent>
    </Card>
  );
}


