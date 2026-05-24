import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/50 focus:bg-black/35";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input className={cn(fieldClass, className)} ref={ref} {...props} />;
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn(fieldClass, "min-h-24 resize-none", className)} ref={ref} {...props} />;
  },
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return <select className={cn(fieldClass, "appearance-none", className)} ref={ref} {...props} />;
  },
);
Select.displayName = "Select";

export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-400", className)}>
      {children}
    </label>
  );
}