import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const energyDomain = fileURLToPath(
  new URL('../../src/features/energy/domain', import.meta.url),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@energy': energyDomain,
    },
  },
});
