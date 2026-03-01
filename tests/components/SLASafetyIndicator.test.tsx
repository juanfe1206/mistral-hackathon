/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LeadSlaIndicator, QueueSlaIndicator, type SlaStatusData, type QueueSlaSummary } from "@/components/SLASafetyIndicator";

describe("SLASafetyIndicator", () => {
  afterEach(() => cleanup());

  describe("LeadSlaIndicator", () => {
    it("shows SLA unavailable with Retry when unavailable=true (AC2 fallback)", () => {
      render(<LeadSlaIndicator slaStatus={null} unavailable onRetry={() => {}} />);
      expect(screen.getByRole("status", { name: /SLA status temporarily unavailable/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry loading SLA/ })).toBeInTheDocument();
    });

    it("shows SLA unavailable without Retry when onRetry not provided", () => {
      render(<LeadSlaIndicator slaStatus={null} unavailable />);
      expect(screen.getByRole("status", { name: /SLA status temporarily unavailable/ })).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows status when slaStatus provided", () => {
      const sla: SlaStatusData = {
        status: "breach-risk",
        minutes_to_breach: 1,
        minutes_over: null,
        first_response_at: null,
        response_minutes: null,
      };
      render(<LeadSlaIndicator slaStatus={sla} />);
      expect(screen.getByRole("status", { name: /SLA at breach risk.*1m to breach/ })).toBeInTheDocument();
    });

    it("shows response duration when lead responded in time", () => {
      const sla: SlaStatusData = {
        status: "safe",
        minutes_to_breach: null,
        minutes_over: null,
        first_response_at: "2024-01-01T12:09:00.000Z",
        response_minutes: 1,
      };
      render(<LeadSlaIndicator slaStatus={sla} />);
      expect(screen.getByRole("status", { name: /SLA safe.*Responded in 1m/ })).toBeInTheDocument();
    });
  });

  describe("QueueSlaIndicator", () => {
    it("shows SLA temporarily unavailable with Retry when unavailable=true (AC2 fallback)", () => {
      const onRetry = vi.fn();
      render(<QueueSlaIndicator summary={null} unavailable onRetry={onRetry} />);
      expect(screen.getByRole("alert")).toHaveTextContent("SLA temporarily unavailable");
      const retryBtn = screen.getByRole("button", { name: /Retry loading SLA/ });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("shows queue summary when summary provided", () => {
      const summary: QueueSlaSummary = {
        count_safe: 9,
        count_warning: 0,
        count_breach_risk: 0,
        count_breached: 0,
        count_recovering: 1,
        count_n_a: 5,
        total_tracked: 10,
        sla_safe_percent: 90,
      };
      render(<QueueSlaIndicator summary={summary} />);
      expect(screen.getByRole("status", { name: "SLA Safe 90%" })).toBeInTheDocument();
    });

    it("shows at-risk count when leads at risk", () => {
      const summary: QueueSlaSummary = {
        count_safe: 5,
        count_warning: 2,
        count_breach_risk: 1,
        count_breached: 0,
        count_recovering: 0,
        count_n_a: 2,
        total_tracked: 8,
        sla_safe_percent: 63,
      };
      render(<QueueSlaIndicator summary={summary} />);
      expect(screen.getByRole("status", { name: "3 leads at SLA risk" })).toBeInTheDocument();
    });
  });
});
