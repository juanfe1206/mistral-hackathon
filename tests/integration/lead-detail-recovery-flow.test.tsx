/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LeadDetailPage from "@/app/(dashboard)/lead/[id]/page";

const LEAD_ID = "11111111-1111-1111-8111-111111111111";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: LEAD_ID }),
}));

function jsonResponse(data: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  } as Response);
}

function setupFetchMock({
  priority,
  riskPulses,
}: {
  priority: "vip" | "high" | "low";
  riskPulses: Array<{ id: string; reason: string; detected_at: string; status: string }>;
}) {
  const leadPayload = {
    data: {
      id: LEAD_ID,
      source_channel: "whatsapp",
      source_external_id: "15551234567",
      source_metadata: {},
      priority,
      lifecycle_state: "at_risk",
      reason_tags: ["at_risk"],
      override_history: [],
      risk_pulses: riskPulses,
      created_at: "2026-03-01T10:00:00.000Z",
      sla_status: null,
    },
  };

  return vi.spyOn(global, "fetch").mockImplementation((input: URL | RequestInfo, init?: RequestInit) => {
    const url = String(input);
    if (url.includes(`/api/leads/${LEAD_ID}/timeline`)) {
      return jsonResponse({ data: [] });
    }
    if (url.endsWith(`/api/leads/${LEAD_ID}`)) {
      return jsonResponse(leadPayload);
    }
    if (url.endsWith("/api/replies/generate")) {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return jsonResponse({ data: { draft: `Draft with ${body.tone ?? "warm"} tone` } });
    }
    if (url.endsWith(`/api/leads/${LEAD_ID}/approve-reply`)) {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return jsonResponse({
        data: {
          status: body.action === "approve" ? "approved" : "sent",
          draft_id: "draft-1",
        },
      });
    }
    if (url.endsWith(`/api/leads/${LEAD_ID}/mark-lifecycle`)) {
      return jsonResponse({
        data: {
          ...leadPayload.data,
          lifecycle_state: "recovered",
        },
      });
    }
    return jsonResponse({ data: {} });
  });
}

describe("lead-detail recovery flow integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps recovery actions available with at-risk lifecycle even when active pulse is missing", async () => {
    const fetchMock = setupFetchMock({ priority: "high", riskPulses: [] });

    render(<LeadDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Generate draft/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Mark recovered/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark lost/i })).toBeInTheDocument();
    expect(screen.getByText(/At-risk lead requires recovery outreach/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate draft/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/replies/generate",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"tone\":\"warm\""),
        })
      );
    });

    expect(screen.getByRole("button", { name: /Send reply/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Approve draft/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Send reply/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Send reply/i }));
    await waitFor(() => {
      expect(screen.getByText(/Current status: Sent/i)).toBeInTheDocument();
    });
  });

  it("allows direct send for low-priority branch through lead page wiring", async () => {
    setupFetchMock({
      priority: "low",
      riskPulses: [
        {
          id: "pulse-1",
          reason: "No response in 72h",
          detected_at: "2026-03-01T09:00:00.000Z",
          status: "escalated",
        },
      ],
    });

    render(<LeadDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Generate draft/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /Approve draft/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate draft/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Send reply/i })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reply/i }));

    await waitFor(() => {
      expect(screen.getByText(/Current status: Sent/i)).toBeInTheDocument();
    });
  });
});
