const BASE_URL = 'https://eledo.online/api/RESTv1';

/**
 * Normalizes Eledo API endpoints to a fully-qualified URL.
 *
 * n8n helpers may sometimes pass only a relative path (e.g. "/Generate")
 * instead of a full URL, depending on call site and helper usage.
 *
 * This function ensures all outbound requests always target the
 * correct Eledo API base URL, while still allowing absolute URLs
 * to pass through unchanged.
 */
export function eledoUrl(path: string): string {
	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}
	return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
