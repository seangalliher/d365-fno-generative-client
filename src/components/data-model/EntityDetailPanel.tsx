/**
 * EntityDetailPanel — shows entity metadata when a node is clicked.
 * Desktop: right sidebar. Mobile: bottom sheet.
 */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type GraphNode,
  type GraphLink,
} from "@/data/entityGraphData";

interface EntityDetailPanelProps {
  node: GraphNode;
  allLinks: GraphLink[];
  allNodes: GraphNode[];
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
  isMobile: boolean;
}

export function EntityDetailPanel({
  node,
  allLinks,
  allNodes,
  onClose,
  onNavigate,
  isMobile,
}: EntityDetailPanelProps) {
  // Find all connected entities
  const connections = allLinks
    .filter((l) => l.source === node.id || l.target === node.id)
    .map((l) => {
      const otherId = l.source === node.id ? String(l.target) : String(l.source);
      const otherNode = allNodes.find((n) => n.id === otherId);
      return {
        id: otherId,
        label: otherNode?.label ?? otherId,
        category: otherNode?.category,
        type: l.type,
        field: l.field,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const containerClass = isMobile
    ? "absolute bottom-0 left-0 right-0 z-20 max-h-[60vh] rounded-t-xl"
    : "absolute top-0 right-0 z-20 h-full w-80";

  return (
    <div
      className={`${containerClass} bg-black/80 backdrop-blur-md border-white/10 text-white overflow-y-auto
        ${isMobile ? "border-t" : "border-l"}`}
    >
      {/* Drag indicator (mobile) */}
      {isMobile && (
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{node.label}</h3>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: CATEGORY_COLORS[node.category] + "33",
                color: CATEGORY_COLORS[node.category],
              }}
            >
              {CATEGORY_LABELS[node.category]}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-xs text-white/70 leading-relaxed">
          {node.description}
        </p>

        {/* Key Fields */}
        <div>
          <div className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
            Key Fields
          </div>
          <div className="flex flex-wrap gap-1">
            {node.keyFields.map((f) => (
              <code
                key={f}
                className="px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-mono text-white/80"
              >
                {f}
              </code>
            ))}
          </div>
        </div>

        {/* Default Columns */}
        <div>
          <div className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
            Default Columns
          </div>
          <div className="flex flex-wrap gap-1">
            {node.defaultSelect.map((f) => (
              <code
                key={f}
                className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono text-white/60"
              >
                {f}
              </code>
            ))}
          </div>
        </div>

        {/* Relationships */}
        {connections.length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
              Relationships ({connections.length})
            </div>
            <div className="space-y-1">
              {connections.map((conn) => (
                <button
                  key={conn.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/10 transition-colors text-left"
                  onClick={() => onNavigate(conn.id)}
                >
                  {conn.category && (
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: CATEGORY_COLORS[conn.category],
                      }}
                    />
                  )}
                  <span className="text-xs truncate">{conn.label}</span>
                  {conn.field && (
                    <span className="ml-auto text-[10px] text-white/40 shrink-0 font-mono">
                      {conn.field}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Entity ID */}
        <div className="pt-2 border-t border-white/10">
          <code className="text-[10px] text-white/30 font-mono">{node.id}</code>
        </div>
      </div>
    </div>
  );
}
