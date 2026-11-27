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

/** Longest countdown the picker allows: 99:59. */
export const MAX_COUNTDOWN_MS = (99 * 60 + 59) * 1000;

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

// ── Display ────────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Stopwatch time: "mm:ss.cc", or "h:mm:ss.cc" from an hour (hundredths, rounded down). */
export function formatStopwatch(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 10));
  const centis = total % 100;
  const seconds = Math.floor(total / 100) % 60;
  const minutes = Math.floor(total / 6000) % 60;
  const hours = Math.floor(total / 360000);
  const base = `${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`;
  return hours > 0 ? `${hours}:${base}` : base;
}

/**
 * Countdown time: "m:ss", rounding up so it shows 0:01 until the last moment and only
 * reads 0:00 when time is actually up.
 */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${pad2(total % 60)}`;
}

/** "1 minute 30 seconds" for screen readers. */
export function spokenDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts = [
    m ? `${m} minute${m === 1 ? '' : 's'}` : '',
    s || !m ? `${s} second${s === 1 ? '' : 's'}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

export type CountdownInput = { ok: true; durationMs: number } | { ok: false; message: string };

/**
 * Parses the custom countdown fields. Blank counts as zero; both fields take whole
 * numbers only (minutes 0–99, seconds 0–59), and the total must be at least 1 second.
 */
export function parseCountdownInput(minutesText: string, secondsText: string): CountdownInput {
  const read = (text: string) => (text.trim() === '' ? 0 : /^\d+$/.test(text.trim()) ? Number(text) : NaN);
  const minutes = read(minutesText);
  const seconds = read(secondsText);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return { ok: false, message: 'Use whole numbers only.' };
  }
  if (minutes > 99 || seconds > 59) {
    return { ok: false, message: 'Up to 99 minutes and 59 seconds.' };
  }
  const durationMs = (minutes * 60 + seconds) * 1000;
  if (!isValidCountdownMs(durationMs)) return { ok: false, message: 'Set at least 1 second.' };
  return { ok: true, durationMs };
}
