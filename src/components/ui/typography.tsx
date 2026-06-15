import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/lib/cn";

export interface TypographyProps<T extends ElementType = "p"> extends HTMLAttributes<HTMLElement> {
  as?: T;
}

export function H1({ className, as, ...props }: TypographyProps<"h1">) {
  const Component = as || "h1";
  return (
    <Component
      className={cn(
        "font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground text-wrap-balance leading-none",
        className
      )}
      {...props}
    />
  );
}

export function H2({ className, as, ...props }: TypographyProps<"h2">) {
  const Component = as || "h2";
  return (
    <Component
      className={cn(
        "font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground text-wrap-balance border-b border-card-border pb-2.5 leading-tight",
        className
      )}
      {...props}
    />
  );
}

export function H3({ className, as, ...props }: TypographyProps<"h3">) {
  const Component = as || "h3";
  return (
    <Component
      className={cn(
        "font-display text-xl font-bold tracking-tight sm:text-2xl text-foreground text-wrap-balance leading-snug",
        className
      )}
      {...props}
    />
  );
}

export function H4({ className, as, ...props }: TypographyProps<"h4">) {
  const Component = as || "h4";
  return (
    <Component
      className={cn(
        "font-display text-lg font-bold tracking-tight sm:text-xl text-foreground text-wrap-balance leading-normal",
        className
      )}
      {...props}
    />
  );
}

export function Lead({ className, as, ...props }: TypographyProps<"p">) {
  const Component = as || "p";
  return (
    <Component
      className={cn(
        "text-xl text-zinc-555 leading-relaxed font-sans text-wrap-pretty",
        className
      )}
      {...props}
    />
  );
}

export function Body({ className, as, ...props }: TypographyProps<"p">) {
  const Component = as || "p";
  return (
    <Component
      className={cn(
        "text-base leading-relaxed text-zinc-755 font-sans text-wrap-pretty",
        className
      )}
      {...props}
    />
  );
}

export function Small({ className, as, ...props }: TypographyProps<"small">) {
  const Component = as || "small";
  return (
    <Component
      className={cn(
        "text-sm font-semibold leading-normal text-zinc-555 font-sans",
        className
      )}
      {...props}
    />
  );
}

export function Muted({ className, as, ...props }: TypographyProps<"p">) {
  const Component = as || "p";
  return (
    <Component
      className={cn(
        "text-sm text-zinc-450 leading-relaxed font-sans text-wrap-pretty",
        className
      )}
      {...props}
    />
  );
}

export function Caption({ className, as, ...props }: TypographyProps<"span">) {
  const Component = as || "span";
  return (
    <Component
      className={cn(
        "text-xs font-bold uppercase tracking-wider text-zinc-450 font-sans block",
        className
      )}
      {...props}
    />
  );
}

// Group under Typography namespace for clean imports
export const Typography = {
  H1,
  H2,
  H3,
  H4,
  Lead,
  Body,
  Small,
  Muted,
  Caption,
};
