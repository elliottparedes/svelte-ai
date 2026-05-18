import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;

export async function hashPassword(plain: string): Promise<string> {
	const salt = randomBytes(16);
	const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
	return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	if (!saltHex || !hashHex) return false;
	const salt = Buffer.from(saltHex, 'hex');
	const expected = Buffer.from(hashHex, 'hex');
	const derived = (await scryptAsync(plain, salt, expected.length)) as Buffer;
	if (derived.length !== expected.length) return false;
	return timingSafeEqual(derived, expected);
}
