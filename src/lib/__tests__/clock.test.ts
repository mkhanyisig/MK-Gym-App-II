import {
  countdownDone,
  countdownRemaining,
  formatCountdown,
  formatStopwatch,
  lapStopwatch,
  MAX_COUNTDOWN_MS,
  newCountdown,
  newStopwatch,
  parseCountdownInput,
  pauseCountdown,
  pauseStopwatch,
  resetCountdown,
  resetStopwatch,
  setCountdownDuration,
  spokenDuration,
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
    [61_999, '01:01.99'],
    [3_723_450, '1:02:03.45'],
  ])('formatStopwatch(%p) → %s', (ms, text) => {
    expect(formatStopwatch(ms)).toBe(text);
  });

  it.each([
    [90_000, '1:30'],
    [59_001, '1:00'], // rounds up: never shows 0:00 early
    [400, '0:01'],
    [0, '0:00'],
    [-50, '0:00'],
  ])('formatCountdown(%p) → %s', (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });

  it('speaks durations naturally', () => {
    expect(spokenDuration(90_000)).toBe('1 minute 30 seconds');
    expect(spokenDuration(60_000)).toBe('1 minute');
    expect(spokenDuration(1_000)).toBe('1 second');
    expect(spokenDuration(0)).toBe('0 seconds');
  });
});

describe('parseCountdownInput', () => {
  it('reads minutes and seconds, treating blank as zero', () => {
    expect(parseCountdownInput('2', '30')).toEqual({ ok: true, durationMs: 150_000 });
    expect(parseCountdownInput('', '45')).toEqual({ ok: true, durationMs: 45_000 });
    expect(parseCountdownInput(' 5 ', '')).toEqual({ ok: true, durationMs: 300_000 });
  });

  it('rejects a zero duration', () => {
    expect(parseCountdownInput('0', '0')).toMatchObject({ ok: false });
    expect(parseCountdownInput('', '')).toMatchObject({ ok: false });
  });

  it('rejects out-of-range and non-numeric values', () => {
    expect(parseCountdownInput('1', '60')).toMatchObject({ ok: false });
    expect(parseCountdownInput('100', '0')).toMatchObject({ ok: false });
    expect(parseCountdownInput('-1', '30')).toMatchObject({ ok: false });
    expect(parseCountdownInput('1.5', '0')).toMatchObject({ ok: false });
    expect(parseCountdownInput('a', '0')).toMatchObject({ ok: false });
  });

  it('accepts the maximum', () => {
    expect(parseCountdownInput('99', '59')).toEqual({ ok: true, durationMs: MAX_COUNTDOWN_MS });
  });
});

describe('countdownRemaining with a stale clock', () => {
  it('never shows more than was left when the countdown started', () => {
    const running = startCountdown(newCountdown(60_000), 10_000);
    // A display tick from before Start must not read as extra time.
    expect(countdownRemaining(running, 5_000)).toBe(60_000);
  });
});
