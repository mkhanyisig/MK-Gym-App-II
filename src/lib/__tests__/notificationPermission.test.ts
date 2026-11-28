import {
  describeAlerts,
  IosStatus,
  type PermissionSnapshot,
  toPermission,
} from '@/lib/notificationPermission';

const ios = (
  status: number,
  extra: Partial<NonNullable<PermissionSnapshot['ios']>> = {},
): PermissionSnapshot => ({
  granted: status === IosStatus.authorized,
  canAskAgain: status === IosStatus.notDetermined || status === IosStatus.provisional,
  ios: { status, allowsSound: true, allowsAlert: true, alertStyle: 1, ...extra },
});

describe('toPermission (reminders keep their behaviour)', () => {
  it('treats provisional as granted, since it still delivers', () => {
    expect(toPermission(ios(IosStatus.provisional))).toBe('granted');
    expect(toPermission(ios(IosStatus.authorized))).toBe('granted');
    expect(toPermission(ios(IosStatus.notDetermined))).toBe('undetermined');
    expect(toPermission(ios(IosStatus.denied))).toBe('denied');
  });
});

describe('describeAlerts (is "Time\'s up" audible?)', () => {
  it('full permission with sound and banners is audible', () => {
    expect(describeAlerts(ios(IosStatus.authorized))).toEqual({
      permission: 'granted',
      audible: true,
      issue: null,
      canPrompt: false,
    });
  });

  it('provisional is not enough: quiet delivery, but the app may ask to upgrade', () => {
    expect(describeAlerts(ios(IosStatus.provisional))).toMatchObject({
      permission: 'granted',
      audible: false,
      issue: 'provisional',
      canPrompt: true,
    });
  });

  it('never asked: can prompt', () => {
    expect(describeAlerts(ios(IosStatus.notDetermined))).toMatchObject({
      issue: 'not-asked',
      canPrompt: true,
    });
  });

  it('denied: only Settings can fix it', () => {
    expect(describeAlerts(ios(IosStatus.denied))).toMatchObject({ issue: 'denied', canPrompt: false });
  });

  it('sounds or alerts switched off in Settings', () => {
    expect(describeAlerts(ios(IosStatus.authorized, { allowsSound: false }))).toMatchObject({
      audible: false,
      issue: 'sound-off',
      canPrompt: false,
    });
    expect(describeAlerts(ios(IosStatus.authorized, { alertStyle: 0 }))).toMatchObject({
      issue: 'alerts-off',
    });
    expect(describeAlerts(ios(IosStatus.authorized, { allowsAlert: false }))).toMatchObject({
      issue: 'alerts-off',
    });
  });

  it('Android (no iOS details): granted is audible', () => {
    expect(describeAlerts({ granted: true, canAskAgain: true })).toMatchObject({
      audible: true,
      issue: null,
    });
    expect(describeAlerts({ granted: false, canAskAgain: false })).toMatchObject({ issue: 'denied' });
  });
});
