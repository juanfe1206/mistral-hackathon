/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/(dashboard)/settings/page";

function jsonResponse(data: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
  } as Response);
}

describe("SettingsPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("enforces 44px touch target on error retry action", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      jsonResponse({ error: { message: "Could not load settings" } })
    );

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Could not load settings");
    });

    const retryButton = screen.getByRole("button", { name: "Retry" });
    expect(retryButton).toHaveStyle({ minHeight: "44px" });
  });
});
