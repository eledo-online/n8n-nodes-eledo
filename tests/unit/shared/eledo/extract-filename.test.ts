import { describe, it, expect } from 'vitest';
import { extractFilename } from '../../../../shared/eledo/helpers';

describe('extractFilename', () => {
	it('extracts filename="..."', () => {
		expect(extractFilename('attachment; filename="0_0.pdf"')).toBe('0_0.pdf');
	});

	it("extracts filename*=UTF-8''...", () => {
		expect(extractFilename("attachment; filename*=UTF-8''0_0.pdf")).toBe('0_0.pdf');
	});

	it('handles both filename and filename*', () => {
		const h = 'attachment; filename="0_0.pdf"; filename*=UTF-8\'\'0_0.pdf';
		const v = extractFilename(h);
		expect(v).toBe('0_0.pdf');
	});

	it('decodes percent-encoded filename', () => {
		const h = "attachment; filename*=UTF-8''hello%20world.pdf";
		expect(extractFilename(h)).toBe('hello world.pdf');
	});

	it('returns undefined for empty/undefined header', () => {
		expect(extractFilename(undefined)).toBeUndefined();
		expect(extractFilename('')).toBeUndefined();
	});
});
