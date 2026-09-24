import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98]";

    const variants = {
      primary:
        "bg-emerald-700 text-white hover:bg-emerald-800 shadow-md shadow-emerald-900/10 focus:ring-emerald-600 hover:shadow-lg hover:shadow-emerald-900/20",
      secondary:
        "bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-900/10 focus:ring-amber-500",
      outline:
        "border border-stone-300 bg-transparent text-stone-800 hover:bg-stone-100 hover:text-stone-900 focus:ring-stone-400 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800",
      ghost:
        "bg-transparent text-stone-700 hover:bg-stone-100 focus:ring-stone-400 dark:text-stone-300 dark:hover:bg-stone-800",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs tracking-wide",
      md: "h-11 px-6 text-sm tracking-wide",
      lg: "h-14 px-8 text-base tracking-wide font-semibold",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
