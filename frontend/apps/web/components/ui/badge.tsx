import * as React from "react";

import { cn } from "@/lib/utils";

const badgeClasses: Record<string, string> = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-700",
  destructive: "bg-rose-100 text-rose-700",
  outline: "border border-slate-200 text-slate-700",
};

function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: keyof typeof badgeClasses }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium",
        badgeClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
