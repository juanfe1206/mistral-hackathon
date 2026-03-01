/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { useState } from "react";
import theme from "@/styles/theme";
import {
  ConciergeReplyComposer,
  type ComposerStatus,
  type ComposerTone,
} from "@/features/reply-composer/components/ConciergeReplyComposer";

function RecoveryHarness({ needsApproval }: { needsApproval: boolean }) {
  const [draft, setDraft] = useState("");
  const [approved, setApproved] = useState(false);
  const [sent, setSent] = useState(false);
  const [tone, setTone] = useState<ComposerTone>("warm");

  const status: ComposerStatus = sent
    ? "sent"
    : draft.trim().length === 0
      ? "drafting"
      : needsApproval && !approved
        ? "pending-approval"
        : "generated";

  return (
    <ThemeProvider theme={theme}>
      <ConciergeReplyComposer
        mode="quick"
        tone={tone}
        confidence={0.88}
        status={status}
        draft={draft}
        needsApproval={needsApproval}
        approved={approved}
        onToneChange={setTone}
        onDraftChange={(value) => {
          setDraft(value);
          setSent(false);
        }}
        onGenerate={() => {
          setDraft("Generated recovery draft");
          setApproved(false);
          setSent(false);
        }}
        onApprove={() => setApproved(true)}
        onSend={() => {
          if (needsApproval && !approved) return;
          setSent(true);
          setDraft("");
          setApproved(false);
        }}
      />
    </ThemeProvider>
  );
}

describe("lead-detail recovery flow integration", () => {
  afterEach(() => cleanup());

  it("requires approve before send for VIP/high branch", () => {
    render(<RecoveryHarness needsApproval />);

    fireEvent.click(screen.getByRole("button", { name: /Generate draft/i }));
    const sendBtn = screen.getByRole("button", { name: /Send reply/i });
    expect(sendBtn).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Approve draft/i }));
    expect(screen.getByRole("button", { name: /Send reply/i })).toBeEnabled();
  });

  it("allows direct send for low-priority branch", () => {
    render(<RecoveryHarness needsApproval={false} />);

    fireEvent.click(screen.getByRole("button", { name: /Generate draft/i }));
    fireEvent.click(screen.getByRole("button", { name: /Send reply/i }));

    expect(screen.getByText(/Current status: Sent/i)).toBeInTheDocument();
  });
});
