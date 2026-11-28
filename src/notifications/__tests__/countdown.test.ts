/**
 * syncCountdownNotifications against a fake iOS notification centre that tracks pending
 * (scheduled) and delivered notifications by identifier, like UNUserNotificationCenter.
 * Checks that every Start/Pause/Resume/Cancel/Restart leaves at most one status note and
 * one pending "Time's up", and how permission is handled.
 */
import { newCountdown, pauseCountdown, resetCountdown, startCountdown, type Countdown } from '@/lib/clock';
import { planCountdownNotifications } from '@/lib/countdownNotifications';
import {
  COUNTDOWN_ALERT_ID,
  COUNTDOWN_STATUS_ID,
  syncCountdownNotifications,
} from '@/notifications/countdown';

type Request = { identifier: string; content: Record<string, unknown>; trigger: { date?: Date } | null };

type Permission = {
  granted: boolean;
  canAskAgain: boolean;
  ios: { status: number; allowsSound: boolean | null; allowsAlert: boolean | null; alertStyle: number };
};

const mockCenter = {
  pending: new Map<string, Request>(),
  delivered: new Map<string, Request>(),
  maxDelivered: 0,
  maxPending: 0,
  permission: {
    granted: true,
    canAskAgain: false,
    ios: { status: 2, allowsSound: true, allowsAlert: true, alertStyle: 1 },
  } as Permission,
  afterRequest: null as null | Permission,
  requests: 0,
};

jest.mock('@/lib/storage', () => ({ loadJson: jest.fn(async () => null) }));
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => mockCenter.permission),
  requestPermissionsAsync: jest.fn(async () => {
    mockCenter.requests += 1;
    if (mockCenter.afterRequest) mockCenter.permission = mockCenter.afterRequest;
    return mockCenter.permission;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    mockCenter.pending.delete(id);
  }),
  dismissNotificationAsync: jest.fn(async (id: string) => {
    mockCenter.delivered.delete(id);
  }),
  scheduleNotificationAsync: jest.fn(async (request: Request) => {
    // Immediate requests are delivered; dated ones wait. Same identifier replaces.
    if (request.trigger == null) mockCenter.delivered.set(request.identifier, request);
    else mockCenter.pending.set(request.identifier, request);
    mockCenter.maxDelivered = Math.max(mockCenter.maxDelivered, mockCenter.delivered.size);
    mockCenter.maxPending = Math.max(mockCenter.maxPending, mockCenter.pending.size);
    return request.identifier;
  }),
}));

const time = (ms: number) => `t${ms / 1000}`;
let now = 0;
jest.spyOn(Date, 'now').mockImplementation(() => now);
const sync = (cd: Countdown) => syncCountdownNotifications(planCountdownNotifications(cd, now, time));
const status = () => mockCenter.delivered.get(COUNTDOWN_STATUS_ID)?.content;
const alertDate = () => mockCenter.pending.get(COUNTDOWN_ALERT_ID)?.trigger?.date?.getTime();

beforeEach(() => {
  mockCenter.pending.clear();
  mockCenter.delivered.clear();
  mockCenter.maxDelivered = 0;
  mockCenter.maxPending = 0;
  mockCenter.requests = 0;
  mockCenter.afterRequest = null;
  mockCenter.permission = {
    granted: true,
    canAskAgain: false,
    ios: { status: 2, allowsSound: true, allowsAlert: true, alertStyle: 1 },
  };
  now = 0;
});

describe('countdown notifications through a whole session', () => {
  it('Start → Pause → Resume → Cancel never duplicates or leaves stale notifications', async () => {
    let cd = startCountdown(newCountdown(90_000), now);
    await sync(cd);
    expect(status()).toMatchObject({
      title: 'Countdown running',
      sound: false,
      interruptionLevel: 'passive',
    });
    expect(alertDate()).toBe(90_000);
    expect(mockCenter.pending.get(COUNTDOWN_ALERT_ID)?.content).toMatchObject({
      sound: true,
      interruptionLevel: 'timeSensitive',
    });

    now = 30_000;
    cd = pauseCountdown(cd, now);
    await sync(cd);
    expect(status()).toMatchObject({ title: 'Countdown paused', body: '01:00 left' });
    expect(mockCenter.pending.size).toBe(0); // no alert while paused

    now = 50_000;
    cd = startCountdown(cd, now);
    await sync(cd);
    expect(status()).toMatchObject({ title: 'Countdown running' });
    expect(alertDate()).toBe(110_000); // rescheduled: 60 s left from 50 s

    cd = resetCountdown(cd);
    await sync(cd);
    expect(mockCenter.delivered.size).toBe(0);
    expect(mockCenter.pending.size).toBe(0);
    expect(mockCenter.maxDelivered).toBe(1);
    expect(mockCenter.maxPending).toBe(1);
  });

  it('finishing in the app removes the note; Restart starts one fresh alert and clears the old Time’s up', async () => {
    let cd = startCountdown(newCountdown(30_000), now);
    await sync(cd);
    // The alert fires: iOS moves it from pending to delivered.
    now = 30_000;
    mockCenter.delivered.set(COUNTDOWN_ALERT_ID, mockCenter.pending.get(COUNTDOWN_ALERT_ID)!);
    mockCenter.pending.delete(COUNTDOWN_ALERT_ID);
    await sync(cd); // done
    expect(status()).toBeUndefined();
    expect(mockCenter.delivered.has(COUNTDOWN_ALERT_ID)).toBe(true); // Time's up stays while "done"

    now = 40_000;
    cd = startCountdown(resetCountdown(cd), now); // Restart
    await sync(cd);
    expect(mockCenter.delivered.has(COUNTDOWN_ALERT_ID)).toBe(false);
    expect(status()).toMatchObject({ title: 'Countdown running' });
    expect(alertDate()).toBe(70_000);
    expect(mockCenter.pending.size).toBe(1);
  });

  it('rapid taps without waiting still end in one consistent state', async () => {
    const start = startCountdown(newCountdown(60_000), 0);
    const paused = pauseCountdown(start, 1_000);
    const resumed = startCountdown(paused, 2_000);
    await Promise.all([sync(start), sync(paused), sync(resumed), sync(paused), sync(resumed)]);
    expect(mockCenter.delivered.size).toBe(1);
    expect(mockCenter.pending.size).toBe(1);
    expect(alertDate()).toBe(61_000);
    expect(mockCenter.maxDelivered).toBe(1);
    expect(mockCenter.maxPending).toBe(1);
  });

  it('uses the fixed identifiers', async () => {
    await sync(startCountdown(newCountdown(60_000), 0));
    expect([...mockCenter.delivered.keys()]).toEqual([COUNTDOWN_STATUS_ID]);
    expect([...mockCenter.pending.keys()]).toEqual([COUNTDOWN_ALERT_ID]);
  });
});

describe('permission', () => {
  it('asks to upgrade provisional (quiet) permission when a countdown starts', async () => {
    mockCenter.permission = {
      granted: false,
      canAskAgain: true,
      ios: { status: 3, allowsSound: false, allowsAlert: false, alertStyle: 0 },
    };
    mockCenter.afterRequest = {
      granted: true,
      canAskAgain: false,
      ios: { status: 2, allowsSound: true, allowsAlert: true, alertStyle: 1 },
    };
    await sync(startCountdown(newCountdown(60_000), 0));
    expect(mockCenter.requests).toBe(1);
    expect(mockCenter.pending.size).toBe(1);
  });

  it('asks the first time, but not again once decided, and never on pause', async () => {
    mockCenter.permission = {
      granted: false,
      canAskAgain: true,
      ios: { status: 0, allowsSound: null, allowsAlert: null, alertStyle: 0 },
    };
    mockCenter.afterRequest = {
      granted: true,
      canAskAgain: false,
      ios: { status: 2, allowsSound: true, allowsAlert: true, alertStyle: 1 },
    };
    const start = startCountdown(newCountdown(60_000), 0);
    await sync(start);
    await sync(pauseCountdown(start, 1_000));
    await sync(startCountdown(pauseCountdown(start, 1_000), 2_000));
    expect(mockCenter.requests).toBe(1);
  });

  it('denied: posts nothing and does not prompt', async () => {
    mockCenter.permission = {
      granted: false,
      canAskAgain: false,
      ios: { status: 1, allowsSound: null, allowsAlert: null, alertStyle: 0 },
    };
    await sync(startCountdown(newCountdown(60_000), 0));
    expect(mockCenter.requests).toBe(0);
    expect(mockCenter.delivered.size + mockCenter.pending.size).toBe(0);
  });
});
