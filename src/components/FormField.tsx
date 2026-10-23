import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  /** Tinggi input lebih kecil (36px), mengikuti Figma halaman Login. */
  compact?: boolean;
};

/** Field input dengan label dan pesan error. Dipakai ulang di Login, Register, dan nanti Edit Profile. */
export default function FormField({ label, error, id, compact = false, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-medium text-neutral-200">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`${compact ? "h-9" : "h-11"} rounded-lg border bg-surface px-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand ${
          error ? "border-red-500" : "border-neutral-800"
        }`}
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
