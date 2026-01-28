import { NodeApiError} from 'n8n-workflow';
import type { JsonObject, IExecuteFunctions } from 'n8n-workflow';

/**
 * Runtime type guard for JSON objects.
 *
 * TypeScript types are erased at runtime, so external data (API responses, user input)
 * must be validated structurally before it is treated as a JsonObject.
 *
 * This guard returns true only for plain object values and excludes `null` and arrays.
 */
export function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extracts a filename from a Content-Disposition header value.
 *
 * Supports common forms such as:
 * - `attachment; filename="file_name.pdf"`
 * - `attachment; filename=file_name.pdf`
 * - `attachment; filename*=UTF-8''file_name.pdf` (RFC 5987)
 *
 * Observed behavior (Eledo):
 * - The header may include *both* `filename` and `filename*` parameters
 * - Either variant may appear first; this function accepts both
 *
 * Returns `undefined` if no filename can be extracted or the header is empty.
 *
 * Notes:
 * - Best-effort and intentionally non-throwing
 * - If percent-decoding fails, the raw captured value is returned
 */
export function extractFilename(contentDisposition?: string): string | undefined {
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
export function toIsoDateTimeStringMaybe(v: unknown): string | undefined {
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
export function coerceNumberMaybe(v: unknown): number | undefined {
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
export function safeJsonParseObject(this: IExecuteFunctions, raw: unknown): JsonObject {
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
