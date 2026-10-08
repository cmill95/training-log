// A labeled input with its validation errors underneath.
export function Field({
  label,
  errors,
  ...input
}: { label: string; errors?: string[] } & React.ComponentProps<"input">) {
  const errorId = `${input.name}-error`;
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        {...input}
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? errorId : undefined}
        className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base font-normal dark:border-zinc-700"
      />
      {errors && (
        <span id={errorId} className="text-red-600 dark:text-red-400">
          {errors.join(" ")}
        </span>
      )}
    </label>
  );
}
