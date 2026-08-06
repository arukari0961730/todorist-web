export function trimText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function normalizeTeamName(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export function nullableTrimmedText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
