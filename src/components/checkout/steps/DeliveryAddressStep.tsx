"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/checkout";
import { AddressFields } from "@/components/checkout/AddressFields";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function DeliveryAddressStep({
  defaultValues,
  shippingNotes,
  giftMessage,
  onShippingNotesChange,
  onGiftMessageChange,
  onBack,
  onNext,
}: {
  defaultValues?: Partial<AddressInput>;
  shippingNotes: string;
  giftMessage: string;
  onShippingNotesChange: (value: string) => void;
  onGiftMessageChange: (value: string) => void;
  onBack: () => void;
  onNext: (data: AddressInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-charcoal">Delivery Address</h2>
      <AddressFields register={register} errors={errors} idPrefix="delivery" />

      <div>
        <Label htmlFor="shippingNotes">Shipping notes (optional)</Label>
        <Textarea
          id="shippingNotes"
          rows={2}
          maxLength={500}
          value={shippingNotes}
          onChange={(e) => onShippingNotesChange(e.target.value)}
          placeholder="Gate code, landmark, safe place to leave a parcel…"
        />
      </div>
      <div>
        <Label htmlFor="giftMessage">Gift message (optional)</Label>
        <Textarea
          id="giftMessage"
          rows={2}
          maxLength={300}
          value={giftMessage}
          onChange={(e) => onGiftMessageChange(e.target.value)}
          placeholder="Add a note to include with the order"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue to delivery method
        </Button>
      </div>
    </form>
  );
}
