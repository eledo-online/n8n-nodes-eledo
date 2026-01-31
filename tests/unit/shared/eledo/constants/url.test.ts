// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { eledoUrl } from '../../../../../shared/eledo/constants/url';

describe('eledoUrl', () => {
	it('passes through absolute https URL', () => {
		expect(eledoUrl('https://example.com/x')).toBe('https://example.com/x');
	});

	it('passes through absolute http URL', () => {
		expect(eledoUrl('http://example.com/x')).toBe('http://example.com/x');
	});

	it('prefixes BASE_URL for relative paths', () => {
		expect(eledoUrl('/Generate')).toMatch(/\/Generate$/);
	});

	it('adds a slash if missing', () => {
		expect(eledoUrl('Generate')).toMatch(/\/Generate$/);
	});
});