import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: ReactNode;
}

const variants = {
  primary:
    "border-transparent bg-foreground text-background hover:opacity-90 shadow-sm",
  secondary:
    "border-btn-secondary-border bg-btn-secondary text-foreground hover:bg-btn-secondary-hover supports-[backdrop-filter]:backdrop-blur-xl",
  ghost:
    "border-transparent bg-transparent text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white",
  danger:
    "border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-100 dark:hover:bg-red-500/25",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-11 w-11 p-0",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
