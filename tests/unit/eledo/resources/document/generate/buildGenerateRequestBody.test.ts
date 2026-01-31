/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import { buildGenerateRequestBody } from '../../../../../../nodes/Eledo/resources/document/generate-execute';
import { makeExecuteCtx } from '../../../../../utils/n8n'

describe('buildGenerateRequestBody', () => {
	it('throws when templateId missing', () => {
		const { ctx } = makeExecuteCtx({
			templateId: '',
		});

		expect(() => buildGenerateRequestBody.call(ctx, 0)).toThrow(NodeApiError);
	});

	it('includes templateVersion only when enabled and valid', () => {
		const { ctx } = makeExecuteCtx({
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
			const { ctx } = makeExecuteCtx({
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
		const { ctx } = makeExecuteCtx({
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'json',
			payloadJson: '{}',
		});

		const body = buildGenerateRequestBody.call(ctx, 0) as any;
		expect(body).toEqual({ templateId: 'tpl', file: null });
	});

	it('FIELDS mode: uses guided fields and sends null when none provided', () => {
		const { ctx } = makeExecuteCtx({
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
