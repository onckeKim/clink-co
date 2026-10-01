"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { Product, ProductBadge } from "@/types/product";
import type { Category } from "@/types/category";
import type { CuratedCollection } from "@/types/collection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { toast } from "@/components/ui/Toast";
import { ProductImagesEditor } from "@/components/admin/products/ProductImagesEditor";
import { ProductVariantsEditor } from "@/components/admin/products/ProductVariantsEditor";
import { TagListInput } from "@/components/admin/products/TagListInput";

const ALL_BADGES: ProductBadge[] = ["New", "Bestseller", "Limited", "Gift Edit"];

export interface ProductFormValues {
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | undefined;
  images: string[];
  categorySlug: string;
  productType: string;
  collectionSlugs: string[];
  material: string;
  colors: string[];
  capacity: string;
  setSize: string;
  stockQuantity: number;
  lowStockThreshold: number | undefined;
  discontinued: boolean;
  featured: boolean;
  badges: ProductBadge[];
  variants: NonNullable<Product["variants"]>;
  tags: string[];
  careInstructions: string[];
  heightCm: number | undefined;
  widthCm: number | undefined;
  depthCm: number | undefined;
  weightGrams: number | undefined;
  keyBenefits: string[];
  lifestyleImage: string;
  lifestyleCaption: string;
  pairsWithSlugs: string[];
  packagingInfo: string;
  publishStatus: "draft" | "published";
  useScheduledSale: boolean;
  regularPrice: number | undefined;
  salePrice: number | undefined;
  saleStartsAt: string;
  saleEndsAt: string;
  seoTitle: string;
  seoDescription: string;
}

function fromProduct(product?: Product): ProductFormValues {
  return {
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    price: product?.regularPrice ?? product?.price ?? 0,
    compareAtPrice: product?.regularPrice ? undefined : product?.compareAtPrice,
    images: product?.images ?? [],
    categorySlug: product?.categorySlug ?? "",
    productType: product?.productType ?? "",
    collectionSlugs: product?.collectionSlugs ?? [],
    material: product?.material ?? "",
    colors: product?.colors ?? [],
    capacity: product?.capacity ?? "",
    setSize: product?.setSize ?? "",
    stockQuantity: product?.stockQuantity ?? 0,
    lowStockThreshold: product?.lowStockThreshold,
    discontinued: product?.discontinued ?? false,
    featured: product?.featured ?? false,
    badges: product?.badges ?? [],
    variants: product?.variants ?? [],
    tags: product?.tags ?? [],
    careInstructions: product?.careInstructions ?? [],
    heightCm: product?.dimensions?.heightCm,
    widthCm: product?.dimensions?.widthCm,
    depthCm: product?.dimensions?.depthCm,
    weightGrams: product?.weightGrams,
    keyBenefits: product?.keyBenefits ?? [],
    lifestyleImage: product?.lifestyleImage ?? "",
    lifestyleCaption: product?.lifestyleCaption ?? "",
    pairsWithSlugs: product?.pairsWithSlugs ?? [],
    packagingInfo: product?.packagingInfo ?? "",
    publishStatus: product?.publishStatus ?? "draft",
    useScheduledSale: product?.regularPrice !== undefined,
    regularPrice: product?.regularPrice,
    salePrice: product?.salePrice,
    saleStartsAt: product?.saleStartsAt ?? "",
    saleEndsAt: product?.saleEndsAt ?? "",
    seoTitle: product?.seoTitle ?? "",
    seoDescription: product?.seoDescription ?? "",
  };
}

function toPayload(values: ProductFormValues) {
  return {
    slug: values.slug || undefined,
    sku: values.sku,
    name: values.name,
    shortDescription: values.shortDescription,
    description: values.description,
    price: values.useScheduledSale ? values.regularPrice ?? 0 : values.price,
    compareAtPrice: values.useScheduledSale ? undefined : values.compareAtPrice,
    currency: "ZAR" as const,
    images: values.images,
    categorySlug: values.categorySlug,
    productType: values.productType,
    collectionSlugs: values.collectionSlugs,
    material: values.material || undefined,
    colors: values.colors.length ? values.colors : undefined,
    capacity: values.capacity || undefined,
    setSize: values.setSize || undefined,
    stockQuantity: values.stockQuantity,
    discontinued: values.discontinued,
    featured: values.featured,
    badges: values.badges.length ? values.badges : undefined,
    variants: values.variants.length ? values.variants : undefined,
    tags: values.tags,
    careInstructions: values.careInstructions,
    dimensions:
      values.heightCm !== undefined && values.widthCm !== undefined && values.depthCm !== undefined
        ? { heightCm: values.heightCm, widthCm: values.widthCm, depthCm: values.depthCm }
        : undefined,
    weightGrams: values.weightGrams,
    keyBenefits: values.keyBenefits.length ? values.keyBenefits : undefined,
    lifestyleImage: values.lifestyleImage || undefined,
    lifestyleCaption: values.lifestyleCaption || undefined,
    pairsWithSlugs: values.pairsWithSlugs.length ? values.pairsWithSlugs : undefined,
    packagingInfo: values.packagingInfo || undefined,
    publishStatus: values.publishStatus,
    lowStockThreshold: values.lowStockThreshold,
    regularPrice: values.useScheduledSale ? values.regularPrice : undefined,
    salePrice: values.useScheduledSale ? values.salePrice : undefined,
    saleStartsAt: values.useScheduledSale ? values.saleStartsAt || undefined : undefined,
    saleEndsAt: values.useScheduledSale ? values.saleEndsAt || undefined : undefined,
    seoTitle: values.seoTitle || undefined,
    seoDescription: values.seoDescription || undefined,
  };
}

const TABS = [
  { id: "general", label: "General" },
  { id: "images", label: "Images" },
  { id: "pricing", label: "Pricing & Stock" },
  { id: "variants", label: "Variants" },
  { id: "organization", label: "Organization & Details" },
  { id: "seo", label: "SEO" },
];

export function ProductForm({
  product,
  categories,
  collections,
}: {
  product?: Product;
  categories: Category[];
  collections: CuratedCollection[];
}) {
  const router = useRouter();
  const isEditing = Boolean(product);
  const [values, setValues] = React.useState<ProductFormValues>(() => fromProduct(product));
  const [activeTab, setActiveTab] = React.useState("general");
  const [saving, setSaving] = React.useState(false);

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent, publishStatusOverride?: "draft" | "published") => {
    e.preventDefault();
    if (!values.name.trim() || !values.sku.trim() || !values.categorySlug || !values.productType.trim()) {
      toast.error("Fill in name, SKU, category and product type before saving.");
      setActiveTab("general");
      return;
    }
    if (values.images.length === 0) {
      toast.error("Add at least one image before saving.");
      setActiveTab("images");
      return;
    }

    setSaving(true);
    const payload = toPayload(
      publishStatusOverride ? { ...values, publishStatus: publishStatusOverride } : values,
    );

    try {
      const res = await fetch(isEditing ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this product.");
        return;
      }
      toast.success(isEditing ? "Product updated." : "Product created.");
      router.push(`/admin/products/${data.product.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-charcoal">{isEditing ? product!.name : "New product"}</h1>
          {isEditing && (
            <a
              href={`/products/${values.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-stone underline-offset-2 hover:text-charcoal hover:underline"
            >
              Preview on storefront
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {values.publishStatus === "draft" ? (
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={(e) => handleSubmit(e, "published")}>
              Save &amp; publish
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={(e) => handleSubmit(e, "draft")}>
              Unpublish
            </Button>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs items={TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === "general" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="p-name">Product name</Label>
            <Input id="p-name" value={values.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="p-slug">Slug</Label>
            <Input
              id="p-slug"
              value={values.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="auto-generated from name if left blank"
            />
          </div>
          <div>
            <Label htmlFor="p-sku">SKU</Label>
            <Input id="p-sku" value={values.sku} onChange={(e) => update("sku", e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="p-type">Product type</Label>
            <Input
              id="p-type"
              value={values.productType}
              onChange={(e) => update("productType", e.target.value)}
              placeholder="e.g. Wine Glasses"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-short">Short description</Label>
            <Input id="p-short" value={values.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-desc">Full description</Label>
            <Textarea id="p-desc" value={values.description} onChange={(e) => update("description", e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="p-tags">Tags</Label>
            <TagListInput values={values.tags} onChange={(v) => update("tags", v)} placeholder="Type a tag, press Enter" />
          </div>
          <div>
            <Label>Badges</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {ALL_BADGES.map((badge) => (
                <label key={badge} className="flex items-center gap-2 text-sm text-charcoal">
                  <Checkbox
                    checked={values.badges.includes(badge)}
                    onCheckedChange={(checked) =>
                      update("badges", checked ? [...values.badges, badge] : values.badges.filter((b) => b !== badge))
                    }
                  />
                  {badge}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={values.featured} onCheckedChange={(v) => update("featured", v)} id="p-featured" />
            <Label htmlFor="p-featured" className="mb-0 normal-case tracking-normal text-charcoal">
              Featured (homepage curation)
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={values.discontinued} onCheckedChange={(v) => update("discontinued", v)} id="p-discontinued" />
            <Label htmlFor="p-discontinued" className="mb-0 normal-case tracking-normal text-charcoal">
              Archived (discontinued)
            </Label>
          </div>
        </div>
      )}

      {activeTab === "images" && <ProductImagesEditor images={values.images} onChange={(v) => update("images", v)} />}

      {activeTab === "pricing" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Switch
              checked={values.useScheduledSale}
              onCheckedChange={(v) => update("useScheduledSale", v)}
              id="p-scheduled"
            />
            <Label htmlFor="p-scheduled" className="mb-0 normal-case tracking-normal text-charcoal">
              Schedule a sale (auto-activates/deactivates on the dates below)
            </Label>
          </div>

          {values.useScheduledSale ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-regular">Regular price (ZAR)</Label>
                <Input
                  id="p-regular"
                  type="number"
                  inputMode="decimal"
                  value={values.regularPrice ?? ""}
                  onChange={(e) => update("regularPrice", e.target.value ? Number(e.target.value) : undefined)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="p-sale">Sale price (ZAR)</Label>
                <Input
                  id="p-sale"
                  type="number"
                  inputMode="decimal"
                  value={values.salePrice ?? ""}
                  onChange={(e) => update("salePrice", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="p-sale-start">Sale starts</Label>
                <Input id="p-sale-start" type="date" value={values.saleStartsAt} onChange={(e) => update("saleStartsAt", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-sale-end">Sale ends</Label>
                <Input id="p-sale-end" type="date" value={values.saleEndsAt} onChange={(e) => update("saleEndsAt", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-price">Price (ZAR)</Label>
                <Input
                  id="p-price"
                  type="number"
                  inputMode="decimal"
                  value={values.price}
                  onChange={(e) => update("price", Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="p-compare">Compare-at price (ZAR)</Label>
                <Input
                  id="p-compare"
                  type="number"
                  inputMode="decimal"
                  value={values.compareAtPrice ?? ""}
                  onChange={(e) => update("compareAtPrice", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Shown struck through when set"
                />
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-stock">Stock quantity</Label>
              <Input
                id="p-stock"
                type="number"
                inputMode="numeric"
                value={values.stockQuantity}
                onChange={(e) => update("stockQuantity", Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="p-threshold">Low-stock threshold</Label>
              <Input
                id="p-threshold"
                type="number"
                inputMode="numeric"
                value={values.lowStockThreshold ?? ""}
                onChange={(e) => update("lowStockThreshold", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Defaults to the site-wide setting"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "variants" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="font-display text-lg text-charcoal">Colour/style variants</h3>
            <p className="mt-1 text-sm text-stone">Rendered as swatch chips on the product page.</p>
            <div className="mt-3">
              <ProductVariantsEditor variants={values.variants} onChange={(v) => update("variants", v)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "organization" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-category">Category</Label>
            <Select id="p-category" value={values.categorySlug} onChange={(e) => update("categorySlug", e.target.value)} required>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Collections</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {collections.map((collection) => (
                <label key={collection.id} className="flex items-center gap-2 text-sm text-charcoal">
                  <Checkbox
                    checked={values.collectionSlugs.includes(collection.id)}
                    onCheckedChange={(checked) =>
                      update(
                        "collectionSlugs",
                        checked
                          ? [...values.collectionSlugs, collection.id]
                          : values.collectionSlugs.filter((s) => s !== collection.id),
                      )
                    }
                  />
                  {collection.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="p-material">Material</Label>
            <Input id="p-material" value={values.material} onChange={(e) => update("material", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p-colors">Colours</Label>
            <TagListInput values={values.colors} onChange={(v) => update("colors", v)} placeholder="e.g. Ivory" />
          </div>
          <div>
            <Label htmlFor="p-capacity">Capacity</Label>
            <Input id="p-capacity" value={values.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="e.g. 350ml" />
          </div>
          <div>
            <Label htmlFor="p-setsize">Set size</Label>
            <Input id="p-setsize" value={values.setSize} onChange={(e) => update("setSize", e.target.value)} placeholder="e.g. Set of 4" />
          </div>

          <div>
            <Label htmlFor="p-height">Height (cm)</Label>
            <Input
              id="p-height"
              type="number"
              inputMode="decimal"
              value={values.heightCm ?? ""}
              onChange={(e) => update("heightCm", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label htmlFor="p-width">Width (cm)</Label>
              <Input
                id="p-width"
                type="number"
                inputMode="decimal"
                value={values.widthCm ?? ""}
                onChange={(e) => update("widthCm", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="p-depth">Depth (cm)</Label>
              <Input
                id="p-depth"
                type="number"
                inputMode="decimal"
                value={values.depthCm ?? ""}
                onChange={(e) => update("depthCm", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="p-weight">Weight (g)</Label>
            <Input
              id="p-weight"
              type="number"
              inputMode="numeric"
              value={values.weightGrams ?? ""}
              onChange={(e) => update("weightGrams", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="p-care">Care instructions</Label>
            <TagListInput values={values.careInstructions} onChange={(v) => update("careInstructions", v)} placeholder="Type an instruction, press Enter" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-benefits">Key benefits</Label>
            <TagListInput values={values.keyBenefits} onChange={(v) => update("keyBenefits", v)} placeholder="Type a benefit, press Enter" />
          </div>
          <div>
            <Label htmlFor="p-lifestyle-image">Lifestyle image URL</Label>
            <Input id="p-lifestyle-image" value={values.lifestyleImage} onChange={(e) => update("lifestyleImage", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p-lifestyle-caption">Lifestyle caption</Label>
            <Input id="p-lifestyle-caption" value={values.lifestyleCaption} onChange={(e) => update("lifestyleCaption", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-pairs">Pairs well with (product slugs)</Label>
            <TagListInput values={values.pairsWithSlugs} onChange={(v) => update("pairsWithSlugs", v)} placeholder="Type a product slug, press Enter" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-packaging">Packaging information</Label>
            <Textarea id="p-packaging" value={values.packagingInfo} onChange={(e) => update("packagingInfo", e.target.value)} />
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div className="grid gap-5">
          <div>
            <Label htmlFor="p-seo-title">SEO title</Label>
            <Input
              id="p-seo-title"
              value={values.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
              placeholder={values.name || "Falls back to the product name"}
            />
          </div>
          <div>
            <Label htmlFor="p-seo-desc">SEO description</Label>
            <Textarea
              id="p-seo-desc"
              value={values.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
              placeholder={values.shortDescription || "Falls back to the short description"}
            />
          </div>
        </div>
      )}
    </form>
  );
}
