import { describe, it, expect, vi, beforeEach } from "vitest";
import * as riskService from "@/server/services/risk-service";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";
const TENANT_ID = "22222222-2222-2222-8222-222222222222";

const mockFindLeadById = vi.fn();
const mockGetActivePulsesForLead = vi.fn();
const mockFindLatestInteractionForLead = vi.fn();
const mockCreatePulse = vi.fn();
const mockUpdateLeadLifecycleState = vi.fn();
const mockUpdatePulseStatus = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  },
}));

vi.mock("@/server/repositories/lead-repository", () => ({
  findLeadById: (...args: unknown[]) => mockFindLeadById(...args),
  updateLeadLifecycleState: (...args: unknown[]) => mockUpdateLeadLifecycleState(...args),
}));

vi.mock("@/server/repositories/risk-repository", () => ({
  createPulse: (...args: unknown[]) => mockCreatePulse(...args),
  getActivePulsesForLead: (...args: unknown[]) => mockGetActivePulsesForLead(...args),
  updatePulseStatus: (...args: unknown[]) => mockUpdatePulseStatus(...args),
}));

vi.mock("@/server/repositories/interaction-repository", () => ({
  findLatestInteractionForLead: (...args: unknown[]) =>
    mockFindLatestInteractionForLead(...args),
}));

const mockCreateAuditEvent = vi.fn();
vi.mock("@/server/repositories/audit-repository", () => ({
  createAuditEvent: (...args: unknown[]) => mockCreateAuditEvent(...args),
}));

describe("risk-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    mockCreateAuditEvent.mockResolvedValue(undefined);
  });

  describe("detectAndFlagAtRisk", () => {
    it("returns flagged=false when no interactions", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "default",
      });
      mockFindLatestInteractionForLead.mockResolvedValue(null);

      const result = await riskService.detectAndFlagAtRisk(LEAD_ID, TENANT_ID);
      expect(result.flagged).toBe(false);
      expect(mockCreatePulse).not.toHaveBeenCalled();
    });

    it("returns flagged=false when last interaction within threshold", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "default",
      });
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      mockFindLatestInteractionForLead.mockResolvedValue({
        id: "i1",
        occurredAt: oneHourAgo,
      });

      const result = await riskService.detectAndFlagAtRisk(LEAD_ID, TENANT_ID, {
        inactivityHours: 24,
      });
      expect(result.flagged).toBe(false);
      expect(mockCreatePulse).not.toHaveBeenCalled();
    });

    it("creates pulse and updates lifecycle when past threshold", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "default",
      });
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      mockFindLatestInteractionForLead.mockResolvedValue({
        id: "i1",
        occurredAt: fiftyHoursAgo,
      });
      mockCreatePulse.mockResolvedValue({
        id: "pulse-1",
        leadId: LEAD_ID,
        tenantId: TENANT_ID,
        reason: "No contact for 50h (threshold: 24h)",
        status: "active",
      });
      mockGetActivePulsesForLead.mockResolvedValue([
        {
          id: "pulse-1",
          reason: "No contact for 50h (threshold: 24h)",
        },
      ]);

      const result = await riskService.detectAndFlagAtRisk(LEAD_ID, TENANT_ID, {
        inactivityHours: 24,
      });
      expect(result.flagged).toBe(true);
      expect(result.reason).toContain("No contact for");
      expect(mockCreatePulse).toHaveBeenCalled();
      expect(mockUpdateLeadLifecycleState).toHaveBeenCalledWith(
        LEAD_ID,
        TENANT_ID,
        "at_risk",
        expect.anything()
      );
    });

    it("returns existing pulse when lead already at-risk", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "at_risk",
      });
      mockGetActivePulsesForLead.mockResolvedValue([
        { id: "pulse-existing", reason: "No contact for 48h" },
      ]);

      const result = await riskService.detectAndFlagAtRisk(LEAD_ID, TENANT_ID);
      expect(result.flagged).toBe(true);
      expect(result.pulseId).toBe("pulse-existing");
      expect(mockCreatePulse).not.toHaveBeenCalled();
    });

    it("throws when lead not found", async () => {
      mockFindLeadById.mockResolvedValue(null);
      await expect(
        riskService.detectAndFlagAtRisk(LEAD_ID, TENANT_ID)
      ).rejects.toThrow("not found");
    });
  });

  describe("markLifecycle", () => {
    it("updates lead and pulses to recovered and creates audit event", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "at_risk",
        riskPulses: [{ id: "p1", status: "active" }],
      });
      mockGetActivePulsesForLead.mockResolvedValue([
        { id: "p1", status: "active" },
      ]);

      const result = await riskService.markLifecycle(
        LEAD_ID,
        TENANT_ID,
        "recovered"
      );
      expect(result.lifecycleState).toBe("recovered");
      expect(mockUpdateLeadLifecycleState).toHaveBeenCalledWith(
        LEAD_ID,
        TENANT_ID,
        "recovered",
        expect.anything()
      );
      expect(mockUpdatePulseStatus).toHaveBeenCalledWith(
        "p1",
        TENANT_ID,
        "recovered",
        expect.anything()
      );
      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          eventType: "lifecycle.marked",
          payload: expect.objectContaining({
            lead_id: LEAD_ID,
            lifecycle_state: "recovered",
            pulse_status: "recovered",
          }),
        }),
        expect.anything()
      );
    });

    it("throws when lead not at-risk", async () => {
      mockFindLeadById.mockResolvedValue({
        id: LEAD_ID,
        tenantId: TENANT_ID,
        lifecycleState: "default",
      });
      await expect(
        riskService.markLifecycle(LEAD_ID, TENANT_ID, "recovered")
      ).rejects.toThrow("not at-risk");
      expect(mockUpdateLeadLifecycleState).not.toHaveBeenCalled();
    });

    it("throws when lead not found", async () => {
      mockFindLeadById.mockResolvedValue(null);
      await expect(
        riskService.markLifecycle(LEAD_ID, TENANT_ID, "recovered")
      ).rejects.toThrow("not found");
    });
  });
});
