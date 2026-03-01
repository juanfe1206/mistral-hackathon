/**
 * Lead classification types for AI prioritization (Epic 2).
 * Used by classification service and test doubles.
 */

export type LeadPriority = "vip" | "high" | "low";

export interface ClassifyLeadResult {
  priority: LeadPriority;
  reasonTags: string[];
}

export interface LeadClassificationContext {
  sourceChannel: string;
  sourceMetadata: Record<string, unknown>;
  /** Optional summary of recent interactions for context */
  interactionsSummary?: string;
}
