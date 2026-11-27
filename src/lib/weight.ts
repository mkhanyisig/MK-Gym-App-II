/**
 * One daily weigh-in, as stored in the `weight_entries` table (see src/db/database.ts).
 * There is at most one entry per local calendar day.
 */
export type WeightEntry = {
  id: number;
  /** Local calendar day, 'YYYY-MM-DD' (the user's day, not the UTC day). */
  date: string;
  /** Canonical metric value at full precision; rounded only for display (formatWeight). */
  weightKg: number;
  /** ISO 8601 UTC timestamp. */
  createdAt: string;
  /** ISO 8601 UTC timestamp; changes when the entry is edited. */
  updatedAt: string;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The local calendar day of `date` as 'YYYY-MM-DD'.
 *
 * Built from local date parts on purpose: `date.toISOString().slice(0, 10)` gives the
 * UTC day, which is already "tomorrow" on a US evening.
 */
export function todayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
