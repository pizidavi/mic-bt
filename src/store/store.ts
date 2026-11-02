import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LoopbackStatus } from '../services/loopbackAudio';
import { LOOPBACK_STATE } from '../type/enum';
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

export type LoopbackStore = {
  state: LOOPBACK_STATE;
  reason: LoopbackStatus['reason'];
  setStatus: (status: LoopbackStatus) => void;
};

export const useLoopbackStore = create<LoopbackStore>(set => ({
  state: LOOPBACK_STATE.IDLE,
  reason: null,
  setStatus: status => set(status),
}));
