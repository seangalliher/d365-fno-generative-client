/**
 * LLM client abstraction — supports Azure OpenAI for form schema generation.
 * Behind a provider interface for future flexibility (Claude, local models, etc.)
 */

export interface FormGenerationProvider {
  generateFormSchema(prompt: string): Promise<string>;
}

export interface LlmClientConfig {
  readonly endpoint: string;
  readonly apiKey: string;
  readonly deploymentName: string;
  readonly apiVersion?: string;
  readonly maxRetries?: number;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

interface ChatResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const RETRY_DELAYS_MS = [1000, 2000, 4000];

/**
 * Azure OpenAI client implementing FormGenerationProvider.
 */
export class AzureOpenAIClient implements FormGenerationProvider {
  private readonly config: LlmClientConfig;
  private _totalTokensUsed = 0;

  constructor(config: LlmClientConfig) {
    if (!config.endpoint || !config.apiKey) {
      throw new Error("LLM endpoint and apiKey are required");
    }
    this.config = config;
  }

  get totalTokensUsed(): number {
    return this._totalTokensUsed;
  }

  async generateFormSchema(prompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a D365 Finance & Operations UX specialist. Generate JSON form schemas that follow D365 conventions. Return ONLY valid JSON — no markdown, no explanation.",
      },
      { role: "user", content: prompt },
    ];

    const response = await this.chat(messages);
    return response;
  }

  private async chat(messages: ChatMessage[], attempt = 0): Promise<string> {
    const apiVersion = this.config.apiVersion ?? "2024-08-01-preview";
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${apiVersion}`;

    const body = {
      messages,
      temperature: this.config.temperature ?? 0.2,
      max_tokens: this.config.maxTokens ?? 4096,
      response_format: { type: "json_object" },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": this.config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429 && attempt < (this.config.maxRetries ?? 3)) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.chat(messages, attempt + 1);
      }
      throw new LlmError(
        `LLM request failed: HTTP ${response.status}`,
        response.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED"
      );
    }

    const data = (await response.json()) as ChatResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new LlmError("LLM returned empty response", "EMPTY_RESPONSE");
    }

    if (data.usage) {
      this._totalTokensUsed += data.usage.total_tokens;
    }

    return content;
  }
}

/**
 * Copilot Proxy client — routes requests through a local OpenAI-compatible proxy.
 * Used with GitHub Copilot's proxy at 127.0.0.1:8080.
 */
export interface CopilotProxyConfig {
  readonly endpoint: string;    // e.g. "http://127.0.0.1:8080"
  readonly model: string;       // e.g. "gpt-4o"
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export class CopilotProxyClient implements FormGenerationProvider {
  private readonly config: CopilotProxyConfig;
  private _totalTokensUsed = 0;

  constructor(config: CopilotProxyConfig) {
    if (!config.endpoint) {
      throw new Error("Copilot Proxy endpoint is required");
    }
    this.config = config;
  }

  get totalTokensUsed(): number {
    return this._totalTokensUsed;
  }

  async generateFormSchema(prompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a D365 Finance & Operations UX specialist. Generate JSON form schemas that follow D365 conventions. Return ONLY valid JSON — no markdown, no explanation.",
      },
      { role: "user", content: prompt },
    ];

    const url = `${this.config.endpoint}/v1/chat/completions`;

    const body = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature ?? 0.2,
      max_tokens: this.config.maxTokens ?? 4096,
      response_format: { type: "json_object" },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new LlmError(
        `Copilot Proxy request failed: HTTP ${response.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
        response.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED"
      );
    }

    const data = (await response.json()) as ChatResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new LlmError("Copilot Proxy returned empty response", "EMPTY_RESPONSE");
    }

    if (data.usage) {
      this._totalTokensUsed += data.usage.total_tokens;
    }

    return content;
  }
}

/**
 * Mock provider for development/testing — returns pre-built form schemas.
 */
export class MockFormGenerationProvider implements FormGenerationProvider {
  private responses: Map<string, string> = new Map();

  setResponse(promptContains: string, response: string): void {
    this.responses.set(promptContains, response);
  }

  async generateFormSchema(prompt: string): Promise<string> {
    for (const [key, response] of this.responses) {
      if (prompt.includes(key)) return response;
    }
    throw new LlmError("No mock response configured for prompt", "MOCK_NOT_FOUND");
  }
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly code: "RATE_LIMITED" | "REQUEST_FAILED" | "EMPTY_RESPONSE" | "MOCK_NOT_FOUND"
  ) {
    super(message);
    this.name = "LlmError";
  }
}
