import type { FormField } from "@/types";

interface BooleanFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function BooleanField({ field, value, onChange, readOnly }: BooleanFieldProps) {
  const checked = value === true || value === "true" || value === "Yes";

  return (
    <div className="flex items-center gap-2 pt-2">
      <input
        id={field.name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={readOnly}
        className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-sm text-muted-foreground">
        {checked ? "Yes" : "No"}
      </span>
    </div>
  );
}
