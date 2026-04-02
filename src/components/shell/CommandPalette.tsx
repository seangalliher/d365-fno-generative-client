/**
 * CommandPalette — Ctrl+K quick navigation dialog.
 * Searches menu items and recent navigation history.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigationHistory } from "@/store/navigationHistory";
import type { MenuItem, NavigationEntry } from "@/types";

interface CommandPaletteProps {
  onSearch: (query: string) => MenuItem[];
  onSelect: (item: MenuItem) => void;
}

export function CommandPalette({ onSearch, onSelect }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentItems = useNavigationHistory((s) => s.recentItems);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedIndex(0);
      if (value.trim().length < 2) {
        setResults([]);
        return;
      }
      setResults(onSearch(value).slice(0, 8));
    },
    [onSearch]
  );

  const handleSelect = useCallback(
    (item: MenuItem) => {
      onSelect(item);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query.trim().length < 2 ? [] : results;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && items[selectedIndex]) {
        e.preventDefault();
        handleSelect(items[selectedIndex]);
      }
    },
    [query, results, selectedIndex, handleSelect]
  );

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-[10px]">
          ⌘K
        </kbd>
      </Button>
    );
  }

  const recent = recentItems(5);
  const showRecent = query.trim().length < 2 && recent.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

      {/* Palette */}
      <div className="relative z-10 w-full max-w-lg rounded-lg border bg-popover shadow-2xl">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search menu items..."
            className="border-0 focus-visible:ring-0"
          />
          <kbd className="pointer-events-none ml-2 inline-flex h-5 shrink-0 items-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {/* Recent items when no query */}
          {showRecent && (
            <>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Recent</p>
              {recent.map((entry: NavigationEntry) => (
                <button
                  key={entry.path + entry.timestamp}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    if (entry.menuItemName) {
                      handleSelect({
                        menuItemName: entry.menuItemName,
                        menuItemType: "Display",
                        label: entry.label,
                        formCached: false,
                        accessCount: 0,
                      });
                    }
                  }}
                >
                  <span>{entry.label}</span>
                  <span className="text-xs text-muted-foreground">{entry.menuItemName}</span>
                </button>
              ))}
            </>
          )}

          {/* Search results */}
          {results.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Results</p>
              {results.map((item, i) => (
                <button
                  key={item.menuItemName}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${
                    i === selectedIndex ? "bg-accent" : "hover:bg-accent"
                  }`}
                  onClick={() => handleSelect(item)}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">({item.menuItemType})</span>
                </button>
              ))}
            </>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}
