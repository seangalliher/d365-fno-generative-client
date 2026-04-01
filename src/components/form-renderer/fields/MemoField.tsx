import type { FormField } from "@/types";

interface MemoFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function MemoField({ field, value, onChange, readOnly }: MemoFieldProps) {
  return (
    <textarea
      id={field.name}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      maxLength={field.maxLength}
      rows={4}
      placeholder={field.helpText ?? `Enter ${field.label.toLowerCase()}`}
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${readOnly ? "bg-muted" : ""}`}
    />
  );
}
