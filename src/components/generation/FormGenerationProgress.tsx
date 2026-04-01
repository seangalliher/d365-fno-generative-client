/**
 * FormGenerationProgress — Shows step-by-step progress during form generation.
 */

import type { GenerationStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FormGenerationProgressProps {
  status: GenerationStatus;
}

const STEPS = [
  { key: "checking-cache", label: "Checking cache" },
  { key: "fetching-metadata", label: "Fetching metadata" },
  { key: "generating", label: "Generating form layout" },
  { key: "validating", label: "Validating schema" },
  { key: "caching", label: "Caching for reuse" },
] as const;

export function FormGenerationProgress({ status }: FormGenerationProgressProps) {
  if (status.step === "error") {
    return (
      <div className="flex flex-col items-center gap-4 p-12">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{status.message}</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status.step);

  return (
    <div className="space-y-6 p-8">
      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <span
                className={
                  isCurrent
                    ? "text-sm font-medium text-foreground"
                    : isComplete
                      ? "text-sm text-muted-foreground line-through"
                      : "text-sm text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Skeleton preview */}
      <div className="space-y-3 pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <Skeleton className="h-10 w-1/2" />
      </div>
    </div>
  );
}
