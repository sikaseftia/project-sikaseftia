import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  /** Tinggi input lebih kecil (36px), mengikuti Figma halaman Login. */
  compact?: boolean;
};

/** Field input dengan label dan pesan error. Dipakai ulang di Login, Register, dan nanti Edit Profile. */
export default function FormField({ label, error, id, compact = false, className, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-medium text-neutral-200">
        {label}
      </label>
      <Input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          compact ? "h-9" : "h-11",
          "rounded-lg bg-surface px-3 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-brand focus-visible:ring-2 focus-visible:ring-brand",
          error ? "border-red-500" : "border-neutral-800",
          className,
        )}
        {...inputProps}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
