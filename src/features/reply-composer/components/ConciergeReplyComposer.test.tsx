/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/styles/theme";
import { ConciergeReplyComposer } from "./ConciergeReplyComposer";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe("ConciergeReplyComposer", () => {
  afterEach(() => cleanup());

  it("renders quick mode with tone selector and confidence marker", () => {
    render(
      <TestWrapper>
        <ConciergeReplyComposer
          mode="quick"
          tone="warm"
          confidence={0.87}
          status="generated"
          draft="We can help recover your appointment."
          needsApproval
          approved={false}
          onDraftChange={() => {}}
          onGenerate={() => {}}
          onApprove={() => {}}
          onSend={() => {}}
          onToneChange={() => {}}
        />
      </TestWrapper>
    );

    expect(screen.getByRole("textbox", { name: /Reply draft/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Tone/i })).toBeInTheDocument();
    expect(screen.getByText(/87% confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Approval required/i)).toBeInTheDocument();
  });

  it("enforces approval gate for VIP/high before send", () => {
    const onSend = vi.fn();
    const onApprove = vi.fn();
    render(
      <TestWrapper>
        <ConciergeReplyComposer
          mode="quick"
          tone="neutral"
          confidence={0.62}
          status="pending-approval"
          draft="Draft body"
          needsApproval
          approved={false}
          onDraftChange={() => {}}
          onGenerate={() => {}}
          onApprove={onApprove}
          onSend={onSend}
          onToneChange={() => {}}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: /Approve draft/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Send reply/i })).toBeDisabled();
  });

  it("allows low-priority direct send flow and supports keyboard shortcut", () => {
    const onSend = vi.fn();
    render(
      <TestWrapper>
        <ConciergeReplyComposer
          mode="quick"
          tone="warm"
          confidence={0.8}
          status="edited"
          draft="Updated draft"
          needsApproval={false}
          approved={false}
          onDraftChange={() => {}}
          onGenerate={() => {}}
          onApprove={() => {}}
          onSend={onSend}
          onToneChange={() => {}}
        />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: /Send reply/i })).toBeEnabled();
    fireEvent.keyDown(screen.getByRole("textbox", { name: /Reply draft/i }), {
      key: "Enter",
      ctrlKey: true,
    });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("shows failure state with retry action", () => {
    const onGenerate = vi.fn();
    render(
      <TestWrapper>
        <ConciergeReplyComposer
          mode="quick"
          tone="direct"
          confidence={0.4}
          status="failed"
          draft=""
          errorMessage="Draft generation failed"
          needsApproval={false}
          approved={false}
          onDraftChange={() => {}}
          onGenerate={onGenerate}
          onApprove={() => {}}
          onSend={() => {}}
          onToneChange={() => {}}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: /Retry generation/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});
