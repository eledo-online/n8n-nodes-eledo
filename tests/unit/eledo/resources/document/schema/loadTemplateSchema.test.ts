// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { loadTemplateSchema } from '../../../../../../nodes/Eledo/resources/document/schema';
import { makeLoadOptionsCtx } from '../../../../../utils/n8n'

describe('loadTemplateSchema', () => {
	it('returns null when templateId missing', async () => {
		const { ctx } = makeLoadOptionsCtx({ templateId: '' });
		await expect(loadTemplateSchema.call(ctx)).resolves.toBeNull();
	});

	it('uses latest schema when useTemplateVersion is false', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({
			templateId: 'tpl1',
			useTemplateVersion: false,
			templateVersion: 9,
		});

		httpCall.mockResolvedValueOnce({ schema: {} });

		await loadTemplateSchema.call(ctx);

		const [, , req] = httpCall.mock.calls[0];
		expect(String(req.url)).toContain('/Schema/');
		expect(String(req.url)).not.toMatch(/\/9(\D|$)/);
	});

	it('uses versioned schema when enabled and version is number', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({
			templateId: 'tpl1',
			useTemplateVersion: true,
			templateVersion: 3,
		});

		httpCall.mockResolvedValueOnce({ schema: {} });

		await loadTemplateSchema.call(ctx);

		const [, , req] = httpCall.mock.calls[0];
		expect(String(req.url)).toContain('/3');
	});

	it('falls back to latest if enabled but version is not a number', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({
			templateId: 'tpl1',
			useTemplateVersion: true,
			templateVersion: '3',
		});

		httpCall.mockResolvedValueOnce({ schema: {} });

		await loadTemplateSchema.call(ctx);

		const [, , req] = httpCall.mock.calls[0];
		expect(String(req.url)).not.toMatch(/\/3(\D|$)/);
	});
});
