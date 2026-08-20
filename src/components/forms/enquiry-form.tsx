"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { submitEnquiry } from "@/app/actions/enquiry";
import { Field, HoneypotField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HONEYPOT, type EnquiryType } from "@/lib/enquiry-schema";

export function EnquiryForm({
  type = "vehicle",
  vehicle,
  source,
  compact = false,
  onSuccess,
}: {
  type?: EnquiryType;
  vehicle?: { id: number; title: string };
  source?: string;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const isTestDrive = type === "test-drive";

  const schema = React.useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, "Please enter your name"),
          phone: z.string().trim().optional().or(z.literal("")),
          email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).optional(),
          preferredDate: z.string().optional().or(z.literal("")),
          message: z.string().max(2000).optional().or(z.literal("")),
          consent: z.literal(true, { message: "Please accept to continue" }),
          [HONEYPOT]: z.string().optional(),
        })
        .refine((d) => Boolean(d.email) || Boolean(d.phone), {
          message: "Provide an email or phone number",
          path: ["phone"],
        })
        .refine((d) => !isTestDrive || Boolean(d.preferredDate), {
          message: "Please choose a preferred date",
          path: ["preferredDate"],
        }),
    [isTestDrive],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { consent: false } as never });

  const onSubmit = async (values: FormValues) => {
    const res = await submitEnquiry({
      type,
      name: values.name,
      email: values.email || "",
      phone: values.phone || "",
      message: values.message || "",
      preferredDate: values.preferredDate || undefined,
      vehicleId: vehicle?.id,
      vehicleTitle: vehicle?.title,
      consent: values.consent,
      source: source || (typeof window !== "undefined" ? window.location.pathname : undefined),
      [HONEYPOT]: String((values as Record<string, unknown>)[HONEYPOT] ?? ""),
    });
    if (res.ok) {
      toast.success("Thanks — we'll be in touch shortly.");
      reset();
      onSuccess?.();
    } else {
      toast.error(res.error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-lg font-bold">Enquiry sent</p>
        <p className="text-sm text-muted-foreground">
          Thank you. A member of the Amico Motors team will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {vehicle ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Enquiring about <span className="font-semibold text-foreground">{vehicle.title}</span>
        </p>
      ) : null}

      <HoneypotField {...register(HONEYPOT)} />

      <Field label="Name" htmlFor="eq-name" required error={errors.name?.message}>
        <Input id="eq-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>

      <div className={compact ? "flex flex-col gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label="Phone" htmlFor="eq-phone" error={errors.phone?.message}>
          <Input id="eq-phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="eq-email" error={errors.email?.message}>
          <Input id="eq-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
      </div>

      {isTestDrive ? (
        <Field label="Preferred date" htmlFor="eq-date" required error={errors.preferredDate?.message}>
          <Input id="eq-date" type="date" aria-invalid={!!errors.preferredDate} {...register("preferredDate")} />
        </Field>
      ) : null}

      <Field label="Message" htmlFor="eq-msg" error={errors.message?.message}>
        <Textarea
          id="eq-msg"
          rows={compact ? 3 : 4}
          placeholder={isTestDrive ? "Any preferred time or questions?" : "How can we help?"}
          {...register("message")}
        />
      </Field>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          style={{ accentColor: "var(--accent)" }}
          aria-invalid={!!errors.consent}
          {...register("consent")}
        />
        <span className="text-muted-foreground">
          I agree that Amico Motors may contact me about this enquiry and process my details per the{" "}
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

      <Button type="submit" variant="accent" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : isTestDrive ? "Book test drive" : "Send enquiry"}
      </Button>
    </form>
  );
}
