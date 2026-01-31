/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eledoUrl } from '../../../../../../shared/eledo/constants/url';
import { ELEDO_CREDENTIALS } from '../../../../../../shared/eledo/constants/credentials';
import { readFixtureJson } from '../../../../../utils/fixtures'
import { makeLoadOptionsCtx } from '../../../../../utils/n8n'

import { getTemplates,
    	TEMPLATE_SCOPE,
	    ELEDO_LIST_SCOPE,
 } from '../../../../../../nodes/Eledo/resources/document/list';

describe('getTemplates', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('calls /List with default (private) scope mapped to Mine and returns options', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });
		const fixture = readFixtureJson('eledo', 'templates', 'list.scope.mine.v1.ok.json');

		httpCall.mockResolvedValueOnce(fixture);

		const out = await getTemplates.call(ctx as any);

		// request assertions
		expect(ctx.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledTimes(1);

		const [thisArg, credName, req] = ctx.helpers.httpRequestWithAuthentication.call.mock.calls[0];

        expect(thisArg).toBe(ctx);
		expect(credName).toBe(ELEDO_CREDENTIALS.API);
		expect(req).toMatchObject({
			method: 'GET',
			url: eledoUrl('/List'),
			qs: {
				scope: ELEDO_LIST_SCOPE.PRIVATE, // Mine
				limit: 200,
				page: 1,
			},
			json: true,
		});

		// output assertions (shape + mapping)
		expect(Array.isArray(out)).toBe(true);
		expect(out.length).toBeGreaterThan(0);

		// verify formatting rule: name + optional (vX), value=id, description for bulk
		const first = out[0];
		expect(first).toHaveProperty('name');
		expect(first).toHaveProperty('value');

		// If your fixture includes version, we expect "(vX)"
		// This is intentionally tolerant: it checks *behavior* without hardcoding exact names.
		if (String((fixture as any)?.templates?.[0]?.version ?? '') !== '') {
			expect(first.name).toMatch(/\(v\d+\)$/);
		}
	});

	it('maps public UI scope to Public for Eledo API', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateScope: TEMPLATE_SCOPE.PUBLIC });
		const fixture = readFixtureJson('eledo', 'templates', 'list.scope.public.v1.ok.json');

		httpCall.mockResolvedValueOnce(fixture);

		await getTemplates.call(ctx as any);

		const [, , req] = ctx.helpers.httpRequestWithAuthentication.call.mock.calls[0];
		expect(req.qs.scope).toBe(ELEDO_LIST_SCOPE.PUBLIC);
	});

	it('adds description only for bulk templates', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });

		// minimal inline fixture (no need to rely on disk for this one)
		httpCall.mockResolvedValueOnce({
			templates: [
				{ id: 'a', name: 'A', bulk: true, version: 1 },
				{ id: 'b', name: 'B', bulk: false, version: 1 },
				{ id: 'c', name: 'C' }, // bulk undefined
			],
		});

		const out = await getTemplates.call(ctx as any);

		expect(out[0].description).toBe('Bulk template');
		expect(out[1].description).toBeUndefined();
		expect(out[2].description).toBeUndefined();
	});

	it('throws NodeOperationError with context when the API call fails', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });

		httpCall.mockRejectedValueOnce(new Error('boom'));

		await expect(getTemplates.call(ctx as any)).rejects.toMatchObject({
			name: 'NodeOperationError',
			message: expect.stringContaining('Failed to fetch templates from Eledo (/List). boom'),
		});
	});

	it('throws NodeOperationError when response does not match expected shape', async () => {
		const { ctx, httpCall } = makeLoadOptionsCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });

		httpCall.mockResolvedValueOnce({ nope: true });

		await expect(getTemplates.call(ctx as any)).rejects.toMatchObject({
			name: 'NodeOperationError',
			message: 'Invalid response from Eledo API: expected templates array',
		});
	});
});
