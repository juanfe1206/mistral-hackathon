/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/styles/theme";
import {
  DecisionTimeline,
  type DecisionTimelineItem,
} from "./DecisionTimeline";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const BASE_ITEMS: DecisionTimelineItem[] = [
  {
    id: "1",
    event_type: "priority.overridden",
    event_label: "Priority Overridden",
    occurred_at: "2026-03-01T10:00:00.000Z",
    actor: "agent-1",
    rationale: "VIP customer escalation",
    transition: "Priority: high -> vip",
    flagged: true,
    source: "audit",
  },
  {
    id: "2",
    event_type: "action.sent",
    event_label: "Action Sent",
    occurred_at: "2026-03-01T11:00:00.000Z",
    actor: null,
    rationale: null,
    transition: null,
    source: "audit",
  },
];

describe("DecisionTimeline", () => {
  afterEach(() => cleanup());

  it("renders semantic list output with compact variant and non-color status cue", () => {
    render(
      <TestWrapper>
        <DecisionTimeline items={BASE_ITEMS} />
      </TestWrapper>
    );

    expect(screen.getByRole("heading", { name: /Decision timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText(/Flagged event/i)).toBeInTheDocument();
  });

  it("supports per-entry expand/collapse with aria-expanded and placeholder fallbacks", () => {
    render(
      <TestWrapper>
        <DecisionTimeline items={BASE_ITEMS} />
      </TestWrapper>
    );

    const expandButton = screen.getAllByRole("button", { name: /Expand details/i })[1];
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expandButton);
    expect(expandButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Unknown actor/i)).toBeInTheDocument();
    expect(screen.getByText(/No rationale recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/State transition unavailable/i)).toBeInTheDocument();
  });

  it("filters events by event type and toggles audit variant", () => {
    render(
      <TestWrapper>
        <DecisionTimeline items={BASE_ITEMS} />
      </TestWrapper>
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Event type/i }));
    fireEvent.click(screen.getByRole("option", { name: /Action Sent/i }));
    const list = screen.getByRole("list");
    expect(within(list).queryByText(/Priority Overridden/i)).not.toBeInTheDocument();
    expect(within(list).getByText(/Action Sent/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Audit timeline/i }));
    expect(screen.getByText(/Actor:/i)).toBeInTheDocument();
    expect(screen.getByText(/Transition:/i)).toBeInTheDocument();
    expect(screen.getByText(/Rationale:/i)).toBeInTheDocument();
  });
});
