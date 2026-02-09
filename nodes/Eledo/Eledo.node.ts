import { NodeConnectionTypes, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { documentDescription } from './resources/document';
import { getTemplates } from './resources/document/list';
import { getTemplateTextAndNumberFields, getTemplateBooleanFields, getTemplateDateFields } from './resources/document/schema';
import { executeDocumentGenerate } from './resources/document/generate-execute';
import { ELEDO_CREDENTIALS, ELEDO_SOURCE_HEADER } from '../../shared/eledo/constants/credentials';

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
		credentials: [{ name: ELEDO_CREDENTIALS.API, required: true }],
		requestDefaults: {
			headers: {
				...ELEDO_SOURCE_HEADER,
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

	/**
	 * Main execution entry point for the Eledo node.
	 *
	 * This node uses n8n's programmatic API to allow fine-grained control
	 * over execution flow and to support multiple resources and operations
	 * within a single node implementation.
	 *
	 * The execute method itself intentionally contains minimal logic.
	 * It acts as a dispatcher, routing each input item to a dedicated
	 * operation-specific handler (e.g. document.generate).
	 *
	 * This structure keeps business logic isolated in helper execute
	 * functions and makes the node easily extensible as new resources
	 * or operations are added in the future.
	 * 
	 * Operation handlers are invoked using Function.call to preserve
	 * the n8n execution context (this), which provides access to node
	 * parameters, helpers, and credentials.
	 */
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
