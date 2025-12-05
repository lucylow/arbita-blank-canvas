import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 border-border bg-card">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-destructive" />
            </div>
          </div>

          <h1 className="text-4xl font-bold font-mono text-foreground mb-2 glitch-text" data-text="404">404</h1>

          <h2 className="text-xl font-semibold font-mono text-foreground mb-4">
            PAGE NOT FOUND
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed font-mono text-sm">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 font-mono"
            >
              <Home className="w-4 h-4 mr-2" />
              GO TO DASHBOARD
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
