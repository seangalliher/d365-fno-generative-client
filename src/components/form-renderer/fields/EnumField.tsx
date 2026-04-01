import type { FormField } from "@/types";

interface EnumFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function EnumField({ field, value, onChange, readOnly }: EnumFieldProps) {
  return (
    <select
      id={field.name}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={readOnly}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
    >
      <option value="">Select {field.label}...</option>
      {(field.enumValues ?? []).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
