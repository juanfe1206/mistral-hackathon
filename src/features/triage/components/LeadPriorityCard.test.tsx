/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/styles/theme";
import { LeadPriorityCard } from "./LeadPriorityCard";
import type { SlaStatusData } from "@/components/SLASafetyIndicator";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// React 18 Strict Mode double-mounts; use getAllBy* and assert on first when multiple expected

const mockLead = {
  id: "lead-1",
  source_external_id: "wa:123",
  source_channel: "whatsapp",
  priority: "vip" as const,
  lifecycle_state: "default" as const,
  reason_tags: ["new_lead", "high_intent"],
  sla_status: {
    status: "safe" as const,
    minutes_to_breach: 30,
    minutes_over: null,
    first_response_at: null,
  } as SlaStatusData | null,
  created_at: "2025-01-15T10:00:00Z",
};

describe("LeadPriorityCard", () => {
  afterEach(() => cleanup());

  it("renders with lead data and default variant", () => {
    render(
      <TestWrapper>
        <LeadPriorityCard lead={mockLead} />
      </TestWrapper>
    );
    expect(screen.getByText(/wa:123/)).toBeInTheDocument();
    expect(screen.getByText(/whatsapp/)).toBeInTheDocument();
    expect(screen.getByText(/vip/)).toBeInTheDocument();
  });

  it("shows max 2 primary reason tags before overflow", () => {
    const leadWithManyTags = { ...mockLead, reason_tags: ["tag1", "tag2", "tag3", "tag4"] };
    render(
      <TestWrapper>
        <LeadPriorityCard lead={leadWithManyTags} />
      </TestWrapper>
    );
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText(/\+2/)).toBeInTheDocument();
  });

  it("has landmark role and aria-labels on actions", () => {
    render(
      <TestWrapper>
        <LeadPriorityCard lead={mockLead} />
      </TestWrapper>
    );
    const articles = screen.getAllByRole("article");
    expect(articles[0]).toHaveAttribute("aria-label", expect.stringMatching(/lead.*wa:123/i));
    const viewLinks = screen.getAllByRole("link", { name: /view lead wa:123/i });
    expect(viewLinks[0]).toBeInTheDocument();
  });

  it("shows SLA hint when sla_status provided", () => {
    render(
      <TestWrapper>
        <LeadPriorityCard lead={mockLead} />
      </TestWrapper>
    );
    const hints = screen.getAllByText(/30m to breach/);
    expect(hints[0]).toBeInTheDocument();
  });

  it("renders compact variant on mobile", () => {
    render(
      <TestWrapper>
        <LeadPriorityCard lead={mockLead} variant="compact" />
      </TestWrapper>
    );
    const ids = screen.getAllByText(/wa:123/);
    expect(ids[0]).toBeInTheDocument();
  });
});
