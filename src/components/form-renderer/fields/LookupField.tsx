/**
 * LookupField — Combobox field that searches against a related entity via OData.
 * For now renders as a simple text input; full async search will be added for Phase 3.
 */

import type { FormField } from "@/types";
import { Input } from "@/components/ui/input";

interface LookupFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function LookupField({ field, value, onChange, readOnly }: LookupFieldProps) {
  return (
    <div className="space-y-1">
      <Input
        id={field.name}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={
          field.lookupEntity
            ? `Search ${field.lookupEntity}...`
            : `Enter ${field.label.toLowerCase()}`
        }
        className={readOnly ? "bg-muted" : ""}
      />
      {field.lookupEntity && !readOnly && (
        <p className="text-xs text-muted-foreground">
          Lookup: {field.lookupEntity}
        </p>
      )}
    </div>
  );
}
