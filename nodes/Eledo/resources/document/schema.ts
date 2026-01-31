import { NodeOperationError } from 'n8n-workflow';
import type { ILoadOptionsFunctions, INodePropertyOptions, JsonObject } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';
import { ELEDO_CREDENTIALS } from '../../../../shared/eledo/constants/credentials';
import { isJsonObject } from '../../../../shared/eledo/helpers';

/**
 * Eledo template schema helpers.
 *
 * The node intentionally relies on the default schema returned by the Eledo API
 * when no `schemaType` is specified in the request.
 *
 * Although this schema is not explicitly named in the official documentation,
 * it represents the canonical structure used by Eledo templates and is sufficient
 * for guided field generation in this node.
 *
 * The schema response is treated as external data and validated at runtime
 * before being used.
 */

type EledoSchemaResponse = {
	schema?: {
		type?: string;
		properties?: JsonObject;
	};
};

const PRIMITIVE_TYPE = {
	STRING: 'String',
	NUMBER: 'Number',
	BOOLEAN: 'Boolean',
	DATE: 'Date'
} as const;


type PrimitiveType = typeof PRIMITIVE_TYPE[keyof typeof PRIMITIVE_TYPE];

/**
 * Builds the Eledo schema endpoint URL for a template.
 *
 * If a template version is provided, the versioned schema is requested.
 * Otherwise, the default (latest) schema is used.
 */
/** @internal Test-only export */
export function eledoSchemaUrl(templateId: string, templateVersion?: number): string {
	const safeId = encodeURIComponent(templateId);

	const path =
		typeof templateVersion === 'number'
			? `/Schema/${safeId}/${encodeURIComponent(String(templateVersion))}`
			: `/Schema/${safeId}`;

	return eledoUrl(path);
}

/**
 * Runtime check for a schema response returned by the Eledo API.
 *
 * This guard only verifies that a `schema` field is present.
 * Detailed validation is performed downstream as fields are extracted.
 */
/** @internal Test-only export */
export function isEledoSchemaResponse(value: unknown): value is EledoSchemaResponse {
	if (!isJsonObject(value)) return false;
	return 'schema' in value;
}

/**
 * Extracts top-level primitive fields from an Eledo template schema.
 *
 * This helper is used to build the Guided Fields UI. It intentionally:
 * - operates only on the default Eledo schema
 * - considers only top-level properties
 * - filters fields by an allowed set of primitive types
 *
 * Nested objects and arrays are ignored by design.
 */
/** @internal Test-only export */
export function pickPrimitiveFields(
	schema: EledoSchemaResponse,
	allowed: ReadonlySet<PrimitiveType>,
): Array<{ key: string; type: PrimitiveType }> {
	const props = schema.schema?.properties;
	if (!isJsonObject(props)) return [];

	const out: Array<{ key: string; type: PrimitiveType }> = [];

	for (const [key, def] of Object.entries(props)) {
		if (!isJsonObject(def)) continue;

		const t = (def as JsonObject).type;
		if (typeof t === 'string' && allowed.has(t as PrimitiveType)) {
			out.push({ key, type: t as PrimitiveType });
		}
	}

	return out;
}

/**
 * Fetches the default Eledo template schema for a given template (optionally versioned).
 *
 * This function performs only the HTTP request + minimal runtime validation of the
 * response shape. It accepts explicit inputs and does not read node parameters,
 * which keeps it easy to test and reuse.
 */
/** @internal Test-only export */
export async function fetchTemplateSchema(
	this: ILoadOptionsFunctions,
	templateId: string,
	templateVersion?: number,
): Promise<EledoSchemaResponse> {
	let response: unknown;

	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, ELEDO_CREDENTIALS.API, {
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

/**
 * Loads the currently selected template schema from the node parameters.
 *
 * This function adapts n8n parameters (`templateId`, `useTemplateVersion`, `templateVersion`)
 * into explicit inputs for `fetchTemplateSchema`. It returns null when no template is
 * selected, allowing callers to keep load-options behavior predictable.
 * 
 * Returns the latest schema unless a specific version is enabled.
 */
/** @internal Test-only export */
export async function loadTemplateSchema(
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

/**
 * Template field load-options helpers.
 *
 * These functions adapt the Eledo template schema into `INodePropertyOptions[]`
 * used by the n8n UI (field selectors). They intentionally:
 *
 * - map schema keys into stable, sorted option lists
 * - split fields by primitive type groups to match how the UI presents inputs
 * - fetch the schema on demand (no caching), so the UI reflects the latest template state
 */

const ALLOWED_TEXT_NUMBER = new Set<PrimitiveType>([PRIMITIVE_TYPE.STRING, PRIMITIVE_TYPE.NUMBER]);
const ALLOWED_BOOLEAN = new Set<PrimitiveType>([PRIMITIVE_TYPE.BOOLEAN]);
const ALLOWED_DATE = new Set<PrimitiveType>([PRIMITIVE_TYPE.DATE]);

/**
 * Builds UI option entries for template fields of selected primitive types.
 *
 * This helper acts as an adapter between the Eledo template schema and the n8n
 * load-options UI layer. It:
 * - loads the currently selected template schema on demand
 * - extracts top-level primitive fields filtered by the provided type set
 * - sorts fields to ensure stable, predictable UI ordering
 * - maps schema fields into `INodePropertyOptions` used by field selectors
 *
 * The schema is fetched fresh on each invocation to reflect the latest template
 * state and avoid hidden caching assumptions.
 */
/** @internal Test-only export */
export async function getTemplatePrimitiveFieldOptions(
	this: ILoadOptionsFunctions,
	allowed: ReadonlySet<PrimitiveType>,
	describe: (t: PrimitiveType) => string,
): Promise<INodePropertyOptions[]> {
	const schema = await loadTemplateSchema.call(this);
	if (!schema) return [];

	const fields = pickPrimitiveFields(schema, allowed);

	// Stable output for UI
	fields.sort((a, b) => a.key.localeCompare(b.key));

	return fields.map((f) => ({
		name: f.key,
		value: f.key,
		description: describe(f.type),
	}));
}


/**
 * Returns selectable template fields that accept text or numeric values.
 *
 * The options are derived from the currently selected template schema and exposed
 * as UI choices (name/value pairs) for Guided Fields mapping.
 */
export async function getTemplateTextAndNumberFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return await getTemplatePrimitiveFieldOptions.call(
		this,
		new Set<PrimitiveType>(ALLOWED_TEXT_NUMBER),
		(t) => (t === PRIMITIVE_TYPE.NUMBER ? PRIMITIVE_TYPE.NUMBER : 'Text'),
	);
}

/**
 * Returns selectable template fields that accept boolean values.
 *
 * The options are derived from the currently selected template schema and exposed
 * as UI choices for Guided Fields mapping.
 */
export async function getTemplateBooleanFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return await getTemplatePrimitiveFieldOptions.call(
		this,
		new Set<PrimitiveType>(ALLOWED_BOOLEAN),
		() => PRIMITIVE_TYPE.BOOLEAN,
	);
}

/**
 * Returns selectable template fields that accept date/time values.
 *
 * The options are derived from the currently selected template schema and exposed
 * as UI choices for Guided Fields mapping.
 */
export async function getTemplateDateFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return await getTemplatePrimitiveFieldOptions.call(
		this,
		new Set<PrimitiveType>(ALLOWED_DATE),
		() => PRIMITIVE_TYPE.DATE,
	);
}