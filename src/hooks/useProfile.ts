import { useCallback, useEffect, useState } from 'react';

import type { UnitSystem } from '@/lib/units';
import { loadJson, removeKey, saveJson } from '@/lib/storage';

export type Profile = {
  firstName: string;
  lastName: string;
  nickname: string;
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
  nickname: '',
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
    loadJson<Profile>(STORAGE_KEY).then((stored) => {
      if (stored) setSaved({ ...emptyProfile, ...stored });
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
