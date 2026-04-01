/**
 * FormRefinementPanel — Lets users provide natural language feedback
 * to adjust the generated form layout (e.g., "Add a grid for sales orders",
 * "Move CustomerAccount to the header", "Make this field read-only").
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";

interface FormRefinementPanelProps {
  onRefine: (feedback: string) => Promise<void>;
  isRefining: boolean;
}

export function FormRefinementPanel({ onRefine, isRefining }: FormRefinementPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!feedback.trim() || isRefining) return;
    await onRefine(feedback.trim());
    setFeedback("");
    setIsOpen(false);
  }, [feedback, isRefining, onRefine]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Refine form
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Refine form layout</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Describe how you'd like the form to change. The AI will regenerate the layout.
      </p>
      <div className="flex gap-2">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRefining}
          placeholder={`e.g., "Add a tab for addresses" or "Show invoice fields first"`}
          rows={2}
          className="flex-1 min-h-[60px] rounded-md border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!feedback.trim() || isRefining}
          className="self-end"
        >
          {isRefining ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setFeedback(s)}
            className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const suggestions: string[] = [
  "Add more fields",
  "Group by category",
  "Add a related grid",
  "Make it simpler",
  "Add tabs for sections",
];
