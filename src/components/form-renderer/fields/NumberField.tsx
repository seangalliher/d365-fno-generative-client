import type { FormField } from "@/types";
import { Input } from "@/components/ui/input";

interface NumberFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function NumberField({ field, value, onChange, readOnly }: NumberFieldProps) {
  return (
    <Input
      id={field.name}
      type="number"
      value={value != null ? String(value) : ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? null : Number(v));
      }}
      readOnly={readOnly}
      placeholder={`Enter ${field.label.toLowerCase()}`}
      className={readOnly ? "bg-muted" : ""}
    />
  );
}
