import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/product";
import { renderWithStoreSettings as render } from "@/components/__tests__/test-utils/store-settings";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    slug: "solstice-coupe-glasses",
    sku: "CC-GLS-SOL-04",
    name: "Solstice Coupe Glasses",
    shortDescription: "Elegant coupe glasses.",
    description: "Full description.",
    price: 1450,
    currency: "ZAR",
    images: ["/images/coupe.jpg"],
    categorySlug: "glassware",
    productType: "Coupe Glasses",
    collectionSlugs: [],
    stockQuantity: 5,
    inStock: true,
    ...overrides,
  } as Product;
}

beforeEach(() => {
  useCartStore.setState({ lines: [], isOpen: false, coupon: null, manualCouponCode: null, couponError: null });
});

describe("CartDrawer (component)", () => {
  it("renders nothing when the cart is closed", async () => {
    render(<CartDrawer />);
    await waitFor(() => expect(document.body.style).toBeDefined());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty-bag state when open with no lines", async () => {
    useCartStore.setState({ isOpen: true });
    render(<CartDrawer />);
    await waitFor(() => screen.getByRole("dialog"));
    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
  });

  it("lists cart lines and a checkout link when the cart has items", async () => {
    useCartStore.getState().addItem(makeProduct());
    render(<CartDrawer />);
    await waitFor(() => screen.getByRole("dialog"));
    expect(screen.getByText("Solstice Coupe Glasses")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /checkout/i })).toHaveAttribute("href", "/checkout");
  });

  it("closes the drawer when the close button is clicked", async () => {
    useCartStore.setState({ isOpen: true });
    render(<CartDrawer />);
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /close bag/i }));
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("has an accessible dialog label", async () => {
    useCartStore.setState({ isOpen: true });
    render(<CartDrawer />);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Shopping bag");
    });
  });
});
