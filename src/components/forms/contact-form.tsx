"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { submitEnquiry } from "@/app/actions/enquiry";
import { Field, HoneypotField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HONEYPOT } from "@/lib/enquiry-schema";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  subject: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please enter a message"),
  consent: z.literal(true, { message: "Please accept to continue" }),
  [HONEYPOT]: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { consent: false } as never });

  const onSubmit = async (v: Values) => {
    const res = await submitEnquiry({
      type: "contact",
      name: v.name,
      email: v.email,
      phone: v.phone || "",
      message: v.message,
      consent: v.consent,
      details: v.subject ? { subject: v.subject } : undefined,
      source: "/contact",
      [HONEYPOT]: (v as Record<string, string>)[HONEYPOT] || "",
    });
    if (res.ok) {
      toast.success("Thanks — we'll be in touch shortly.");
      reset();
    } else {
      toast.error(res.error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-lg font-bold">Message sent</p>
        <p className="text-sm text-muted-foreground">Thank you. We&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <HoneypotField {...register(HONEYPOT)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" required error={errors.name?.message}>
          <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Phone" htmlFor="c-phone" error={errors.phone?.message}>
          <Input id="c-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>
      <Field label="Email" htmlFor="c-email" required error={errors.email?.message}>
        <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Subject" htmlFor="c-subject" error={errors.subject?.message}>
        <Input id="c-subject" {...register("subject")} />
      </Field>
      <Field label="Message" htmlFor="c-message" required error={errors.message?.message}>
        <Textarea id="c-message" rows={5} aria-invalid={!!errors.message} {...register("message")} />
      </Field>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" style={{ accentColor: "var(--accent)" }} {...register("consent")} />
        <span className="text-muted-foreground">
          I agree to Amico Motors processing my details per the{" "}
          <a href="/privacy" className="text-accent underline">
            Privacy Policy
          </a>{" "}
          (POPIA).
        </span>
      </label>
      {errors.consent ? (
        <p className="-mt-2 text-xs font-medium text-destructive" role="alert">
          {errors.consent.message}
        </p>
      ) : null}
      <Button type="submit" variant="accent" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
