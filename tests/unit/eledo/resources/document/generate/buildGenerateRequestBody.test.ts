import { describe, it, expect, vi } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import { buildGenerateRequestBody } from '../../../../../../nodes/Eledo/resources/document/generate-execute';

function makeCtx(params: Record<string, any>) {
	const ctx: any = {
		getNode: vi.fn(() => ({ name: 'Eledo' })),
		getNodeParameter: vi.fn((key: string) => params[key]),
	};
	return { ctx };
}

describe('buildGenerateRequestBody', () => {
	it('throws when templateId missing', () => {
		const { ctx } = makeCtx({
			templateId: '',
		});

		expect(() => buildGenerateRequestBody.call(ctx, 0)).toThrow(NodeApiError);
	});

	it('includes templateVersion only when enabled and valid', () => {
		const { ctx } = makeCtx({
			templateId: 'tpl',
			useTemplateVersion: true,
			templateVersion: 2,
			inputMode: 'json',
			payloadJson: '{"x":1}',
		});

		const body = buildGenerateRequestBody.call(ctx, 0) as any;
		expect(body).toMatchObject({ templateId: 'tpl', templateVersion: 2, file: { x: 1 } });
	});

	it('rejects invalid templateVersion when enabled', () => {
		const bad = (templateVersion: any) => {
			const { ctx } = makeCtx({
				templateId: 'tpl',
				useTemplateVersion: true,
				templateVersion,
				inputMode: 'json',
				payloadJson: '{"x":1}',
			});
			return () => buildGenerateRequestBody.call(ctx, 0);
		};

		expect(bad('2')).toThrow(NodeApiError);
		expect(bad(0)).toThrow(NodeApiError);
		expect(bad(-1)).toThrow(NodeApiError);
		expect(bad(1.5)).toThrow(NodeApiError);
		expect(bad(NaN)).toThrow(NodeApiError);
	});

	it('JSON mode: treats payloadJson as file content and sends null for empty object', () => {
		const { ctx } = makeCtx({
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'json',
			payloadJson: '{}',
		});

		const body = buildGenerateRequestBody.call(ctx, 0) as any;
		expect(body).toEqual({ templateId: 'tpl', file: null });
	});

	it('FIELDS mode: uses guided fields and sends null when none provided', () => {
		const { ctx } = makeCtx({
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'fields',
			textAndNumberFields: { field: [{ name: 'a', value: '' }] },
			booleanFields: { field: [] },
			dateFields: { field: [] },
		});

		const body = buildGenerateRequestBody.call(ctx, 0) as any;
		expect(body).toEqual({ templateId: 'tpl', file: null });
	});
});
