import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplateSchema } from '../../../../../../nodes/Eledo/resources/document/schema';

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

const fixturesDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../../../../fixtures/eledo/schema',
);

function readFixture(name: string): unknown {
	return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

describe('loadTemplateSchema', () => {
	it('returns null when templateId missing', async () => {
		const { ctx } = makeCtx({ templateId: '' });
		await expect(loadTemplateSchema.call(ctx)).resolves.toBeNull();
	});

	it('uses latest schema when useTemplateVersion is false', async () => {
		const { ctx, httpCall } = makeCtx({
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
		const { ctx, httpCall } = makeCtx({
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
		const { ctx, httpCall } = makeCtx({
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
