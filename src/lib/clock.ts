/**
 * Timing model for the Clock (pure functions, no React, no timers).
 *
 * Time is never counted by ticks. Each clock stores when it last started (`startedAt`,
 * a Date.now() value) plus time already banked while paused, and the current value is
 * computed from the `now` passed in. So it can't drift, and it's correct after the app
 * has been in the background. The UI only re-renders on a tick to show the new value.
 *
 * Built to be reused later for workout duration, rest intervals and timed sets.
 */

export type ClockStatus = 'idle' | 'running' | 'paused';

// ── Stopwatch ──────────────────────────────────────────────────────────────

export type Stopwatch = {
  status: ClockStatus;
  /** When the current running stretch began; null unless running. */
  startedAt: number | null;
  /** Time banked from earlier running stretches. */
  accumulatedMs: number;
  /** Total elapsed time at each lap press, oldest first. */
  lapMarks: number[];
};

export const newStopwatch = (): Stopwatch => ({
  status: 'idle',
  startedAt: null,
  accumulatedMs: 0,
  lapMarks: [],
});

export function stopwatchElapsed(sw: Stopwatch, now: number): number {
  return (
    sw.accumulatedMs + (sw.status === 'running' && sw.startedAt != null ? Math.max(0, now - sw.startedAt) : 0)
  );
}

/** Starts from idle, or resumes from paused. No effect while running. */
export function startStopwatch(sw: Stopwatch, now: number): Stopwatch {
  if (sw.status === 'running') return sw;
  return { ...sw, status: 'running', startedAt: now };
}

export function pauseStopwatch(sw: Stopwatch, now: number): Stopwatch {
  if (sw.status !== 'running') return sw;
  return { ...sw, status: 'paused', startedAt: null, accumulatedMs: stopwatchElapsed(sw, now) };
}

/** Records a lap at the current elapsed time. Only while running. */
export function lapStopwatch(sw: Stopwatch, now: number): Stopwatch {
  if (sw.status !== 'running') return sw;
  return { ...sw, lapMarks: [...sw.lapMarks, stopwatchElapsed(sw, now)] };
}

/** Clears time and laps. Only when paused, so a running stopwatch can't be wiped by accident. */
export function resetStopwatch(sw: Stopwatch): Stopwatch {
  return sw.status === 'paused' ? newStopwatch() : sw;
}

export type Lap = { number: number; durationMs: number };

/**
 * Laps newest first, as the list shows them. Each lap's duration is the time since the
 * previous lap mark. While the stopwatch has started, the in-progress lap comes first.
 */
export function stopwatchLaps(sw: Stopwatch, now: number): Lap[] {
  const marks = sw.lapMarks;
  const laps: Lap[] = marks.map((mark, i) => ({
    number: i + 1,
    durationMs: mark - (i === 0 ? 0 : marks[i - 1]),
  }));
  if (sw.status !== 'idle') {
    laps.push({ number: marks.length + 1, durationMs: stopwatchElapsed(sw, now) - (marks.at(-1) ?? 0) });
  }
  return laps.reverse();
}

// ── Countdown ──────────────────────────────────────────────────────────────

/**
 * Longest countdown the picker allows: 23:59:59 (hours 0–23). It was 99:59 before the
 * hour wheel; saved countdowns from then are all shorter, so they still restore.
 */
export const MAX_COUNTDOWN_MS = ((23 * 60 + 59) * 60 + 59) * 1000;

export type Countdown = {
  status: ClockStatus;
  /** The chosen length; Reset returns to it. */
  durationMs: number;
  /** When the running stretch ends; null unless running. */
  endsAt: number | null;
  /** Time left when not running (idle: the full duration; paused: what was left). */
  remainingMs: number;
};

export const isValidCountdownMs = (ms: number) => Number.isFinite(ms) && ms >= 1000 && ms <= MAX_COUNTDOWN_MS;

export const newCountdown = (durationMs: number): Countdown => {
  const safe = isValidCountdownMs(durationMs) ? Math.round(durationMs) : 60_000;
  return { status: 'idle', durationMs: safe, endsAt: null, remainingMs: safe };
};

/**
 * Time left, never below zero, and never more than was left when it last started (so a
 * stale or earlier `now` can't show extra time).
 */
export function countdownRemaining(cd: Countdown, now: number): number {
  if (cd.status === 'running' && cd.endsAt != null) {
    return Math.min(cd.remainingMs, Math.max(0, cd.endsAt - now));
  }
  return Math.max(0, cd.remainingMs);
}

/** A countdown has finished once it has been started and reached zero. */
export const countdownDone = (cd: Countdown, now: number) =>
  cd.status !== 'idle' && countdownRemaining(cd, now) === 0;

/** Chooses a new length. Only while idle (not mid-countdown); invalid lengths are ignored. */
export function setCountdownDuration(cd: Countdown, durationMs: number): Countdown {
  if (cd.status !== 'idle' || !isValidCountdownMs(durationMs)) return cd;
  return newCountdown(durationMs);
}

/** Starts from idle, or resumes from paused. No effect while running or once finished. */
export function startCountdown(cd: Countdown, now: number): Countdown {
  if (cd.status === 'running' || countdownDone(cd, now)) return cd;
  return { ...cd, status: 'running', endsAt: now + countdownRemaining(cd, now) };
}

export function pauseCountdown(cd: Countdown, now: number): Countdown {
  if (cd.status !== 'running' || countdownDone(cd, now)) return cd;
  return { ...cd, status: 'paused', endsAt: null, remainingMs: countdownRemaining(cd, now) };
}

/** Back to the full chosen length, ready to start again. */
export const resetCountdown = (cd: Countdown): Countdown => newCountdown(cd.durationMs);

/**
 * How much of the countdown is left, from 1 (full, not started) to 0 (finished), for the
 * progress ring. It follows the remaining time, so it freezes while paused and is
 * correct straight after the app returns from the background.
 */
export function countdownProgress(cd: Countdown, now: number): number {
  return Math.min(1, Math.max(0, countdownRemaining(cd, now) / cd.durationMs));
}

export type DurationParts = { hours: number; minutes: number; seconds: number };

/** Splits a duration into whole hours, minutes and seconds (for the picker wheels). */
export function splitDuration(ms: number): DurationParts {
  const total = Math.max(0, Math.round(ms / 1000));
  return { hours: Math.floor(total / 3600), minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
}

/** The duration in ms for whole hours, minutes and seconds (the inverse of splitDuration). */
export const joinDuration = ({ hours, minutes, seconds }: DurationParts): number =>
  ((hours * 60 + minutes) * 60 + seconds) * 1000;

// ── Display ────────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, '0');

export const HOUR_MS = 3_600_000;

/**
 * Stopwatch time, always three units:
 * - under an hour: "mm:ss.cc" (minutes, seconds, hundredths), e.g. "00:31.42";
 * - from an hour: "hh:mm:ss", e.g. "01:02:03".
 * The dot marks hundredths, so "00:31.42" can't be mistaken for 31 minutes 42 seconds.
 * Every unit rounds down: a second (or hundredth) only counts once it has passed.
 */
export function formatStopwatch(ms: number): string {
  const safe = Math.max(0, ms);
  const { hours, minutes, seconds } = splitDuration(Math.floor(safe / 1000) * 1000);
  if (safe >= HOUR_MS) return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return `${pad2(minutes)}:${pad2(seconds)}.${pad2(Math.floor(safe / 10) % 100)}`;
}

/** Elapsed time for screen readers, in whole seconds (hundredths would be noise). */
export const spokenElapsed = (ms: number): string =>
  spokenDuration(Math.floor(Math.max(0, ms) / 1000) * 1000);

/**
 * Countdown time: "mm:ss", or "hh:mm:ss" from an hour (like the stopwatch). Rounds up, so it shows 00:01 until
 * the last moment and only reads 00:00 when time is actually up.
 */
export function formatCountdown(ms: number): string {
  const { hours, minutes, seconds } = splitDuration(Math.ceil(Math.max(0, ms) / 1000) * 1000);
  const base = `${pad2(minutes)}:${pad2(seconds)}`;
  return hours > 0 ? `${pad2(hours)}:${base}` : base;
}

/** "1 hour 1 minute 30 seconds" for screen readers (zero parts left out). */
export function spokenDuration(ms: number): string {
  const { hours, minutes, seconds } = splitDuration(Math.ceil(Math.max(0, ms) / 1000) * 1000);
  const unit = (n: number, word: string) => (n ? `${n} ${word}${n === 1 ? '' : 's'}` : '');
  const parts = [unit(hours, 'hour'), unit(minutes, 'minute'), unit(seconds, 'second')].filter(Boolean);
  return parts.length ? parts.join(' ') : '0 seconds';
}

// ── Background alert and persistence ───────────────────────────────────────

/** When a background "Time's up" alert should fire: the end time of a running countdown that hasn't ended. */
export function countdownAlertAt(cd: Countdown, now: number): number | null {
  return cd.status === 'running' && cd.endsAt != null && cd.endsAt > now ? cd.endsAt : null;
}

const isStatus = (v: unknown): v is ClockStatus => v === 'idle' || v === 'running' || v === 'paused';
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * A saved stopwatch read back from storage, or null if it isn't a consistent one. Saved
 * clocks are timestamps, so a stopwatch left running keeps counting while the app is closed.
 */
export function restoreStopwatch(value: unknown): Stopwatch | null {
  if (!isRecord(value) || !isStatus(value.status) || !isTime(value.accumulatedMs)) return null;
  const { status, accumulatedMs, startedAt, lapMarks } = value;
  if (!Array.isArray(lapMarks) || !lapMarks.every(isTime)) return null;
  if (status === 'running' ? !isTime(startedAt) : startedAt !== null) return null;
  if (status === 'idle' && (accumulatedMs !== 0 || lapMarks.length > 0)) return null;
  return { status, accumulatedMs, startedAt: status === 'running' ? (startedAt as number) : null, lapMarks };
}

/** A saved countdown read back from storage, or null if it isn't a consistent one. */
export function restoreCountdown(value: unknown): Countdown | null {
  if (!isRecord(value) || !isStatus(value.status) || !isTime(value.remainingMs)) return null;
  const { status, durationMs, remainingMs, endsAt } = value;
  if (typeof durationMs !== 'number' || !isValidCountdownMs(durationMs) || remainingMs > durationMs)
    return null;
  if (status === 'running' ? !isTime(endsAt) : endsAt !== null) return null;
  if (status === 'idle' && remainingMs !== durationMs) return null;
  return { status, durationMs, remainingMs, endsAt: status === 'running' ? (endsAt as number) : null };
}
