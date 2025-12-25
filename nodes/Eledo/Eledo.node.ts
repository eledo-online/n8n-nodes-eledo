import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { documentDescription } from './resources/document';

export class Eledo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Eledo',
		name: 'eledo',
		icon: { light: 'file:../../icons/eledo.svg', dark: 'file:../../icons/eledo.dark.svg' },
		group: ['transform'],
		version: 1,
        subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Generate PDFs with Eledo directly in n8n workflows',
		defaults: {
			name: 'Eledo',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'eledoApi', required: true }],
		requestDefaults: {
			baseURL: 'https://eledo.online/api/RESTv1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Document',
						value: 'document',
					}
				],
				default: 'document',
			},
			...documentDescription,
		],
	};
}
