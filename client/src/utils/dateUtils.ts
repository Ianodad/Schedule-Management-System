export function toIsoString(date: Date): string {
  return date.toISOString()
}

export function fromIsoString(value: string): Date {
  return new Date(value)
}
