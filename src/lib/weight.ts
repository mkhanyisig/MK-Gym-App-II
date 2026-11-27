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

/** True for a real calendar day written as 'YYYY-MM-DD' (rejects '2026-02-30', '2026-1-5'). */
export function isDayKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** True for a weight that can be stored: a finite number above zero. */
export const isValidWeightKg = (kg: number): boolean => Number.isFinite(kg) && kg > 0;

export type WeightChange = {
  /** latest − previous, in kg. Negative means weight went down. */
  deltaKg: number;
  /** The day of the earlier entry, so the UI can say "since Mon". */
  sinceDate: string;
};

/**
 * Change between the two most recent weigh-ins, in canonical kg.
 * Null with fewer than two entries: a single weight has no trend.
 * Display goes through formatWeight(Math.abs(deltaKg), units) plus a sign.
 */
export function weightChange(latest: WeightEntry | null, previous: WeightEntry | null): WeightChange | null {
  if (!latest || !previous) return null;
  return { deltaKg: latest.weightKg - previous.weightKg, sinceDate: previous.date };
}
