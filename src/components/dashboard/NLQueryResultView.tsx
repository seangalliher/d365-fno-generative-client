/**
 * Renders an NLQueryResult as a titled chart card.
 */

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NLQueryResult } from "@/services/analytics/dashboardDataProvider";
import { DynamicChart } from "./DynamicChart";

interface NLQueryResultViewProps {
  result: NLQueryResult;
  onRetry?: () => void;
}

export function NLQueryResultView({ result, onRetry }: NLQueryResultViewProps) {
  if (result.error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{result.error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{result.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <DynamicChart result={result} />
      </CardContent>
    </Card>
  );
}
