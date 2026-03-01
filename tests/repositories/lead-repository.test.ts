import { describe, it, expect, vi, beforeEach } from "vitest";
import * as leadRepository from "@/server/repositories/lead-repository";

const mockFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: vi.fn(),
    },
    tenant: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

describe("lead-repository ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  it("findLeadsByTenant uses orderBy priority asc then createdAt desc (vip > high > low)", async () => {
    await leadRepository.findLeadsByTenant("tenant-id", { limit: 50 });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-id" },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 50,
      })
    );
  });

  it("findLeadsByTenant uses default limit when not provided", async () => {
    await leadRepository.findLeadsByTenant("tenant-id");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });
});
