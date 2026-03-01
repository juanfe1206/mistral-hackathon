/**
 * Validates Mistral classifier mock — Epic 2 preparation.
 * Ensures test double works and classification tests won't hit real API.
 */
import { describe, it, expect } from "vitest";
import { createMockClassifier, MOCK_CLASSIFICATIONS } from "./mistral-classifier";

describe("Mistral classifier mock", () => {
  it("returns default low priority when no overrides", async () => {
    const classify = createMockClassifier();
    const result = await classify({
      sourceChannel: "whatsapp",
      sourceMetadata: {},
    });
    expect(result.priority).toBe("low");
    expect(result.reasonTags).toEqual([]);
  });

  it("returns overridden priority and reasonTags", async () => {
    const classify = createMockClassifier(MOCK_CLASSIFICATIONS.vip);
    const result = await classify({
      sourceChannel: "whatsapp",
      sourceMetadata: { contact_name: "Maria" },
    });
    expect(result.priority).toBe("vip");
    expect(result.reasonTags).toContain("repeat customer");
    expect(result.reasonTags).toContain("high intent");
  });

  it("uses predefined MOCK_CLASSIFICATIONS for high", async () => {
    const classify = createMockClassifier(MOCK_CLASSIFICATIONS.high);
    const result = await classify({
      sourceChannel: "whatsapp",
      sourceMetadata: {},
      interactionsSummary: "Inquiry about appointment",
    });
    expect(result.priority).toBe("high");
    expect(result.reasonTags).toContain("urgent inquiry");
  });

  it("ignores context input — mock does not call API", async () => {
    const classify = createMockClassifier({ priority: "low", reasonTags: ["stub"] });
    const result = await classify({
      sourceChannel: "whatsapp",
      sourceMetadata: { foo: "bar" },
    });
    expect(result.priority).toBe("low");
    expect(result.reasonTags).toEqual(["stub"]);
  });
});
