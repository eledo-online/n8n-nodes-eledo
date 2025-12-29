const BASE_URL = 'https://eledo.online/api/RESTv1';

export function eledoUrl(path: string): string {
	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}
	return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
