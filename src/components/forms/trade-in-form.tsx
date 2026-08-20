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
import { HONEYPOT } from "@/lib/enquiry-schema";

const MAKES = [
  "Audi", "BMW", "Chevrolet", "Ford", "GWM", "Haval", "Honda", "Hyundai", "Isuzu", "Jeep",
  "Kia", "Land Rover", "Mahindra", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan",
  "Opel", "Renault", "Suzuki", "Toyota", "Volkswagen", "Other",
];

const selectCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).optional(),
  make: z.string().min(1, "Select a make"),
  model: z.string().trim().min(1, "Enter the model"),
  year: z.string().min(1, "Select a year"),
  mileage: z.string().trim().min(1, "Enter the mileage"),
  transmission: z.string().optional(),
  fuel: z.string().optional(),
  colour: z.string().optional(),
  condition: z.string().optional(),
  expectedPrice: z.string().optional(),
  message: z.string().max(2000).optional(),
  consent: z.literal(true, { message: "Please accept to continue" }),
  [HONEYPOT]: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function TradeInForm() {
  const years = React.useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: now - 1994 }, (_, i) => now - i);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { consent: false } as never });

  const onSubmit = async (v: Values) => {
    const res = await submitEnquiry({
      type: "trade-in",
      name: v.name,
      phone: v.phone,
      email: v.email || "",
      message: v.message || "",
      consent: v.consent,
      source: "/sell-your-car",
      details: {
        make: v.make,
        model: v.model,
        year: v.year,
        mileage: v.mileage,
        transmission: v.transmission,
        fuel: v.fuel,
        colour: v.colour,
        condition: v.condition,
        expectedPrice: v.expectedPrice,
      },
      [HONEYPOT]: String((v as Record<string, unknown>)[HONEYPOT] ?? ""),
    });
    if (res.ok) {
      toast.success("Thanks — we'll value your car and be in touch.");
      reset();
    } else {
      toast.error(res.error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-lg font-bold">Request received</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Thank you. We&apos;ll review your car&apos;s details and contact you with a valuation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <HoneypotField {...register(HONEYPOT)} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-accent">
          Your details
        </legend>
        <Field label="Name" htmlFor="t-name" required error={errors.name?.message}>
          <Input id="t-name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Phone" htmlFor="t-phone" required error={errors.phone?.message}>
          <Input id="t-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="t-email" error={errors.email?.message} className="sm:col-span-2">
          <Input id="t-email" type="email" autoComplete="email" {...register("email")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-accent">
          Your car
        </legend>
        <Field label="Make" htmlFor="t-make" required error={errors.make?.message}>
          <select id="t-make" className={selectCls} defaultValue="" {...register("make")}>
            <option value="" disabled>
              Select make
            </option>
            {MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model" htmlFor="t-model" required error={errors.model?.message}>
          <Input id="t-model" placeholder="e.g. Ranger" {...register("model")} />
        </Field>
        <Field label="Year" htmlFor="t-year" required error={errors.year?.message}>
          <select id="t-year" className={selectCls} defaultValue="" {...register("year")}>
            <option value="" disabled>
              Select year
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mileage (km)" htmlFor="t-mileage" required error={errors.mileage?.message}>
          <Input id="t-mileage" inputMode="numeric" placeholder="e.g. 120000" {...register("mileage")} />
        </Field>
        <Field label="Transmission" htmlFor="t-trans">
          <select id="t-trans" className={selectCls} defaultValue="" {...register("transmission")}>
            <option value="">—</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </Field>
        <Field label="Fuel" htmlFor="t-fuel">
          <select id="t-fuel" className={selectCls} defaultValue="" {...register("fuel")}>
            <option value="">—</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
          </select>
        </Field>
        <Field label="Colour" htmlFor="t-colour">
          <Input id="t-colour" {...register("colour")} />
        </Field>
        <Field label="Condition" htmlFor="t-cond">
          <select id="t-cond" className={selectCls} defaultValue="" {...register("condition")}>
            <option value="">—</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
          </select>
        </Field>
        <Field label="Expected price" htmlFor="t-price" className="sm:col-span-2">
          <Input id="t-price" inputMode="numeric" placeholder="e.g. 150000" {...register("expectedPrice")} />
        </Field>
      </fieldset>

      <Field label="Anything else we should know?" htmlFor="t-msg">
        <Textarea id="t-msg" rows={3} {...register("message")} />
      </Field>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" style={{ accentColor: "var(--accent)" }} {...register("consent")} />
        <span className="text-muted-foreground">
          I agree to Amico Motors contacting me about this valuation and processing my details per the{" "}
          <a href="/privacy" className="text-accent underline">
            Privacy Policy
          </a>{" "}
          (POPIA).
        </span>
      </label>
      {errors.consent ? (
        <p className="-mt-3 text-xs font-medium text-destructive" role="alert">
          {errors.consent.message}
        </p>
      ) : null}

      <Button type="submit" variant="accent" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Sending…" : "Request a valuation"}
      </Button>
    </form>
  );
}
