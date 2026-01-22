import { INodeExecutionData, type IExecuteFunctions } from 'n8n-workflow';

export async function executeDocumentGenerate(this: IExecuteFunctions, itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
    return {
        json: {
            ok: true
        },
    };
}
