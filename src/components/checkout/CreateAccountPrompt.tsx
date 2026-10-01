"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

const quickSignUpSchema = z.object({
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[a-z]/, "Include a lowercase letter.")
    .regex(/[A-Z]/, "Include an uppercase letter.")
    .regex(/[0-9]/, "Include a number."),
});
type QuickSignUpInput = z.infer<typeof quickSignUpSchema>;

/**
 * Shown on the order confirmation page for a guest checkout — offers to
 * turn the order that was just placed into a real account. Signing up with
 * the same email the order was placed under links this (and any other past
 * guest orders on that email) to the new account automatically — see
 * linkGuestOrdersToUser() in src/lib/orders/store.ts, called from
 * /api/auth/signup regardless of whether email confirmation is pending.
 */
export function CreateAccountPrompt({ email, customerName }: { email: string; customerName: string }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<"confirm" | "ready" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickSignUpInput>({ resolver: zodResolver(quickSignUpSchema) });

  const onSubmit = async (data: QuickSignUpInput) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const [firstName, ...rest] = customerName.split(" ");
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName || customerName,
          lastName: rest.join(" ") || firstName || customerName,
          email,
          password: data.password,
          confirmPassword: data.password,
          marketingConsent: false,
          termsAccepted: true,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(body.needsEmailConfirmation ? "confirm" : "ready");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-sand p-5 text-sm text-stone">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        {done === "confirm" ? (
          <span>
            Account created — check <strong className="text-charcoal">{email}</strong> for a link to verify it, then
            log in to track this order.
          </span>
        ) : (
          <span>
            Account created. <a href="/login" className="underline underline-offset-2">Log in</a> to track this order
            and future ones.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-sand p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-charcoal">
        <UserPlus className="h-4 w-4 text-stone" aria-hidden />
        Create an account to track this order
      </div>
      <p className="mb-4 text-xs text-stone">
        We&apos;ll use <strong className="text-charcoal">{email}</strong> — just set a password.
      </p>

      {serverError && <p className="mb-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{serverError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Label htmlFor="quick-signup-password" className="sr-only">
            Password
          </Label>
          <PasswordInput
            id="quick-signup-password"
            autoComplete="new-password"
            placeholder="Choose a password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>
        <Button type="submit" disabled={submitting} className="sm:mt-0">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </div>
  );
}
