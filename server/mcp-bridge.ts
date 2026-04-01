/**
 * MCP Bridge Server — relays REST calls from the browser to the D365 MCP server
 * using the official @modelcontextprotocol/sdk SSE client transport.
 *
 * The browser sends its MSAL bearer token; the bridge forwards it to the MCP server.
 * No credentials are stored on the bridge.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// ---- Configuration ----

const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL ??
  "https://agent365.svc.cloud.microsoft/mcp/environments/74e044ee-c9a4-eb11-b7eb-064361b18b09/servers/msdyn_ERPAnalyticsMCPServer";

const PORT = Number(process.env.MCP_BRIDGE_PORT ?? 3001);
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// ---- Connection Pool ----

interface PoolEntry {
  client: Client;
  transport: SSEClientTransport;
  lastUsed: number;
}

const pool = new Map<string, PoolEntry>();

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

async function getOrCreateClient(token: string): Promise<Client> {
  const key = tokenHash(token);
  const existing = pool.get(key);

  if (existing) {
    existing.lastUsed = Date.now();
    return existing.client;
  }

  const transport = new SSEClientTransport(new URL(MCP_SERVER_URL), {
    requestInit: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const client = new Client({ name: "d365-generative-client-bridge", version: "1.0.0" });
  await client.connect(transport);

  pool.set(key, { client, transport, lastUsed: Date.now() });
  console.info(`[bridge] New MCP session for token ${key}`);
  return client;
}

// Sweep idle connections every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pool) {
    if (now - entry.lastUsed > IDLE_TIMEOUT_MS) {
      entry.client.close().catch(() => {});
      pool.delete(key);
      console.info(`[bridge] Closed idle session ${key}`);
    }
  }
}, 60_000);

// ---- HTTP Helpers ----

function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function extractToken(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

// ---- Route Handlers ----

async function handleHealth(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  sendJson(res, 200, { ok: true, mcpServer: MCP_SERVER_URL, poolSize: pool.size });
}

async function handleListTools(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    sendJson(res, 401, { success: false, error: "Missing Authorization header" });
    return;
  }

  try {
    const client = await getOrCreateClient(token);
    const result = await client.listTools();
    sendJson(res, 200, { success: true, tools: result.tools });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[bridge] listTools error: ${msg}`);
    sendJson(res, 502, { success: false, error: `MCP connection failed: ${msg}` });
  }
}

async function handleCallTool(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    sendJson(res, 401, { success: false, error: "Missing Authorization header" });
    return;
  }

  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    sendJson(res, 400, { success: false, error: "Invalid JSON body" });
    return;
  }

  const { tool, args } = body;
  if (!tool || typeof tool !== "string") {
    sendJson(res, 400, { success: false, error: "Missing 'tool' field" });
    return;
  }
  if (args !== undefined && (typeof args !== "object" || args === null)) {
    sendJson(res, 400, { success: false, error: "'args' must be an object" });
    return;
  }

  try {
    const client = await getOrCreateClient(token);
    const result = await client.callTool({ name: tool, arguments: args ?? {} });
    sendJson(res, 200, { success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[bridge] callTool(${tool}) error: ${msg}`);

    // If connection died, evict from pool so next request reconnects
    const key = tokenHash(token);
    if (pool.has(key)) {
      pool.get(key)!.client.close().catch(() => {});
      pool.delete(key);
    }

    sendJson(res, 502, { success: false, error: `MCP call failed: ${msg}` });
  }
}

// ---- Server ----

const server = createServer(async (req, res) => {
  setCorsHeaders(req, res);

  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url ?? "";

  try {
    if (req.method === "GET" && url === "/mcp/health") {
      await handleHealth(req, res);
    } else if (req.method === "POST" && url === "/mcp/list-tools") {
      await handleListTools(req, res);
    } else if (req.method === "POST" && url === "/mcp/call-tool") {
      await handleCallTool(req, res);
    } else {
      sendJson(res, 404, { error: "Not found" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[bridge] Unhandled: ${msg}`);
    sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.info(`[bridge] MCP bridge listening on http://127.0.0.1:${PORT}`);
  console.info(`[bridge] MCP server: ${MCP_SERVER_URL}`);
});
