import { vi, describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickPrimitiveFields } from '../../../../../../nodes/Eledo/resources/document/schema';

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

describe('pickPrimitiveFields', () => {
	it('returns [] when schema has no properties', () => {
		expect(pickPrimitiveFields({}, new Set(['String']))).toEqual([]);
		expect(pickPrimitiveFields({ schema: {} }, new Set(['String']))).toEqual([]);
	});

	it('returns [] when properties is not a JsonObject', () => {
		expect(
			pickPrimitiveFields({ schema: { properties: [] as any } }, new Set(['String'] as any)),
		).toEqual([]);
	});

	it('filters top-level primitive fields by allowed types', () => {
		const schema: any = {
			schema: {
				properties: {
					name: { type: 'String' },
					age: { type: 'Number' },
					active: { type: 'Boolean' },
					when: { type: 'Date' },
					ignoredObj: { type: 'Object' },
					ignoredNoType: {},
					ignoredNull: null,
				},
			},
		};

		const out = pickPrimitiveFields(schema, new Set(['String', 'Number'] as any));
		expect(out).toEqual(
			expect.arrayContaining([
				{ key: 'name', type: 'String' },
				{ key: 'age', type: 'Number' },
			]),
		);
		expect(out.find((f) => f.key === 'active')).toBeUndefined();
		expect(out.find((f) => f.key === 'when')).toBeUndefined();
	});

	it('ignores nested objects/arrays by design (only top-level)', () => {
		const schema: any = {
			schema: {
				properties: {
					person: { type: 'Object', properties: { x: { type: 'String' } } },
					list: { type: 'Array', items: { type: 'String' } },
				},
			},
		};

		const out = pickPrimitiveFields(schema, new Set(['String'] as any));
		expect(out).toEqual([]);
	});
});
