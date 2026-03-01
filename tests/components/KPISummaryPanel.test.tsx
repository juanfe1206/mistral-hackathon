/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  KPISummaryPanel,
  type KpiSummaryData,
} from "@/components/KPISummaryPanel";

describe("KPISummaryPanel", () => {
  afterEach(() => cleanup());

  it("shows loading state when loading=true", () => {
    render(<KPISummaryPanel summary={null} loading />);
    expect(screen.getByRole("status", { name: /Loading KPI metrics/ })).toBeInTheDocument();
  });

  it("shows fallback when unavailable with Retry (AC2)", () => {
    const onRetry = vi.fn();
    render(<KPISummaryPanel summary={null} unavailable onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "KPIs temporarily unavailable"
    );
    const retryBtn = screen.getByRole("button", { name: /Retry loading KPIs/ });
    expect(retryBtn).toHaveStyle({ minHeight: "44px" });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows no-data state when summary is null and not loading/unavailable", () => {
    render(<KPISummaryPanel summary={null} />);
    expect(screen.getByRole("status", { name: "No KPI data" })).toBeInTheDocument();
  });

  it("displays metrics with icon and text (NFR13)", () => {
    const summary: KpiSummaryData = {
      recovery_count: 5,
      sla_compliance_percent: 80,
      queue_aging_minutes: 12,
      queue_aging_count: 2,
    };
    render(<KPISummaryPanel summary={summary} />);
    expect(screen.getByRole("article", { name: /Recovery count: 5/ })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /SLA compliance: 80 percent/ })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Oldest VIP\/high lead waiting 12 minutes/ })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /2 VIP\/high leads waiting over 30 minutes/ })).toBeInTheDocument();
  });

  it("shows em-dash for no-data metrics", () => {
    const summary: KpiSummaryData = {
      recovery_count: 0,
      sla_compliance_percent: null,
      queue_aging_minutes: null,
      queue_aging_count: 0,
    };
    render(<KPISummaryPanel summary={summary} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
