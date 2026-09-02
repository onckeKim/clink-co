"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/login?reset=success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      {serverError && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
          <p className="mt-1.5 text-xs text-stone">
            At least 8 characters, with an uppercase letter, a lowercase letter and a number.
          </p>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
