/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import { executeDocumentGenerate } from '../../../../../../nodes/Eledo/resources/document/generate-execute';
import { makeExecuteCtx } from '../../../../../utils/n8n'

function abFromString(s: string): ArrayBuffer {
	return new TextEncoder().encode(s).buffer;
}

describe('executeDocumentGenerate', () => {
	it('returns binary.document for file output', async () => {
		const { ctx, httpCall } = makeExecuteCtx({
			outputType: 'file',
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'fields',
			textAndNumberFields: { field: [] },
			booleanFields: { field: [] },
			dateFields: { field: [] },
		});

		const pdfBody = new ArrayBuffer(10);

		httpCall.mockResolvedValueOnce({
			body: pdfBody,
			headers: {
				'content-type': 'application/pdf',
				'content-disposition': 'attachment; filename="0_0.pdf"; filename*=UTF-8\'\'0_0.pdf',
			},
			statusCode: 200,
		});

		ctx.helpers.prepareBinaryData.mockResolvedValueOnce({ data: 'bin', fileName: '0_0.pdf', mimeType: 'application/pdf' });

		const item: any = { json: { keep: 1 }, binary: { keepBin: { data: 'x' } } };

		const out = await executeDocumentGenerate.call(ctx, 0, item);

		expect(out.json).toEqual({ keep: 1 });
		expect(out.binary.keepBin).toBeDefined();
		expect(out.binary.document).toBeDefined();
		expect(ctx.helpers.prepareBinaryData).toHaveBeenCalledWith(pdfBody, '0_0.pdf', 'application/pdf');
	});

	it('returns pdfBase64 + metadata for base64 output', async () => {
		const { ctx, httpCall } = makeExecuteCtx({
			outputType: 'base64',
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'json',
			payloadJson: '{"x":1}',
		});

		const pdfBody = new ArrayBuffer(10);

		httpCall.mockResolvedValueOnce({
			body: pdfBody,
			headers: {
				'content-type': 'application/pdf',
				'content-disposition': 'attachment; filename="0_0.pdf"; filename*=UTF-8\'\'0_0.pdf',
			},
			statusCode: 200,
		});

		ctx.helpers.binaryToString.mockResolvedValueOnce('BASE64PDF');

		const item: any = { json: { keep: 1 } };

		const out = await executeDocumentGenerate.call(ctx, 0, item);

		expect(out.json.keep).toBe(1);
		expect(out.json.pdfBase64).toBe('BASE64PDF');
		expect(out.json.filename).toBe('0_0.pdf');
		expect(out.json.mimeType).toBe('application/pdf');
	});

	it('throws NodeApiError for application/json error payload', async () => {
		const { ctx, httpCall } = makeExecuteCtx({
			outputType: 'file',
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'json',
			payloadJson: '{"x":1}',
		});

		const errObj = { message: 'Bad Request', code: 400 };
		httpCall.mockResolvedValueOnce({
			body: abFromString(JSON.stringify(errObj)),
			headers: { 'content-type': 'application/json' },
			statusCode: 400,
		});

		ctx.helpers.binaryToString.mockResolvedValueOnce(JSON.stringify(errObj));

		await expect(executeDocumentGenerate.call(ctx, 0, { json: {} } as any))
			.rejects.toBeInstanceOf(NodeApiError);
	});

	it('JSON error payload with invalid JSON falls back to text message', async () => {
		const { ctx, httpCall } = makeExecuteCtx({
			outputType: 'file',
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'json',
			payloadJson: '{"x":1}',
		});

		httpCall.mockResolvedValueOnce({
			body: abFromString('NOT JSON'),
			headers: { 'content-type': 'application/json' },
			statusCode: 400,
		});

		ctx.helpers.binaryToString.mockResolvedValueOnce('NOT JSON');

		await expect(executeDocumentGenerate.call(ctx, 0, { json: {} } as any))
			.rejects.toBeInstanceOf(NodeApiError);
	});

	it('defaults filename to document.pdf when header missing', async () => {
		const { ctx, httpCall } = makeExecuteCtx({
			outputType: 'file',
			templateId: 'tpl',
			useTemplateVersion: false,
			inputMode: 'json',
			payloadJson: '{"x":1}',
		});

		const pdfBody = new ArrayBuffer(10);

		httpCall.mockResolvedValueOnce({
			body: pdfBody,
			headers: { 'content-type': 'application/pdf' },
			statusCode: 200,
		});

		ctx.helpers.prepareBinaryData.mockResolvedValueOnce({ data: 'bin' });

		const out = await executeDocumentGenerate.call(ctx, 0, { json: {} } as any);
		expect(ctx.helpers.prepareBinaryData).toHaveBeenCalledWith(pdfBody, 'document.pdf', 'application/pdf');
		expect(out.binary.document).toBeDefined();
	});
});
