/**
 * DataModelPage — Interactive 3D force-directed graph of D365 entity relationships.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import type { ForceGraphMethods, NodeObject } from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  buildEntityGraph,
  CATEGORY_COLORS,
  type GraphNode,
} from "@/data/entityGraphData";
import { EntityDetailPanel } from "@/components/data-model/EntityDetailPanel";
import { GraphLegend } from "@/components/data-model/GraphLegend";

export function DataModelPage() {
  const isMobile = useIsMobile();
  const fgRef = useRef<ForceGraphMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Build graph from entity catalog (static, computed once)
  const { nodes, links } = useMemo(() => buildEntityGraph(), []);
  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    }),
    [nodes, links]
  );

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);

    // Initial measurement
    setDimensions({ width: el.clientWidth, height: el.clientHeight });

    return () => ro.disconnect();
  }, []);

  // Tune forces after mount
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    const charge = fg.d3Force("charge");
    if (charge) charge.strength(-250);

    const link = fg.d3Force("link");
    if (link) link.distance(80);
  }, []);

  // Node click → select + zoom
  const handleNodeClick = useCallback(
    (node: NodeObject) => {
      const gn = node as unknown as GraphNode;
      setSelectedNode(gn);

      // Fly camera to clicked node
      const fg = fgRef.current;
      if (fg && node.x != null && node.y != null && node.z != null) {
        const dist = 120;
        fg.cameraPosition(
          { x: node.x + dist, y: node.y + dist / 2, z: node.z + dist },
          { x: node.x, y: node.y, z: node.z },
          800
        );
      }
    },
    []
  );

  // Navigate to a connected node from the detail panel
  const handleNavigateToNode = useCallback(
    (nodeId: string) => {
      const target = graphData.nodes.find((n) => n.id === nodeId);
      if (target) {
        handleNodeClick(target as unknown as NodeObject);
      }
    },
    [graphData.nodes, handleNodeClick]
  );

  // Custom node rendering with text labels
  const nodeThreeObject = useCallback(
    (node: NodeObject) => {
      const gn = node as unknown as GraphNode;
      const sprite = new SpriteText(gn.label, isMobile ? 3 : 3.5, "#ffffff");
      sprite.fontFace = "system-ui, -apple-system, sans-serif";
      sprite.backgroundColor = "rgba(0,0,0,0.5)";
      sprite.padding = 1.5;
      sprite.borderRadius = 2;
      sprite.material.depthWrite = false;
      sprite.position.set(0, isMobile ? 8 : 10, 0);
      return sprite;
    },
    [isMobile]
  );

  return (
    <div
      ref={containerRef}
      className="relative -m-3 sm:-m-6 bg-[#030712] overflow-hidden"
      style={{
        width: isMobile ? "calc(100% + 1.5rem)" : "calc(100% + 3rem)",
        height: "calc(100vh - 3.5rem)",
      }}
    >
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#030712"
        // Node styling
        nodeColor={(node: NodeObject) => {
          const gn = node as unknown as GraphNode;
          return CATEGORY_COLORS[gn.category] ?? "#666";
        }}
        nodeVal={(node: NodeObject) => {
          const gn = node as unknown as GraphNode;
          return Math.max(2, gn.connectionCount * 2.5);
        }}
        nodeRelSize={4}
        nodeOpacity={0.92}
        nodeLabel={() => ""}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={true}
        // Link styling
        linkColor={(link) => {
          const srcId =
            typeof link.source === "object"
              ? (link.source as NodeObject).id
              : link.source;
          const srcNode = nodes.find((n) => n.id === srcId);
          const color = srcNode
            ? CATEGORY_COLORS[srcNode.category]
            : "#ffffff";
          return color + "55";
        }}
        linkWidth={1}
        linkOpacity={0.4}
        linkDirectionalParticles={isMobile ? 0 : 2}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={(link) => {
          const srcId =
            typeof link.source === "object"
              ? (link.source as NodeObject).id
              : link.source;
          const srcNode = nodes.find((n) => n.id === srcId);
          return srcNode ? CATEGORY_COLORS[srcNode.category] : "#ffffff";
        }}
        // Interaction
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => setSelectedNode(null)}
        enableNavigationControls={true}
        showNavInfo={false}
        // Simulation
        warmupTicks={60}
        cooldownTicks={120}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.3}
      />

      {/* Legend overlay */}
      <GraphLegend compact={isMobile} />

      {/* Title overlay */}
      <div className="absolute top-3 right-3 z-10 text-right">
        <h1 className="text-white/80 text-sm font-semibold tracking-wide">
          D365 Data Model
        </h1>
        <p className="text-white/40 text-[10px]">
          {nodes.length} entities &middot; {links.length} relationships
        </p>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <EntityDetailPanel
          node={selectedNode}
          allLinks={links}
          allNodes={nodes}
          onClose={() => setSelectedNode(null)}
          onNavigate={handleNavigateToNode}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
