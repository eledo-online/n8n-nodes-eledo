import { vi, describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eledoSchemaUrl } from '../../../../../../nodes/Eledo/resources/document/schema';

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

const fixturesDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../../../../fixtures/eledo/schema',
);

function readFixture(name: string): unknown {
	return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

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