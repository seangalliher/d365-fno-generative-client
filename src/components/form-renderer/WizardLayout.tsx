/**
 * WizardLayout — Multi-step form layout for action-type menu items
 * that guide users through a process (e.g., Create Sales Order wizard).
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { FormTab } from "@/types";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  tabs: FormTab[];
  renderFields: (fieldNames: string[]) => React.ReactNode;
  renderGrids?: (gridNames?: string[]) => React.ReactNode;
  onComplete?: () => void;
}

export function WizardLayout({ tabs, renderFields, renderGrids, onComplete }: WizardLayoutProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const sortedTabs = [...tabs].sort((a, b) => a.order - b.order);
  const totalSteps = sortedTabs.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const activeTab = sortedTabs[currentStep];

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete?.();
    } else {
      setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  }, [isLast, totalSteps, onComplete]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  if (!activeTab) return null;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {sortedTabs.map((tab, index) => (
          <div key={tab.name} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(index)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                index < currentStep && "bg-primary text-primary-foreground",
                index === currentStep && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                index > currentStep && "bg-muted text-muted-foreground"
              )}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </button>
            <span
              className={cn(
                "hidden text-sm sm:block",
                index === currentStep ? "font-medium" : "text-muted-foreground"
              )}
            >
              {tab.label}
            </span>
            {index < totalSteps - 1 && (
              <div className={cn("h-px w-8", index < currentStep ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-medium">{activeTab.label}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {renderFields(activeTab.fields)}
        </div>
        {renderGrids && activeTab.grids && (
          <div className="mt-4">{renderGrids(activeTab.grids)}</div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={isFirst}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          {isLast ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Complete
            </>
          ) : (
            <>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
