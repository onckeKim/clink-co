"use client";

import * as React from "react";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Address } from "@/lib/account/addresses-store";
import { AddressFormModal } from "@/components/account/AddressFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function AddressesView() {
  const [addresses, setAddresses] = React.useState<Address[] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Address | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const loadAddresses = React.useCallback(() => {
    fetch("/api/account/addresses")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { addresses?: Address[] } | null) => setAddresses(data?.addresses ?? []));
  }, []);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAdd = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      return;
    }
    setBusyId(id);
    try {
      await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      loadAddresses();
    } finally {
      setBusyId(null);
      setConfirmingDeleteId(null);
    }
  };

  const handleSetDefault = async (id: string, type: "delivery" | "billing") => {
    setBusyId(id);
    try {
      await fetch(`/api/account/addresses/${id}/default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      loadAddresses();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Address Book</h1>
          <p className="mt-1.5 text-sm text-stone">Save addresses for faster checkout.</p>
        </div>
        <Button type="button" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add address
        </Button>
      </div>

      {addresses === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-sand/40" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand p-10 text-center">
          <MapPin className="mx-auto h-8 w-8 text-stone" aria-hidden />
          <p className="mt-3 text-sm text-stone">You haven&apos;t saved any addresses yet.</p>
          <Button type="button" size="sm" className="mt-4" onClick={openAdd}>
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="flex flex-col gap-3 rounded-2xl border border-sand p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-charcoal">{address.label || address.fullName}</p>
                <div className="flex gap-1.5">
                  {address.isDefaultDelivery && <Badge variant="light">Default delivery</Badge>}
                  {address.isDefaultBilling && <Badge variant="light">Default billing</Badge>}
                </div>
              </div>
              <p className="text-sm text-stone">
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 ? <>, {address.line2}</> : null}
                <br />
                {address.suburb}, {address.city}
                <br />
                {address.province} {address.postalCode}
                <br />
                {address.phone}
              </p>

              <div className="mt-1 flex flex-wrap gap-2 border-t border-sand pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(address)}
                  className="focus-ring flex items-center gap-1.5 rounded-full border border-sand px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-charcoal/40"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={busyId === address.id}
                  className="focus-ring flex items-center gap-1.5 rounded-full border border-sand px-3 py-1.5 text-xs text-error transition-colors hover:border-error disabled:opacity-50"
                >
                  {busyId === address.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  {confirmingDeleteId === address.id ? "Confirm delete?" : "Delete"}
                </button>
                {!address.isDefaultDelivery && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id, "delivery")}
                    disabled={busyId === address.id}
                    className="focus-ring rounded-full border border-sand px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-charcoal/40 disabled:opacity-50"
                  >
                    Make default delivery
                  </button>
                )}
                {!address.isDefaultBilling && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id, "billing")}
                    disabled={busyId === address.id}
                    className="focus-ring rounded-full border border-sand px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-charcoal/40 disabled:opacity-50"
                  >
                    Make default billing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        address={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadAddresses();
        }}
      />
    </div>
  );
}
