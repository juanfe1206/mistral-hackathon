"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

export type ComposerMode = "quick" | "full";
export type ComposerTone = "warm" | "neutral" | "direct";
export type ComposerStatus =
  | "drafting"
  | "generated"
  | "edited"
  | "pending-approval"
  | "sent"
  | "failed";

interface ConciergeReplyComposerProps {
  mode: ComposerMode;
  tone: ComposerTone;
  confidence: number | null;
  status: ComposerStatus;
  draft: string;
  needsApproval: boolean;
  approved: boolean;
  generating?: boolean;
  sending?: boolean;
  errorMessage?: string | null;
  onDraftChange: (value: string) => void;
  onGenerate: () => void;
  onApprove: () => void;
  onSend: () => void;
  onToneChange: (tone: ComposerTone) => void;
}

const STATUS_META: Record<ComposerStatus, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  drafting: { label: "Drafting", color: "default" },
  generated: { label: "Generated", color: "success" },
  edited: { label: "Edited", color: "default" },
  "pending-approval": { label: "Pending approval", color: "warning" },
  sent: { label: "Sent", color: "success" },
  failed: { label: "Failed", color: "error" },
};

function formatConfidence(confidence: number | null): string {
  if (confidence == null) return "Confidence unavailable";
  const value = Math.max(0, Math.min(1, confidence));
  return `${Math.round(value * 100)}% confidence`;
}

export function ConciergeReplyComposer({
  mode,
  tone,
  confidence,
  status,
  draft,
  needsApproval,
  approved,
  generating = false,
  sending = false,
  errorMessage,
  onDraftChange,
  onGenerate,
  onApprove,
  onSend,
  onToneChange,
}: ConciergeReplyComposerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [modalOpen, setModalOpen] = useState(false);
  const statusMeta = STATUS_META[status];

  const sendDisabled = useMemo(
    () => sending || !draft.trim() || (needsApproval && !approved),
    [draft, needsApproval, approved, sending]
  );

  const content = (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Typography variant="h6" sx={{ fontSize: mode === "quick" ? "1rem" : "1.1rem" }}>
            Concierge Reply
          </Typography>
          <Chip label={STATUS_META[status].label} color={statusMeta.color} size="small" role="status" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: "auto" } }}>
            {formatConfidence(confidence)}
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="composer-tone-label">Tone</InputLabel>
            <Select
              labelId="composer-tone-label"
              label="Tone"
              value={tone}
              onChange={(event) => onToneChange(event.target.value as ComposerTone)}
              inputProps={{ "aria-label": "Tone" }}
            >
              <MenuItem value="warm">Warm</MenuItem>
              <MenuItem value="neutral">Neutral</MenuItem>
              <MenuItem value="direct">Direct</MenuItem>
            </Select>
          </FormControl>

          {needsApproval ? (
            <Typography variant="body2" color="warning.main" sx={{ display: "flex", alignItems: "center" }}>
              <span aria-hidden="true" style={{ marginRight: 6 }}>🔒</span>
              {approved ? "Approved for send" : "Approval required before send"}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center" }}>
              <span aria-hidden="true" style={{ marginRight: 6 }}>✓</span>
              Low-priority direct send enabled
            </Typography>
          )}
        </Stack>

        <TextField
          multiline
          minRows={mode === "quick" ? 3 : 6}
          fullWidth
          label="Reply draft"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !sendDisabled) {
              event.preventDefault();
              onSend();
            }
          }}
          sx={{ mt: 1.5 }}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
          <Button variant="outlined" onClick={onGenerate} disabled={generating} sx={{ minHeight: 44 }}>
            {generating ? "Generating..." : "Generate draft"}
          </Button>
          {status === "failed" ? (
            <Button variant="outlined" color="error" onClick={onGenerate} sx={{ minHeight: 44 }} aria-label="Retry generation">
              Retry generation
            </Button>
          ) : null}
          {needsApproval ? (
            <Button
              variant="outlined"
              onClick={onApprove}
              disabled={sending || !draft.trim()}
              sx={{ minHeight: 44 }}
              aria-label="Approve draft"
            >
              Approve draft
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={onSend}
            disabled={sendDisabled}
            sx={{ minHeight: 44 }}
            aria-label="Send reply"
          >
            {sending ? "Sending..." : "Send reply"}
          </Button>
        </Stack>

        <Box role="status" aria-live="polite" aria-atomic="true" sx={{ mt: 1 }}>
          <Typography variant="body2" color={errorMessage ? "error.main" : "text.secondary"}>
            {errorMessage ?? `Current status: ${STATUS_META[status].label}`}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (mode === "full" && isMobile) {
    return (
      <>
        <Button variant="outlined" onClick={() => setModalOpen(true)} sx={{ minHeight: 44 }}>
          Open full composer
        </Button>
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullScreen>
          <DialogTitle>Concierge Reply</DialogTitle>
          <DialogContent>{content}</DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return content;
}
