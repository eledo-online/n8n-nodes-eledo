/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesRoot = path.resolve(__dirname, '..', 'fixtures');

export function fixturePath(...parts: string[]) {
	return path.join(fixturesRoot, ...parts);
}

export function readFixtureText(...parts: string[]) {
	return fs.readFileSync(fixturePath(...parts), 'utf8');
}

export function readFixtureJson<T = unknown>(...parts: string[]): T {
	return JSON.parse(readFixtureText(...parts)) as T;
}

export function readFixtureBuffer(...parts: string[]): ArrayBuffer {
	// for PDF / arraybuffer cases
	const b = fs.readFileSync(fixturePath(...parts));
	return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
