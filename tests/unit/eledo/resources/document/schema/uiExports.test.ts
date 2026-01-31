import { describe, it, expect, vi } from 'vitest';
import { makeLoadOptionsCtx } from '../../../../../utils/n8n'
import {
	getTemplateTextAndNumberFields,
	getTemplateBooleanFields,
	getTemplateDateFields,
} from '../../../../../../nodes/Eledo/resources/document/schema';

describe('UI exports', () => {
	it('TextAndNumber maps Number->Number else Text', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateId: 'tpl1' });

		httpCall.mockResolvedValueOnce({
			schema: { properties: { age: { type: 'Number' }, name: { type: 'String' } } },
		});

		const out = await getTemplateTextAndNumberFields.call(ctx);
		const byKey = Object.fromEntries(out.map((o) => [o.value, o.description]));

		expect(byKey.age).toBe('Number');
		expect(byKey.name).toBe('Text');
	});

	it('Boolean returns Boolean description', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateId: 'tpl1' });
		httpCall.mockResolvedValueOnce({ schema: { properties: { ok: { type: 'Boolean' } } } });

		const out = await getTemplateBooleanFields.call(ctx);
		expect(out).toEqual([{ name: 'ok', value: 'ok', description: 'Boolean' }]);
	});

	it('Date returns Date description', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateId: 'tpl1' });
		httpCall.mockResolvedValueOnce({ schema: { properties: { when: { type: 'Date' } } } });

		const out = await getTemplateDateFields.call(ctx);
		expect(out).toEqual([{ name: 'when', value: 'when', description: 'Date' }]);
	});
});
