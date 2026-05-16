import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: ReactNode;
}

const variants = {
  primary:
    "border-white/10 bg-white text-zinc-950 shadow-[0_12px_40px_rgba(255,255,255,0.12)] hover:bg-zinc-100",
  secondary:
    "border-white/10 bg-white/10 text-white hover:bg-white/15 supports-[backdrop-filter]:backdrop-blur-xl",
  ghost: "border-transparent bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white",
  danger:
    "border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/25",
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
