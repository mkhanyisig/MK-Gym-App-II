import { useSyncExternalStore } from 'react';

import type { UnitSystem } from '@/lib/units';
import { loadJson, removeKey, saveJson } from '@/lib/storage';

export type Profile = {
  firstName: string;
  lastName: string;
  /** What the app calls the user, e.g. in the home-screen greeting. */
  preferredName: string;
  /** Free text for now, e.g. MM/DD/YYYY */
  dateOfBirth: string;
  email: string;
  /** Body measurements are always stored in metric; the UI converts for display. */
  weightKg: number | null;
  heightCm: number | null;
  units: UnitSystem;
};

export const emptyProfile: Profile = {
  firstName: '',
  lastName: '',
  preferredName: '',
  dateOfBirth: '',
  email: '',
  weightKg: null,
  heightCm: null,
  units: 'metric',
};

const STORAGE_KEY = 'profile.v2';

type ProfileState = {
  profile: Profile;
  /** True once a profile has been saved on this device (used to tell returning users apart). */
  exists: boolean;
  loading: boolean;
};

/*
 * One shared copy of the profile for the whole app. Tabs stay mounted, so if each
 * screen kept its own copy, a name saved on Profile wouldn't reach the Home greeting.
 */
let state: ProfileState = { profile: emptyProfile, exists: false, loading: true };
const listeners = new Set<() => void>();
let loadStarted = false;

function setState(next: ProfileState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loadStarted) {
    loadStarted = true;
    void loadJson<Profile & { nickname?: string }>(STORAGE_KEY).then((stored) => {
      // A save or clear that finished first wins over this initial read.
      if (!state.loading) return;
      if (!stored) {
        setState({ profile: emptyProfile, exists: false, loading: false });
        return;
      }
      // Profiles saved before the rename used `nickname`; carry it over.
      const { nickname, ...rest } = stored;
      setState({
        profile: { ...emptyProfile, ...rest, preferredName: rest.preferredName || nickname || '' },
        exists: true,
        loading: false,
      });
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

async function save(profile: Profile) {
  await saveJson(STORAGE_KEY, profile);
  setState({ profile, exists: true, loading: false });
}

async function clear() {
  await removeKey(STORAGE_KEY);
  setState({ profile: emptyProfile, exists: false, loading: false });
}

export function useProfile() {
  const { profile, exists, loading } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { profile, exists, loading, save, clear };
}
