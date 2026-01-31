import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	getTemplateTextAndNumberFields,
	getTemplateBooleanFields,
	getTemplateDateFields,
} from '../../../../../../nodes/Eledo/resources/document/schema';

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

describe('UI exports', () => {
	it('TextAndNumber maps Number->Number else Text', async () => {
		const { ctx, httpCall } = makeCtx({ templateId: 'tpl1' });

		httpCall.mockResolvedValueOnce({
			schema: { properties: { age: { type: 'Number' }, name: { type: 'String' } } },
		});

		const out = await getTemplateTextAndNumberFields.call(ctx);
		const byKey = Object.fromEntries(out.map((o) => [o.value, o.description]));

		expect(byKey.age).toBe('Number');
		expect(byKey.name).toBe('Text');
	});

	it('Boolean returns Boolean description', async () => {
		const { ctx, httpCall } = makeCtx({ templateId: 'tpl1' });
		httpCall.mockResolvedValueOnce({ schema: { properties: { ok: { type: 'Boolean' } } } });

		const out = await getTemplateBooleanFields.call(ctx);
		expect(out).toEqual([{ name: 'ok', value: 'ok', description: 'Boolean' }]);
	});

	it('Date returns Date description', async () => {
		const { ctx, httpCall } = makeCtx({ templateId: 'tpl1' });
		httpCall.mockResolvedValueOnce({ schema: { properties: { when: { type: 'Date' } } } });

		const out = await getTemplateDateFields.call(ctx);
		expect(out).toEqual([{ name: 'when', value: 'when', description: 'Date' }]);
	});
});
