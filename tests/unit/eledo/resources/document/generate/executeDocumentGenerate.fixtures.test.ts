/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect, vi } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import { executeDocumentGenerate } from '../../../../../../nodes/Eledo/resources/document/generate-execute';
import { readFixtureJson } from '../../../../../utils/fixtures'

describe('executeDocumentGenerate (errors)', () => {
	it('throws NodeApiError when Eledo returns application/json error payload (fixture)', async () => {
		const fixture = { error: 'Request Body is empty, or not a valid JSON' };

		const httpCall = vi.fn().mockResolvedValueOnce({
			body: readFixtureJson('eledo', 'generate', 'generate.http.no.body.payload.error.json'),
			headers: { 'content-type': 'application/json' },
			statusCode: 400,
		});

		const binaryToString = vi.fn().mockResolvedValueOnce(JSON.stringify(fixture));

		const ctx: any = {
			getNode: vi.fn(() => ({ name: 'Eledo' })),
			getNodeParameter: vi.fn((key: string) => {
				// minimal params to get into executeDocumentGenerate and reach the call
				const map: Record<string, any> = {
					outputType: 'file',
					templateId: 'tpl',
					useTemplateVersion: false,
					inputMode: 'json',
					payloadJson: '{"x":1}',
				};
				return map[key];
			}),
			helpers: {
				httpRequestWithAuthentication: { call: httpCall },
				binaryToString,
				prepareBinaryData: vi.fn(),
			},
		};

		await expect(executeDocumentGenerate.call(ctx, 0, { json: {} } as any))
			.rejects.toBeInstanceOf(NodeApiError);

        expect(binaryToString).toHaveBeenCalledTimes(1);
        expect(ctx.helpers.prepareBinaryData).not.toHaveBeenCalled();
	});
});
