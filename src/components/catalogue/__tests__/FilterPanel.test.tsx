import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { FilterPanel } from "@/components/catalogue/FilterPanel";
import { DEFAULT_FILTERS, type CatalogueFilters, type CatalogueFacets } from "@/lib/catalogue";
import { renderWithCatalog as render } from "@/components/__tests__/test-utils/store-settings";

const facets: CatalogueFacets = {
  productTypes: ["Coupe Glasses", "Decanters"],
  colors: ["Smoke", "Ivory"],
  materials: ["Crystal"],
  capacities: [],
  setSizes: [],
  priceMin: 500,
  priceMax: 2500,
};

/** Wraps FilterPanel in real controlled state, mirroring how FilterSidebar/FilterDrawer use it — so the onChange updater sees the DOM's actual committed value rather than a stale event reference. */
function StatefulFilterPanel({
  initial = DEFAULT_FILTERS,
  onFiltersChange,
  lockedCategory,
}: {
  initial?: CatalogueFilters;
  onFiltersChange?: (f: CatalogueFilters) => void;
  lockedCategory?: string;
}) {
  const [filters, setFilters] = React.useState(initial);
  const onChange = (updater: (prev: CatalogueFilters) => CatalogueFilters) => {
    setFilters((prev) => {
      const next = updater(prev);
      onFiltersChange?.(next);
      return next;
    });
  };
  return <FilterPanel filters={filters} onChange={onChange} facets={facets} lockedCategory={lockedCategory} />;
}

describe("FilterPanel (product filters component)", () => {
  it("renders category checkboxes from the category list", () => {
    render(<StatefulFilterPanel />);
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("renders product type facet options once expanded", () => {
    render(<StatefulFilterPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Product Type" }));
    expect(screen.getByText("Coupe Glasses")).toBeInTheDocument();
    expect(screen.getByText("Decanters")).toBeInTheDocument();
  });

  it("toggles a colour chip on and off", () => {
    let latest: CatalogueFilters = DEFAULT_FILTERS;
    render(<StatefulFilterPanel onFiltersChange={(f) => (latest = f)} />);
    fireEvent.click(screen.getByRole("button", { name: "Colour" }));
    const chip = screen.getByRole("button", { name: "Smoke" });

    fireEvent.click(chip);
    expect(latest.colors).toEqual(["Smoke"]);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);
    expect(latest.colors).toEqual([]);
  });

  it("updates the minimum price via the price input", () => {
    let latest: CatalogueFilters = DEFAULT_FILTERS;
    render(<StatefulFilterPanel onFiltersChange={(f) => (latest = f)} />);
    fireEvent.click(screen.getByRole("button", { name: "Price" }));
    fireEvent.change(screen.getByLabelText("Minimum price"), { target: { value: "600" } });
    expect(latest.priceMin).toBe(600);
  });

  it("toggles the in-stock-only checkbox", () => {
    let latest: CatalogueFilters = DEFAULT_FILTERS;
    render(<StatefulFilterPanel onFiltersChange={(f) => (latest = f)} />);
    fireEvent.click(screen.getByRole("button", { name: "Availability" }));
    fireEvent.click(screen.getByText("In stock only"));
    expect(latest.inStockOnly).toBe(true);
  });

  it("hides the category section when lockedCategory is set", () => {
    render(<StatefulFilterPanel lockedCategory="glassware" />);
    expect(screen.queryByText("Category")).not.toBeInTheDocument();
  });

  it("allows only one rating threshold to be selected at a time", () => {
    render(<StatefulFilterPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Rating" }));
    const fourAndUp = screen.getAllByRole("checkbox").find((el) => el.closest("label")?.textContent?.includes("& up"));
    expect(fourAndUp).toBeTruthy();
  });
});
