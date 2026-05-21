import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(secret: string): Buffer {
	return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plainText: string, secret: string): string {
	const iv = randomBytes(IV_LENGTH);
	const key = deriveKey(secret);
	const cipher = createCipheriv(ALGO, key, iv);
	const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(cipherText: string, secret: string): string {
	const [ivB64, tagB64, encB64] = cipherText.split(':');
	if (!ivB64 || !tagB64 || !encB64) {
		throw new Error('Invalid ciphertext');
	}
	const key = deriveKey(secret);
	const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
	decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(encB64, 'base64')),
		decipher.final()
	]);
	return decrypted.toString('utf8');
}

export function maskToken(token: string): string {
	if (token.length <= 8) return '****';
	return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
