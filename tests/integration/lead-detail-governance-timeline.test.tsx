/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import LeadDetailPage from "@/app/(dashboard)/lead/[id]/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "11111111-1111-1111-8111-111111111111" }),
  useSearchParams: () => new URLSearchParams(),
}));

const leadResponse = {
  data: {
    id: "11111111-1111-1111-8111-111111111111",
    source_channel: "whatsapp",
    source_external_id: "15551234567",
    source_metadata: {
      contact_name: "Ana",
      message_id: "wamid.123",
      timestamp: "1700000000",
    },
    priority: "high",
    lifecycle_state: "default",
    reason_tags: ["vip", "urgent"],
    override_history: [],
    risk_pulses: [],
    created_at: "2026-03-01T10:00:00.000Z",
    sla_status: null,
  },
};

const timelineResponse = {
  data: [
    {
      id: "e-1",
      event_type: "priority.overridden",
      event_label: "Priority Overridden",
      occurred_at: "2026-03-01T10:05:00.000Z",
      actor: "agent-ops",
      rationale: "VIP walk-in in queue",
      transition: "Priority: high -> vip",
      source: "audit",
      flagged: true,
      payload: {},
    },
    {
      id: "e-2",
      event_type: "action.sent",
      event_label: "Action Sent",
      occurred_at: "2026-03-01T10:06:00.000Z",
      actor: "agent-ops",
      rationale: "Manual send approved",
      transition: "Draft: approved -> sent",
      source: "audit",
      flagged: false,
      payload: {},
    },
  ],
};

describe("lead detail governance timeline integration", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          x: 10,
          y: 10,
          width: 120,
          height: 36,
          top: 10,
          left: 10,
          right: 130,
          bottom: 46,
          toJSON: () => ({}),
        }) as DOMRect
    );

    vi.spyOn(global, "fetch").mockImplementation((input: URL | RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/leads/11111111-1111-1111-8111-111111111111/timeline")) {
        return Promise.resolve({
          ok: true,
          json: async () => timelineResponse,
        } as Response);
      }

      if (url.includes("/api/leads/11111111-1111-1111-8111-111111111111")) {
        return Promise.resolve({
          ok: true,
          json: async () => leadResponse,
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ data: {} }),
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders governance events and supports event-type filtering", async () => {
    render(<LeadDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Decision timeline/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Priority Overridden/i)).toBeInTheDocument();
    expect(screen.getByText(/Action Sent/i)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Event type/i }));
    fireEvent.click(screen.getByRole("option", { name: /Action Sent/i }));

    const list = screen.getByRole("list");
    expect(within(list).queryByText(/Priority Overridden/i)).not.toBeInTheDocument();
    expect(within(list).getByText(/Action Sent/i)).toBeInTheDocument();
  });
});
