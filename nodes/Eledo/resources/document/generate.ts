import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocumentGenerate = {
	operation: ['generate'],
	resource: ['document'],
};

export const documentGenerateDescription: INodeProperties[] = [
	{
		displayName: 'Template Scope',
		name: 'templateScope',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'private',
		displayOptions: {
			show: showOnlyForDocumentGenerate,
		},
		options: [
			{ name: 'Private', value: 'private' },
			{ name: 'Public', value: 'public' },
		],
		description: 'Whether to load templates from your private library or from the public gallery',
	},
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		required: true,
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
			loadOptionsDependsOn: ['templateScope']
		},
		description: 'Select the document template to use. Templates are loaded from the selected scope. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: showOnlyForDocumentGenerate,
		},
	},
	{
		displayName: 'Use Specific Template Version',
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
	},
	{
		displayName: 'Input',
		name: 'inputMode',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'fields',
		displayOptions: {
				show: showOnlyForDocumentGenerate,
				hide: {
				templateId: [''], // hide until template selected
			},
		},
		options: [
			{
				name: 'Guided Fields',
				value: 'fields',
				description: 'Fill template fields using a guided form generated from the selected template',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Provide the raw JSON payload manually (advanced users)',
			},
		],
		description:
			'Choose how to provide input data for the selected template. Guided Fields are recommended for most use cases.',
	},
	{
		displayName: 'Text / Number Fields',
		name: 'textAndNumberFields',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Text or Number Field',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
				show: {
					...showOnlyForDocumentGenerate,
					inputMode: ['fields'],
				},
				hide: {
				templateId: [''], // hide until template selected
			},
		},
		description: 'Add template fields and map values (you can use expressions)',
		options: [
			{
				name: 'field',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'name',
						type: 'options',
						required: true,
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getTemplateTextAndNumberFields',
							loadOptionsDependsOn: ['templateId', 'useTemplateVersion', 'templateVersion'],
						},
						description:
							'Select a field from the template schema. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Boolean Fields',
		name: 'booleanFields',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Boolean Field',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
				show: {
					...showOnlyForDocumentGenerate,
					inputMode: ['fields'],
				},
				hide: {
				templateId: [''], // hide until template selected
			},
		},
		options: [
			{
				name: 'field',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'name',
						type: 'options',
						required: true,
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getTemplateBooleanFields',
							loadOptionsDependsOn: ['templateId', 'useTemplateVersion', 'templateVersion'],
						},
						description:
							'Select a Boolean field from the template schema. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'boolean',
						default: false,
					},
				],
			},
		],
	},
	{
		displayName: 'Date Fields',
		name: 'dateFields',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Date Field',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
				show: {
					...showOnlyForDocumentGenerate,
					inputMode: ['fields'],
				},
				hide: {
				templateId: [''], // hide until template selected
			},
		},
		options: [
			{
				name: 'field',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'name',
						type: 'options',
						required: true,
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getTemplateDateFields',
							loadOptionsDependsOn: ['templateId', 'useTemplateVersion', 'templateVersion'],
						},
						description:
							'Select a Date field from the template schema. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'dateTime',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Payload (JSON)',
		name: 'payloadJson',
		type: 'json',
		default: '',
		displayOptions: {
				show: {
					...showOnlyForDocumentGenerate,
					inputMode: ['json'],
				},
				hide: {
				templateId: [''], // hide until template selected
			},
		},
		description:
			'Paste the JSON payload for the selected template. You can copy the exact payload structure from the template’s API page in Eledo.',
	},
	{
		displayName: 'Output',
		name: 'outputType',
		type: 'options',
		noDataExpression: true,
		required: true,
		default: 'file',
		displayOptions: {
				show: showOnlyForDocumentGenerate,
				hide: {
				templateId: [''], // hide until template selected
			},
		},
		options: [
			{
				name: 'File',
				value: 'file',
				description: 'Return the generated PDF as a binary file for use in subsequent workflow steps',
			},
			{
				name: 'Base64',
				value: 'base64',
				description: 'Return the generated PDF encoded as a Base64 string',
			},
		],
		description: 'Choose how the generated PDF should be returned',
	},
];
