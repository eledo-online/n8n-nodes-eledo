export function withDefaults<T extends Record<string, unknown>>(defaults: T, overrides?: Partial<T>): T {
	return { ...defaults, ...(overrides ?? {}) } as T;
}
