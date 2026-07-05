/** Trim prior-name rows and drop blanks. Keeps the "None" sentinel for research. */
export function normalizePriorBusinessNames(names: string[]): string[] {
  return names.map((n) => n.trim()).filter((n) => n.length > 0)
}
