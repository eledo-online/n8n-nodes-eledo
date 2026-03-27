// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { fetchTemplateSchema } from '../../../../../../nodes/Eledo/resources/document/schema';
import { ELEDO_CREDENTIALS } from '../../../../../../shared/eledo/constants/credentials';
import { makeLoadOptionsCtx } from '../../../../../utils/n8n'

describe('fetchTemplateSchema', () => {
	it('calls /Schema/<id> (latest) and returns response', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx();
		httpCall.mockResolvedValueOnce({ schema: { properties: {} } });

		const out = await fetchTemplateSchema.call(ctx, 'tpl1');

		const [, credName, req] = httpCall.mock.calls[0];
		expect(credName).toBe(ELEDO_CREDENTIALS.API);
		expect(req.method).toBe('GET');
		expect(String(req.url)).toContain('/Schema/');
		expect(out).toHaveProperty('schema');
	});

	it('calls /Schema/<id>/<version> when version provided', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx();
		httpCall.mockResolvedValueOnce({ schema: { properties: {} } });

		await fetchTemplateSchema.call(ctx, 'tpl1', 2);

		const [, , req] = httpCall.mock.calls[0];
		expect(String(req.url)).toContain('/Schema/');
		expect(String(req.url)).toContain('/2');
	});

	it('throws NodeApiError on request failure', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx();
		httpCall.mockRejectedValueOnce(new Error('boom'));

		await expect(fetchTemplateSchema.call(ctx, 'tpl1')).rejects.toBeInstanceOf(NodeApiError);
	});

	it('throws NodeOperationError on invalid response', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx();
		httpCall.mockResolvedValueOnce({ nope: true });

		await expect(fetchTemplateSchema.call(ctx, 'tpl1')).rejects.toBeInstanceOf(NodeOperationError);
	});
});

