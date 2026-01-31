import { describe, it, expect } from 'vitest';
import { eledoSchemaUrl } from '../../../../../../nodes/Eledo/resources/document/schema';

describe('eledeSchemaUrl', () => {
	it('builds /Schema/<id> for latest schema', () => {
		expect(eledoSchemaUrl('abc')).toContain('/Schema/abc');
	});

	it('builds /Schema/<id>/<version> when version provided', () => {
		expect(eledoSchemaUrl('abc', 3)).toContain('/Schema/abc/3');
	});

	it('encodes templateId and version', () => {
		const url = eledoSchemaUrl('a b/č', 1);
		expect(url).toContain('/Schema/');
		expect(url).not.toContain('a b/č'); // should be encoded
	});
});