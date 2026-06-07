export function splitFullName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim()
  if (!trimmed) {
    return { firstName: "LevelStack", lastName: "Lead" }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "Lead" }
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  }
}
