/**
 * FormToolbar — Action bar for the dynamic form (Save, Delete, New, Close).
 */

import type { GeneratedForm } from "@/types";
import { Button } from "@/components/ui/button";
import { Save, Trash2, Plus, X, Loader2 } from "lucide-react";
import { useState } from "react";

interface FormToolbarProps {
  form: GeneratedForm;
  isDirty: boolean;
  saving: boolean;
  onSave?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onNew?: () => void;
  onClose?: () => void;
}

export function FormToolbar({
  form,
  isDirty,
  saving,
  onSave,
  onDelete,
  onNew,
  onClose,
}: FormToolbarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setConfirmDelete(false);
    await onDelete?.();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold truncate">{form.title}</h2>
        {isDirty && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 shrink-0">
            Unsaved
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onNew && (
          <Button variant="outline" size="sm" onClick={onNew}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New</span>
          </Button>
        )}

        {onSave && (
          <Button size="sm" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-1" />
            ) : (
              <Save className="h-4 w-4 sm:mr-1" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>
        )}

        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
          >
            <Trash2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{confirmDelete ? "Confirm" : "Delete"}</span>
          </Button>
        )}

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        )}
      </div>
    </div>
  );
}
