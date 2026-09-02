"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { accountAddressSchema, type AccountAddressInput } from "@/lib/validations/auth";
import { southAfricanProvinces } from "@/data/provinces";
import type { Address } from "@/lib/account/addresses-store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

export function AddressFormModal({
  open,
  address,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Editing an existing address when set, otherwise creating a new one. */
  address?: Address;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={address ? "Edit address" : "Add a new address"} className="max-w-xl">
      {/* Keyed so opening a different address (or switching add<->edit) always
          mounts a fresh form instance with the right initial values, instead
          of reaching for a reset-on-prop-change effect. */}
      {open && <AddressFormBody key={address?.id ?? "new"} address={address} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function AddressFormBody({
  address,
  onClose,
  onSaved,
}: {
  address?: Address;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  // Lifted outside react-hook-form, matching the pattern used for
  // marketingConsent in CustomerDetailsStep — the custom Checkbox component
  // takes checked/onCheckedChange rather than a native input's ref/onChange,
  // so it's simpler to manage separately than to wire through a Controller.
  const [isDefaultDelivery, setIsDefaultDelivery] = React.useState(address?.isDefaultDelivery ?? false);
  const [isDefaultBilling, setIsDefaultBilling] = React.useState(address?.isDefaultBilling ?? false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountAddressInput>({
    resolver: zodResolver(accountAddressSchema),
    defaultValues: address
      ? {
          label: address.label ?? "",
          fullName: address.fullName,
          line1: address.line1,
          line2: address.line2 ?? "",
          suburb: address.suburb,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          phone: address.phone,
        }
      : { label: "" },
  });

  const onSubmit = async (data: AccountAddressInput) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(address ? `/api/account/addresses/${address.id}` : "/api/account/addresses", {
        method: address ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isDefaultDelivery, isDefaultBilling }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      {serverError && <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{serverError}</p>}

      <div>
        <Label htmlFor="addr-label">Label (optional)</Label>
        <Input id="addr-label" placeholder="Home, Work…" {...register("label")} error={errors.label?.message} />
      </div>
      <div>
        <Label htmlFor="addr-fullName">Full name</Label>
        <Input id="addr-fullName" {...register("fullName")} error={errors.fullName?.message} />
      </div>
      <div>
        <Label htmlFor="addr-line1">Street address</Label>
        <Input id="addr-line1" {...register("line1")} error={errors.line1?.message} />
      </div>
      <div>
        <Label htmlFor="addr-line2">Apartment, suite, etc. (optional)</Label>
        <Input id="addr-line2" {...register("line2")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="addr-suburb">Suburb</Label>
          <Input id="addr-suburb" {...register("suburb")} error={errors.suburb?.message} />
        </div>
        <div>
          <Label htmlFor="addr-city">City</Label>
          <Input id="addr-city" {...register("city")} error={errors.city?.message} />
        </div>
        <div>
          <Label htmlFor="addr-province">Province</Label>
          <select
            id="addr-province"
            {...register("province")}
            defaultValue={address?.province ?? ""}
            className="focus-ring h-11 w-full rounded-full border border-sand bg-white px-5 text-sm text-charcoal transition-colors focus-visible:border-charcoal"
          >
            <option value="" disabled>
              Select a province
            </option>
            {southAfricanProvinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          {errors.province && <p className="mt-1.5 text-xs text-error">{errors.province.message}</p>}
        </div>
        <div>
          <Label htmlFor="addr-postalCode">Postal code</Label>
          <Input id="addr-postalCode" inputMode="numeric" {...register("postalCode")} error={errors.postalCode?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="addr-phone">Phone number</Label>
        <Input id="addr-phone" type="tel" {...register("phone")} error={errors.phone?.message} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-porcelain p-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
          <Checkbox checked={isDefaultDelivery} onCheckedChange={setIsDefaultDelivery} />
          Set as default delivery address
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
          <Checkbox checked={isDefaultBilling} onCheckedChange={setIsDefaultBilling} />
          Set as default billing address
        </label>
      </div>

      <div className="mt-1 flex gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={submitting} className="flex-1">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {address ? "Save changes" : "Add address"}
        </Button>
      </div>
    </form>
  );
}
