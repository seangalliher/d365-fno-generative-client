import type { FormField } from "@/types";
import { Input } from "@/components/ui/input";

interface DateFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function DateField({ field, value, onChange, readOnly }: DateFieldProps) {
  const type = field.type === "datetime" ? "datetime-local" : "date";
  const stringValue = typeof value === "string" ? value.slice(0, type === "date" ? 10 : 16) : "";

  return (
    <Input
      id={field.name}
      type={type}
      value={stringValue}
      onChange={(e) => onChange(e.target.value || null)}
      readOnly={readOnly}
      className={readOnly ? "bg-muted" : ""}
    />
  );
}
