/**
 * FormPage — Dynamically generates and renders a D365 form.
 *
 * Display-type menu items show a list/grid of records first (drill-down to detail).
 * Action-type menu items show the generation form directly.
 */

import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findMenuItem } from "@/data/moduleTaxonomy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useGeneratedForm } from "@/hooks/useGeneratedForm";
import { useAppState } from "@/store/appState";
import { DynamicForm } from "@/components/form-renderer/DynamicForm";
import { EntityListView } from "@/components/form-renderer/EntityListView";
import { FormGenerationProgress } from "@/components/generation/FormGenerationProgress";
import { FormFallback } from "@/components/generation/FormFallback";
import { FormRefinementPanel } from "@/components/generation/FormRefinementPanel";
import { toast } from "sonner";
import type { FormValues } from "@/types";

type ViewMode = "list" | "detail";

export function FormPage() {
  const { menuItemName } = useParams<{ menuItemName: string }>();
  const navigate = useNavigate();
  const company = useAppState((s) => s.currentCompany);
  const found = menuItemName ? findMenuItem(menuItemName) : undefined;

  const isDisplayType = found?.item.menuItemType === "Display";
  const hasEntitySet = Boolean(found?.item.entitySet);

  // Display-type items with an entity set start in list mode
  const [viewMode, setViewMode] = useState<ViewMode>(
    isDisplayType && hasEntitySet ? "list" : "detail",
  );
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const { form, status, error, regenerate, refine, isRefining } = useGeneratedForm(
    found?.item,
    company,
  );

  const handleRowClick = useCallback((record: Record<string, unknown>) => {
    setSelectedRecord(record);
    setViewMode("detail");
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedRecord(null);
    setViewMode("list");
  }, []);

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

  const handleNew = () => {
    setSelectedRecord(null);
    setViewMode("detail");
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {viewMode === "detail" && isDisplayType && hasEntitySet && (
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold truncate">{item.label}</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {module.label} &middot; {item.menuItemName} ({item.menuItemType})
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {viewMode === "list"
            ? "List View"
            : status.step === "ready"
              ? "Generated"
              : "Generating..."}
        </Badge>
      </div>

      {item.entitySet && (
        <p className="text-sm text-muted-foreground">
          Entity: <span className="font-mono">{item.entitySet}</span>
        </p>
      )}

      {/* LIST VIEW — Display-type items with an entity set */}
      {viewMode === "list" && item.entitySet && (
        <EntityListView
          entitySet={item.entitySet}
          title={item.label}
          onRowClick={handleRowClick}
          onNew={handleNew}
        />
      )}

      {/* DETAIL VIEW — Generated form */}
      {viewMode === "detail" && (
        <>
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
                initialValues={selectedRecord ?? {}}
                onSave={handleSave}
                onDelete={handleDelete}
                onNew={handleNew}
                onClose={isDisplayType && hasEntitySet ? handleBackToList : () => navigate("/")}
                readOnlyMode={selectedRecord !== null}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
