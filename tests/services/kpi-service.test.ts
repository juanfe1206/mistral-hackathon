import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as kpiService from "@/server/services/kpi-service";

const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockCountLeadsByLifecycleState = vi.fn();
const mockFindVipHighLeadsByTenant = vi.fn();
const mockGetQueueSlaSummary = vi.fn();
const mockGetEarliestSentAtByLeadIds = vi.fn();

vi.mock("@/server/repositories/lead-repository", () => ({
  countLeadsByLifecycleState: (...args: unknown[]) =>
    mockCountLeadsByLifecycleState(...args),
  findVipHighLeadsByTenant: (...args: unknown[]) =>
    mockFindVipHighLeadsByTenant(...args),
}));

vi.mock("@/server/services/sla-service", () => ({
  getQueueSlaSummary: (...args: unknown[]) => mockGetQueueSlaSummary(...args),
}));

vi.mock("@/server/repositories/reply-draft-repository", () => ({
  getEarliestSentAtByLeadIds: (...args: unknown[]) =>
    mockGetEarliestSentAtByLeadIds(...args),
}));

describe("kpi-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:10:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getKpiSummary", () => {
    it("returns recovery count from lead-repository", async () => {
      mockCountLeadsByLifecycleState.mockResolvedValue(7);
      mockGetQueueSlaSummary.mockResolvedValue({
        sla_safe_percent: 80,
      });
      mockFindVipHighLeadsByTenant.mockResolvedValue([]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(new Map());

      const result = await kpiService.getKpiSummary(TENANT_ID);
      expect(result.recovery_count).toBe(7);
      expect(mockCountLeadsByLifecycleState).toHaveBeenCalledWith(
        TENANT_ID,
        "recovered"
      );
    });

    it("returns SLA compliance from sla-service", async () => {
      mockCountLeadsByLifecycleState.mockResolvedValue(0);
      mockGetQueueSlaSummary.mockResolvedValue({
        sla_safe_percent: 67,
      });
      mockFindVipHighLeadsByTenant.mockResolvedValue([]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(new Map());

      const result = await kpiService.getKpiSummary(TENANT_ID);
      expect(result.sla_compliance_percent).toBe(67);
      expect(mockGetQueueSlaSummary).toHaveBeenCalledWith(TENANT_ID);
    });

    it("returns queue aging: oldest minutes and count over 30m", async () => {
      mockCountLeadsByLifecycleState.mockResolvedValue(0);
      mockGetQueueSlaSummary.mockResolvedValue({ sla_safe_percent: 100 });
      const lead1 = {
        id: "a",
        createdAt: new Date("2024-01-01T12:00:00Z"),
      };
      const lead2 = {
        id: "b",
        createdAt: new Date("2024-01-01T11:30:00Z"),
      };
      mockFindVipHighLeadsByTenant.mockResolvedValue([lead1, lead2]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(new Map());

      const result = await kpiService.getKpiSummary(TENANT_ID);
      expect(result.queue_aging_minutes).toBe(40);
      expect(result.queue_aging_count).toBe(1);
    });

    it("returns null queue_aging_minutes when no VIP/high leads waiting", async () => {
      mockCountLeadsByLifecycleState.mockResolvedValue(0);
      mockGetQueueSlaSummary.mockResolvedValue({ sla_safe_percent: null });
      mockFindVipHighLeadsByTenant.mockResolvedValue([]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(new Map());

      const result = await kpiService.getKpiSummary(TENANT_ID);
      expect(result.queue_aging_minutes).toBeNull();
      expect(result.queue_aging_count).toBe(0);
    });

    it("excludes leads with first response from queue aging", async () => {
      mockCountLeadsByLifecycleState.mockResolvedValue(0);
      mockGetQueueSlaSummary.mockResolvedValue({ sla_safe_percent: 100 });
      const lead1 = {
        id: "a",
        createdAt: new Date("2024-01-01T12:00:00Z"),
      };
      const lead2 = {
        id: "b",
        createdAt: new Date("2024-01-01T11:30:00Z"),
      };
      mockFindVipHighLeadsByTenant.mockResolvedValue([lead1, lead2]);
      mockGetEarliestSentAtByLeadIds.mockResolvedValue(
        new Map([["a", new Date("2024-01-01T12:05:00Z")]])
      );

      const result = await kpiService.getKpiSummary(TENANT_ID);
      expect(result.queue_aging_minutes).toBe(40);
      expect(result.queue_aging_count).toBe(1);
    });
  });
});
