"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { profileFormSchema, type ProfileFormInput, type ProfileInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

export function ProfileView() {
  const [profile, setProfile] = React.useState<ProfileInput | null>(null);

  React.useEffect(() => {
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profile?: ProfileInput } | null) => setProfile(data?.profile ?? null));
  }, []);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Profile</h1>
        <p className="mt-1.5 text-sm text-stone">Keep your personal details up to date.</p>
      </div>

      {profile === null ? (
        <div className="h-96 animate-pulse rounded-2xl bg-sand/40" />
      ) : (
        // Mounted only once `profile` is loaded, so defaultValues are
        // correct from the start — no reset-on-fetch effect needed.
        <ProfileForm initial={profile} />
      )}
    </div>
  );
}

function ProfileForm({ initial }: { initial: ProfileInput }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = React.useState(initial.marketingConsent);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormInput>({ resolver: zodResolver(profileFormSchema), defaultValues: initial });

  const onSubmit = async (data: ProfileFormInput) => {
    setSubmitting(true);
    setServerError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, marketingConsent }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(
        body.emailChangePending
          ? "Saved. Check your new email address for a confirmation link to finish updating it."
          : "Your profile has been updated.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {serverError && <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{serverError}</p>}
      {success && (
        <p className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" {...register("firstName")} error={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" {...register("lastName")} error={errors.lastName?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" {...register("email")} error={errors.email?.message} />
        <p className="mt-1.5 text-xs text-stone">Changing this sends a confirmation link to the new address.</p>
      </div>
      <div>
        <Label htmlFor="phone">Mobile number</Label>
        <Input id="phone" type="tel" {...register("phone")} error={errors.phone?.message} />
      </div>
      <div>
        <Label htmlFor="dateOfBirth">Date of birth (optional)</Label>
        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
        <Checkbox checked={marketingConsent} onCheckedChange={setMarketingConsent} />
        Keep me posted on new arrivals, restocks and offers.
      </label>

      <Button type="submit" size="lg" disabled={submitting} className="mt-1 self-start">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
