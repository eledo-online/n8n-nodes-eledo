import { IHttpRequestOptions, INodeExecutionData, JsonObject, type IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { eledoUrl } from '../../../../shared/eledo/constants/url';

type InputMode = 'fields' | 'json';
type OutputType = 'file' | 'base64';

/**
 * Extracts a filename from a Content-Disposition header value.
 *
 * Supports common forms like:
 * - `attachment; filename="file_name.pdf"`
 * - `attachment; filename=file_name.pdf`
 * - `attachment; filename*=UTF-8''file_name.pdf` (RFC 5987 style)
 *
 * Returns undefined if no filename can be found or the header is empty.
 *
 * Notes:
 * - This function is best-effort and intentionally non-throwing.
 * - If percent-decoding fails, it returns the raw captured value.
 */
function extractFilename(contentDisposition?: string): string | undefined {
	if (!contentDisposition) return;
	// attachment; filename="file_name"
	const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i.exec(contentDisposition);
	if (!m) return;
	try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

/**
 * Attempts to serialize a value into an ISO-8601 date-time string (UTC, via Date#toISOString).
 *
 * Input:
 * - Accepts unknown values (string, number, Date, etc.).
 *
 * Output:
 * - Returns an ISO-8601 string (example: `2026-01-19T18:02:00.000Z`) if the value can be
 *   interpreted as a valid date.
 * - Returns undefined if the input is null/undefined/empty or cannot be parsed into a valid date.
 *
 * Notes:
 * - Uses the JavaScript Date parser semantics — which are permissive but can be surprising for
 *   non-ISO date strings.
 * - The returned format is always UTC ("Z"), not a local timezone offset.
 */
function toIsoDateTimeStringMaybe(v: unknown): string | undefined {
	if (v === null || v === undefined) return;

	if (v instanceof Date) {
		if (Number.isNaN(v.getTime())) return;
		return v.toISOString();
	}

	if (typeof v === 'string' || typeof v === 'number') {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return;
		return d.toISOString();
	}

	return;
}

/**
 * Attempts to coerce an unknown value into a finite number.
 *
 * Input:
 * - Accepts unknown values.
 * - If `v` is a number, it is returned as-is (including integers/floats).
 * - If `v` is a string, it is converted via `Number(v)`.
 *
 * Output:
 * - Returns a finite number (not NaN, not Infinity) when conversion succeeds.
 * - Returns undefined for null/undefined, non-numeric strings, NaN, Infinity, or unsupported types.
 *
 * Notes:
 * - This is a lenient conversion helper intended for mapping UI string inputs to typed JSON.
 * - It is intentionally non-throwing.
 */
function coerceNumberMaybe(v: unknown): number | undefined {
	if (v === '' || v === null || v === undefined) return;
	if (typeof v === 'number') return v;
	if (typeof v === 'string') {
		const n = Number(v);
		return Number.isFinite(n) ? n : undefined;
	}
	return;
}

/**
 * Parses a JSON string into a plain object (JsonObject).
 *
 * Behavior:
 * - Accepts any value; only string inputs are considered for parsing.
 * - Trims the input string before parsing.
 * - Allows an empty string and treats it as an empty object `{}`.
 *
 * Validation:
 * - Throws a NodeApiError if JSON parsing fails.
 * - Throws a NodeApiError if the parsed value is not a plain object (arrays are rejected).
 *
 * Returns:
 * - A plain object suitable for use as the `file` payload in Eledo requests.
 *
 * Notes:
 * - This helper is used to ensure the "JSON" input mode produces a predictable structure.
 * - It does not validate schema keys — only shape (object vs array) and JSON correctness.
 */
function safeJsonParseObject(this: IExecuteFunctions, raw: unknown): JsonObject {
	const text = typeof raw === 'string' ? raw.trim() : '';

	// Allow empty payload → treated as empty file object
	if (text === '') return {};

	let parsed: unknown;

	try {
		parsed = JSON.parse(text);
	} catch {
		throw new NodeApiError(this.getNode(), {
			message: 'Invalid JSON payload.',
		});
	}

	if (
		parsed === null ||
		typeof parsed !== 'object' ||
		Array.isArray(parsed)
	) {
		throw new NodeApiError(this.getNode(), {
			message:
				'JSON payload must be an object (the content of the "file" object).',
		});
	}

	return parsed as JsonObject;
}

function buildFileFromGuidedFields(this: IExecuteFunctions, itemIndex: number): JsonObject | undefined {
	const file: JsonObject = {};

	type FixedCollectionRows = {
		field?: Array<{
			name?: string;
			value?: unknown;
		}>;
	};

	const tn = this.getNodeParameter('textAndNumberFields', itemIndex, {}) as FixedCollectionRows;
	const tnRows = tn.field ?? [];
	for (const row of tnRows) {
		const key = row.name;
		if (!key) continue;
		const v = row.value;

		// best-effort: treat numeric-like as number; otherwise string
		const n = coerceNumberMaybe(v);
		file[key] = n ?? (v ?? '');
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

function buildGenerateRequestBody(this: IExecuteFunctions, itemIndex: number): JsonObject {
	const templateId = this.getNodeParameter('templateId', itemIndex) as string;
	if (!templateId) {
		throw new NodeApiError(this.getNode(), { message: 'Template is required.' });
	}

	const useTemplateVersion = this.getNodeParameter('useTemplateVersion', itemIndex) as boolean;
	const templateVersionRaw = this.getNodeParameter('templateVersion', itemIndex, undefined);
	const templateVersion =
		useTemplateVersion && typeof templateVersionRaw === 'number' ? templateVersionRaw : undefined;

	const inputMode = this.getNodeParameter('inputMode', itemIndex) as InputMode;

	let fileObj: JsonObject | undefined;

	if (inputMode === 'json') {
		// JSON = content of file object
		const raw = this.getNodeParameter('payloadJson', itemIndex) as string;
		fileObj = safeJsonParseObject.call(this, raw);
		if (Object.keys(fileObj).length === 0) fileObj = undefined; // optional file
	} else {
		fileObj = buildFileFromGuidedFields.call(this, itemIndex);
	}

	type GenerateRequestBody = {
		templateId: string;
		templateVersion?: number;
		file?: JsonObject;
	};

	const body: GenerateRequestBody = { templateId };
	if (templateVersion !== undefined) body.templateVersion = templateVersion;
	if (fileObj !== undefined) body.file = fileObj;

	return body;
}

async function callGenerate(this: IExecuteFunctions, body: JsonObject) {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: eledoUrl('/Generate'),
		body,
		json: true,
		returnFullResponse: true,
		encoding: 'arraybuffer'
	};

	// uses your credential name: eledoApi
	return (await this.helpers.httpRequestWithAuthentication.call(this, 'eledoApi', options)) as {
		body: ArrayBuffer;
		headers: JsonObject;
		statusCode: number;
	};
}

export async function executeDocumentGenerate(this: IExecuteFunctions, itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
	const outputType = this.getNodeParameter('outputType', itemIndex) as OutputType;

	const body: JsonObject = buildGenerateRequestBody.call(this, itemIndex);
	const resp = await callGenerate.call(this, body);

	const contentType = String(resp.headers?.['content-type'] ?? '').toLowerCase();

	// Eledo: error is JSON
	if (contentType.includes('application/json')) {
		const text = resp.body ? await this.helpers.binaryToString(resp.body as ArrayBuffer, 'utf8') : '';
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

	if (outputType === 'base64') {
		out.json.pdfBase64 = await this.helpers.binaryToString(resp.body as ArrayBuffer, 'base64');
		out.json.filename = filename;
		out.json.mimeType = 'application/pdf';
		return out;
	}

	// outputType === 'file'
	out.binary!.pdf = await this.helpers.prepareBinaryData(resp.body, filename, 'application/pdf');
	return out;
}
