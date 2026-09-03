"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { contactFormSchema, ENQUIRY_CATEGORIES, type ContactFormInput } from "@/lib/validations/contact";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "success" | "error";

export function ContactForm({ defaultCategory }: { defaultCategory?: (typeof ENQUIRY_CATEGORIES)[number] }) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      orderNumber: "",
      category: defaultCategory ?? "Order Enquiry",
      message: "",
      consent: false,
      company: "",
    },
  });

  const onSubmit = async (data: ContactFormInput) => {
    setStatus("idle");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(body?.error ?? "Something went wrong — please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      reset({ ...data, name: "", email: "", phone: "", orderNumber: "", message: "", consent: false, company: "" });
    } catch {
      setErrorMessage("Something went wrong — please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-sand bg-porcelain px-6 py-14 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <h2 className="font-display text-xl text-charcoal">Message sent</h2>
        <p className="max-w-sm text-sm leading-relaxed text-stone">
          Thanks for reaching out — our team typically replies within one business day. We&apos;ll get back to you at the email address you gave us.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Full name</Label>
          <Input id="contact-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="mt-1.5 text-xs text-error">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="contact-email">Email address</Label>
          <Input id="contact-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-phone">Phone number (optional)</Label>
          <Input id="contact-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="contact-order">Order number (if applicable)</Label>
          <Input id="contact-order" placeholder="CC-250304-0001" {...register("orderNumber")} />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-category">Enquiry type</Label>
        <Select id="contact-category" aria-invalid={!!errors.category} {...register("category")}>
          {ENQUIRY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        {errors.category && <p className="mt-1.5 text-xs text-error">{errors.category.message}</p>}
      </div>

      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" rows={6} aria-invalid={!!errors.message} {...register("message")} />
        {errors.message && <p className="mt-1.5 text-xs text-error">{errors.message.message}</p>}
      </div>

      {/* Honeypot — hidden from sighted and screen-reader users alike (aria-hidden + tabIndex -1 + off-screen), never legitimately filled in. See POST /api/contact. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className="flex items-start gap-3">
        <Controller
          name="consent"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="contact-consent"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? "contact-consent-error" : undefined}
            />
          )}
        />
        <Label htmlFor="contact-consent" className="mb-0 text-sm font-normal normal-case tracking-normal text-stone">
          I agree that Clink & Co may use these details to respond to my enquiry.
        </Label>
      </div>
      {errors.consent && (
        <p id="contact-consent-error" className="-mt-3 text-xs text-error">
          {errors.consent.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Send Message
      </Button>
    </form>
  );
}
