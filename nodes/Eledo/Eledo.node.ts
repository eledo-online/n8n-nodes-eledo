import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { documentDescription } from './resources/document';
import { getTemplates } from './resources/document/list';
import { getTemplateFields } from './resources/document/schema';

export class Eledo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Eledo',
		name: 'eledo',
		icon: { light: 'file:../../shared/eledo/icons/eledo.svg', dark: 'file:../../shared/eledo/icons/eledo.dark.svg' },
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

	methods = {
		loadOptions: {
			getTemplates,
			getTemplateFields,
		},
	};
}
