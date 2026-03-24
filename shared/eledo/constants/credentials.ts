import type { IExecuteFunctions, IHttpRequestOptions, ILoadOptionsFunctions } from 'n8n-workflow';

export const ELEDO_CREDENTIALS = {
	API: 'eledoApi',
} as const;

export const ELEDO_SOURCE_HEADER = {
	'X-ELEDO-SOURCE': 'n8n-community-node'
} as const;

export async function eledoRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	options: IHttpRequestOptions,
) {
	const mergedOptions: IHttpRequestOptions = {
		...options,
		headers: {
			...ELEDO_SOURCE_HEADER,
			...(options.headers ?? {}),
		},
	};

	return await this.helpers.httpRequestWithAuthentication.call(
		this,
		ELEDO_CREDENTIALS.API,
		mergedOptions,
	);
}