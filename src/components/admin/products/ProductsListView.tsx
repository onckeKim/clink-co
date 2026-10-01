"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Eye, Loader2, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { cn, formatPrice } from "@/lib/utils";

interface CategoryOption {
  slug: string;
  name: string;
}

export function ProductsListView({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("");
  const [publishStatus, setPublishStatus] = React.useState("");
  const [stockLevel, setStockLevel] = React.useState(searchParams.get("stockLevel") ?? "");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categorySlug) params.set("categorySlug", categorySlug);
    if (publishStatus) params.set("publishStatus", publishStatus);
    if (stockLevel) params.set("stockLevel", stockLevel);

    fetch(`/api/admin/products?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: Product[] } | null) => setProducts(data?.products ?? []));
  }, [search, categorySlug, publishStatus, stockLevel]);

  React.useEffect(() => {
    const id = window.setTimeout(load, 250);
    return () => window.clearTimeout(id);
  }, [load]);

  const runAction = async (id: string, action: "archive" | "restore" | "duplicate") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "That action failed.");
        return;
      }
      if (action === "archive") toast.success("Product archived.");
      if (action === "restore") toast.success("Product restored.");
      if (action === "duplicate") {
        toast.success("Product duplicated.");
        router.push(`/admin/products/${data.product.id}`);
        return;
      }
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setBusyId(confirmDeleteId);
    try {
      const res = await fetch(`/api/admin/products/${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "This product can't be deleted.");
        return;
      }
      toast.success("Product deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Products</h1>
          <p className="mt-1.5 text-sm text-stone">Create, edit and manage the catalogue.</p>
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="h-4 w-4" />
          New product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or slug"
            className="pl-11"
          />
        </div>
        <Select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)} className="w-auto min-w-[140px]">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <Select value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} className="w-auto min-w-[140px]">
          <option value="">All stock levels</option>
          <option value="in-stock">In stock</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </Select>
      </div>

      {products === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No products match these filters.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="max-w-[240px]">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="truncate font-medium text-charcoal underline-offset-2 hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="text-stone">{product.sku}</TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>
                  {product.stockQuantity <= 0 ? (
                    <Badge variant="error">Out of stock</Badge>
                  ) : product.stockQuantity <= (product.lowStockThreshold ?? 6) ? (
                    <Badge variant="warning">{product.stockQuantity} left</Badge>
                  ) : (
                    <span className="text-charcoal">{product.stockQuantity}</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.discontinued ? (
                    <Badge variant="neutral">Archived</Badge>
                  ) : product.publishStatus === "draft" ? (
                    <Badge variant="warning">Draft</Badge>
                  ) : (
                    <Badge variant="success">Published</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu
                    trigger={
                      <span
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          busyId === product.id && "pointer-events-none opacity-50",
                        )}
                      >
                        {busyId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actions"}
                      </span>
                    }
                  >
                    <DropdownMenuItem onClick={() => window.open(`/products/${product.slug}`, "_blank", "noreferrer")}>
                      <Eye className="h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => runAction(product.id, "duplicate")}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                    {product.discontinued ? (
                      <DropdownMenuItem onClick={() => runAction(product.id, "restore")}>
                        <RotateCcw className="h-4 w-4" /> Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => runAction(product.id, "archive")}>
                        <RotateCcw className="h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onClick={() => setConfirmDeleteId(product.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this product?"
        description="This can't be undone. Products that appear in past orders can't be deleted — archive them instead."
        confirmLabel="Delete"
        destructive
        loading={busyId === confirmDeleteId}
      />
    </div>
  );
}
