/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { vi } from 'vitest';

type CtxBase = {
  getNode: ReturnType<typeof vi.fn>;
  getCurrentNodeParameter: ReturnType<typeof vi.fn>;
  helpers: {
    httpRequestWithAuthentication: { call: ReturnType<typeof vi.fn> };
  };
};

export function makeLoadOptionsCtx(params: Record<string, unknown> = {}) {
  const httpCall = vi.fn();

  const ctx: CtxBase = {
    getNode: vi.fn(() => ({ name: 'Eledo' })),
    getCurrentNodeParameter: vi.fn((key: string) => params[key]),
    helpers: {
      httpRequestWithAuthentication: { call: httpCall },
    },
  };

  return { ctx, httpCall };
}

export function makeExecuteCtx(params: Record<string, unknown> = {}) {
	const httpCall = vi.fn();

	const ctx: any = {
		getNode: vi.fn(() => ({ name: 'Eledo' })),
		getNodeParameter: vi.fn((key: string) => params[key]),
		helpers: {
			httpRequestWithAuthentication: { call: httpCall },

			// add only what a given test needs
			binaryToString: vi.fn(),
			prepareBinaryData: vi.fn(),
		},
	} satisfies CtxBase & { getNodeParameter: any };

	return { ctx, httpCall };
}

export function withDefaults<T extends Record<string, unknown>>(defaults: T, overrides?: Partial<T>): T {
	return { ...defaults, ...(overrides ?? {}) } as T;
}
