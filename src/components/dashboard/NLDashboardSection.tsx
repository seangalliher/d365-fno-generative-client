/**
 * Natural language dashboard section — query input + dynamic chart result.
 */

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/store/appState";
import { NLQueryInput } from "./NLQueryInput";
import { NLQueryResultView } from "./NLQueryResultView";
import { executeNLDashboardQuery } from "@/services/analytics/nlQueryService";
import type { NLQueryResult } from "@/services/analytics/dashboardDataProvider";

export function NLDashboardSection() {
  const company = useAppState((s) => s.currentCompany);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NLQueryResult | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const handleQuery = async (query: string) => {
    setLastQuery(query);
    setLoading(true);
    setResult(null);
    try {
      const data = await executeNLDashboardQuery(query, company);
      setResult(data);
    } catch (err) {
      setResult({
        title: "Error",
        chartType: "table",
        columns: [],
        rows: [],
        error: err instanceof Error ? err.message : "Failed to generate dashboard",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Ask a Question
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <NLQueryInput onSubmit={handleQuery} loading={loading} />

        {loading && (
          <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Generating chart from your question...</span>
          </div>
        )}

        {!loading && result && (
          <NLQueryResultView
            result={result}
            onRetry={() => handleQuery(lastQuery)}
          />
        )}

        {!loading && !result && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Type a question above or click an example to generate a chart.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
