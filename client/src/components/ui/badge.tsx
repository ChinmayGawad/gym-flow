import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-white shadow-xs hover:bg-zinc-800",
        secondary:
          "border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        outline: "text-zinc-700 border-zinc-200 bg-white",
        low: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
        moderate: "border-zinc-200 bg-zinc-100 text-zinc-700",
        high: "border-rose-200/80 bg-rose-50 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-slow" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
