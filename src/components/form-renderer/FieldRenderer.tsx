/**
 * FieldRenderer — Maps FormField type to the correct field component.
 */

import type { FormField } from "@/types";
import { TextField } from "./fields/TextField";
import { NumberField } from "./fields/NumberField";
import { DateField } from "./fields/DateField";
import { EnumField } from "./fields/EnumField";
import { BooleanField } from "./fields/BooleanField";
import { CurrencyField } from "./fields/CurrencyField";
import { MemoField } from "./fields/MemoField";
import { LookupField } from "./fields/LookupField";

interface FieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

export function FieldRenderer({ field, value, onChange, error, readOnly }: FieldRendererProps) {
  const commonProps = {
    field,
    value,
    onChange,
    error,
    readOnly: readOnly || field.readOnly,
  };

  const fieldComponent = (() => {
    switch (field.type) {
      case "text":
        return <TextField {...commonProps} />;
      case "number":
        return <NumberField {...commonProps} />;
      case "date":
      case "datetime":
        return <DateField {...commonProps} />;
      case "enum":
        return <EnumField {...commonProps} />;
      case "boolean":
        return <BooleanField {...commonProps} />;
      case "currency":
        return <CurrencyField {...commonProps} />;
      case "memo":
        return <MemoField {...commonProps} />;
      case "lookup":
        return <LookupField {...commonProps} />;
      default:
        return <TextField {...commonProps} />;
    }
  })();

  return (
    <div className="space-y-1">
      <label
        htmlFor={field.name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {field.label}
        {field.required && !readOnly && <span className="ml-1 text-destructive">*</span>}
      </label>
      {fieldComponent}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {field.helpText && !error && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}
