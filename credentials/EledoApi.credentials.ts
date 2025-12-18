import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EledoApi implements ICredentialType {
	name = 'eledoApi';

	displayName = 'Eledo API';

	icon: Icon = { light: 'file:../icons/eledo.svg', dark: 'file:../icons/eledo.dark.svg' };

	documentationUrl = 'https://github.com/eledo-online/n8n-nodes-eledo/blob/main/README.md#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://eledo.online/api/RESTv1',
			url: '/v1/user',
		},
	};
}
