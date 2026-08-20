import * as React from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  required,
  error,
  description,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
      ) : null}
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Visually hidden honeypot input. Bots fill it; real users never see it. */
export function HoneypotField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label>
        Company
        <input type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  );
}
