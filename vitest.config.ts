import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setupTests.ts',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      include: [
        'components/ui/**/*.{ts,tsx}',
        'design/**/*.ts',
        'permissions/**/*.{ts,tsx}',
        'services/contracts.ts',
        'services/authService.ts',
        'services/index.ts',
        'services/tripOperations.ts',
        'services/tripDetails.ts',
        'components/tripOperationsQuery.ts',
        'components/TripOperationsTable.tsx',
        'components/TripQuickDetailsPanel.tsx',
        'components/TripDetailsPage.tsx',
        'routes.ts',
      ],
    },
  },
});
