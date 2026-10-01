"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerDetailsSchema, type CustomerDetailsInput } from "@/lib/validations/checkout";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

export function CustomerDetailsStep({
  defaultValues,
  marketingConsent,
  onMarketingConsentChange,
  onNext,
}: {
  defaultValues?: Partial<CustomerDetailsInput>;
  marketingConsent: boolean;
  onMarketingConsentChange: (value: boolean) => void;
  onNext: (data: CustomerDetailsInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerDetailsInput>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl text-charcoal">Customer Details</h2>
        <p className="mt-1 text-sm text-stone">Checking out as a guest — no account needed.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" {...register("firstName")} error={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" {...register("lastName")} error={errors.lastName?.message} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" {...register("email")} error={errors.email?.message} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" {...register("phone")} error={errors.phone?.message} />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
        <Checkbox checked={marketingConsent} onCheckedChange={onMarketingConsentChange} />
        Keep me posted on new arrivals, restocks and offers.
      </label>

      <Button type="submit" size="lg" className="self-start">
        Continue to delivery address
      </Button>
    </form>
  );
}
