// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { coerceTextOrNumberValue } from '../../../../../../nodes/Eledo/resources/document/generate-execute';

describe('coerceTextOrNumberValue', () => {
	it('normalizes empty-ish values to null', () => {
		expect(coerceTextOrNumberValue('')).toBeNull();
		expect(coerceTextOrNumberValue(null)).toBeNull();
		expect(coerceTextOrNumberValue(undefined)).toBeNull();
	});

	it('returns numbers as-is', () => {
		expect(coerceTextOrNumberValue(0)).toBe(0);
		expect(coerceTextOrNumberValue(5)).toBe(5);
		expect(coerceTextOrNumberValue(-12.5)).toBe(-12.5);
	});

	it('coerces numeric-like strings to numbers', () => {
		expect(coerceTextOrNumberValue('5')).toBe(5);
		expect(coerceTextOrNumberValue(' 42 ')).toBe(42);
		expect(coerceTextOrNumberValue('3.14')).toBe(3.14);
	});

	it('keeps non-numeric strings as strings', () => {
		expect(coerceTextOrNumberValue('John')).toBe('John');
		expect(coerceTextOrNumberValue('12px')).toBe('12px');
		expect(coerceTextOrNumberValue('NaN')).toBe('NaN');
	});

	it('stringifies other types', () => {
		expect(coerceTextOrNumberValue(true)).toBe('true');
		expect(coerceTextOrNumberValue(false)).toBe('false');
		expect(coerceTextOrNumberValue({ a: 1 })).toBe('[object Object]');
		expect(coerceTextOrNumberValue([1, 2, 3])).toBe('1,2,3');
	});
});
