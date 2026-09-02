import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { AddressInput } from "@/lib/validations/checkout";
import { southAfricanProvinces } from "@/data/provinces";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

/** Shared address form fields — used identically by the delivery and billing steps. */
export function AddressFields({
  register,
  errors,
  idPrefix,
}: {
  register: UseFormRegister<AddressInput>;
  errors: FieldErrors<AddressInput>;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-fullName`}>Full name</Label>
        <Input id={`${idPrefix}-fullName`} {...register("fullName")} error={errors.fullName?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-line1`}>Street address</Label>
        <Input id={`${idPrefix}-line1`} {...register("line1")} error={errors.line1?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-line2`}>Apartment, suite, etc. (optional)</Label>
        <Input id={`${idPrefix}-line2`} {...register("line2")} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-suburb`}>Suburb</Label>
        <Input id={`${idPrefix}-suburb`} {...register("suburb")} error={errors.suburb?.message} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-city`}>City</Label>
        <Input id={`${idPrefix}-city`} {...register("city")} error={errors.city?.message} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-province`}>Province</Label>
        <select
          id={`${idPrefix}-province`}
          {...register("province")}
          defaultValue=""
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
        <Label htmlFor={`${idPrefix}-postalCode`}>Postal code</Label>
        <Input
          id={`${idPrefix}-postalCode`}
          inputMode="numeric"
          {...register("postalCode")}
          error={errors.postalCode?.message}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-phone`}>Phone number</Label>
        <Input id={`${idPrefix}-phone`} type="tel" {...register("phone")} error={errors.phone?.message} />
      </div>
    </div>
  );
}
