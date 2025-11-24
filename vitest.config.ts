import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    env: {
      SSN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      BANK_BIN: '69420',
    },
    environment: 'node',  
    globals: true,  // Makes describe, it, expect available without imports
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), 
    },
  },
});
