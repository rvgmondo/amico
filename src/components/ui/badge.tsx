import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        navy: "bg-primary text-primary-foreground",
        gold: "bg-accent text-accent-foreground",
        goldSoft: "bg-accent/15 text-accent-foreground",
        sale: "bg-destructive text-destructive-foreground",
        success: "bg-success/15 text-success",
        outline: "border border-border text-foreground",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
