/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/styles/theme";
import { AtRiskPulseBanner } from "./AtRiskPulseBanner";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe("AtRiskPulseBanner", () => {
  afterEach(() => cleanup());

  it("renders pulse reason, elapsed time and urgency text cues", () => {
    render(
      <TestWrapper>
        <AtRiskPulseBanner
          state="escalated"
          reason="No response in 30 minutes"
          detectedAt={new Date(Date.now() - 30 * 60 * 1000).toISOString()}
          primaryAction={{ label: "Open recovery", onClick: () => {} }}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No response in 30 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalated/i)).toBeInTheDocument();
    expect(screen.getByText(/Elapsed:/i)).toBeInTheDocument();
  });

  it("supports sticky variant and keyboard-operable CTAs", () => {
    const onRecover = vi.fn();
    const onLost = vi.fn();

    render(
      <TestWrapper>
        <AtRiskPulseBanner
          variant="sticky"
          state="monitoring"
          reason="Awaiting first reply"
          detectedAt={new Date().toISOString()}
          primaryAction={{ label: "Mark recovered", onClick: onRecover }}
          secondaryActions={[{ label: "Mark lost", onClick: onLost }]}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: /Mark recovered/i }));
    expect(onRecover).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("button", { name: /Mark lost/i }), { key: "Enter" });
    expect(onLost).toHaveBeenCalledTimes(1);
  });

  it("announces status changes through live region and non-color labels", () => {
    const { rerender } = render(
      <TestWrapper>
        <AtRiskPulseBanner
          state="monitoring"
          reason="Recent inactivity"
          detectedAt={new Date().toISOString()}
          primaryAction={{ label: "Open recovery", onClick: () => {} }}
        />
      </TestWrapper>
    );

    expect(screen.getByRole("status")).toHaveTextContent(/Monitoring/i);

    rerender(
      <TestWrapper>
        <AtRiskPulseBanner
          state="resolved"
          reason="Lead replied"
          detectedAt={new Date().toISOString()}
          primaryAction={{ label: "View timeline", onClick: () => {} }}
        />
      </TestWrapper>
    );

    expect(screen.getByRole("status")).toHaveTextContent(/Resolved/i);
  });
});
