/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { getTemplatePrimitiveFieldOptions } from '../../../../../../nodes/Eledo/resources/document/schema';
import { makeLoadOptionsCtx } from '../../../../../utils/n8n'

describe('getTemplatePrimitiveFieldOptions', () => {
	it('returns [] when no template selected', async () => {
		const { ctx } = makeLoadOptionsCtx({ templateId: '' });

		const out = await getTemplatePrimitiveFieldOptions.call(ctx, new Set(['String'] as any), () => 'x');
		expect(out).toEqual([]);
	});

	it('returns sorted UI options with description mapping', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({
			templateId: 'tpl1',
			useTemplateVersion: false,
		});

		httpCall.mockResolvedValueOnce({
			schema: {
				properties: {
					zeta: { type: 'String' },
					alpha: { type: 'Number' },
					skip: { type: 'Boolean' },
				},
			},
		});

		const out = await getTemplatePrimitiveFieldOptions.call(
			ctx,
			new Set(['String', 'Number'] as any),
			(t: any) => `T:${t}`,
		);

		expect(out.map((o) => o.value)).toEqual(['alpha', 'zeta']);
		expect(out).toEqual([
			{ name: 'alpha', value: 'alpha', description: 'T:Number' },
			{ name: 'zeta', value: 'zeta', description: 'T:String' },
		]);
	});
});
