"use client";

import type * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/checkout";
import { AddressFields } from "@/components/checkout/AddressFields";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

export function BillingAddressStep({
  deliveryAddress,
  sameAsDelivery,
  onSameAsDeliveryChange,
  defaultValues,
  onBack,
  onNext,
}: {
  deliveryAddress: AddressInput;
  sameAsDelivery: boolean;
  onSameAsDeliveryChange: (value: boolean) => void;
  defaultValues?: Partial<AddressInput>;
  onBack: () => void;
  onNext: (data: AddressInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues ?? deliveryAddress,
  });

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (sameAsDelivery) {
      event.preventDefault();
      onNext(deliveryAddress);
      return;
    }
    void handleSubmit((data) => onNext(data))(event);
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-charcoal">Billing Address</h2>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
        <Checkbox checked={sameAsDelivery} onCheckedChange={onSameAsDeliveryChange} />
        Same as delivery address
      </label>

      {!sameAsDelivery && <AddressFields register={register} errors={errors} idPrefix="billing" />}

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue to payment
        </Button>
      </div>
    </form>
  );
}
