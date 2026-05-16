import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-zinc-950/68 shadow-[0_18px_60px_rgba(0,0,0,0.28)] supports-[backdrop-filter]:bg-zinc-950/58 supports-[backdrop-filter]:backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-white/[0.055] p-4",
        className,
      )}
      {...props}
    />
  );
}
