// Shared by every form's server action and its useActionState hook.
export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  // React clears a form after its action runs; these refill the fields.
  // Never includes a password.
  values?: Record<string, string>;
};

// Reads the named fields from FormData as strings ("" when missing).
export function fields(formData: FormData, names: string[]) {
  return Object.fromEntries(
    names.map((name) => [name, String(formData.get(name) ?? "")]),
  );
}
