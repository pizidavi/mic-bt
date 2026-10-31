import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localStorage } from './local';

export type SettingsStore = {
  // Empty
};

export const useSettingsStore = create(
  persist<SettingsStore>(_set => ({}), {
    name: 'settings-store',
    storage: createJSONStorage(() => localStorage),
  }),
);
