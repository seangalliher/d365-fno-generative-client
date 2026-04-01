/**
 * GlobalSearch — Search across menu items with fuzzy matching.
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { MenuItem } from "@/types";
import { Search, X } from "lucide-react";

interface GlobalSearchProps {
  onSearch: (query: string) => MenuItem[];
  onSelect: (item: MenuItem) => void;
}

export function GlobalSearch({ onSearch, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      const found = onSearch(value);
      setResults(found);
      setIsOpen(found.length > 0);
    },
    [onSearch]
  );

  const handleSelect = useCallback(
    (item: MenuItem) => {
      onSelect(item);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <div className="relative w-72">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search menu items..."
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
            className="absolute right-2.5 top-2.5"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="max-h-64 overflow-y-auto py-1">
            {results.slice(0, 10).map((item) => (
              <button
                key={item.menuItemName}
                onMouseDown={() => handleSelect(item)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">({item.menuItemType})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
