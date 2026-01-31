import { describe, it, expect, vi } from 'vitest';
import { getTemplatePrimitiveFieldOptions } from '../../../../../../nodes/Eledo/resources/document/schema';

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

describe('getTemplatePrimitiveFieldOptions', () => {
	it('returns [] when no template selected', async () => {
		const { ctx } = makeCtx({ templateId: '' });

		const out = await getTemplatePrimitiveFieldOptions.call(ctx, new Set(['String'] as any), () => 'x');
		expect(out).toEqual([]);
	});

	it('returns sorted UI options with description mapping', async () => {
		const { ctx, httpCall } = makeCtx({
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
