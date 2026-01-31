import { describe, it, expect, vi } from 'vitest';
import { callGenerate } from '../../../../../../nodes/Eledo/resources/document/generate-execute';
import { ELEDO_CREDENTIALS } from '../../../../../../shared/eledo/constants/credentials';

function makeCtx() {
	const httpCall = vi.fn();
	const ctx: any = {
		helpers: {
			httpRequestWithAuthentication: { call: httpCall },
		},
	};
	return { ctx, httpCall };
}

describe('callGenerate', () => {
	it('POSTs to /Generate with arraybuffer response', async () => {
		const { ctx, httpCall } = makeCtx();
		httpCall.mockResolvedValueOnce({ body: new ArrayBuffer(1), headers: {}, statusCode: 200 });

		const body = { templateId: 'tpl', file: null };

		await callGenerate.call(ctx, body);

		const [, credName, req] = httpCall.mock.calls[0];
		expect(credName).toBe(ELEDO_CREDENTIALS.API);
		expect(req.method).toBe('POST');
		expect(String(req.url)).toContain('/Generate');
		expect(req.json).toBe(true);
		expect(req.returnFullResponse).toBe(true);
		expect(req.encoding).toBe('arraybuffer');
		expect(req.body).toEqual(body);
	});
});
