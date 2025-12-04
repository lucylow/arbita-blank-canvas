import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Wallet, Fingerprint } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = (method: string) => {
    setConnecting(true);
    setTimeout(() => {
      localStorage.setItem("nullshot_auth", JSON.stringify({ method, connected: true }));
      setLocation("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">NullShot Security</CardTitle>
          <CardDescription>Connect your wallet to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full h-12"
            onClick={() => handleConnect("plug")}
            disabled={connecting}
          >
            <Wallet className="mr-2 h-5 w-5" />
            {connecting ? "Connecting..." : "Connect with Plug Wallet"}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => handleConnect("ii")}
            disabled={connecting}
          >
            <Fingerprint className="mr-2 h-5 w-5" />
            {connecting ? "Connecting..." : "Internet Identity"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
