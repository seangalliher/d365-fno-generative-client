/**
 * Natural language query input with example chips.
 */

import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Top 10 customers by order count",
  "Sales order status breakdown",
  "Top products by inventory",
  "Purchase orders by status",
  "Recent sales orders this month",
];

interface NLQueryInputProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
}

export function NLQueryInput({ onSubmit, loading }: NLQueryInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) onSubmit(query.trim());
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your data..."
            className="pl-9"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={!query.trim() || loading} size="default">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              if (!loading) onSubmit(ex);
            }}
            className="text-xs px-2.5 py-1 rounded-full border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
