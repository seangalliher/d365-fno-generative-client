/**
 * OData query builder and service for direct D365 F&O HTTP calls.
 * Falls back to this when MCP is unavailable or for simple CRUD.
 */

import type { ODataQueryOptions, ODataResult, ODataUpdate } from "@/types";
import { evaluateGuardrails, hasBlockers } from "./guardrails";

export class ODataQueryBuilder {
  static build(options: ODataQueryOptions): string {
    const params: string[] = [];

    // Auto-inject cross-company if not explicitly set
    if (options.crossCompany !== false) {
      params.push("cross-company=true");
    }

    if (options.filter) params.push(`$filter=${options.filter}`);
    if (options.select) params.push(`$select=${options.select}`);
    if (options.expand) params.push(`$expand=${options.expand}`);
    if (options.top != null) params.push(`$top=${options.top}`);
    if (options.skip != null) params.push(`$skip=${options.skip}`);
    if (options.orderby) params.push(`$orderby=${options.orderby}`);
    if (options.count) params.push("$count=true");

    return params.join("&");
  }

  static parse(queryString: string): ODataQueryOptions {
    const params = new URLSearchParams(queryString);
    return {
      filter: params.get("$filter") ?? undefined,
      select: params.get("$select") ?? undefined,
      expand: params.get("$expand") ?? undefined,
      top: params.has("$top") ? Number(params.get("$top")) : undefined,
      skip: params.has("$skip") ? Number(params.get("$skip")) : undefined,
      orderby: params.get("$orderby") ?? undefined,
      count: params.get("$count") === "true",
      crossCompany: params.get("cross-company") === "true",
    };
  }
}

/** Configuration for OData service */
export interface ODataServiceConfig {
  readonly baseUrl: string;
  readonly getAccessToken: () => Promise<string>;
  readonly maxRetries?: number;
  readonly defaultCompany?: string;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [1000, 2000, 4000];

/**
 * Direct OData client for D365 F&O.
 * Implements retry with exponential backoff on transient errors.
 */
export class ODataService {
  private readonly config: ODataServiceConfig;

  constructor(config: ODataServiceConfig) {
    this.config = config;
  }

  async query<T = Record<string, unknown>>(
    entitySet: string,
    options?: ODataQueryOptions
  ): Promise<ODataResult<T>> {
    const queryString = options ? ODataQueryBuilder.build(options) : "cross-company=true";

    const guardrails = evaluateGuardrails({
      command: "data find",
      entityPath: entitySet,
      queryString,
      company: this.config.defaultCompany ?? "",
      hasConfirm: false,
      body: null,
    });

    if (hasBlockers(guardrails)) {
      const blocker = guardrails.find((g) => g.blocked);
      throw new ODataError(blocker?.message ?? "Operation blocked by guardrail", "GUARDRAIL_BLOCK");
    }

    const url = `${this.config.baseUrl}/data/${entitySet}?${queryString}`;
    const response = await this.fetchWithRetry(url, { method: "GET" });
    return response as ODataResult<T>;
  }

  async create<T = Record<string, unknown>>(
    entitySet: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.config.baseUrl}/data/${entitySet}`;
    return this.fetchWithRetry(url, {
      method: "POST",
      body: JSON.stringify(data),
    }) as Promise<T>;
  }

  async update(updates: ODataUpdate[]): Promise<void> {
    for (const update of updates) {
      const url = `${this.config.baseUrl}/data/${update.odataPath}`;
      await this.fetchWithRetry(url, {
        method: "PATCH",
        body: JSON.stringify(update.updatedFieldValues),
      });
    }
  }

  async remove(odataPath: string): Promise<void> {
    const guardrails = evaluateGuardrails({
      command: "data delete",
      entityPath: odataPath,
      queryString: "",
      company: this.config.defaultCompany ?? "",
      hasConfirm: false,
      body: null,
    });

    if (hasBlockers(guardrails)) {
      const blocker = guardrails.find((g) => g.blocked);
      throw new ODataError(blocker?.message ?? "Operation blocked", "GUARDRAIL_BLOCK");
    }

    const url = `${this.config.baseUrl}/data/${odataPath}`;
    await this.fetchWithRetry(url, { method: "DELETE" });
  }

  private async fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<unknown> {
    const token = await this.config.getAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < (this.config.maxRetries ?? 3)) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      throw await ODataError.fromResponse(response);
    }

    if (response.status === 204) return undefined;
    return response.json();
  }
}

export class ODataError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details?: string,
    readonly suggestion?: string
  ) {
    super(message);
    this.name = "ODataError";
  }

  static async fromResponse(response: Response): Promise<ODataError> {
    const suggestions: Record<number, string> = {
      401: "Authentication token may be expired. Re-authenticate.",
      403: "Check your D365 security role and permissions.",
      404: "The entity or record was not found. Verify the entity set name and keys.",
      429: "D365 is rate-limiting requests. Wait and retry.",
    };

    let message = `HTTP ${response.status}: ${response.statusText}`;
    let code = "ODATA_ERROR";
    let details: string | undefined;

    try {
      const body = (await response.json()) as { error?: { message?: string; code?: string; innererror?: { message?: string } } };
      message = body.error?.message ?? message;
      code = body.error?.code ?? code;
      details = body.error?.innererror?.message;
    } catch {
      // Response body is not JSON
    }

    return new ODataError(message, code, details, suggestions[response.status]);
  }
}
