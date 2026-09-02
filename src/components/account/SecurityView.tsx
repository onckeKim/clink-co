"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export function SecurityView() {
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data: ChangePasswordInput) => {
    setSubmitting(true);
    setServerError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/account/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Password &amp; Security</h1>
        <p className="mt-1.5 text-sm text-stone">Change your password to keep your account secure.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {serverError && <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{serverError}</p>}
        {success && (
          <p className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            Your password has been updated.
          </p>
        )}

        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            {...register("currentPassword")}
            error={errors.currentPassword?.message}
          />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            {...register("newPassword")}
            error={errors.newPassword?.message}
          />
          <p className="mt-1.5 text-xs text-stone">
            At least 8 characters, with an uppercase letter, a lowercase letter and a number.
          </p>
        </div>
        <div>
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmNewPassword"
            autoComplete="new-password"
            {...register("confirmNewPassword")}
            error={errors.confirmNewPassword?.message}
          />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-1 self-start">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
