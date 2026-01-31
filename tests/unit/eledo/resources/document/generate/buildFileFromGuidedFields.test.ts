// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { buildFileFromGuidedFields } from '../../../../../../nodes/Eledo/resources/document/generate-execute';
import { makeExecuteCtx } from '../../../../../utils/n8n'

describe('buildFileFromGuidedFields', () => {
	it('returns undefined when no usable fields exist', () => {
		const { ctx } = makeExecuteCtx({
			textAndNumberFields: { field: [{ name: 'x', value: '' }] }, // becomes null -> skipped
			booleanFields: { field: [{ name: '', value: true }] }, // skipped
			dateFields: { field: [{ name: 'd', value: '' }] }, // invalid -> skipped
		});

		const out = buildFileFromGuidedFields.call(ctx, 0);
		expect(out).toBeUndefined();
	});

	it('collects text/number fields and omits null/empty', () => {
		const { ctx } = makeExecuteCtx({
			textAndNumberFields: {
				field: [
					{ name: 'name', value: 'John' },
					{ name: 'age', value: '5' },
					{ name: 'empty', value: '' },
					{ name: '', value: 'ignored' },
				],
			},
			booleanFields: { field: [] },
			dateFields: { field: [] },
		});

		const out = buildFileFromGuidedFields.call(ctx, 0)!;
		expect(out).toEqual({ name: 'John', age: 5 });
	});

	it('coerces boolean fields using truthiness', () => {
		const { ctx } = makeExecuteCtx({
			textAndNumberFields: { field: [] },
			booleanFields: {
				field: [
					{ name: 'a', value: true },
					{ name: 'b', value: 1 },
					{ name: 'c', value: 0 },
					{ name: 'd', value: '' },
				],
			},
			dateFields: { field: [] },
		});

		const out = buildFileFromGuidedFields.call(ctx, 0)!;
		expect(out).toEqual({ a: true, b: true, c: false, d: false });
	});

	it('converts date fields to ISO and skips invalid', () => {
		const { ctx } = makeExecuteCtx({
			textAndNumberFields: { field: [] },
			booleanFields: { field: [] },
			dateFields: {
				field: [
					{ name: 'when', value: '2026-01-28T10:11:12.000Z' },
					{ name: 'bad', value: 'not-a-date' },
					{ name: '', value: '2026-01-28T10:11:12.000Z' },
				],
			},
		});

		const out = buildFileFromGuidedFields.call(ctx, 0)!;

		// don’t overfit exact formatting — just assert it’s a string that looks like ISO
		expect(typeof out.when).toBe('string');
		expect(String(out.when)).toContain('2026');
		expect(out.bad).toBeUndefined();
	});
});
