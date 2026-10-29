"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { submitEnquiry } from "@/app/actions/enquiry";
import { Field, HoneypotField } from "@/components/forms/fields";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HONEYPOT } from "@/lib/enquiry-schema";
import type { Dict } from "@/lib/i18n";

const MAKES = [
  "Audi", "BMW", "Chevrolet", "Ford", "GWM", "Haval", "Honda", "Hyundai", "Isuzu", "Jeep",
  "Kia", "Land Rover", "Mahindra", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan",
  "Opel", "Renault", "Suzuki", "Toyota", "Volkswagen", "Other",
];

const selectCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const makeSchema = (t: Dict) =>
  z.object({
  name: z.string().trim().min(2, t.form.errName),
  phone: z.string().trim().min(6, t.form.errPhone),
  email: z.union([z.string().trim().email(t.form.errEmail), z.literal("")]).optional(),
  make: z.string().min(1, t.form.errMake),
  model: z.string().trim().min(1, t.form.errModel),
  year: z.string().min(1, t.form.errYear),
  mileage: z.string().trim().min(1, t.form.errMileage),
  transmission: z.string().optional(),
  fuel: z.string().optional(),
  colour: z.string().optional(),
  condition: z.string().optional(),
  expectedPrice: z.string().optional(),
  message: z.string().max(2000).optional(),
  consent: z.literal(true, { message: t.form.errConsent }),
  [HONEYPOT]: z.string().optional(),
});

type Values = z.infer<ReturnType<typeof makeSchema>>;

export function TradeInForm() {
  const { t } = useT();
  const schema = React.useMemo(() => makeSchema(t), [t]);
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
      toast.success(t.form.toastTradeIn);
      reset();
    } else {
      toast.error(res.error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-lg font-bold">{t.form.tradeInSentTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t.form.tradeInSentBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <HoneypotField {...register(HONEYPOT)} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-accent-ink">
          {t.form.yourDetails}
        </legend>
        <Field label={t.form.name} htmlFor="t-name" required error={errors.name?.message}>
          <Input id="t-name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label={t.form.phone} htmlFor="t-phone" required error={errors.phone?.message}>
          <Input id="t-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field label={t.form.email} htmlFor="t-email" error={errors.email?.message} className="sm:col-span-2">
          <Input id="t-email" type="email" autoComplete="email" {...register("email")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-accent-ink">
          {t.form.yourCar}
        </legend>
        <Field label={t.form.make} htmlFor="t-make" required error={errors.make?.message}>
          <select id="t-make" className={selectCls} defaultValue="" {...register("make")}>
            <option value="" disabled>
              {t.form.selectMake}
            </option>
            {MAKES.map((m) => (
              <option key={m} value={m}>
                {m === "Other" ? t.form.otherMake : m}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.form.model} htmlFor="t-model" required error={errors.model?.message}>
          <Input id="t-model" placeholder={t.form.phModel} {...register("model")} />
        </Field>
        <Field label={t.form.year} htmlFor="t-year" required error={errors.year?.message}>
          <select id="t-year" className={selectCls} defaultValue="" {...register("year")}>
            <option value="" disabled>
              {t.form.selectYear}
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.form.mileageKm} htmlFor="t-mileage" required error={errors.mileage?.message}>
          <Input id="t-mileage" inputMode="numeric" placeholder={t.form.phMileage} {...register("mileage")} />
        </Field>
        <Field label={t.form.transmission} htmlFor="t-trans">
          <select id="t-trans" className={selectCls} defaultValue="" {...register("transmission")}>
            <option value=""></option>
            <option value="Automatic">{t.form.automatic}</option>
            <option value="Manual">{t.form.manual}</option>
          </select>
        </Field>
        <Field label={t.form.fuel} htmlFor="t-fuel">
          <select id="t-fuel" className={selectCls} defaultValue="" {...register("fuel")}>
            <option value=""></option>
            <option value="Petrol">{t.form.petrol}</option>
            <option value="Diesel">{t.form.diesel}</option>
          </select>
        </Field>
        <Field label={t.form.colour} htmlFor="t-colour">
          <Input id="t-colour" {...register("colour")} />
        </Field>
        <Field label={t.form.condition} htmlFor="t-cond">
          <select id="t-cond" className={selectCls} defaultValue="" {...register("condition")}>
            <option value=""></option>
            <option value="Excellent">{t.form.conditions.Excellent}</option>
            <option value="Good">{t.form.conditions.Good}</option>
            <option value="Average">{t.form.conditions.Average}</option>
          </select>
        </Field>
        <Field label={t.form.expectedPrice} htmlFor="t-price" className="sm:col-span-2">
          <Input id="t-price" inputMode="numeric" placeholder={t.form.phPrice} {...register("expectedPrice")} />
        </Field>
      </fieldset>

      <Field label={t.form.anythingElse} htmlFor="t-msg">
        <Textarea id="t-msg" rows={3} {...register("message")} />
      </Field>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" style={{ accentColor: "var(--accent)" }} {...register("consent")} />
        <span className="text-muted-foreground">
          {t.form.consentTradeIn}{" "}
          <a href="/privacy" className="text-accent-ink underline">
            {t.form.privacy}
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
        {isSubmitting ? t.form.sending : t.form.requestValuation}
      </Button>
    </form>
  );
}
