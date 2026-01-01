import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';

type EledoSchemaResponse = {
	schema?: {
		type?: string;
		properties?: Record<string, unknown>;
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

function pickPrimitiveFields(schema: EledoSchemaResponse): Array<{ key: string; type: string }> {
	const props = schema.schema?.properties;
	if (!props || typeof props !== 'object') return [];

	const out: Array<{ key: string; type: string }> = [];

	for (const [key, def] of Object.entries(props)) {
		// Expecting `{ type: "String" }` / `{ type: "Number" }`
		if (!def || typeof def !== 'object') continue;

		const t = (def as Record<string, unknown>).type;
		if (t === 'String' || t === 'Number') {
			out.push({ key, type: t });
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
			//qs: { schemaType: 'zapier' },
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

export async function getTemplateFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const templateId = this.getCurrentNodeParameter('templateId') as string;
	if (!templateId) return []; // collection is hidden anyway, but safe

	const useTemplateVersion = this.getCurrentNodeParameter('useTemplateVersion') as boolean;
	const templateVersionRaw = this.getCurrentNodeParameter('templateVersion');

	const templateVersion =
		useTemplateVersion && typeof templateVersionRaw === 'number' ? templateVersionRaw : undefined;

	const schema = await fetchTemplateSchema.call(this, templateId, templateVersion);
	const fields = pickPrimitiveFields(schema);

	// Stable output
	fields.sort((a, b) => a.key.localeCompare(b.key));

	return fields.map((f) => ({
		name: f.key,
		value: f.key,
		description: f.type === 'Number' ? 'Number' : 'Text',
	}));
}