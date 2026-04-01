/**
 * RelatedEntitiesPanel — Renders cross-entity navigation links from the form's
 * navigation definitions. Allows users to jump to related records.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/store/navigationHistory";
import { useAppState } from "@/store/appState";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormNavigation, FormValues } from "@/types";

interface RelatedEntitiesPanelProps {
  navigation: FormNavigation[];
  currentValues: FormValues;
}

export function RelatedEntitiesPanel({ navigation, currentValues }: RelatedEntitiesPanelProps) {
  const navigate = useNavigate();
  const pushNav = useNavigationHistory((s) => s.push);
  const setMenuItem = useAppState((s) => s.setMenuItem);

  const handleNavigate = useCallback(
    (nav: FormNavigation) => {
      const fkValue = currentValues[nav.foreignKeyField];
      setMenuItem({
        menuItemName: nav.targetMenuItemName,
        menuItemType: nav.targetMenuItemType,
        label: nav.label,
        formCached: false,
        accessCount: 0,
      });
      pushNav({
        path: `/form/${nav.targetMenuItemName}`,
        label: nav.label,
        menuItemName: nav.targetMenuItemName,
        timestamp: new Date().toISOString(),
        recordId: fkValue != null ? String(fkValue) : undefined,
      });
      navigate(`/form/${nav.targetMenuItemName}`);
    },
    [currentValues, navigate, pushNav, setMenuItem]
  );

  if (navigation.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Related</h3>
      <div className="flex flex-wrap gap-2">
        {navigation.map((nav) => {
          const fkValue = currentValues[nav.foreignKeyField];
          const hasValue = fkValue != null && fkValue !== "";

          return (
            <Button
              key={nav.targetMenuItemName}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!hasValue}
              onClick={() => handleNavigate(nav)}
              title={
                hasValue
                  ? `Open ${nav.label} for ${String(fkValue)}`
                  : `No ${nav.foreignKeyField} value to navigate`
              }
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {nav.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
