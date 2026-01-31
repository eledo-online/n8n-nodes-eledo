import { vi, describe, it, expect } from 'vitest';
import { NodeOperationError } from 'n8n-workflow';
import { fetchTemplateSchema } from '../../../../../../nodes/Eledo/resources/document/schema';
import { ELEDO_CREDENTIALS } from '../../../../../../shared/eledo/constants/credentials';

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

describe('fetchTemplateSchema', () => {
	it('calls /Schema/<id> (latest) and returns response', async () => {
		const { ctx, httpCall } = makeCtx();
		httpCall.mockResolvedValueOnce({ schema: { properties: {} } });

		const out = await fetchTemplateSchema.call(ctx, 'tpl1');

		const [, credName, req] = httpCall.mock.calls[0];
		expect(credName).toBe(ELEDO_CREDENTIALS.API);
		expect(req.method).toBe('GET');
		expect(String(req.url)).toContain('/Schema/');
		expect(out).toHaveProperty('schema');
	});

	it('calls /Schema/<id>/<version> when version provided', async () => {
		const { ctx, httpCall } = makeCtx();
		httpCall.mockResolvedValueOnce({ schema: { properties: {} } });

		await fetchTemplateSchema.call(ctx, 'tpl1', 2);

		const [, , req] = httpCall.mock.calls[0];
		expect(String(req.url)).toContain('/Schema/');
		expect(String(req.url)).toContain('/2');
	});

	it('throws NodeOperationError on request failure', async () => {
		const { ctx, httpCall } = makeCtx();
		httpCall.mockRejectedValueOnce(new Error('boom'));

		await expect(fetchTemplateSchema.call(ctx, 'tpl1')).rejects.toBeInstanceOf(NodeOperationError);
	});

	it('throws NodeOperationError on invalid response', async () => {
		const { ctx, httpCall } = makeCtx();
		httpCall.mockResolvedValueOnce({ nope: true });

		await expect(fetchTemplateSchema.call(ctx, 'tpl1')).rejects.toBeInstanceOf(NodeOperationError);
	});
});

