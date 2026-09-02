"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: "That link is invalid or has expired. Please try again.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/account";
  const linkError = searchParams.get("error");
  const justReset = searchParams.get("reset") === "success";

  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(
    linkError ? (ERROR_MESSAGES[linkError] ?? null) : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      // A same-origin relative path only — never follow an absolute or
      // protocol-relative "redirect" value from the URL (open-redirect
      // guard on a parameter an attacker fully controls).
      const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/account";
      router.push(safeRedirect);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to view your orders, addresses and wishlist."
      footer={
        <span>
          New here?{" "}
          <Link href="/signup" className="focus-ring font-medium text-charcoal underline-offset-2 hover:underline">
            Create an account
          </Link>
        </span>
      }
    >
      {justReset && (
        <p className="mb-5 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
          Your password has been reset. Log in with your new password.
        </p>
      )}

      {serverError && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="focus-ring text-xs text-stone underline-offset-2 hover:text-charcoal hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>

      <SocialLoginButtons />
    </AuthShell>
  );
}
