// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, it, expect } from 'vitest';
import { readFixtureJson } from '../../../../../utils/fixtures'
import { isEledoListResponse } from '../../../../../../nodes/Eledo/resources/document/list';

describe('isEledoListResponse', () => {
	it('accepts a minimal valid response', () => {
		const input = {
			templates: [
				{ id: 't1', name: 'Template 1' },
				{ id: 't2', name: 'Template 2' },
			],
		};

		expect(isEledoListResponse(input)).toBe(true);
	});

	it('accepts extra fields on response and templates', () => {
		const input = {
			templates: [
				{ id: 't1', name: 'Template 1', version: 3, bulk: true },
				{ id: 't2', name: 'Template 2', somethingElse: { nested: true } },
			],
			otherTopLevel: 'ignored',
		};

		expect(isEledoListResponse(input)).toBe(true);
	});

	it('rejects non-object values', () => {
		expect(isEledoListResponse(null)).toBe(false);
		expect(isEledoListResponse(undefined)).toBe(false);
		expect(isEledoListResponse('x')).toBe(false);
		expect(isEledoListResponse(123)).toBe(false);
		expect(isEledoListResponse(true)).toBe(false);
		expect(isEledoListResponse([])).toBe(false);
	});

	it('rejects missing templates key', () => {
		expect(isEledoListResponse({})).toBe(false);
		expect(isEledoListResponse({ template: [] })).toBe(false);
	});

	it('rejects templates that are not an array', () => {
		expect(isEledoListResponse({ templates: null })).toBe(false);
		expect(isEledoListResponse({ templates: {} })).toBe(false);
		expect(isEledoListResponse({ templates: 'nope' })).toBe(false);
		expect(isEledoListResponse({ templates: 1 })).toBe(false);
	});

	it('rejects templates with non-object entries', () => {
		expect(isEledoListResponse({ templates: [null] })).toBe(false);
		expect(isEledoListResponse({ templates: ['x'] })).toBe(false);
		expect(isEledoListResponse({ templates: [123] })).toBe(false);
		expect(isEledoListResponse({ templates: [true] })).toBe(false);
	});

	it('rejects template entries missing id or name', () => {
		expect(isEledoListResponse({ templates: [{ name: 'x' }] })).toBe(false);
		expect(isEledoListResponse({ templates: [{ id: 'x' }] })).toBe(false);
		expect(isEledoListResponse({ templates: [{}] })).toBe(false);
	});

	it('rejects template entries with wrong types for id/name', () => {
		expect(isEledoListResponse({ templates: [{ id: 1, name: 'x' }] })).toBe(false);
		expect(isEledoListResponse({ templates: [{ id: 'x', name: 2 }] })).toBe(false);
		expect(isEledoListResponse({ templates: [{ id: null, name: 'x' }] })).toBe(false);
		expect(isEledoListResponse({ templates: [{ id: 'x', name: null }] })).toBe(false);
	});

	it('rejects if any template item is invalid', () => {
		const input = {
			templates: [
				{ id: 't1', name: 'ok' },
				{ id: 't2' }, // invalid
			],
		};

		expect(isEledoListResponse(input)).toBe(false);
	});
});

describe('isEledoListResponse – fixtures', () => {
	it('accepts real-world /List success payload', () => {
		const payload = readFixtureJson('eledo', 'templates', 'list.default.scope.v1.ok.json');

		expect(isEledoListResponse(payload)).toBe(true);
	});

	it('rejects payload when template id is missing', () => {
		const payload = readFixtureJson('eledo', 'templates', 'list.missing-id.json');

		expect(isEledoListResponse(payload)).toBe(false);
	});
});
