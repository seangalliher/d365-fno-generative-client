import type { FormField } from "@/types";
import { Input } from "@/components/ui/input";

interface TextFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function TextField({ field, value, onChange, readOnly }: TextFieldProps) {
  return (
    <Input
      id={field.name}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.maxLength}
      readOnly={readOnly}
      placeholder={field.helpText ?? `Enter ${field.label.toLowerCase()}`}
      className={readOnly ? "bg-muted" : ""}
    />
  );
}
