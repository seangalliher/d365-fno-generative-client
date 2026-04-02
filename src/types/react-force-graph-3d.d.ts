declare module "react-force-graph-3d" {
  import type { ForwardRefExoticComponent, RefAttributes } from "react";

  export interface NodeObject {
    id: string | number;
    x?: number;
    y?: number;
    z?: number;
    [key: string]: unknown;
  }

  export interface LinkObject {
    source: string | number | NodeObject;
    target: string | number | NodeObject;
    [key: string]: unknown;
  }

  export interface GraphData {
    nodes: NodeObject[];
    links: LinkObject[];
  }

  export interface ForceGraphMethods {
    d3Force: (forceName: string) => {
      strength: (val: number) => void;
      distance: (val: number) => void;
    } | undefined;
    cameraPosition: (
      position: { x: number; y: number; z: number },
      lookAt?: { x: number; y: number; z: number },
      transitionMs?: number
    ) => void;
    scene: () => object;
    renderer: () => object;
  }

  export interface ForceGraph3DProps {
    graphData?: GraphData;
    width?: number;
    height?: number;
    backgroundColor?: string;
    nodeLabel?: string | ((node: NodeObject) => string);
    nodeColor?: string | ((node: NodeObject) => string);
    nodeVal?: string | ((node: NodeObject) => number);
    nodeRelSize?: number;
    nodeOpacity?: number;
    nodeThreeObject?: (node: NodeObject) => object;
    nodeThreeObjectExtend?: boolean;
    linkColor?: string | ((link: LinkObject) => string);
    linkWidth?: number | ((link: LinkObject) => number);
    linkOpacity?: number;
    linkDirectionalParticles?: number | ((link: LinkObject) => number);
    linkDirectionalParticleSpeed?: number;
    linkDirectionalParticleWidth?: number;
    linkDirectionalParticleColor?: string | ((link: LinkObject) => string);
    onNodeClick?: (node: NodeObject, event: MouseEvent) => void;
    onNodeHover?: (node: NodeObject | null, prevNode: NodeObject | null) => void;
    onBackgroundClick?: () => void;
    warmupTicks?: number;
    cooldownTicks?: number;
    cooldownTime?: number;
    d3AlphaDecay?: number;
    d3VelocityDecay?: number;
    enableNavigationControls?: boolean;
    showNavInfo?: boolean;
  }

  const ForceGraph3D: ForwardRefExoticComponent<
    ForceGraph3DProps & RefAttributes<ForceGraphMethods>
  >;
  export default ForceGraph3D;
}

declare module "three-spritetext" {
  export default class SpriteText {
    constructor(text?: string, textHeight?: number, color?: string);
    text: string;
    textHeight: number;
    color: string;
    backgroundColor: string | false;
    padding: number;
    borderWidth: number;
    borderRadius: number;
    borderColor: string;
    fontFace: string;
    fontSize: number;
    fontWeight: string;
    strokeWidth: number;
    strokeColor: string;
    material: { depthWrite: boolean; [key: string]: unknown };
    position: { set: (x: number, y: number, z: number) => void };
  }
}
