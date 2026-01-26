import { IHttpRequestOptions, INodeExecutionData, JsonObject, NodeApiError } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';
import { ELEDO_CREDENTIALS } from '../../../../shared/eledo/constants/credentials';
import { extractFilename, toIsoDateTimeStringMaybe, coerceNumberMaybe, safeJsonParseObject } from '../../../../shared/eledo/helpers';

/**
 * Generate PDF operation logic.
 *
 * This file contains the complete execution logic for the `Generate` operation
 * of the Eledo PDF n8n node.
 *
 * Responsibilities:
 * - Validate and normalize node parameters for the Generate operation
 * - Build the request payload for the Eledo `/Generate` API
 * - Support multiple input modes (Guided Fields and raw JSON)
 * - Execute the authenticated HTTP request against Eledo
 * - Handle success and error responses consistently
 * - Transform the API response into n8n-compatible output formats
 *
 * The UI configuration (options, fields, selectors) lives separately.
 * This file focuses purely on runtime behavior and data transformation.
 *
 * Keeping the Generate operation isolated here makes the node easier to
 * reason about, test, and extend as new document-related operations are added.
 */

const INPUT_MODE = {
	FIELDS: 'fields',
	JSON: 'json',
} as const;
type InputMode = typeof INPUT_MODE[keyof typeof INPUT_MODE];


const OUTPUT_TYPE = {
	FILE: 'file',
	BASE64: 'base64',
} as const;
type OutputType = typeof OUTPUT_TYPE[keyof typeof OUTPUT_TYPE];

type GenerateRequestBody = {
	templateId: string;
	templateVersion?: number;
	file: JsonObject | null;
};

type FixedCollectionRows = {
	field?: Array<{
		name?: string;
		value?: unknown;
	}>;
};

type GenerateHttpResponse = {
	body: ArrayBuffer;
	headers: JsonObject;
	statusCode: number;
};

/**
 * Normalize a Guided Field value into a text-or-number JSON value.
 *
 * This helper is used when building the `file` payload for the Eledo
 * /Generate API from Guided Fields.
 *
 * Behavior:
 * - Empty, null, or undefined values are normalized to `null`
 * - Numeric-like values are converted to `number`
 * - All other values are converted to `string`
 *
 * This mirrors the semantics of the Guided Fields UI, where a field
 * may represent either free text or a number, and ensures the resulting
 * value is always a JSON-safe primitive.
 *
 * Note:
 * - This function intentionally does **not** drop string values that
 *   are not numeric.
 * - Returning `null` allows the caller to decide whether to omit the
 *   field entirely or send an explicit null.
 *
 * @param v Raw field value from the node UI
 * @returns A string, number, or null suitable for inclusion in a JSON payload
 */
function coerceTextOrNumberValue(v: unknown): string | number | null {
  if (v === '' || v === null || v === undefined) return null;

  const n = coerceNumberMaybe(v);
  if (n !== undefined) return n;

  return String(v);
}

/**
 * Builds the `file` payload object for the Eledo /Generate API
 * from the node's Guided Fields UI.
 *
 * This function collects values from the three Guided Fields groups:
 * - Text / Number Fields
 * - Boolean Fields
 * - Date Fields
 *
 * Each group is processed independently and merged into a single
 * flat JSON object that corresponds to the `file` object expected
 * by the Eledo API.
 *
 * Design notes:
 * - Only flat (top-level) fields are supported in Guided Fields.
 * - Missing, empty, or invalid fields are skipped entirely (not included in the payload).
 * - Eledo accepts partial payloads, so absent fields are valid.
 *
 * Type handling:
 * - Text / Number fields:
 *   Attempts best-effort numeric coercion; if the value cannot be represented
 *   as a JSON primitive, it is omitted from the payload.
 * - Boolean fields:
 *   Always coerced to a boolean using truthiness.
 * - Date fields:
 *   Converted to ISO 8601 date-time strings; invalid or empty
 *   values are ignored.
 *
 * If no valid fields are provided, this function returns `undefined`
 * to indicate that no `file` object should be sent at all.
 *
 * @param itemIndex Index of the current input item being processed
 * @returns A JSON object representing the `file` payload, or
 *          `undefined` if no fields were provided
 */
function buildFileFromGuidedFields(this: IExecuteFunctions, itemIndex: number): JsonObject | undefined {
	const file: JsonObject = {};
	const tn = this.getNodeParameter('textAndNumberFields', itemIndex, {}) as FixedCollectionRows;
	const tnRows = tn.field ?? [];
	for (const row of tnRows) {
		const key = row.name;
		if (!key) continue;
		const value = coerceTextOrNumberValue(row.value);
		// if invalid / empty, we skip (Eledo accepts partial payloads)
		if (value === null) continue;
		file[key] = value;
	}

	const bf = this.getNodeParameter('booleanFields', itemIndex, {}) as FixedCollectionRows;
	const bfRows = bf?.field ?? [];
	for (const row of bfRows) {
		const key = row.name;
		if (!key) continue;
		file[key] = !!row.value;
	}

	const df = this.getNodeParameter('dateFields', itemIndex, {}) as FixedCollectionRows;
	const dfRows = df?.field ?? [];
	for (const row of dfRows) {
		const key = row.name;
		if (!key) continue;
		const iso = toIsoDateTimeStringMaybe(row.value);
		// if invalid / empty, we skip (Eledo accepts partial payloads)
		if (!iso) continue;
		file[key] = iso;
	}

	return Object.keys(file).length ? file : undefined;
}

/**
 * Builds the request body for the Eledo `/Generate` API call.
 *
 * This function translates node parameters into the exact JSON
 * structure expected by Eledo, handling both supported input modes:
 *
 * - Guided Fields: values collected via the n8n UI are assembled
 *   into a flat `file` object.
 * - JSON Input: the user-provided JSON is treated as the content
 *   of the `file` object directly.
 *
 * Key behaviors:
 * - `templateId` is mandatory and validated here.
 * - `templateVersion` is included only when explicitly enabled.
 * - The `file` field is always included. If no input data is provided,
 *   `file` is sent as `null` (Eledo accepts partial payloads).
 *
 * This function performs only structural validation:
 * - JSON syntax and object shape are validated for JSON input.
 * - Field-level coercion is delegated to helper functions.
 *
 * The resulting object is safe to send directly to the Eledo
 * `/Generate` endpoint.
 *
 * @param itemIndex Index of the current input item being processed
 * @returns A fully constructed request body for the Generate API
 * @throws NodeApiError if required parameters are missing or invalid
 */
function buildGenerateRequestBody(this: IExecuteFunctions, itemIndex: number): JsonObject {
	const templateId = this.getNodeParameter('templateId', itemIndex) as string;
	if (!templateId) {
		throw new NodeApiError(this.getNode(), { message: 'Template is required.' });
	}

	const useTemplateVersion = this.getNodeParameter('useTemplateVersion', itemIndex) as boolean;

	let templateVersion: number | undefined;

	if (useTemplateVersion) {
		const raw = this.getNodeParameter('templateVersion', itemIndex) as unknown;

		if (typeof raw !== 'number' || !Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) {
			throw new NodeApiError(this.getNode(), {
				message: 'Template Version must be an integer number ≥ 1.',
			});
		}

		templateVersion = raw;
	}

	const inputMode = this.getNodeParameter('inputMode', itemIndex) as InputMode;

	let fileObj: JsonObject | undefined;

	if (inputMode === INPUT_MODE.JSON) {
		// JSON = content of file object
		const raw = this.getNodeParameter('payloadJson', itemIndex) as string;
		fileObj = safeJsonParseObject.call(this, raw);
		if (Object.keys(fileObj).length === 0) fileObj = undefined; // optional file
	} else {
		fileObj = buildFileFromGuidedFields.call(this, itemIndex);
	}

	// Eledo API contract (validated): `file` must be present; `null` is allowed.
	const body: GenerateRequestBody = {
		templateId,
		file: fileObj ?? null,
	};

	if (templateVersion !== undefined) body.templateVersion = templateVersion;

	return body;
}

/**
 * Executes the Eledo `/Generate` API call.
 *
 * This function is a thin, focused transport layer responsible for:
 * - Sending the already-constructed request body to the Eledo Generate endpoint
 * - Executing the request using n8n-managed authentication
 * - Returning the full HTTP response (headers + binary body)
 *
 * Important design notes:
 * - This function does NOT build or validate the request payload.
 *   That responsibility belongs to higher-level helpers.
 * - The response is returned in raw binary form (`ArrayBuffer`)
 *   because successful responses contain a PDF file.
 * - Error handling based on Content-Type (JSON vs PDF) is intentionally
 *   deferred to the caller.
 *
 * Keeping this function minimal makes it easy to test, reuse,
 * and adapt if the Generate transport changes in the future.
 *
 * @param body Fully constructed Generate request body
 * @returns Full HTTP response including binary PDF body and headers
 */

async function callGenerate(this: IExecuteFunctions, body: JsonObject): Promise<GenerateHttpResponse> {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: eledoUrl('/Generate'),
		body,
		json: true,
		returnFullResponse: true,
		encoding: 'arraybuffer'
	};

	return (await this.helpers.httpRequestWithAuthentication.call(this, ELEDO_CREDENTIALS.API, options));
}

/**
 * Executes the Document → Generate operation.
 *
 * High-level flow:
 * 1) Read node parameters (input mode, template/version, output type).
 * 2) Build the Eledo `/Generate` request body (optionally with a `file` object).
 * 3) Call the Eledo API and receive a binary response (`ArrayBuffer`) with headers.
 * 4) Decide whether the response is a PDF or an API error based on Content-Type:
 *    - `application/pdf` → success
 *    - `application/json` → error payload (Eledo returns JSON errors even for this endpoint)
 * 5) Convert the successful PDF into the requested output:
 *    - `file`  → attach PDF to `out.binary.pdf`
 *    - `base64` → set `out.json.pdfBase64` and include filename + mimeType metadata
 *
 * Design notes:
 * - We treat all external API responses as untrusted and only interpret them using boundary checks
 *   (Content-Type and guarded JSON parsing).
 * - We keep the node output stable and non-destructive: the returned item copies the original
 *   `json`/`binary` payload and only adds new fields.
 * - Filename is taken from `Content-Disposition` when available; otherwise we default to `document.pdf`.
 *
 * @param itemIndex Index of the current input item being processed by n8n
 * @param item The current input item (used as the base for the output item)
 * @returns A single n8n item containing either a binary PDF or a Base64 representation
 * @throws NodeApiError when Eledo returns an error response (JSON payload)
 */
export async function executeDocumentGenerate(this: IExecuteFunctions, itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
	const outputType = this.getNodeParameter('outputType', itemIndex) as OutputType;

	const body: JsonObject = buildGenerateRequestBody.call(this, itemIndex);
	const resp = await callGenerate.call(this, body);

	const contentType = String(resp.headers?.['content-type'] ?? '').toLowerCase();

	// Eledo: error is JSON
	if (contentType.includes('application/json')) {
		const text = resp.body ? await this.helpers.binaryToString(resp.body, 'utf8') : '';
		let errJson: JsonObject | undefined;
		try {
			errJson = text ? (JSON.parse(text) as JsonObject) : undefined;
		} catch {
			errJson = undefined;
		}
		throw new NodeApiError(this.getNode(), errJson ?? { message: text || 'Eledo API error' });
	}

	const filename =
		extractFilename(String(resp.headers?.['content-disposition'] ?? '')) ?? 'document.pdf';

	const out: INodeExecutionData = {
		json: { ...(item.json ?? {}) },
		binary: item.binary ? { ...item.binary } : {},
	};

	if (outputType === OUTPUT_TYPE.BASE64) {
		out.json.pdfBase64 = await this.helpers.binaryToString(resp.body, OUTPUT_TYPE.BASE64);
		out.json.filename = filename;
		out.json.mimeType = 'application/pdf';
		return out;
	}

	// outputType === OUTPUT_TYPE.FILE
	out.binary!.pdf = await this.helpers.prepareBinaryData(resp.body, filename, 'application/pdf');
	return out;
}
