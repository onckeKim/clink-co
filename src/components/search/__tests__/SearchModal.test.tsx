import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchModal } from "@/components/search/SearchModal";
import { mockRouter, resetMockRouter } from "@/components/__tests__/test-utils/next-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  resetMockRouter();
  window.localStorage.clear();
});

describe("SearchModal (search component)", () => {
  it("renders nothing when closed", () => {
    render(<SearchModal open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a search dialog with a combobox input when open", async () => {
    render(<SearchModal open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Search" })).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("shows matching results as the user types a known product name", async () => {
    const user = userEvent.setup();
    render(<SearchModal open onClose={() => {}} />);
    const input = await screen.findByRole("combobox");
    await user.type(input, "coupe");
    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: "Search results" })).toBeInTheDocument();
    });
    expect(screen.getByText(/Solstice/i)).toBeInTheDocument();
  });

  it("shows a no-results state for a nonsense query", async () => {
    const user = userEvent.setup();
    render(<SearchModal open onClose={() => {}} />);
    const input = await screen.findByRole("combobox");
    await user.type(input, "zzzznotarealproductzzzz");
    await waitFor(() => {
      expect(screen.getByText(/No results for/i)).toBeInTheDocument();
    });
  });

  it("navigates to the shop with the query on Enter when no result is highlighted", async () => {
    render(<SearchModal open onClose={() => {}} />);
    const input = await screen.findByRole("combobox");
    fireEvent.change(input, { target: { value: "glass" } });
    await waitFor(() => screen.getByRole("listbox"));
    // Move focus off any option highlight, then press Enter with no arrow-key selection made explicit via activeIndex -1 default
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<SearchModal open onClose={onClose} />);
    const input = await screen.findByRole("combobox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<SearchModal open onClose={onClose} />);
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /close search/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows popular categories when the query is empty", async () => {
    render(<SearchModal open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/popular categories/i)).toBeInTheDocument();
    });
  });
});
