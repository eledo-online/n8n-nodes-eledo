import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocumentGenerate = {
	operation: ['generate'],
	resource: ['document'],
};

export const documentGenerateDescription: INodeProperties[] = [
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		required: true,
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
		},
		description: 'Select the document template to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: showOnlyForDocumentGenerate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'templateId',
			},
		},
	},
	{
		displayName: 'Use Specific Version',
		name: 'useTemplateVersion',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: showOnlyForDocumentGenerate,
		},
		description: 'Whether to use a specific template version instead of the latest one',
	},
	{
		displayName: 'Template Version',
		name: 'templateVersion',
		type: 'number',
		typeOptions: { minValue: 1, numberPrecision: 0 },
		default: 1,
		displayOptions: {
			show: {
				...showOnlyForDocumentGenerate,
				useTemplateVersion: [true],
			},
		},
		description: 'Specific version of the template',
		routing: {
			send: {
				type: 'body',
				property: 'templateVersion',
			},
		},
	},
	{
		displayName: 'Payload (JSON)',
		name: 'file',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: showOnlyForDocumentGenerate,
		},
		description: 'JSON payload matching the template schema used to generate the PDF',
		routing: {
			send: {
				type: 'body',
				property: 'file',
			},
		},
	},
];
