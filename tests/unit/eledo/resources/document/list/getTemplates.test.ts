import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ✅ import the function under test
import { getTemplates,
    	TEMPLATE_SCOPE,
	    ELEDO_LIST_SCOPE,
 } from '../../../../../../nodes/Eledo/resources/document/list';

// ✅ import constants used by getTemplates so you can assert precisely
import {
	ELEDO_CREDENTIALS,
} from '../../../../../../shared/eledo/constants/credentials';

// Optional: if you want to assert exact URL called, import eledoUrl and BASE_URL,
// otherwise just assert it ends with '/List'
import { eledoUrl } from '../../../../../../shared/eledo/constants/url';

// ---- helpers (keep in this file for now) ----

type MockLoadCtx = {
	getCurrentNodeParameter: (name: string) => unknown;
	getNode: () => unknown;
	helpers: {
		httpRequestWithAuthentication: {
			call: ReturnType<typeof vi.fn>;
		};
	};
};

function makeCtx(params?: { templateScope?: string }): MockLoadCtx {
	return {
		getCurrentNodeParameter: vi.fn((name: string) => {
			if (name === 'templateScope') return params?.templateScope;
			return undefined;
		}),
		getNode: vi.fn(() => ({ name: 'Eledo (test node)' })),
		helpers: {
			httpRequestWithAuthentication: {
				call: vi.fn(),
			},
		},
	};
}

async function loadJsonFixture(rel: string): Promise<unknown> {
	const fixturesDir = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'../../../../../fixtures/eledo/templates',
	);
	const p = path.join(fixturesDir, rel);
	const raw = await readFile(p, 'utf8');
	return JSON.parse(raw);
}

// ---- tests ----

describe('getTemplates', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('calls /List with default (private) scope mapped to Mine and returns options', async () => {
		const ctx = makeCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });
		const fixture = await loadJsonFixture('list.scope.mine.v1.ok.json');

		ctx.helpers.httpRequestWithAuthentication.call.mockResolvedValueOnce(fixture);

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
		const ctx = makeCtx({ templateScope: TEMPLATE_SCOPE.PUBLIC });
		const fixture = await loadJsonFixture('list.scope.public.v1.ok.json');

		ctx.helpers.httpRequestWithAuthentication.call.mockResolvedValueOnce(fixture);

		await getTemplates.call(ctx as any);

		const [, , req] = ctx.helpers.httpRequestWithAuthentication.call.mock.calls[0];
		expect(req.qs.scope).toBe(ELEDO_LIST_SCOPE.PUBLIC);
	});

	it('adds description only for bulk templates', async () => {
		const ctx = makeCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });

		// minimal inline fixture (no need to rely on disk for this one)
		ctx.helpers.httpRequestWithAuthentication.call.mockResolvedValueOnce({
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
		const ctx = makeCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });

		ctx.helpers.httpRequestWithAuthentication.call.mockRejectedValueOnce(new Error('boom'));

		await expect(getTemplates.call(ctx as any)).rejects.toMatchObject({
			name: 'NodeOperationError',
			message: expect.stringContaining('Failed to fetch templates from Eledo (/List). boom'),
		});
	});

	it('throws NodeOperationError when response does not match expected shape', async () => {
		const ctx = makeCtx({ templateScope: TEMPLATE_SCOPE.PRIVATE });

		ctx.helpers.httpRequestWithAuthentication.call.mockResolvedValueOnce({ nope: true });

		await expect(getTemplates.call(ctx as any)).rejects.toMatchObject({
			name: 'NodeOperationError',
			message: 'Invalid response from Eledo API: expected templates array',
		});
	});
});
