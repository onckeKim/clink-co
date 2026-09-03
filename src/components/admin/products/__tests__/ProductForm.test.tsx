import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { toast } from "@/components/ui/Toast";
import { mockRouter, resetMockRouter } from "@/components/__tests__/test-utils/next-mocks";
import type { Category } from "@/types/category";
import type { CuratedCollection } from "@/types/collection";
import type { Product } from "@/types/product";

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const categories = [{ slug: "glassware", name: "Glassware", itemCount: 8 }] as unknown as Category[];
const collections: CuratedCollection[] = [];

const originalFetch = global.fetch;

beforeEach(() => {
  resetMockRouter();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("ProductForm (admin product form component)", () => {
  it("blocks submission and shows a toast when required fields are missing", async () => {
    const errorSpy = vi.spyOn(toast, "error");
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { container } = render(<ProductForm categories={categories} collections={collections} />);
    // fireEvent.submit bypasses the browser's native HTML5 required-field
    // validation (which a real button click would trigger and which would
    // block the submit event before React ever sees it) so this exercises
    // the form's own JS validation message directly.
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Fill in name, SKU, category and product type before saving.");
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks submission with a toast when no images have been added", async () => {
    const errorSpy = vi.spyOn(toast, "error");
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const user = userEvent.setup();

    render(<ProductForm categories={categories} collections={collections} />);
    await user.type(screen.getByLabelText("Product name"), "Solstice Coupe Glasses");
    await user.type(screen.getByLabelText("SKU"), "CC-GLS-SOL-04");
    await user.type(screen.getByLabelText("Product type"), "Coupe Glasses");
    await user.type(screen.getByLabelText("Short description"), "Elegant coupe glasses.");
    await user.type(screen.getByLabelText("Full description"), "Full description text.");

    fireEvent.click(screen.getByRole("tab", { name: "Organization & Details" }));
    await user.selectOptions(screen.getByLabelText("Category"), "glassware");

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Add at least one image before saving.");
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    // Switches to the Images tab so the admin can see what's missing.
    expect(screen.getByRole("tab", { name: "Images", selected: true })).toBeInTheDocument();
  });

  it("submits a PATCH request and redirects when editing a valid, complete product", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ product: { id: "prod-1" } }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    const existingProduct = {
      id: "prod-1",
      slug: "solstice-coupe-glasses",
      sku: "CC-GLS-SOL-04",
      name: "Solstice Coupe Glasses",
      shortDescription: "Elegant coupe glasses.",
      description: "Full description text.",
      price: 1450,
      currency: "ZAR",
      images: ["/images/coupe.jpg"],
      categorySlug: "glassware",
      productType: "Coupe Glasses",
      collectionSlugs: [],
      stockQuantity: 10,
      inStock: true,
      featured: false,
      tags: [],
      careInstructions: [],
    } as unknown as Product;

    render(<ProductForm product={existingProduct} categories={categories} collections={collections} />);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/admin/products/prod-1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/admin/products/prod-1"));
  });

  it("surfaces a server-side error via toast without redirecting", async () => {
    const errorSpy = vi.spyOn(toast, "error");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "A product with this SKU already exists." }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    const existingProduct = {
      id: "prod-1",
      slug: "solstice-coupe-glasses",
      sku: "CC-GLS-SOL-04",
      name: "Solstice Coupe Glasses",
      shortDescription: "Elegant coupe glasses.",
      description: "Full description text.",
      price: 1450,
      currency: "ZAR",
      images: ["/images/coupe.jpg"],
      categorySlug: "glassware",
      productType: "Coupe Glasses",
      collectionSlugs: [],
      stockQuantity: 10,
      inStock: true,
      featured: false,
      tags: [],
      careInstructions: [],
    } as unknown as Product;

    render(<ProductForm product={existingProduct} categories={categories} collections={collections} />);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("A product with this SKU already exists.");
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
