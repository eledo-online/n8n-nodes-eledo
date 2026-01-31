// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { toIsoDateTimeStringMaybe } from '../../../../shared/eledo/helpers';

describe('toIsoDateTimeStringMaybe', () => {
	it('returns undefined for emptyish input', () => {
		expect(toIsoDateTimeStringMaybe('')).toBeUndefined();
		expect(toIsoDateTimeStringMaybe(null)).toBeUndefined();
		expect(toIsoDateTimeStringMaybe(undefined)).toBeUndefined();
	});

	it('converts Date to ISO', () => {
		const d = new Date('2026-01-01T12:34:56.000Z');
		expect(toIsoDateTimeStringMaybe(d)).toBe('2026-01-01T12:34:56.000Z');
	});

	it('accepts ISO string if valid', () => {
		const s = '2026-01-01T12:34:56.000Z';
		expect(toIsoDateTimeStringMaybe(s)).toBe(s);
	});

	it('returns undefined for invalid date-like input', () => {
		expect(toIsoDateTimeStringMaybe('not-a-date')).toBeUndefined();
	});
});
