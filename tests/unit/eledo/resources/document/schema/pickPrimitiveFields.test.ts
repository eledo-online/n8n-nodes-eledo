/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { pickPrimitiveFields } from '../../../../../../nodes/Eledo/resources/document/schema';

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
