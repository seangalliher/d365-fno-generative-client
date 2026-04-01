/**
 * DynamicForm — Main form renderer that interprets a GeneratedForm schema.
 * Manages form state, dirty tracking, and delegates rendering to FieldRenderer.
 */

import { useState, useCallback } from "react";
import type { GeneratedForm, FormValues, FormField } from "@/types";
import { FieldRenderer } from "./FieldRenderer";
import { TabLayout } from "./TabLayout";
import { FormToolbar } from "./FormToolbar";
import { GridRenderer } from "./GridRenderer";
import { RelatedEntitiesPanel } from "./RelatedEntitiesPanel";
import { WizardLayout } from "./WizardLayout";

interface DynamicFormProps {
  form: GeneratedForm;
  initialValues?: FormValues;
  onSave?: (values: FormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  onNew?: () => void;
  onClose?: () => void;
  readOnlyMode?: boolean;
}

export function DynamicForm({
  form,
  initialValues = {},
  onSave,
  onDelete,
  onNew,
  onClose,
  readOnlyMode = false,
}: DynamicFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = dirtyFields.size > 0;

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      setDirtyFields((prev) => new Set(prev).add(fieldName));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.required && !field.readOnly) {
        const val = values[field.name];
        if (val === undefined || val === null || val === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
      if (field.maxLength) {
        const val = values[field.name];
        if (typeof val === "string" && val.length > field.maxLength) {
          newErrors[field.name] = `${field.label} must be ${field.maxLength} characters or fewer`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.fields, values]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave?.(values);
      setDirtyFields(new Set());
    } finally {
      setSaving(false);
    }
  }, [values, validate, onSave]);

  const handleDelete = useCallback(async () => {
    await onDelete?.();
  }, [onDelete]);

  const renderFieldsForTab = (fieldNames: string[]) => {
    const tabFields = form.fields.filter((f) => fieldNames.includes(f.name));
    return tabFields
      .sort((a, b) => a.order - b.order)
      .map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={(val) => handleFieldChange(field.name, val)}
          error={errors[field.name]}
          readOnly={readOnlyMode || field.readOnly}
        />
      ));
  };

  const renderGridsForTab = (gridNames?: string[]) => {
    if (!gridNames?.length) return null;
    return form.grids
      .filter((g) => gridNames.includes(g.name))
      .map((grid) => (
        <GridRenderer key={grid.name} grid={grid} parentValues={values} />
      ));
  };

  return (
    <div className="space-y-4">
      <FormToolbar
        form={form}
        isDirty={isDirty}
        saving={saving}
        onSave={onSave ? handleSave : undefined}
        onDelete={onDelete ? handleDelete : undefined}
        onNew={onNew}
        onClose={onClose}
      />

      {/* Wizard mode for Action-type forms with tabs */}
      {form.menuItemType === "Action" && form.layout.type === "tabbed" && form.layout.tabs.length > 0 ? (
        <WizardLayout
          tabs={form.layout.tabs}
          renderFields={renderFieldsForTab}
          renderGrids={renderGridsForTab}
          onComplete={onSave ? handleSave : undefined}
        />
      ) : form.layout.type === "tabbed" && form.layout.tabs.length > 0 ? (
        <TabLayout
          tabs={form.layout.tabs}
          renderFields={renderFieldsForTab}
          renderGrids={renderGridsForTab}
        />
      ) : (
        <div className="space-y-4">
          {form.fields
            .sort((a: FormField, b: FormField) => a.order - b.order)
            .map((field: FormField) => (
              <FieldRenderer
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(val) => handleFieldChange(field.name, val)}
                error={errors[field.name]}
                readOnly={readOnlyMode || field.readOnly}
              />
            ))}
        </div>
      )}

      {/* Cross-entity navigation links */}
      {form.navigation.length > 0 && (
        <RelatedEntitiesPanel
          navigation={form.navigation}
          currentValues={values}
        />
      )}
    </div>
  );
}
