/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/styles/theme";
import { QueueFilterBar } from "./QueueFilterBar";

vi.mock("@mui/material", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@mui/material")>();
  return { ...mod, useMediaQuery: () => false };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe("QueueFilterBar", () => {
  afterEach(() => cleanup());

  it("renders filter chips and sort selector", () => {
    const onFiltersChange = vi.fn();
    const onSortChange = vi.fn();
    render(
      <TestWrapper>
        <QueueFilterBar
          filters={{}}
          sort="priority_desc"
          onFiltersChange={onFiltersChange}
          onSortChange={onSortChange}
        />
      </TestWrapper>
    );
    // Desktop: chips visible; Mobile: "Filters" button to open drawer
    const hasChips = screen.queryByRole("button", { name: /all/i }) !== null;
    const hasFiltersButton = screen.queryByRole("button", { name: /open filter/i }) !== null;
    expect(hasChips || hasFiltersButton).toBe(true);
    // Sort is in toolbar (desktop) or drawer (mobile)
    const sortCombobox = screen.queryByRole("combobox", { name: /sort/i });
    expect(sortCombobox !== null || hasFiltersButton).toBe(true);
  });

  it("applies filters via callbacks when chip clicked", () => {
    const onFiltersChange = vi.fn();
    render(
      <TestWrapper>
        <QueueFilterBar filters={{}} sort="priority_desc" onFiltersChange={onFiltersChange} onSortChange={() => {}} />
      </TestWrapper>
    );
    const vipChip = screen.getByRole("button", { name: /filter by vip priority/i });
    fireEvent.click(vipChip);
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ priority: "vip" }));
  });

  it("applies sort via callback when sort selector changes", () => {
    const onSortChange = vi.fn();
    render(
      <TestWrapper>
        <QueueFilterBar filters={{}} sort="priority_desc" onFiltersChange={() => {}} onSortChange={onSortChange} />
      </TestWrapper>
    );
    const sortSelect = screen.getByRole("combobox", { name: /sort/i });
    fireEvent.mouseDown(sortSelect);
    const options = screen.getAllByRole("option");
    if (options.length > 1) {
      fireEvent.click(options[1]);
      expect(onSortChange).toHaveBeenCalled();
    }
  });

  it("shows reset control when filters active", () => {
    render(
      <TestWrapper>
        <QueueFilterBar
          filters={{ priority: "vip" }}
          sort="priority_desc"
          onFiltersChange={() => {}}
          onSortChange={() => {}}
        />
      </TestWrapper>
    );
    const resetBtn = screen.getByRole("button", { name: /reset filters/i });
    expect(resetBtn).toBeInTheDocument();
  });

  it("has keyboard-operable chips", () => {
    render(
      <TestWrapper>
        <QueueFilterBar filters={{}} sort="priority_desc" onFiltersChange={() => {}} onSortChange={() => {}} />
      </TestWrapper>
    );
    const chip = screen.getByRole("button", { name: /filter by all priorities/i });
    chip.focus();
    expect(document.activeElement).toBe(chip);
  });
});
