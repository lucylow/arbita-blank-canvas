import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, ExternalLink, Loader2 } from "lucide-react";
import { useStripeContext } from "@/contexts/StripeContext";
import { cn } from "@/lib/utils";

export default function BillingHistory() {
  const { billingHistory, fetchBillingHistory, isLoading } = useStripeContext();

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      paid: { variant: "default", label: "PAID" },
      pending: { variant: "secondary", label: "PENDING" },
      failed: { variant: "destructive", label: "FAILED" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="font-mono text-xs">
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (billingHistory.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono">
            <Receipt className="w-4 h-4 text-primary" />
            BILLING HISTORY
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Your payment history will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">
            No billing history found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Receipt className="w-4 h-4 text-primary" />
          BILLING HISTORY
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          View and download your invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {billingHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-background/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {item.description}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span>{formatDate(item.date)}</span>
                  <span className="text-foreground font-bold">{formatAmount(item.amount)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.invoiceUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="font-mono text-xs"
                  >
                    <a
                      href={item.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      VIEW
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs"
                  onClick={() => {
                    // In a real app, this would download the invoice
                    window.open(item.invoiceUrl, "_blank");
                  }}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


