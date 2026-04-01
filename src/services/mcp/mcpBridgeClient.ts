/**
 * Browser-side REST client for the MCP bridge server.
 * Sends tool call requests through the Vite proxy to the local bridge.
 */

import type {
  McpToolCallResponse,
  McpToolResult,
  McpToolInfo,
  McpListToolsResponse,
} from "./mcpTypes";

export interface McpBridgeClientConfig {
  /** Base URL for the bridge. Empty string = same origin (via Vite proxy). */
  bridgeUrl: string;
  /** Acquires an MSAL bearer token to forward to the MCP server. */
  getAccessToken: () => Promise<string>;
}

export class McpBridgeClient {
  private readonly bridgeUrl: string;
  private readonly getAccessToken: () => Promise<string>;

  constructor(config: McpBridgeClientConfig) {
    this.bridgeUrl = config.bridgeUrl;
    this.getAccessToken = config.getAccessToken;
  }

  /** Call an MCP tool through the bridge. */
  async callTool(tool: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.bridgeUrl}/mcp/call-tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tool, args }),
    });

    const data: McpToolCallResponse = await res.json();

    if (!data.success || !data.result) {
      throw new Error(data.error ?? `MCP call to ${tool} failed (HTTP ${res.status})`);
    }

    if (data.result.isError) {
      const errorText = data.result.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");
      throw new Error(errorText || `MCP tool ${tool} returned an error`);
    }

    return data.result;
  }

  /** Extract the first text content from an MCP result, parsed as JSON. */
  extractJson<T = Record<string, unknown>>(result: McpToolResult): T {
    const textItem = result.content.find((c) => c.type === "text" && c.text);
    if (!textItem?.text) {
      throw new Error("MCP result contains no text content");
    }
    return JSON.parse(textItem.text) as T;
  }

  /** List all tools available on the MCP server. */
  async listTools(): Promise<McpToolInfo[]> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.bridgeUrl}/mcp/list-tools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data: McpListToolsResponse = await res.json();
    if (!data.success || !data.tools) {
      throw new Error(data.error ?? "Failed to list MCP tools");
    }
    return data.tools;
  }

  /** Check if the bridge server is reachable. */
  async isReachable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.bridgeUrl}/mcp/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return false;
      const data = await res.json();
      return data?.ok === true;
    } catch {
      return false;
    }
  }
}
