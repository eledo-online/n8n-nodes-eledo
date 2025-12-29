import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';

interface EledoTemplate {
	id: string;
	name: string;
	version?: number;
	bulk?: boolean;
}

interface EledoListResponse {
	templates: EledoTemplate[];
}

function isEledoListResponse(value: unknown): value is EledoListResponse {
	if (typeof value !== 'object' || value === null) return false;

	const v = value as Record<string, unknown>;
	if (!Array.isArray(v.templates)) return false;

	return v.templates.every((t) => {
		if (typeof t !== 'object' || t === null) return false;
		const tt = t as Record<string, unknown>;
		return typeof tt.id === 'string' && typeof tt.name === 'string';
	});
}

export async function getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const raw = this.getCurrentNodeParameter('templateScope');
	const scopeUi = raw === 'public' ? 'public' : 'private';
	const scope = scopeUi === 'private' ? 'Mine' : 'Public';

	let response: unknown;

	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, 'eledoApi', {
			method: 'GET',
			url: eledoUrl('/List'),
			qs: {
				scope,
				limit: 200,
				page: 1,
			},
			json: true,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		throw new NodeOperationError(
			this.getNode(),
			`Failed to fetch templates from Eledo (/List). ${message}`,
		);
	}

	if (!isEledoListResponse(response)) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid response from Eledo API: expected templates array',
		);
	}

	const templates = response.templates;

	return templates.map((t) => ({
		name: `${t.name}${typeof t.version === 'number' ? ` (v${t.version})` : ''}`,
		value: t.id,
		description: t.bulk ? 'Bulk template' : undefined,
	}));
}