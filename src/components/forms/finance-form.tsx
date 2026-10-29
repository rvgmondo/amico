"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ShieldCheck } from "lucide-react";
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

const selectCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const makeSchema = (t: Dict) =>
  z.object({
  name: z.string().trim().min(2, t.form.errName),
  phone: z.string().trim().min(6, t.form.errPhone),
  email: z.string().trim().email(t.form.errEmail),
  vehicle: z.string().optional(),
  employment: z.string().optional(),
  income: z.string().optional(),
  deposit: z.string().optional(),
  message: z.string().max(2000).optional(),
  consent: z.literal(true, { message: t.form.errConsent }),
  [HONEYPOT]: z.string().optional(),
});

type Values = z.infer<ReturnType<typeof makeSchema>>;

export function FinanceForm({ vehicleTitle }: { vehicleTitle?: string }) {
  const { t } = useT();
  const schema = React.useMemo(() => makeSchema(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { consent: false, vehicle: vehicleTitle ?? "" } as never,
  });

  const onSubmit = async (v: Values) => {
    const res = await submitEnquiry({
      type: "finance",
      name: v.name,
      phone: v.phone,
      email: v.email,
      message: v.message || "",
      vehicleTitle: v.vehicle || undefined,
      consent: v.consent,
      source: "/finance",
      details: {
        vehicle: v.vehicle,
        employment: v.employment,
        monthlyIncome: v.income,
        depositAvailable: v.deposit,
      },
      [HONEYPOT]: String((v as Record<string, unknown>)[HONEYPOT] ?? ""),
    });
    if (res.ok) {
      toast.success(t.form.toastFinance);
      reset();
    } else {
      toast.error(res.error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-lg font-bold">{t.form.financeSentTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t.form.financeSentBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <HoneypotField {...register(HONEYPOT)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.form.name} htmlFor="f-name" required error={errors.name?.message}>
          <Input id="f-name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label={t.form.phone} htmlFor="f-phone" required error={errors.phone?.message}>
          <Input id="f-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>
      <Field label={t.form.email} htmlFor="f-email" required error={errors.email?.message}>
        <Input id="f-email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label={t.form.vehicleOfInterest} htmlFor="f-vehicle" error={errors.vehicle?.message}>
        <Input id="f-vehicle" placeholder={t.form.phVehicle} {...register("vehicle")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.form.employment} htmlFor="f-emp">
          <select id="f-emp" className={selectCls} defaultValue="" {...register("employment")}>
            <option value="">{t.form.select}</option>
            {["Permanent", "Contract", "Self-employed", "Other"].map((v) => (
              <option key={v} value={v}>
                {t.form.employments[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.form.income} htmlFor="f-income">
          <select id="f-income" className={selectCls} defaultValue="" {...register("income")}>
            <option value="">{t.form.select}</option>
            <option value="< R10 000">{t.form.incomeUnder}</option>
            <option value="R10 000 to R20 000">R10 000 to R20 000</option>
            <option value="R20 000 to R35 000">R20 000 to R35 000</option>
            <option value="R35 000 to R50 000">R35 000 to R50 000</option>
            <option value="R50 000+">R50 000+</option>
          </select>
        </Field>
      </div>
      <Field label={t.form.deposit} htmlFor="f-deposit">
        <Input id="f-deposit" inputMode="numeric" placeholder={t.form.phDeposit} {...register("deposit")} />
      </Field>
      <Field label={t.form.message} htmlFor="f-msg">
        <Textarea id="f-msg" rows={3} {...register("message")} />
      </Field>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-subtle p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>
          {t.form.noIdNote}
        </span>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" style={{ accentColor: "var(--accent)" }} {...register("consent")} />
        <span className="text-muted-foreground">
          {t.form.consentFinance}{" "}
          <a href="/privacy" className="text-accent-ink underline">
            {t.form.privacy}
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
        {isSubmitting ? t.form.sending : t.form.startFinance}
      </Button>
    </form>
  );
}
