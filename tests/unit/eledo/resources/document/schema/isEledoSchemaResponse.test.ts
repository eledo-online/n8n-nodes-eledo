import { vi, describe, it, expect } from 'vitest';
import { isEledoSchemaResponse } from '../../../../../../nodes/Eledo/resources/document/schema';

function makeCtx(params: Record<string, unknown> = {}) {
	const httpCall = vi.fn();

	const ctx: any = {
		getNode: vi.fn(() => ({ name: 'Eledo' })),
		getCurrentNodeParameter: vi.fn((key: string) => params[key]),
		helpers: {
			httpRequestWithAuthentication: {
				call: httpCall,
			},
		},
	};

	return { ctx, httpCall };
}

describe('isEledoSchemaResponse', () => {
	it('returns false for non-objects', () => {
		expect(isEledoSchemaResponse(null)).toBe(false);
		expect(isEledoSchemaResponse(123)).toBe(false);
		expect(isEledoSchemaResponse('x')).toBe(false);
	});

	it('returns false for objects without schema field', () => {
		expect(isEledoSchemaResponse({})).toBe(false);
		expect(isEledoSchemaResponse({ schemas: {} })).toBe(false);
	});

	it('returns true when schema key exists (minimal guard)', () => {
		expect(isEledoSchemaResponse({ schema: {} })).toBe(true);
		expect(isEledoSchemaResponse({ schema: null })).toBe(true); // guard is intentionally minimal
	});
});

