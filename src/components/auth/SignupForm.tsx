"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, MailCheck } from "lucide-react";
import { signUpFormSchema, type SignUpFormInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = React.useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormInput>({ resolver: zodResolver(signUpFormSchema) });

  const onSubmit = async (data: SignUpFormInput) => {
    setAttemptedSubmit(true);
    if (!termsAccepted) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, marketingConsent, termsAccepted }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (body.needsEmailConfirmation) {
        setConfirmationSent(data.email);
      } else {
        router.push("/account");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthShell title="Check your inbox">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-porcelain">
            <MailCheck className="h-5 w-5 text-charcoal" aria-hidden />
          </div>
          <p className="text-sm text-stone">
            We&apos;ve sent a confirmation link to <strong className="text-charcoal">{confirmationSent}</strong>. Click it
            to activate your account, then log in.
          </p>
          <Link href="/login" className="focus-ring text-sm font-medium text-charcoal underline-offset-2 hover:underline">
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track orders, save addresses and check out faster next time."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="focus-ring font-medium text-charcoal underline-offset-2 hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      {serverError && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" autoComplete="given-name" {...register("firstName")} error={errors.firstName?.message} />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" autoComplete="family-name" {...register("lastName")} error={errors.lastName?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
          <Checkbox checked={marketingConsent} onCheckedChange={setMarketingConsent} />
          Keep me posted on new arrivals, restocks and offers.
        </label>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              aria-invalid={attemptedSubmit && !termsAccepted}
            />
            <span>
              I agree to the <Link href="/terms" className="underline underline-offset-2">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
            </span>
          </label>
          {attemptedSubmit && !termsAccepted && (
            <p className="mt-1.5 text-xs text-error">You must accept the Terms of Service and Privacy Policy.</p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <SocialLoginButtons />
    </AuthShell>
  );
}
