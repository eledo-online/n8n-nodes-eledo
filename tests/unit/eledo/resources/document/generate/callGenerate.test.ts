// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { callGenerate } from '../../../../../../nodes/Eledo/resources/document/generate-execute';
import { ELEDO_CREDENTIALS } from '../../../../../../shared/eledo/constants/credentials';
import { makeExecuteCtx } from '../../../../../utils/n8n'

describe('callGenerate', () => {
	it('POSTs to /Generate with arraybuffer response', async () => {
		const { ctx, httpCall } = makeExecuteCtx();
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
