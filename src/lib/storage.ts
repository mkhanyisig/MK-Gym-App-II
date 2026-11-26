import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch (e) {
    console.warn(`Failed to load "${key}"`, e);
    return null;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
