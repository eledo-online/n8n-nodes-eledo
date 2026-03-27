import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { ILoadOptionsFunctions, INodePropertyOptions, JsonObject } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';
import { eledoRequest } from '../../../../shared/eledo/constants/credentials';
import { isJsonObject } from '../../../../shared/eledo/helpers';

interface EledoTemplate {
	id: string;
	name: string;
	version?: number;
	bulk?: boolean;
}

interface EledoListResponse {
	templates: EledoTemplate[];
}

/** @internal Test-only export */
export const TEMPLATE_SCOPE = {
	PRIVATE: 'private',
	PUBLIC: 'public',
} as const;

/** @internal Test-only export */
export const ELEDO_LIST_SCOPE = {
	PRIVATE: 'Mine',
	PUBLIC: 'Public',
} as const;

/**
 * Runtime type guard for the response returned by the Eledo template list endpoint.
 *
 * This is a boundary check: external API data is treated as `unknown` and validated
 * before being used by the node. Downstream logic assumes `templates` is an array
 * of objects with at least `{ id: string, name: string }`.
 */
/** @internal Test-only export */
export function isEledoListResponse(value: unknown): value is EledoListResponse {
	if (!isJsonObject(value)) return false;
	const templates = value.templates;
	if (!Array.isArray(templates)) return false;

	return templates.every((t) => {
		if (!isJsonObject(t)) return false;
		return typeof t.id === 'string' && typeof t.name === 'string';
	});
}

/**
 * Loads available Eledo templates for the template selector.
 *
 * Note: Eledo's API endpoint is `/List`, but we expose it as `getTemplates()` because
 * it describes the user intent (select a template) rather than the API naming.
 *
 * UI scope values use `private | public` for clarity in n8n, and are mapped to
 * Eledo API values `Mine | Public` at request time.
 */
export async function getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const scope = (this.getCurrentNodeParameter('templateScope') === TEMPLATE_SCOPE.PUBLIC) ? ELEDO_LIST_SCOPE.PUBLIC : ELEDO_LIST_SCOPE.PRIVATE;
	let response: unknown;

	try {
		response = await eledoRequest.call(this, {
			method: 'GET',
			url: eledoUrl('/List'),
			qs: {
				scope,
				limit: 200,
				page: 1,
			},
			json: true,
		});
	} catch (error: unknown) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
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