/**
 * GridRenderer — Renders an embedded data grid using TanStack Table.
 */

import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { FormGrid, FormValues } from "@/types";

interface GridRendererProps {
  grid: FormGrid;
  data?: Record<string, unknown>[];
  parentValues?: FormValues;
  onRowClick?: (row: Record<string, unknown>) => void;
  enableSelection?: boolean;
  onSelectionChange?: (selectedRows: Record<string, unknown>[]) => void;
}

export function GridRenderer({ grid, data = [], onRowClick, enableSelection = false, onSelectionChange }: GridRendererProps) {
  const [sorting, setSorting] = useState<SortingState>(
    grid.defaultSort
      ? [{ id: grid.defaultSort.column, desc: grid.defaultSort.direction === "desc" }]
      : []
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectionColumn: ColumnDef<Record<string, unknown>>[] = enableSelection
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="h-4 w-4"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="h-4 w-4"
              onClick={(e) => e.stopPropagation()}
            />
          ),
          size: 40,
          enableSorting: false,
        },
      ]
    : [];

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      ...selectionColumn,
      ...grid.columns.map((col) => ({
        accessorKey: col.name,
        header: col.label,
        size: col.width,
        enableSorting: col.sortable !== false,
      })),
    ],
    [grid.columns, selectionColumn]
  );

  const handleRowSelectionChange = useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      if (onSelectionChange) {
        const selectedIndices = Object.keys(newSelection).filter((k) => newSelection[k]);
        onSelectionChange(selectedIndices.map((i) => data[Number(i)]).filter(Boolean) as Record<string, unknown>[]);
      }
    },
    [rowSelection, data, onSelectionChange]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: grid.pageSize ?? 20 },
    },
  });

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold">{grid.title}</h3>
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? " ↑" : ""}
                    {header.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-accent"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <button
              className="rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              className="rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
