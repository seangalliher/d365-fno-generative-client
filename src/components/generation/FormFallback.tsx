/**
 * FormFallback — Shown when LLM form generation fails.
 * Provides categorized error display and retry with guidance.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Loader2, WifiOff, ShieldAlert, Bug } from "lucide-react";

interface FormFallbackProps {
  menuItemName: string;
  error: string;
  onRegenerate: () => void;
}

type ErrorCategory = "network" | "auth" | "validation" | "unknown";

function categorizeError(error: string): ErrorCategory {
  const lower = error.toLowerCase();
  if (lower.includes("rate_limited") || lower.includes("429") || lower.includes("network") || lower.includes("fetch")) {
    return "network";
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return "auth";
  }
  if (lower.includes("parse") || lower.includes("missing required") || lower.includes("invalid")) {
    return "validation";
  }
  return "unknown";
}

const ERROR_INFO: Record<ErrorCategory, { icon: React.ReactNode; title: string; guidance: string }> = {
  network: {
    icon: <WifiOff className="h-5 w-5 text-amber-500" />,
    title: "Connection Issue",
    guidance: "The AI service may be temporarily unavailable or rate-limited. Try again in a moment.",
  },
  auth: {
    icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
    title: "Authentication Error",
    guidance: "The AI service credentials may be invalid or expired. Contact your administrator.",
  },
  validation: {
    icon: <Bug className="h-5 w-5 text-orange-500" />,
    title: "Form Validation Failed",
    guidance: "The AI generated a form that didn't pass validation. Retrying usually resolves this.",
  },
  unknown: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    title: "Form Generation Failed",
    guidance: "An unexpected error occurred. Try regenerating the form.",
  },
};

export function FormFallback({ menuItemName, error, onRegenerate }: FormFallbackProps) {
  const [retrying, setRetrying] = useState(false);
  const category = categorizeError(error);
  const info = ERROR_INFO[category];

  const handleRetry = useCallback(() => {
    setRetrying(true);
    onRegenerate();
    // Reset after a delay (the hook will handle the actual state)
    setTimeout(() => setRetrying(false), 2000);
  }, [onRegenerate]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {info.icon}
          {info.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Could not generate a form for <strong>{menuItemName}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">{info.guidance}</p>
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Technical details
          </summary>
          <p className="mt-2 rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
            {error}
          </p>
        </details>
        <Button onClick={handleRetry} variant="outline" size="sm" disabled={retrying}>
          {retrying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {retrying ? "Retrying..." : "Try Again"}
        </Button>
      </CardContent>
    </Card>
  );
}
