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
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{form.title}</h2>
        {isDirty && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onNew && (
          <Button variant="outline" size="sm" onClick={onNew}>
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        )}

        {onSave && (
          <Button size="sm" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save
          </Button>
        )}

        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </Button>
        )}

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
