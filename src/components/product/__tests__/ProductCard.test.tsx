import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import type { Product } from "@/types/product";
import { renderWithCatalog as render } from "@/components/__tests__/test-utils/store-settings";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/shop",
  useSearchParams: () => new URLSearchParams(),
}));

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
    images: ["/images/coupe-1.jpg", "/images/coupe-2.jpg"],
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
  useWishlistStore.setState({ items: [] });
});

describe("ProductCard (component)", () => {
  it("renders the product name, description and formatted price", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Solstice Coupe Glasses")).toBeInTheDocument();
    expect(screen.getByText("Elegant coupe glasses.")).toBeInTheDocument();
    expect(screen.getByText(/R.?1.?450/)).toBeInTheDocument();
  });

  it("links to the product detail page", () => {
    render(<ProductCard product={makeProduct()} />);
    const links = screen.getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href") === "/products/solstice-coupe-glasses")).toBe(true);
  });

  it("shows a struck-through compare-at price and discount badge when on sale", () => {
    render(<ProductCard product={makeProduct({ price: 900, compareAtPrice: 1200 })} />);
    expect(screen.getByText("-25%")).toBeInTheDocument();
  });

  it("shows an 'Out of stock' badge and disables quick-add for an unavailable product", () => {
    render(<ProductCard product={makeProduct({ inStock: false, stockQuantity: 0 })} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notify me/i })).toBeDisabled();
  });

  it("adds the product to the cart when quick-add is clicked", () => {
    render(<ProductCard product={makeProduct()} />);
    fireEvent.click(screen.getByRole("button", { name: /quick add/i }));
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].slug).toBe("solstice-coupe-glasses");
  });

  it("toggles wishlist state when the heart button is clicked", () => {
    render(<ProductCard product={makeProduct()} />);
    const heartButton = screen.getByRole("button", { name: /add to wishlist/i });
    fireEvent.click(heartButton);
    expect(useWishlistStore.getState().has("prod-1")).toBe(true);
  });

  it("calls onQuickView with the product when the quick-view button is clicked", () => {
    const onQuickView = vi.fn();
    const product = makeProduct();
    render(<ProductCard product={product} onQuickView={onQuickView} />);
    fireEvent.click(screen.getByRole("button", { name: /quick view/i }));
    expect(onQuickView).toHaveBeenCalledWith(product);
  });
});
