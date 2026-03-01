/**
 * Mistral classifier test double — Epic 2 preparation.
 * Use in tests via vi.mock to avoid hitting real API.
 *
 * Example:
 *   vi.mock("@/server/services/mistral-classifier", () => ({
 *     classifyLead: createMockClassifier({ priority: "vip", reasonTags: ["repeat customer"] }),
 *   }));
 */
import type { ClassifyLeadResult, LeadClassificationContext } from "@/lib/classification";

const DEFAULT: ClassifyLeadResult = {
  priority: "low",
  reasonTags: [],
};

/**
 * Returns an async function that resolves to the given result.
 * Use as a drop-in mock for classifyLead in Vitest.
 */
export function createMockClassifier(
  overrides?: Partial<ClassifyLeadResult>
): (context: LeadClassificationContext) => Promise<ClassifyLeadResult> {
  const result: ClassifyLeadResult = { ...DEFAULT, ...overrides };
  return async () => result;
}

/**
 * Predefined mock results for common test scenarios.
 */
export const MOCK_CLASSIFICATIONS = {
  vip: { priority: "vip" as const, reasonTags: ["repeat customer", "high intent"] },
  high: { priority: "high" as const, reasonTags: ["urgent inquiry", "conversion potential"] },
  low: { priority: "low" as const, reasonTags: ["general inquiry"] },
} satisfies Record<string, ClassifyLeadResult>;
