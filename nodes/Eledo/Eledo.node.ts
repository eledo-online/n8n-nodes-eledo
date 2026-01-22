import { NodeConnectionTypes, type INodeType, type INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { documentDescription } from './resources/document';
import { getTemplates } from './resources/document/list';
import { getTemplateTextAndNumberFields, getTemplateBooleanFields, getTemplateDateFields } from './resources/document/schema';
import { executeDocumentGenerate } from './resources/document/generate-execute';

export class Eledo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Eledo PDF',
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
			getTemplateTextAndNumberFields,
			getTemplateBooleanFields,
			getTemplateDateFields,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			if (resource === 'document' && operation === 'generate') {
				const out = await executeDocumentGenerate.call(this, i, items[i]);
				returnItems.push(out);
				continue;
			}

			// fallback passthrough
			returnItems.push(items[i]);
		}

		return [returnItems];
	}
}
