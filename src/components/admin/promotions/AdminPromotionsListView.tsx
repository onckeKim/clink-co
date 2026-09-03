"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Coupon } from "@/types/coupon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { TagListInput } from "@/components/admin/products/TagListInput";
import { formatPrice } from "@/lib/utils";

interface FormState {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  freeDelivery: boolean;
  minSpend: string;
  startsAt: string;
  endsAt: string;
  productSlugs: string[];
  collectionSlugs: string[];
  customerEmails: string[];
  usageLimit: string;
  active: boolean;
  requiresCode: boolean;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  freeDelivery: false,
  minSpend: "",
  startsAt: "",
  endsAt: "",
  productSlugs: [],
  collectionSlugs: [],
  customerEmails: [],
  usageLimit: "",
  active: true,
  requiresCode: true,
};

function fromCoupon(coupon: Coupon): FormState {
  return {
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    freeDelivery: coupon.freeDelivery,
    minSpend: coupon.minSpend !== undefined ? String(coupon.minSpend) : "",
    startsAt: coupon.startsAt ?? "",
    endsAt: coupon.endsAt ?? "",
    productSlugs: coupon.productSlugs ?? [],
    collectionSlugs: coupon.collectionSlugs ?? [],
    customerEmails: coupon.customerEmails ?? [],
    usageLimit: coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "",
    active: coupon.active,
    requiresCode: coupon.requiresCode,
  };
}

function toPayload(form: FormState) {
  return {
    code: form.code,
    description: form.description,
    discountType: form.discountType,
    discountValue: Number(form.discountValue) || 0,
    freeDelivery: form.freeDelivery,
    minSpend: form.minSpend ? Number(form.minSpend) : undefined,
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
    productSlugs: form.productSlugs.length ? form.productSlugs : undefined,
    collectionSlugs: form.collectionSlugs.length ? form.collectionSlugs : undefined,
    customerEmails: form.customerEmails.length ? form.customerEmails : undefined,
    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
    active: form.active,
    requiresCode: form.requiresCode,
  };
}

export function AdminPromotionsListView() {
  const [coupons, setCoupons] = React.useState<Coupon[] | null>(null);
  const [editing, setEditing] = React.useState<Coupon | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/coupons")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { coupons?: Coupon[] } | null) => setCoupons(data?.coupons ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (coupon: Coupon) => {
    setForm(fromCoupon(coupon));
    setEditing(coupon);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.description.trim()) {
      toast.error("Enter a code and description.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this promotion.");
        return;
      }
      toast.success(editing ? "Promotion updated." : "Promotion created.");
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't delete this promotion.");
        return;
      }
      toast.success("Promotion deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Promotions</h1>
          <p className="mt-1.5 text-sm text-stone">Discount codes and automatic discounts.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New promotion
        </Button>
      </div>

      {coupons === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>
                  <p className="font-medium text-charcoal">{coupon.code}</p>
                  <p className="max-w-[220px] truncate text-xs text-stone">{coupon.description}</p>
                </TableCell>
                <TableCell>
                  {coupon.freeDelivery && coupon.discountValue === 0
                    ? "Free delivery"
                    : coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : formatPrice(coupon.discountValue)}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.requiresCode ? "neutral" : "champagne"}>
                    {coupon.requiresCode ? "Code" : "Automatic"}
                  </Badge>
                </TableCell>
                <TableCell className="text-stone">
                  {coupon.timesUsed}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </TableCell>
                <TableCell>
                  {coupon.active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(coupon)} aria-label="Edit promotion">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDeleteId(coupon.id)}
                    aria-label="Delete promotion"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit promotion" : "New promotion"} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="promo-code">Code</Label>
              <Input id="promo-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </div>
            <div>
              <Label htmlFor="promo-desc">Description</Label>
              <Input id="promo-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={!form.requiresCode} onCheckedChange={(v) => setForm((f) => ({ ...f, requiresCode: !v }))} id="promo-automatic" />
            <Label htmlFor="promo-automatic" className="mb-0 normal-case tracking-normal text-charcoal">
              Automatic discount (no code needed at checkout)
            </Label>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="promo-type">Discount type</Label>
              <Select id="promo-type" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percentage" | "fixed" }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount (ZAR)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="promo-value">Discount value</Label>
              <Input id="promo-value" type="number" inputMode="decimal" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />
            </div>
            <div className="flex items-end gap-3 pb-2.5">
              <Switch checked={form.freeDelivery} onCheckedChange={(v) => setForm((f) => ({ ...f, freeDelivery: v }))} id="promo-free-delivery" />
              <Label htmlFor="promo-free-delivery" className="mb-0 normal-case tracking-normal text-charcoal">
                Free delivery
              </Label>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="promo-min-spend">Minimum order value (ZAR)</Label>
              <Input id="promo-min-spend" type="number" inputMode="decimal" value={form.minSpend} onChange={(e) => setForm((f) => ({ ...f, minSpend: e.target.value }))} placeholder="No minimum" />
            </div>
            <div>
              <Label htmlFor="promo-starts">Starts</Label>
              <Input id="promo-starts" type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="promo-ends">Ends</Label>
              <Input id="promo-ends" type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label htmlFor="promo-products">Restrict to products (slugs)</Label>
            <TagListInput values={form.productSlugs} onChange={(v) => setForm((f) => ({ ...f, productSlugs: v }))} placeholder="Type a product slug, press Enter" />
          </div>
          <div>
            <Label htmlFor="promo-collections">Restrict to collections (slugs)</Label>
            <TagListInput values={form.collectionSlugs} onChange={(v) => setForm((f) => ({ ...f, collectionSlugs: v }))} placeholder="Type a collection slug, press Enter" />
          </div>
          <div>
            <Label htmlFor="promo-customers">Restrict to customers (emails)</Label>
            <TagListInput values={form.customerEmails} onChange={(v) => setForm((f) => ({ ...f, customerEmails: v }))} placeholder="Type an email, press Enter" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="promo-usage-limit">Usage limit</Label>
              <Input id="promo-usage-limit" type="number" inputMode="numeric" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className="flex items-end gap-3 pb-2.5">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} id="promo-active" />
              <Label htmlFor="promo-active" className="mb-0 normal-case tracking-normal text-charcoal">
                Active
              </Label>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create promotion"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this promotion?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
