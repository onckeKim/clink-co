import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerDetailsStep } from "@/components/checkout/steps/CustomerDetailsStep";

describe("CustomerDetailsStep (checkout form component)", () => {
  it("renders all required fields", () => {
    render(
      <CustomerDetailsStep marketingConsent={false} onMarketingConsentChange={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it("shows validation errors and does not call onNext when submitted empty", async () => {
    const onNext = vi.fn();
    render(<CustomerDetailsStep marketingConsent={false} onMarketingConsentChange={() => {}} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: /continue to delivery address/i }));
    await waitFor(() => {
      expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
    });
    expect(onNext).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<CustomerDetailsStep marketingConsent={false} onMarketingConsentChange={() => {}} onNext={onNext} />);
    await user.type(screen.getByLabelText(/first name/i), "Ada");
    await user.type(screen.getByLabelText(/last name/i), "Lovelace");
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.type(screen.getByLabelText(/phone number/i), "0821234567");
    fireEvent.click(screen.getByRole("button", { name: /continue to delivery address/i }));
    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    });
    expect(onNext).not.toHaveBeenCalled();
  });

  it("calls onNext with the entered data once every field is valid", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<CustomerDetailsStep marketingConsent={false} onMarketingConsentChange={() => {}} onNext={onNext} />);
    await user.type(screen.getByLabelText(/first name/i), "Ada");
    await user.type(screen.getByLabelText(/last name/i), "Lovelace");
    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.type(screen.getByLabelText(/phone number/i), "0821234567");
    fireEvent.click(screen.getByRole("button", { name: /continue to delivery address/i }));
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
    expect(onNext.mock.calls[0][0]).toMatchObject({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "0821234567",
    });
  });

  it("calls onMarketingConsentChange when the consent checkbox is toggled", () => {
    const onMarketingConsentChange = vi.fn();
    render(
      <CustomerDetailsStep
        marketingConsent={false}
        onMarketingConsentChange={onMarketingConsentChange}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/keep me posted/i));
    expect(onMarketingConsentChange).toHaveBeenCalledWith(true);
  });
});
