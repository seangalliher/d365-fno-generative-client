/**
 * EntityListView — Renders a list/grid of existing records for Display-type menu items.
 * Uses live OData when a D365 endpoint is configured; falls back to sample data.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Search, List, Loader2, AlertCircle } from "lucide-react";
import { GridRenderer } from "@/components/form-renderer/GridRenderer";
import { getEntityCatalogEntry } from "@/data/entityCatalog";
import { buildColumnsFromCatalog } from "@/data/sampleData";
import { useEntityData } from "@/hooks/useEntityData";
import type { FormGrid, GridColumn } from "@/types";

interface EntityListViewProps {
  entitySet: string;
  title: string;
  onRowClick: (record: Record<string, unknown>) => void;
  onNew: () => void;
}

export function EntityListView({ entitySet, title, onRowClick, onNew }: EntityListViewProps) {
  const [filterText, setFilterText] = useState("");

  const catalogEntry = useMemo(() => getEntityCatalogEntry(entitySet), [entitySet]);

  const { data, loading, error, isLive, refresh } = useEntityData(entitySet);

  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;
    const lower = filterText.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(lower),
      ),
    );
  }, [data, filterText]);

  const columns: GridColumn[] = useMemo(() => {
    if (!catalogEntry) return [];
    return buildColumnsFromCatalog(catalogEntry);
  }, [catalogEntry]);

  const grid: FormGrid = useMemo(
    () => ({
      name: `${entitySet}_list`,
      title: "",
      entitySet,
      columns,
      filterableColumns: catalogEntry?.searchFields ?? [],
      sortableColumns: columns.map((c) => c.name),
      defaultSort: columns[0] ? { column: columns[0].name, direction: "asc" } : undefined,
      pageSize: 20,
    }),
    [entitySet, columns, catalogEntry],
  );

  if (!catalogEntry) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <List className="mb-3 h-8 w-8" />
        <p>No catalog entry for entity: {entitySet}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNew}>
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Quick filter */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Filter ${title.toLowerCase()}...`}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm outline-none ring-ring focus:ring-1"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading records...
            </span>
          ) : (
            <>
              {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
              {filterText.trim() ? ` (filtered from ${data.length})` : ""}
            </>
          )}
        </span>
        <span className={`rounded px-2 py-0.5 ${isLive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
          {isLive ? "Live" : "Demo data"}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Data fetch failed — showing sample data</p>
            <p className="text-xs text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <GridRenderer
          grid={grid}
          data={filteredData}
          onRowClick={onRowClick}
          enableSelection
        />
      )}
    </div>
  );
}
