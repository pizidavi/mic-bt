import { createMMKV } from 'react-native-mmkv';

const mmkvStorage = createMMKV();

export const localStorage = {
  getItem: (key: string): string | null => mmkvStorage.getString(key) ?? null,
  setItem: (name: string, value: string) => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name: string) => mmkvStorage.remove(name),
};
