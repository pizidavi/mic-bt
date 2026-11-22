import { fileURLToPath } from 'node:url';

import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
