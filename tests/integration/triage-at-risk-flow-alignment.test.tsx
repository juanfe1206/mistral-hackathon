/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import TriagePage from "@/app/(dashboard)/triage/page";
import AtRiskPage from "@/app/(dashboard)/at-risk/page";
import LeadDetailPage from "@/app/(dashboard)/lead/[id]/page";

const { pushMock, getSearchParamsMock, setSearchParamsMock, getParamsMock, setParamsMock } = vi.hoisted(() => {
  let searchParamsValue = "";
  let searchParams = new URLSearchParams(searchParamsValue);
  let paramsValue = { id: "lead-1" };
  return ({
    pushMock: vi.fn(),
    getSearchParamsMock: () => searchParams,
    setSearchParamsMock: (value: string) => {
      searchParamsValue = value;
      searchParams = new URLSearchParams(searchParamsValue);
    },
    getParamsMock: () => paramsValue,
    setParamsMock: (id: string) => {
      paramsValue = { id };
    },
  });
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => getSearchParamsMock(),
  useParams: () => getParamsMock(),
}));

function jsonResponse(data: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  } as Response);
}

describe("triage and at-risk flow alignment", () => {
  beforeEach(() => {
    pushMock.mockReset();
    setSearchParamsMock("");
    setParamsMock("lead-1");
    vi.spyOn(global, "fetch").mockImplementation((input: URL | RequestInfo) => {
      const url = String(input);

      if (url.endsWith("/api/leads")) {
        return jsonResponse({
          data: [
            {
              id: "lead-1",
              source_channel: "whatsapp",
              source_external_id: "15550000001",
              priority: "vip",
              lifecycle_state: "at_risk",
              reason_tags: ["vip"],
              created_at: "2026-03-01T09:00:00.000Z",
              sla_status: {
                status: "warning",
                minutes_to_breach: 2,
                minutes_over: null,
                measured_at: "2026-03-01T09:01:00.000Z",
              },
            },
            {
              id: "lead-2",
              source_channel: "whatsapp",
              source_external_id: "15550000002",
              priority: "high",
              lifecycle_state: "default",
              reason_tags: ["urgent"],
              created_at: "2026-03-01T09:10:00.000Z",
              sla_status: null,
            },
            {
              id: "lead-3",
              source_channel: "whatsapp",
              source_external_id: "15550000003",
              priority: "low",
              lifecycle_state: "default",
              reason_tags: [],
              created_at: "2026-03-01T09:20:00.000Z",
              sla_status: null,
            },
          ],
        });
      }

      if (url.endsWith("/api/ingestion-failures?limit=10")) {
        return jsonResponse({ data: [] });
      }

      if (url.endsWith("/api/sla")) {
        return jsonResponse({
          data: {
            queue_summary: {
              count_breached: 0,
              count_breach_risk: 1,
              count_warning: 1,
              sla_safe_percent: 92,
              total_tracked: 3,
              measured_at: "2026-03-01T09:01:00.000Z",
            },
          },
        });
      }

      if (url.endsWith("/api/risk-pulses")) {
        return jsonResponse({
          data: [
            {
              id: "pulse-1",
              lead_id: "lead-risk-1",
              reason: "No response in 48h",
              detected_at: "2026-03-01T08:00:00.000Z",
              status: "active",
              lead: {
                id: "lead-risk-1",
                source_channel: "whatsapp",
                source_external_id: "15559990001",
                source_metadata: { contact_name: "Lia" },
                priority: "high",
                lifecycle_state: "at_risk",
              },
            },
          ],
        });
      }

      if (url.endsWith("/api/leads/lead-1")) {
        return jsonResponse({
          data: {
            id: "lead-1",
            source_channel: "whatsapp",
            source_external_id: "15550000001",
            source_metadata: {},
            priority: "vip",
            lifecycle_state: "at_risk",
            reason_tags: ["vip"],
            override_history: [],
            risk_pulses: [],
            created_at: "2026-03-01T09:00:00.000Z",
            sla_status: null,
          },
        });
      }

      if (url.endsWith("/api/leads/lead-1/timeline")) {
        return jsonResponse({ data: [] });
      }

      return jsonResponse({ data: {} });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows top urgent hierarchy and preserves triage context in lead links", async () => {
    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Triage Queue/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Top urgent/i)).toBeInTheDocument();

    const leadLink = screen.getByRole("link", { name: /View lead 15550000001/i });
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("/lead/lead-1?"));
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("from=triage"));
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("sort=priority_desc"));
  });

  it("restores triage filters and sort from URL params", async () => {
    setSearchParamsMock("sort=created_desc&priority=vip&lifecycle=at_risk&source=whatsapp");
    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Triage Queue/i })).toBeInTheDocument();
    });

    const vipChip = screen.getByRole("button", { name: /Filter by VIP priority/i });
    const atRiskChip = screen.getByRole("button", { name: /Filter by lifecycle: At Risk/i });
    const sourceChip = screen.getByRole("button", { name: /Filter by source: WhatsApp/i });
    expect(vipChip).toHaveAttribute("aria-pressed", "true");
    expect(atRiskChip).toHaveAttribute("aria-pressed", "true");
    expect(sourceChip).toHaveAttribute("aria-pressed", "true");

    const leadLink = screen.getByRole("link", { name: /View lead 15550000001/i });
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("sort=created_desc"));
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("priority=vip"));
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("lifecycle=at_risk"));
    expect(leadLink).toHaveAttribute("href", expect.stringContaining("source=whatsapp"));
  });

  it("preserves filter and sort context across triage -> lead detail -> triage round trip", async () => {
    setSearchParamsMock("sort=created_desc&priority=vip&lifecycle=at_risk&source=whatsapp");
    const triageView = render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Triage Queue/i })).toBeInTheDocument();
    });

    const leadLink = screen.getByRole("link", { name: /View lead 15550000001/i });
    const leadHref = leadLink.getAttribute("href");
    expect(leadHref).toBeTruthy();
    if (!leadHref) {
      throw new Error("Expected triage lead link href to be present");
    }

    const [, leadQueryString = ""] = leadHref.split("?");
    triageView.unmount();

    setSearchParamsMock(leadQueryString);
    const leadView = render(<LeadDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("main", { name: /Lead detail/i })).toBeInTheDocument();
    });

    const backLink = screen.getByRole("link", { name: /Back to triage/i });
    const backHref = backLink.getAttribute("href");
    expect(backHref).toContain("/triage?");
    expect(backHref).toContain("sort=created_desc");
    expect(backHref).toContain("priority=vip");
    expect(backHref).toContain("lifecycle=at_risk");
    expect(backHref).toContain("source=whatsapp");

    const [, backQueryString = ""] = (backHref ?? "").split("?");
    leadView.unmount();

    setSearchParamsMock(backQueryString);
    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Triage Queue/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Filter by VIP priority/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /Filter by lifecycle: At Risk/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /Filter by source: WhatsApp/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    const restoredLeadLink = screen.getByRole("link", { name: /View lead 15550000001/i });
    expect(restoredLeadLink).toHaveAttribute("href", expect.stringContaining("sort=created_desc"));
  });

  it("routes at-risk CTA directly to lead recovery context", async () => {
    render(<AtRiskPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Open recovery/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Open recovery/i }));
    expect(pushMock).toHaveBeenCalledWith("/lead/lead-risk-1?from=at-risk");
  });
});
