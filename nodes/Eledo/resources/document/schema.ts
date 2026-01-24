import type { ILoadOptionsFunctions, INodePropertyOptions, JsonObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';

type EledoSchemaResponse = {
	schema?: {
		type?: string;
		properties?: JsonObject;
	};
};

function eledoSchemaUrl(templateId: string, templateVersion?: number): string {
	const safeId = encodeURIComponent(templateId);

	const path =
		typeof templateVersion === 'number'
			? `/Schema/${safeId}/${encodeURIComponent(String(templateVersion))}`
			: `/Schema/${safeId}`;

	return eledoUrl(path);
}

function isEledoSchemaResponse(value: unknown): value is EledoSchemaResponse {
	if (!value || typeof value !== 'object') return false;
	return 'schema' in value;
}

type PrimitiveType = 'String' | 'Number' | 'Boolean' | 'Date';

function pickPrimitiveFields(
	schema: EledoSchemaResponse,
	allowed: ReadonlySet<PrimitiveType>,
): Array<{ key: string; type: PrimitiveType }> {
	const props = schema.schema?.properties;
	if (!props || typeof props !== 'object') return [];

	const out: Array<{ key: string; type: PrimitiveType }> = [];

	for (const [key, def] of Object.entries(props)) {
		if (!def || typeof def !== 'object') continue;

		const t = (def as JsonObject).type;
		if (typeof t === 'string' && allowed.has(t as PrimitiveType)) {
			out.push({ key, type: t as PrimitiveType });
		}
	}

	return out;
}

// Keep internal — do NOT export
async function fetchTemplateSchema(
	this: ILoadOptionsFunctions,
	templateId: string,
	templateVersion?: number,
): Promise<EledoSchemaResponse> {
	let response: unknown;

	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, 'eledoApi', {
			method: 'GET',
			url: eledoSchemaUrl(templateId, templateVersion),
			json: true,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		throw new NodeOperationError(
			this.getNode(),
			`Failed to fetch template schema from Eledo (/Schema). ${message}`,
		);
	}

	if (!isEledoSchemaResponse(response)) {
		throw new NodeOperationError(this.getNode(), 'Invalid response from Eledo API: expected schema');
	}

	return response as EledoSchemaResponse;
}

async function loadTemplateSchema(
	this: ILoadOptionsFunctions,
): Promise<EledoSchemaResponse | null> {
	const templateId = this.getCurrentNodeParameter('templateId') as string;
	if (!templateId) return null;

	const useTemplateVersion = this.getCurrentNodeParameter('useTemplateVersion') as boolean;
	const templateVersionRaw = this.getCurrentNodeParameter('templateVersion');

	const templateVersion =
		useTemplateVersion && typeof templateVersionRaw === 'number' ? templateVersionRaw : undefined;

	return await fetchTemplateSchema.call(this, templateId, templateVersion);
}

export async function getTemplateTextAndNumberFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const schema = await loadTemplateSchema.call(this);
	if (!schema) return [];

	const fields = pickPrimitiveFields(schema, new Set(['String', 'Number']));

	fields.sort((a, b) => a.key.localeCompare(b.key));

	return fields.map((f) => ({
		name: f.key,
		value: f.key,
		description: f.type === 'Number' ? 'Number' : 'Text',
	}));
}

export async function getTemplateBooleanFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const schema = await loadTemplateSchema.call(this);
	if (!schema) return [];

	const fields = pickPrimitiveFields(schema, new Set(['Boolean']));

	fields.sort((a, b) => a.key.localeCompare(b.key));

	return fields.map((f) => ({
		name: f.key,
		value: f.key,
		description: 'Boolean',
	}));
}

export async function getTemplateDateFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const schema = await loadTemplateSchema.call(this);
	if (!schema) return [];

	const fields = pickPrimitiveFields(schema, new Set(['Date']));

	fields.sort((a, b) => a.key.localeCompare(b.key));

	return fields.map((f) => ({
		name: f.key,
		value: f.key,
		description: 'Date',
	}));
}