import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Rocket, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiClient, showErrorNotification, logError } from "@/lib/error-handler";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    aiAgentCalls: number;
    deepAnalysis: number;
    projects: number;
    teamMembers: number;
  };
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get<{ plans: Plan[] }>('/api/stripe/plans');
      setPlans(response.plans);
    } catch (error) {
      logError(error as Error, { component: 'Pricing', method: 'fetchPlans' });
      showErrorNotification(error, {
        title: 'Failed to load pricing plans',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    setProcessingPlan(planId);
    try {
      const response = await apiClient.post<{ success: boolean; sessionUrl: string }>(
        '/api/stripe/checkout',
        { planId },
        {
          maxRetries: 1, // Don't retry checkout requests
        }
      );

      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      logError(error as Error, { component: 'Pricing', method: 'handleSubscribe', planId });
      showErrorNotification(error, {
        title: 'Failed to start checkout',
        duration: 5000,
      });
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Shield className="w-6 h-6" />;
      case 'starter':
        return <Zap className="w-6 h-6" />;
      case 'professional':
        return <Rocket className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select the perfect plan for your security auditing needs. All plans include access to our AI-powered multi-LLM analysis.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all duration-300 hover:scale-105",
                plan.id === 'professional' && "border-primary ring-2 ring-primary"
              )}
            >
              {plan.id === 'professional' && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Popular
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.id)}
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
                  )}
                </div>
                {plan.price === 0 && (
                  <CardDescription className="text-lg">Forever free</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <Button
                  className="w-full mb-6"
                  variant={plan.id === 'professional' ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processingPlan !== null}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : plan.price === 0 ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </Button>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{formatLimit(plan.limits.aiAgentCalls)} AI agent calls</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{formatLimit(plan.limits.deepAnalysis)} deep analyses</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {formatLimit(plan.limits.projects)} active project{plan.limits.projects !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {formatLimit(plan.limits.teamMembers)} team member{plan.limits.teamMembers !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Plans Include</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Multi-LLM Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get consensus from GPT-4, Claude, and Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">On-Chain Attestations</h3>
                  <p className="text-sm text-muted-foreground">
                    Immutable proof of security audits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">MCP Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Standardized agent-to-agent communication
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p>
            Need a custom plan?{' '}
            <Link href="/settings" className="text-primary hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}