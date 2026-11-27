import { useCallback, useEffect, useState } from 'react';

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

export function useProfile() {
  const [saved, setSaved] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJson<Profile & { nickname?: string }>(STORAGE_KEY).then((stored) => {
      if (stored) {
        // Profiles saved before the rename used `nickname`; carry it over.
        const { nickname, ...rest } = stored;
        setSaved({ ...emptyProfile, ...rest, preferredName: rest.preferredName || nickname || '' });
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (profile: Profile) => {
    await saveJson(STORAGE_KEY, profile);
    setSaved(profile);
  }, []);

  const clear = useCallback(async () => {
    await removeKey(STORAGE_KEY);
    setSaved(emptyProfile);
  }, []);

  return { profile: saved, loading, save, clear };
}
