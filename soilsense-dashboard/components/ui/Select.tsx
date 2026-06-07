import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[]; placeholder?: string }
>(({ options, placeholder, className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});
Select.displayName = "Select";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-ink-grey",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({
  children,
  required,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-ink-dark mb-1.5", className)}>
      {children}
      {required && <span className="text-alert-red ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-alert-red mt-1">{message}</p>;
}

export function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-ink-grey mt-1">{children}</p>;
}
