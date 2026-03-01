import { describe, it, expect, vi, beforeEach } from "vitest";
import * as interactionRepository from "@/server/repositories/interaction-repository";

const mockFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    interaction: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: vi.fn(),
    },
    lead: { create: vi.fn(), findFirst: vi.fn() },
    tenant: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

describe("interaction-repository ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  it("findInteractionsByLeadId uses orderBy occurredAt asc (chronological)", async () => {
    await interactionRepository.findInteractionsByLeadId(
      "lead-id",
      "tenant-id",
      { limit: 20, offset: 0 }
    );

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { leadId: "lead-id", tenantId: "tenant-id" },
        orderBy: { occurredAt: "asc" },
        take: 20,
        skip: 0,
      })
    );
  });

  it("findInteractionsByLeadId uses default limit and offset when not provided", async () => {
    await interactionRepository.findInteractionsByLeadId("lead-id", "tenant-id");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
        skip: 0,
      })
    );
  });
});
