import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { logError, showErrorNotification } from "@/lib/error-handler";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    try {
      const loginUrl = getLoginUrl();
      if (loginUrl) {
        window.location.href = loginUrl;
      } else {
        // Fallback: redirect to dashboard if OAuth not configured
        setLocation("/dashboard");
      }
    } catch (error) {
      logError(error as Error, { component: 'Login', method: 'handleLogin' });
      showErrorNotification(error, { title: 'Login failed' });
      // Fallback: redirect to dashboard
      setLocation("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#231942] via-[#0a0f22] to-[#231942] p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#59d7b5]/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-border shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative z-10 card-enhanced">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex items-center justify-center gap-3 mb-4 animate-in zoom-in duration-500 delay-200 group">
            <div className="w-12 h-12 bg-primary/20 border border-primary flex items-center justify-center animate-pulse group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/30">
              <Shield className="w-7 h-7 text-primary transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-white">
              NULL<span className="text-primary gradient-text">AUDIT</span>
            </h1>
          </div>
          <CardTitle className="text-2xl font-bold text-white animate-in fade-in duration-500 delay-300">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-400 text-base animate-in fade-in duration-500 delay-400">
            Sign in to access your security audit dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 animate-in fade-in duration-500 delay-500">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Login
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
              </>
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-slate-400">
              By continuing, you agree to our terms of service
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <div className="text-center">
              <button
                onClick={() => setLocation("/")}
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:underline hover:scale-105 inline-flex items-center gap-1 group"
              >
                <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Home
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

