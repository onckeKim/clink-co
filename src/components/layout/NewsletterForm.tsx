"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/newsletter";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className }: { className?: string }) {
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  const onSubmit = async (data: NewsletterInput) => {
    // TODO: wire up to Supabase (e.g. an `subscribers` table or edge function)
    // once NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Newsletter signup:", data.email);
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-warm-white", className)}>
        <Check className="h-4 w-4" /> You&apos;re on the list — welcome to Clink & Co.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("w-full", className)} noValidate>
      <div className="flex items-center gap-2 rounded-full border border-warm-white/25 bg-warm-white/5 p-1.5 pl-5 focus-within:border-warm-white/60">
        <input
          type="email"
          placeholder="Your email address"
          className="focus-ring h-9 w-full bg-transparent text-sm text-warm-white placeholder:text-warm-white/40"
          aria-label="Email address"
          {...register("email")}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Subscribe"
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm-white text-charcoal transition-transform hover:scale-105 disabled:opacity-60"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {errors.email && <p className="mt-2 text-xs text-champagne-ink">{errors.email.message}</p>}
    </form>
  );
}
