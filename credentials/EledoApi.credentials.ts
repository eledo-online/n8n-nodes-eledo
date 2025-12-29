import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { eledoUrl } from '../shared/eledo/constants/url';

export class EledoApi implements ICredentialType {
	name = 'eledoApi';

	displayName = 'Eledo API';

	icon: Icon = { light: 'file:../shared/eledo/icons/eledo.svg', dark: 'file:../shared/eledo/icons/eledo.dark.svg' };

	documentationUrl = 'https://github.com/eledo-online/n8n-nodes-eledo/blob/main/README.md#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Create or copy your API key in Eledo → API Details: https://eledo.online/api',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Api-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: eledoUrl('/Profile'),
		},
	};
}
