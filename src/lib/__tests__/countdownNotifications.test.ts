import { newCountdown, pauseCountdown, resetCountdown, startCountdown } from '@/lib/clock';
import { planCountdownNotifications } from '@/lib/countdownNotifications';

const time = (ms: number) => `t${ms / 1000}`; // deterministic stand-in for "3:45 PM"
const plan = (cd: ReturnType<typeof newCountdown>, now: number) => planCountdownNotifications(cd, now, time);

describe('planCountdownNotifications: state transitions', () => {
  const idle = newCountdown(90_000);

  it('idle: nothing', () => {
    expect(plan(idle, 0)).toEqual({ phase: 'none', status: null, alertAt: null });
  });

  it('running: a static status note and one completion alert at the end time', () => {
    expect(plan(startCountdown(idle, 10_000), 12_000)).toEqual({
      phase: 'running',
      status: { title: 'Countdown running', body: 'Ends at t100 · 01:30 timer' },
      alertAt: 100_000,
    });
  });

  it('paused: the note says what is left, and there is no alert', () => {
    const paused = pauseCountdown(startCountdown(idle, 0), 48_000);
    expect(plan(paused, 60_000)).toEqual({
      phase: 'paused',
      status: { title: 'Countdown paused', body: '00:42 left' },
      alertAt: null,
    });
  });

  it('resume: the alert moves later by the time spent paused', () => {
    const paused = pauseCountdown(startCountdown(idle, 0), 48_000);
    const resumed = startCountdown(paused, 100_000);
    expect(plan(resumed, 100_000)).toMatchObject({ phase: 'running', alertAt: 142_000 });
  });

  it('cancel: nothing (note removed, alert cancelled)', () => {
    expect(plan(resetCountdown(startCountdown(idle, 0)), 5_000)).toEqual({
      phase: 'none',
      status: null,
      alertAt: null,
    });
  });

  it('finished: no note and no alert (the alert has done its job)', () => {
    expect(plan(startCountdown(idle, 0), 90_000)).toEqual({ phase: 'done', status: null, alertAt: null });
  });

  it('restart after finishing: a fresh full-length run', () => {
    const restarted = startCountdown(resetCountdown(startCountdown(idle, 0)), 200_000);
    expect(plan(restarted, 200_000)).toMatchObject({ phase: 'running', alertAt: 290_000 });
  });

  it('shows hours for long timers', () => {
    expect(plan(startCountdown(newCountdown(3_723_000), 0), 0).status?.body).toBe(
      'Ends at t3723 · 01:02:03 timer',
    );
  });
});
