import { describe, it, expect } from "vitest";
import { MockFormGenerationProvider, LlmError } from "./llmClient";

describe("MockFormGenerationProvider", () => {
  it("returns configured response", async () => {
    const mock = new MockFormGenerationProvider();
    mock.setResponse("Customers", '{"form": true}');
    const result = await mock.generateFormSchema("Generate for Customers");
    expect(result).toBe('{"form": true}');
  });

  it("throws when no response configured", async () => {
    const mock = new MockFormGenerationProvider();
    await expect(mock.generateFormSchema("Unknown")).rejects.toThrow(LlmError);
  });
});

describe("LlmError", () => {
  it("is instanceof Error", () => {
    const err = new LlmError("test", "RATE_LIMITED");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("LlmError");
    expect(err.code).toBe("RATE_LIMITED");
  });
});
