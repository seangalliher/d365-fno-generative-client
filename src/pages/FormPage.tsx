/**
 * FormPage — Dynamically generates and renders a D365 form.
 * Shows generation progress during first load, then renders the cached form.
 */

import { useParams, useNavigate } from "react-router-dom";
import { findMenuItem } from "@/data/moduleTaxonomy";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useGeneratedForm } from "@/hooks/useGeneratedForm";
import { useAppState } from "@/store/appState";
import { DynamicForm } from "@/components/form-renderer/DynamicForm";
import { FormGenerationProgress } from "@/components/generation/FormGenerationProgress";
import { FormFallback } from "@/components/generation/FormFallback";
import { FormRefinementPanel } from "@/components/generation/FormRefinementPanel";
import { toast } from "sonner";
import type { FormValues } from "@/types";

export function FormPage() {
  const { menuItemName } = useParams<{ menuItemName: string }>();
  const navigate = useNavigate();
  const company = useAppState((s) => s.currentCompany);
  const found = menuItemName ? findMenuItem(menuItemName) : undefined;

  const { form, status, error, regenerate, refine, isRefining } = useGeneratedForm(
    found?.item,
    company
  );

  if (!menuItemName || !found) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <p className="text-lg">Form not found: {menuItemName ?? "unknown"}</p>
        <p className="mt-2 text-sm">Select a menu item from the sidebar to generate a form.</p>
      </div>
    );
  }

  const { item, module } = found;

  const handleSave = async (values: FormValues) => {
    // TODO: Wire to FormDataService in Phase 2.5
    toast.success("Save not yet connected to D365");
    console.log("Save values:", values);
  };

  const handleDelete = async () => {
    toast.success("Delete not yet connected to D365");
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.label}</h1>
          <p className="text-sm text-muted-foreground">
            {module.label} &middot; {item.menuItemName} ({item.menuItemType})
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {status.step === "ready" ? "Generated" : "Generating..."}
        </Badge>
      </div>

      {item.entitySet && (
        <p className="text-sm text-muted-foreground">
          Entity: <span className="font-mono">{item.entitySet}</span>
        </p>
      )}

      {/* Error state */}
      {error && (
        <FormFallback
          menuItemName={menuItemName}
          error={error}
          onRegenerate={regenerate}
        />
      )}

      {/* Generating state */}
      {!error && !form && (
        <FormGenerationProgress status={status} />
      )}

      {/* Rendered form */}
      {form && (
        <>
          <FormRefinementPanel
            onRefine={refine}
            isRefining={isRefining}
          />
          <DynamicForm
            form={form}
            onSave={handleSave}
            onDelete={handleDelete}
            onNew={() => navigate(`/form/${menuItemName}`)}
            onClose={() => navigate("/")}
          />
        </>
      )}
    </div>
  );
}
