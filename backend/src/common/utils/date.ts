export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  if (!DATE_PATTERN.test(value)) {
    throw new Error('Invalid date format');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('Invalid calendar date');
  }
  return date;
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
