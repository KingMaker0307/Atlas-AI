import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.035]",
        className,
      )}
      {...props}
    />
  );
}

export function Surface({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-white/10 bg-white/[0.045]", className)}
      {...props}
    />
  );
}