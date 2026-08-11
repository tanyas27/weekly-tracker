import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LEN = 32; // 256 bits
const DIGEST = 'sha256';

export function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(passcode, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

export function verifyPasscode(passcode: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('pbkdf2:')) {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 3) {
    return false;
  }
  const [, salt, expectedHashHex] = parts;
  const computedHashHex = crypto.pbkdf2Sync(passcode, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');

  const bufA = Buffer.from(computedHashHex, 'hex');
  const bufB = Buffer.from(expectedHashHex, 'hex');

  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
