import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/layout/Header";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { renderWithStoreSettings as render } from "@/components/__tests__/test-utils/store-settings";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/hooks/use-auth-user", () => ({
  useAuthUser: () => ({ user: null, loading: false }),
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ SearchModal: React.ComponentType<unknown> }>) => {
    // Render a lightweight stand-in instead of resolving the real lazy import — avoids the
    // dynamic()/ssr:false code path (which next/dynamic disables outside a real Next.js runtime).
    void loader;
    return function DynamicSearchModalStub() {
      return null;
    };
  },
}));

beforeEach(() => {
  useCartStore.setState({ lines: [], isOpen: false, coupon: null, manualCouponCode: null, couponError: null });
  useWishlistStore.setState({ items: [] });
});

describe("Header (navigation component)", () => {
  it("renders the primary navigation links", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toHaveTextContent("Home");
    expect(nav).toHaveTextContent("Shop");
    expect(nav).toHaveTextContent("Collections");
    expect(nav).toHaveTextContent("Gifts");
    expect(nav).toHaveTextContent("About");
    expect(nav).toHaveTextContent("Journal");
  });

  it("marks the current route as the active link", () => {
    render(<Header />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  it("links the account icon to /login when signed out", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("shows a cart item-count badge and opens the cart drawer when clicked", () => {
    useCartStore.setState({
      lines: [
        {
          lineId: "l1",
          productId: "p1",
          slug: "solstice-coupe-glasses",
          sku: "SKU1",
          name: "Solstice Coupe Glasses",
          image: "/img.jpg",
          price: 1450,
          quantity: 2,
          categorySlug: "glassware",
          collectionSlugs: [],
        },
      ],
    });
    render(<Header />);
    const cartButton = screen.getByRole("button", { name: /shopping bag, 2 items/i });
    expect(cartButton).toBeInTheDocument();
    fireEvent.click(cartButton);
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  it("opens the mobile menu drawer when the menu button is clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    // MobileDrawer renders a dialog once opened
    expect(screen.getAllByText("Home").length).toBeGreaterThan(1);
  });

  it("shows a wishlist badge reflecting the wishlist item count", () => {
    useWishlistStore.setState({
      items: [{ productId: "p1", productName: "Test", productSlug: "test", price: 100, image: "/img.jpg", addedAt: new Date().toISOString() } as never],
    });
    render(<Header />);
    expect(screen.getByRole("link", { name: /wishlist, 1 item/i })).toBeInTheDocument();
  });
});
