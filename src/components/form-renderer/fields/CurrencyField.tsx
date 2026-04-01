import type { FormField } from "@/types";
import { Input } from "@/components/ui/input";

interface CurrencyFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function CurrencyField({ field, value, onChange, readOnly }: CurrencyFieldProps) {
  const currencyCode = field.currencyCode ?? "USD";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {currencyCode}
      </span>
      <Input
        id={field.name}
        type="number"
        step="0.01"
        value={value != null ? String(value) : ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        readOnly={readOnly}
        className={`pl-12 ${readOnly ? "bg-muted" : ""}`}
        placeholder="0.00"
      />
    </div>
  );
}
