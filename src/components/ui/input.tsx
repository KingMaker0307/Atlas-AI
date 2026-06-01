import { useState, useEffect } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-base md:text-sm text-foreground outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/50 focus:bg-input-focus-bg focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background";

export function Input({
  className,
  type,
  onChange,
  value,
  onFocus,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const isControlled = value !== undefined;

  // Local string representation for controlled number inputs to allow easy clearing and decimal typing
  const [localValue, setLocalValue] = useState<string>(() => {
    if (type === "number" && isControlled) {
      if (value === null || value === undefined) return "";
      return String(value);
    }
    return "";
  });

  // Synchronize localValue with external value updates
  useEffect(() => {
    if (type === "number" && isControlled) {
      const propNum = value !== null && value !== undefined && value !== "" ? Number(value) : NaN;
      const localNum = localValue !== "" ? Number(localValue) : NaN;

      if (isNaN(propNum) && isNaN(localNum)) {
        return;
      }
      if (propNum !== localNum) {
        setLocalValue(value === null || value === undefined ? "" : String(value));
      }
    }
  }, [value, type, isControlled, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (type === "number") {
      // Clean leading zeroes only if followed by another digit (e.g. "01" -> "1", but "0" remains "0")
      val = val.replace(/^0+(?=\d)/, "");

      if (isControlled) {
        setLocalValue(val);
      }
      e.target.value = val;
    }

    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === "number") {
      try {
        e.target.select();
      } catch (err) {}
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  if (type === "number" && isControlled) {
    return (
      <input
        className={cn(fieldClass, className)}
        type="number"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        {...props}
      />
    );
  }

  return (
    <input
      className={cn(fieldClass, className)}
      type={type}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24 resize-none", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500", className)}
    >
      {children}
    </label>
  );
}
