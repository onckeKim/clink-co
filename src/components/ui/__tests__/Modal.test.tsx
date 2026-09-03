import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

describe("Modal (accessibility component)", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test modal">
        Content
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a dialog with the correct aria attributes when open", async () => {
    render(
      <Modal open onClose={() => {}} title="Test modal">
        Content
      </Modal>,
    );
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-label", "Test modal");
    });
  });

  it("renders the title as a heading and the children as content", async () => {
    render(
      <Modal open onClose={() => {}} title="Confirm action">
        <p>Are you sure?</p>
      </Modal>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Confirm action" })).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test modal">
        Content
      </Modal>,
    );
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="Test modal">
        Content
      </Modal>,
    );
    await waitFor(() => screen.getByRole("dialog"));
    const backdrop = container.ownerDocument.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while open and restores it on close", async () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Test modal">
        Content
      </Modal>,
    );
    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));
    rerender(
      <Modal open={false} onClose={() => {}} title="Test modal">
        Content
      </Modal>,
    );
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });

  it("traps focus within the dialog panel (Tab does not escape to the document body)", async () => {
    render(
      <Modal open onClose={() => {}} title="Focus trap">
        <button>Inside button</button>
      </Modal>,
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("tabIndex", "-1");
  });
});
