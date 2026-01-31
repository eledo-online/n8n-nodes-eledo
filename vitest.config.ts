/// <reference types="vitest" />

// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: ['tests/**/*.test.ts'],
	},
});
