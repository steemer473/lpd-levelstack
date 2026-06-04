import type { FieldPath, UseFormSetError } from "react-hook-form"
import type { ZodError } from "zod"

export function applyZodErrors<T extends Record<string, unknown>>(
  setError: UseFormSetError<T>,
  error: ZodError,
): string[] {
  const messages: string[] = []

  for (const issue of error.issues) {
    messages.push(issue.message)
    if (issue.path.length === 0) continue

    const name = issue.path.join(".") as FieldPath<T>
    setError(name, { type: "manual", message: issue.message })
  }

  return messages
}
