import {
  configureNotifications,
  NotificationKind,
  requestNotificationPermission,
} from '@/notifications/setup';

import type { PermissionSnapshot } from '@/lib/notificationPermission';

const mockState = {
  handler: null as null | { handleNotification: (n: unknown) => Promise<Record<string, boolean>> },
  permission: {
    granted: false,
    canAskAgain: true,
    ios: { status: 3, allowsSound: false, allowsAlert: false, alertStyle: 0 },
  } as PermissionSnapshot,
  requests: 0,
};

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  setNotificationHandler: jest.fn((h) => {
    mockState.handler = h;
  }),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => mockState.permission),
  requestPermissionsAsync: jest.fn(async () => {
    mockState.requests += 1;
    return mockState.permission;
  }),
}));

const present = async (kind: string) =>
  mockState.handler!.handleNotification({ request: { content: { data: { kind } } } });

describe('foreground presentation (app open)', () => {
  beforeAll(() => configureNotifications());

  it('weigh-in reminders still show as banners', async () => {
    expect(await present(NotificationKind.weighInReminder)).toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
    });
  });

  it('the countdown status note goes to the list only (no banner over the Clock)', async () => {
    expect(await present(NotificationKind.countdownStatus)).toMatchObject({
      shouldShowBanner: false,
      shouldShowList: true,
    });
  });

  it("Time's up doesn't pop up while the Clock already shows it", async () => {
    expect(await present(NotificationKind.countdownDone)).toMatchObject({
      shouldShowBanner: false,
      shouldShowList: false,
    });
  });
});

describe('requestNotificationPermission', () => {
  it('prompts to upgrade provisional permission (also benefits reminders)', async () => {
    mockState.requests = 0;
    await requestNotificationPermission();
    expect(mockState.requests).toBe(1);
  });

  it('does not prompt once fully granted or denied', async () => {
    mockState.requests = 0;
    mockState.permission = {
      granted: true,
      canAskAgain: false,
      ios: { status: 2, allowsSound: true, allowsAlert: true, alertStyle: 1 },
    };
    expect(await requestNotificationPermission()).toBe('granted');
    mockState.permission = {
      granted: false,
      canAskAgain: false,
      ios: { status: 1, allowsSound: null, allowsAlert: null, alertStyle: 0 },
    };
    expect(await requestNotificationPermission()).toBe('denied');
    expect(mockState.requests).toBe(0);
  });
});
