// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { coerceNumberMaybe } from '../../../../shared/eledo/helpers';

describe('coerceNumberMaybe', () => {
	it('returns undefined for emptyish values', () => {
		expect(coerceNumberMaybe('')).toBeUndefined();
		expect(coerceNumberMaybe(null)).toBeUndefined();
		expect(coerceNumberMaybe(undefined)).toBeUndefined();
	});

	it('keeps numbers', () => {
		expect(coerceNumberMaybe(5)).toBe(5);
	});

	it('parses numeric-like strings', () => {
		expect(coerceNumberMaybe('5')).toBe(5);
		expect(coerceNumberMaybe(' 5 ')).toBe(5);
	});

	it('rejects non-numeric strings', () => {
		expect(coerceNumberMaybe('John')).toBeUndefined();
		expect(coerceNumberMaybe('5a')).toBeUndefined();
	});

	it('rejects non-string/number', () => {
		expect(coerceNumberMaybe(true)).toBeUndefined();
		expect(coerceNumberMaybe({})).toBeUndefined();
	});
});

