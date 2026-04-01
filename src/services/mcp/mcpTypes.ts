/**
 * Shared types for MCP bridge communication between browser and bridge server.
 */

/** Request body sent from browser to bridge */
export interface McpToolCallRequest {
  tool: string;
  args: Record<string, unknown>;
}

/** Response body returned from bridge to browser */
export interface McpToolCallResponse {
  success: boolean;
  result?: McpToolResult;
  error?: string;
}

/** Normalized MCP tool result */
export interface McpToolResult {
  content: McpContentItem[];
  isError?: boolean;
}

export interface McpContentItem {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
}

/** Tool discovery */
export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface McpListToolsResponse {
  success: boolean;
  tools?: McpToolInfo[];
  error?: string;
}
