import { useSyncExternalStore } from 'react';

import { loadJson, saveJson } from '@/lib/storage';
import {
  getReminderPermission,
  type ReminderPermission,
  remindersSupported,
  requestReminderPermission,
} from '@/notifications/reminders';

const STORAGE_KEY = 'settings.reminders.v1';

type Saved = {
  /** The user wants daily weigh-in reminders. */
  enabled: boolean;
  /** We've already asked once (after the first weigh-in), so never ask on our own again. */
  asked: boolean;
};

type ReminderState = Saved & { loaded: boolean; permission: ReminderPermission };

/*
 * One shared copy of the reminder setting, like useProfile: the Home bell, the
 * Notifications screen and ReminderSync all see the same value.
 */
let state: ReminderState = { enabled: false, asked: false, loaded: false, permission: 'undetermined' };
const listeners = new Set<() => void>();
let loadStarted = false;

function setState(patch: Partial<ReminderState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

async function persist(patch: Partial<Saved>) {
  const next = { enabled: state.enabled, asked: state.asked, ...patch };
  await saveJson<Saved>(STORAGE_KEY, next);
  setState(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loadStarted) {
    loadStarted = true;
    void Promise.all([loadJson<Saved>(STORAGE_KEY), getReminderPermission()]).then(([saved, permission]) => {
      setState({ enabled: saved?.enabled ?? false, asked: saved?.asked ?? false, permission, loaded: true });
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

/** Turns reminders on, asking for permission first. Resolves with the permission result. */
async function enable(): Promise<ReminderPermission> {
  const permission = await requestReminderPermission();
  setState({ permission });
  await persist({ enabled: permission === 'granted', asked: true });
  return permission;
}

async function disable(): Promise<void> {
  await persist({ enabled: false, asked: true });
}

/** Re-reads permission, e.g. after the user returns from the phone's Settings. */
async function refreshPermission(): Promise<void> {
  setState({ permission: await getReminderPermission() });
}

/**
 * The one-time automatic offer after the first weigh-in: asks for permission and turns
 * reminders on if allowed. Never runs again once asked, whatever the answer.
 */
async function offerAfterFirstWeighIn(): Promise<void> {
  if (state.asked || !state.loaded) return;
  if (!remindersSupported) {
    await persist({ asked: true });
    return;
  }
  await enable();
}

export function useReminders() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snapshot,
    supported: remindersSupported,
    enable,
    disable,
    refreshPermission,
    offerAfterFirstWeighIn,
  };
}
