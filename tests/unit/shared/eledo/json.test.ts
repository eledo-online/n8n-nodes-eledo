import { describe, it, expect } from 'vitest';
import { isJsonObject } from '../../../../shared/eledo/helpers';

describe('isJsonObject', () => {
	it('accepts plain objects', () => {
		expect(isJsonObject({})).toBe(true);
		expect(isJsonObject({ a: 1 })).toBe(true);
	});

	it('rejects null and arrays and primitives', () => {
		expect(isJsonObject(null)).toBe(false);
		expect(isJsonObject([])).toBe(false);
		expect(isJsonObject('x')).toBe(false);
		expect(isJsonObject(1)).toBe(false);
		expect(isJsonObject(true)).toBe(false);
	});
});
