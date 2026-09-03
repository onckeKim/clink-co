"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { newsletterSectionSchema, type NewsletterSectionInput } from "@/lib/validations/newsletter";
import { getNewsletterContent } from "@/lib/admin/content-store";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/track";

type Status = "idle" | "success" | "error";

export function NewsletterSection() {
  const content = getNewsletterContent();
  const pathname = usePathname();
  const [status, setStatus] = React.useState<Status>("idle");
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterSectionInput>({
    resolver: zodResolver(newsletterSectionSchema),
    defaultValues: { email: "", consent: false },
  });

  const onSubmit = async (data: NewsletterSectionInput) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) throw new Error("Newsletter signup failed");
      setStatus("success");
      track({ name: "newsletter_signup", location: pathname });
      reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
      <Reveal>
        <div className="overflow-hidden rounded-3xl bg-charcoal px-6 py-16 text-center sm:px-12 sm:py-20">
          <Mail className="mx-auto h-8 w-8 text-champagne" strokeWidth={1.5} />
          <h2 className="font-display mx-auto mt-5 max-w-lg text-display-lg text-warm-white">
            {content.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-warm-white/60">
            {content.description}
          </p>

          {status === "success" ? (
            <div
              role="status"
              className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-2 rounded-full bg-warm-white/10 px-5 py-3 text-sm text-warm-white"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              You&apos;re on the list — welcome to Clink & Co.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mx-auto mt-8 flex max-w-md flex-col gap-4"
              noValidate
            >
              <div>
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email address"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "newsletter-email-error" : undefined}
                  className="border-warm-white/20 bg-warm-white/5 text-warm-white placeholder:text-warm-white/40 focus-visible:border-warm-white"
                  {...register("email")}
                />
                {errors.email && (
                  <p id="newsletter-email-error" className="mt-2 text-left text-xs text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-3 text-left">
                  <Controller
                    control={control}
                    name="consent"
                    render={({ field }) => (
                      <Checkbox
                        id="newsletter-consent"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={Boolean(errors.consent)}
                        aria-describedby={errors.consent ? "newsletter-consent-error" : undefined}
                      />
                    )}
                  />
                  <label htmlFor="newsletter-consent" className="text-xs leading-relaxed text-warm-white/70">
                    I&apos;d like to receive emails from Clink & Co about new arrivals, restocks
                    and offers. I can unsubscribe at any time.
                  </label>
                </div>
                {errors.consent && (
                  <p
                    id="newsletter-consent-error"
                    className="flex items-center gap-1.5 text-left text-xs text-error"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {errors.consent.message}
                  </p>
                )}
              </div>

              {status === "error" && (
                <p role="alert" className="flex items-center gap-1.5 text-xs text-error">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Something went wrong on our end — please try again in a moment.
                </p>
              )}

              <Button type="submit" variant="inverse" size="lg" disabled={isSubmitting} className={cn("w-full")}>
                {isSubmitting ? "Signing you up…" : "Sign up"}
              </Button>
            </form>
          )}

          <p className="mx-auto mt-6 max-w-sm text-xs text-warm-white/40">
            By signing up you agree to our{" "}
            <Link href="/privacy" className="link-underline text-warm-white/60 hover:text-warm-white">
              Privacy Policy
            </Link>
            . We&apos;ll never share your email address.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
