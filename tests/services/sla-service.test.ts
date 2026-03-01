import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as slaService from "@/server/services/sla-service";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";
const LEAD_ID = "11111111-1111-1111-8111-111111111111";

const mockFindLeadById = vi.fn();
const mockFindLeadsByTenant = vi.fn();
const mockGetEarliestSentAtForLead = vi.fn();
const mockGetEarliestSentAtByLeadIds = vi.fn();

vi.mock("@/server/repositories/lead-repository", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  findLeadsByTenant: (...args: unknown[]) => mockFindLeadsByTenant(...args),
}));

vi.mock("@/server/repositories/reply-draft-repository", () => ({
  getEarliestSentAtForLead: (...args: unknown[]) => mockGetEarliestSentAtForLead(...args),
  getEarliestSentAtByLeadIds: (...args: unknown[]) => mockGetEarliestSentAtByLeadIds(...args),
}));

describe("sla-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:10:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getLeadSlaStatus", () => {
    it("returns null when lead not found", async () => {
      mockFindLeadById.mockResolvedValue(null);
      const result = await slaService.getLeadSlaStatus(LEAD_ID, TENANT_ID);
      expect(result).toBeNull();
    });

    it("returns n_a for low-priority lead", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "low",
        createdAt: new Date("2024-01-01T12:00:00Z"),
      });
      const result = await slaService.getLeadSlaStatus(LEAD_ID, TENANT_ID);
      expect(result).toEqual({
        status: "n_a",
        minutes_to_breach: null,
        minutes_over: null,
        first_response_at: null,
      });
    });

    it("returns breached for VIP lead created 6m ago with no response", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "vip",
        createdAt: new Date("2024-01-01T12:04:00Z"), // 6 min ago
      });
      mockGetEarliestSentAtForLead.mockResolvedValue(null);
      const result = await slaService.getLeadSlaStatus(LEAD_ID, TENANT_ID);
      expect(result?.status).toBe("breached");
      expect(result?.minutes_over).toBeGreaterThanOrEqual(1);
    });

    it("returns safe for VIP lead that responded in 2m", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "vip",
        createdAt: new Date("2024-01-01T12:08:00Z"), // 2 min ago
      });
      mockGetEarliestSentAtForLead.mockResolvedValue(new Date("2024-01-01T12:09:00Z")); // 1 min after creation, within 5m
      const result = await slaService.getLeadSlaStatus(LEAD_ID, TENANT_ID);
      expect(result?.status).toBe("safe");
      expect(result?.first_response_at).toBe("2024-01-01T12:09:00.000Z");
    });

    it("returns recovering for VIP lead that responded after breach", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        priority: "vip",
        createdAt: new Date("2024-01-01T12:00:00Z"), // 10 min ago
      });
      mockGetEarliestSentAtForLead.mockResolvedValue(new Date("2024-01-01T12:07:00Z")); // 7 min after creation, past 5m breach
      const result = await slaService.getLeadSlaStatus(LEAD_ID, TENANT_ID);
      expect(result?.status).toBe("recovering");
      expect(result?.minutes_over).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getQueueSlaSummary", () => {
    it("returns summary with zero counts when no leads", async () => {
      mockFindLeadsByTenant.mockResolvedValue([]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(new Map());
      const result = await slaService.getQueueSlaSummary(TENANT_ID);
      expect(result).toEqual({
        count_safe: 0,
        count_warning: 0,
        count_breach_risk: 0,
        count_breached: 0,
        count_recovering: 0,
        count_n_a: 0,
        total_tracked: 0,
        sla_safe_percent: null,
      });
    });

    it("returns correct counts for mixed lead statuses", async () => {
      const vipSafe = {
        id: "a",
        tenantId: TENANT_ID,
        priority: "vip" as const,
        createdAt: new Date("2024-01-01T12:08:00Z"),
      };
      const highBreached = {
        id: "b",
        tenantId: TENANT_ID,
        priority: "high" as const,
        createdAt: new Date("2024-01-01T12:00:00Z"),
      };
      const low = {
        id: "c",
        tenantId: TENANT_ID,
        priority: "low" as const,
        createdAt: new Date("2024-01-01T12:00:00Z"),
      };
      mockFindLeadsByTenant.mockResolvedValue([vipSafe, highBreached, low]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(
        new Map([["a", new Date("2024-01-01T12:09:00Z")]])
      );
      const result = await slaService.getQueueSlaSummary(TENANT_ID);
      expect(result.count_safe).toBe(1);
      expect(result.count_breached).toBe(1);
      expect(result.count_n_a).toBe(1);
      expect(result.total_tracked).toBe(2);
    });
  });
});
