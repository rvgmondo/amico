"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { submitEnquiry } from "@/app/actions/enquiry";
import { Field, HoneypotField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HONEYPOT } from "@/lib/enquiry-schema";

const selectCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address"),
  vehicle: z.string().optional(),
  employment: z.string().optional(),
  income: z.string().optional(),
  deposit: z.string().optional(),
  message: z.string().max(2000).optional(),
  consent: z.literal(true, { message: "Please accept to continue" }),
  [HONEYPOT]: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function FinanceForm({ vehicleTitle }: { vehicleTitle?: string }) {
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
      toast.success("Thanks — our finance team will contact you.");
      reset();
    } else {
      toast.error(res.error);
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-lg font-bold">Application started</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Thank you. Our finance team will be in touch to complete your pre-approval securely.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <HoneypotField {...register(HONEYPOT)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="f-name" required error={errors.name?.message}>
          <Input id="f-name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Phone" htmlFor="f-phone" required error={errors.phone?.message}>
          <Input id="f-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>
      <Field label="Email" htmlFor="f-email" required error={errors.email?.message}>
        <Input id="f-email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Vehicle of interest" htmlFor="f-vehicle" error={errors.vehicle?.message}>
        <Input id="f-vehicle" placeholder="e.g. Ford Ranger XLT" {...register("vehicle")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Employment" htmlFor="f-emp">
          <select id="f-emp" className={selectCls} defaultValue="" {...register("employment")}>
            <option value="">Select</option>
            <option value="Permanent">Permanently employed</option>
            <option value="Contract">Contract</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Gross monthly income" htmlFor="f-income">
          <select id="f-income" className={selectCls} defaultValue="" {...register("income")}>
            <option value="">Select</option>
            <option value="< R10 000">Under R10 000</option>
            <option value="R10 000 – R20 000">R10 000 – R20 000</option>
            <option value="R20 000 – R35 000">R20 000 – R35 000</option>
            <option value="R35 000 – R50 000">R35 000 – R50 000</option>
            <option value="R50 000+">R50 000+</option>
          </select>
        </Field>
      </div>
      <Field label="Deposit available" htmlFor="f-deposit">
        <Input id="f-deposit" inputMode="numeric" placeholder="e.g. 25000" {...register("deposit")} />
      </Field>
      <Field label="Message" htmlFor="f-msg">
        <Textarea id="f-msg" rows={3} {...register("message")} />
      </Field>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-subtle p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>
          Please don&apos;t enter your ID number or bank details here. Our team will collect the
          documents needed for your application (proof of income and address) securely.
        </span>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" style={{ accentColor: "var(--accent)" }} {...register("consent")} />
        <span className="text-muted-foreground">
          I agree to Amico Motors contacting me about vehicle finance and processing my details per
          the{" "}
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
        {isSubmitting ? "Sending…" : "Start finance application"}
      </Button>
    </form>
  );
}
