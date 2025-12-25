import type { INodeProperties } from 'n8n-workflow';
import { documentGenerateDescription } from './generate';

const showOnlyForDocuments = {
	resource: ['document'],
};

export const documentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForDocuments,
		},
		options: [
			{
				name: 'Generate',
				value: 'generate',
				action: 'Generate PDF document',
				description: 'Generate a PDF from a template',
				routing: {
					request: {
						method: 'POST',
						url: '/Generate',
					},
				},
			},
		],
		default: 'generate',
	},
	...documentGenerateDescription,
];
