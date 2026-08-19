import * as React from "react";

import { cn } from "@/lib/utils";

/** Centered max-width page gutter. */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-5 sm:px-6 lg:px-8", className)} {...props} />;
}
