import {
  countdownDone,
  countdownProgress,
  countdownRemaining,
  formatCountdown,
  formatStopwatch,
  isValidCountdownMs,
  joinDuration,
  lapStopwatch,
  MAX_COUNTDOWN_MS,
  newCountdown,
  newStopwatch,
  pauseCountdown,
  pauseStopwatch,
  resetCountdown,
  resetStopwatch,
  restoreCountdown,
  restoreStopwatch,
  setCountdownDuration,
  splitDuration,
  spokenDuration,
  spokenElapsed,
  startCountdown,
  startStopwatch,
  stopwatchElapsed,
  stopwatchLaps,
} from '@/lib/clock';

// `now` values are plain millisecond timestamps; nothing here reads the real clock.

describe('stopwatch', () => {
  it('counts from start, holds while paused, and continues on resume', () => {
    let sw = startStopwatch(newStopwatch(), 1_000);
    expect(stopwatchElapsed(sw, 4_000)).toBe(3_000);

    sw = pauseStopwatch(sw, 4_000);
    expect(stopwatchElapsed(sw, 60_000)).toBe(3_000); // paused: time doesn't move

    sw = startStopwatch(sw, 60_000); // resume
    expect(stopwatchElapsed(sw, 62_500)).toBe(5_500);
  });

  it('stays accurate across a long background gap (no ticks needed)', () => {
    const sw = startStopwatch(newStopwatch(), 0);
    expect(stopwatchElapsed(sw, 2 * 60 * 60 * 1000)).toBe(7_200_000);
  });

  it('ignores repeated starts and pauses', () => {
    const running = startStopwatch(newStopwatch(), 1_000);
    expect(startStopwatch(running, 5_000)).toBe(running);
    expect(pauseStopwatch(newStopwatch(), 5_000)).toEqual(newStopwatch());
  });

  it('only resets when paused, clearing time and laps', () => {
    let sw = lapStopwatch(startStopwatch(newStopwatch(), 0), 1_000);
    expect(resetStopwatch(sw)).toBe(sw); // running: reset is ignored
    sw = pauseStopwatch(sw, 2_000);
    expect(resetStopwatch(sw)).toEqual(newStopwatch());
  });

  it('records laps as the time between lap presses, newest first, with the current lap on top', () => {
    let sw = startStopwatch(newStopwatch(), 0);
    sw = lapStopwatch(sw, 10_000); // lap 1: 10 s
    sw = lapStopwatch(sw, 25_000); // lap 2: 15 s
    expect(stopwatchLaps(sw, 31_000)).toEqual([
      { number: 3, durationMs: 6_000 }, // in progress
      { number: 2, durationMs: 15_000 },
      { number: 1, durationMs: 10_000 },
    ]);
  });

  it('lap times exclude paused time, and laps only record while running', () => {
    let sw = startStopwatch(newStopwatch(), 0);
    sw = pauseStopwatch(sw, 5_000);
    expect(lapStopwatch(sw, 9_000)).toBe(sw); // paused: no lap
    sw = startStopwatch(sw, 100_000);
    sw = lapStopwatch(sw, 102_000);
    expect(stopwatchLaps(sw, 102_000)[1]).toEqual({ number: 1, durationMs: 7_000 });
  });

  it('has no laps before it starts', () => {
    expect(stopwatchLaps(newStopwatch(), 1_000)).toEqual([]);
  });
});

describe('countdown', () => {
  it('counts down from the chosen length, holds while paused, and resumes correctly', () => {
    let cd = startCountdown(newCountdown(90_000), 0);
    expect(countdownRemaining(cd, 30_000)).toBe(60_000);

    cd = pauseCountdown(cd, 30_000);
    expect(countdownRemaining(cd, 500_000)).toBe(60_000); // paused: no change

    cd = startCountdown(cd, 500_000); // resume
    expect(countdownRemaining(cd, 520_000)).toBe(40_000);
  });

  it('stops at zero, never negative, and reports completion', () => {
    const cd = startCountdown(newCountdown(30_000), 0);
    expect(countdownDone(cd, 29_999)).toBe(false);
    expect(countdownRemaining(cd, 30_000)).toBe(0);
    expect(countdownRemaining(cd, 10 * 60_000)).toBe(0); // long after, e.g. in the background
    expect(countdownDone(cd, 45_000)).toBe(true);
  });

  it('cannot be paused or restarted once finished, and Reset restores the chosen length', () => {
    const done = startCountdown(newCountdown(30_000), 0);
    expect(pauseCountdown(done, 40_000)).toBe(done);
    expect(startCountdown(done, 40_000)).toBe(done);
    const reset = resetCountdown(done);
    expect(reset).toEqual(newCountdown(30_000));
    expect(countdownRemaining(reset, 99_999)).toBe(30_000);
  });

  it('only changes length while idle, and rejects invalid lengths', () => {
    const idle = newCountdown(60_000);
    expect(setCountdownDuration(idle, 90_000).durationMs).toBe(90_000);
    for (const bad of [0, -5_000, 500, Number.NaN, MAX_COUNTDOWN_MS + 1000]) {
      expect(setCountdownDuration(idle, bad)).toBe(idle);
    }
    const running = startCountdown(idle, 0);
    expect(setCountdownDuration(running, 30_000)).toBe(running);
  });

  it('falls back to a minute when created with an invalid length', () => {
    expect(newCountdown(0).durationMs).toBe(60_000);
  });
});

describe('switching modes', () => {
  it('stopwatch and countdown are independent values, so one never resets the other', () => {
    // The Clock screen keeps both; switching mode only changes which one is shown.
    let sw = startStopwatch(newStopwatch(), 0);
    let cd = startCountdown(newCountdown(60_000), 0);
    cd = pauseCountdown(cd, 20_000);
    sw = lapStopwatch(sw, 25_000);
    expect(stopwatchElapsed(sw, 30_000)).toBe(30_000);
    expect(countdownRemaining(cd, 30_000)).toBe(40_000);
  });
});

describe('display', () => {
  it.each([
    [0, '00:00.00'],
    [1_234, '00:01.23'],
    [59_999, '00:59.99'], // rounds down: never shows a unit before it has passed
    [61_999, '01:01.99'],
    [3_599_999, '59:59.99'], // the last moment before the hour
    [3_600_000, '01:00:00'], // from an hour: hh:mm:ss
    [3_723_450, '01:02:03'],
    [100 * 3_600_000, '100:00:00'],
  ])('formatStopwatch(%p) → %s', (ms, text) => {
    expect(formatStopwatch(ms)).toBe(text);
  });

  it.each([
    [90_000, '01:30'],
    [59_001, '01:00'], // rounds up: never shows 00:00 early
    [400, '00:01'],
    [0, '00:00'],
    [-50, '00:00'],
    [3_600_000, '01:00:00'],
    [MAX_COUNTDOWN_MS, '23:59:59'],
  ])('formatCountdown(%p) → %s', (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });

  it('speaks elapsed time in whole seconds', () => {
    expect(spokenElapsed(31_420)).toBe('31 seconds');
    expect(spokenElapsed(3_661_900)).toBe('1 hour 1 minute 1 second');
  });

  it('speaks durations naturally', () => {
    expect(spokenDuration(90_000)).toBe('1 minute 30 seconds');
    expect(spokenDuration(60_000)).toBe('1 minute');
    expect(spokenDuration(1_000)).toBe('1 second');
    expect(spokenDuration(0)).toBe('0 seconds');
    expect(spokenDuration(3_661_000)).toBe('1 hour 1 minute 1 second');
    expect(spokenDuration(7_200_000)).toBe('2 hours');
  });
});

describe('duration parts (picker wheels)', () => {
  it('splits and joins hours, minutes and seconds', () => {
    expect(splitDuration(3_723_000)).toEqual({ hours: 1, minutes: 2, seconds: 3 });
    expect(joinDuration({ hours: 1, minutes: 2, seconds: 3 })).toBe(3_723_000);
    expect(splitDuration(MAX_COUNTDOWN_MS)).toEqual({ hours: 23, minutes: 59, seconds: 59 });
    expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('round-trips every preset and the maximum', () => {
    for (const ms of [30_000, 60_000, 90_000, MAX_COUNTDOWN_MS]) {
      expect(joinDuration(splitDuration(ms))).toBe(ms);
    }
  });

  it('allows hours up to 23 and rejects a zero total', () => {
    expect(isValidCountdownMs(joinDuration({ hours: 23, minutes: 59, seconds: 59 }))).toBe(true);
    expect(isValidCountdownMs(joinDuration({ hours: 24, minutes: 0, seconds: 0 }))).toBe(false);
    expect(isValidCountdownMs(joinDuration({ hours: 0, minutes: 0, seconds: 0 }))).toBe(false);
  });
});

describe('countdownProgress (ring)', () => {
  it('starts full, falls with time, freezes while paused, and is empty when finished', () => {
    const idle = newCountdown(100_000);
    expect(countdownProgress(idle, 0)).toBe(1);
    const running = startCountdown(idle, 0);
    expect(countdownProgress(running, 25_000)).toBe(0.75);
    const paused = pauseCountdown(running, 40_000);
    expect(countdownProgress(paused, 40_000)).toBe(0.6);
    expect(countdownProgress(paused, 90_000)).toBe(0.6);
    const resumed = startCountdown(paused, 90_000);
    expect(countdownProgress(resumed, 120_000)).toBeCloseTo(0.3);
    expect(countdownProgress(resumed, 500_000)).toBe(0);
  });

  it('is right straight after a long time in the background', () => {
    const running = startCountdown(newCountdown(600_000), 0);
    expect(countdownProgress(running, 450_000)).toBe(0.25);
  });

  it('cancel and restart keep the chosen duration', () => {
    const done = startCountdown(newCountdown(90_000), 0);
    const cancelled = resetCountdown(done);
    expect(cancelled).toEqual(newCountdown(90_000));
    expect(countdownProgress(startCountdown(cancelled, 200_000), 200_000)).toBe(1);
  });
});

describe('countdownRemaining with a stale clock', () => {
  it('never shows more than was left when the countdown started', () => {
    const running = startCountdown(newCountdown(60_000), 10_000);
    // A display tick from before Start must not read as extra time.
    expect(countdownRemaining(running, 5_000)).toBe(60_000);
  });
});

describe('restoring saved clocks', () => {
  it('round-trips every stopwatch state through JSON', () => {
    const running = lapStopwatch(startStopwatch(newStopwatch(), 1_000), 4_000);
    const paused = pauseStopwatch(running, 6_000);
    for (const sw of [newStopwatch(), running, paused]) {
      expect(restoreStopwatch(JSON.parse(JSON.stringify(sw)))).toEqual(sw);
    }
  });

  it('keeps a stopwatch counting across an app restart', () => {
    const saved = JSON.parse(JSON.stringify(startStopwatch(newStopwatch(), 1_000)));
    const restored = restoreStopwatch(saved)!;
    expect(stopwatchElapsed(restored, 1_000 + 3_600_000)).toBe(3_600_000);
  });

  it('round-trips every countdown state, and a finished one stays finished', () => {
    const running = startCountdown(newCountdown(90_000), 0);
    const paused = pauseCountdown(running, 10_000);
    for (const cd of [newCountdown(90_000), running, paused]) {
      expect(restoreCountdown(JSON.parse(JSON.stringify(cd)))).toEqual(cd);
    }
    const restored = restoreCountdown(JSON.parse(JSON.stringify(running)))!;
    expect(countdownDone(restored, 200_000)).toBe(true);
    expect(countdownRemaining(restored, 200_000)).toBe(0);
  });

  it('restores countdowns saved before the hour wheel (old 99:59 limit)', () => {
    const old = { status: 'paused', durationMs: 5_999_000, remainingMs: 4_000_000, endsAt: null };
    expect(restoreCountdown(old)).toEqual(old);
    const oldRunning = { status: 'running', durationMs: 90_000, remainingMs: 90_000, endsAt: 1_000_000 };
    expect(restoreCountdown(oldRunning)).toEqual(oldRunning);
  });

  it('rejects missing, malformed or inconsistent data', () => {
    for (const bad of [
      null,
      'x',
      {},
      { status: 'running', startedAt: null, accumulatedMs: 0, lapMarks: [] },
      { status: 'paused', startedAt: null, accumulatedMs: -1, lapMarks: [] },
      { status: 'paused', startedAt: null, accumulatedMs: 5, lapMarks: ['a'] },
      { status: 'idle', startedAt: null, accumulatedMs: 5, lapMarks: [] },
    ]) {
      expect(restoreStopwatch(bad)).toBeNull();
    }
    for (const bad of [
      null,
      { status: 'running', durationMs: 60_000, remainingMs: 60_000, endsAt: null },
      { status: 'idle', durationMs: 0, remainingMs: 0, endsAt: null },
      { status: 'paused', durationMs: 60_000, remainingMs: 90_000, endsAt: null },
      { status: 'idle', durationMs: 60_000, remainingMs: 10_000, endsAt: null },
      { status: 'done', durationMs: 60_000, remainingMs: 0, endsAt: null },
    ]) {
      expect(restoreCountdown(bad)).toBeNull();
    }
  });
});
