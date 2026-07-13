const encoder = new TextEncoder();

function hexToBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal value.');
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(
  password: string,
  storedValue: string,
): Promise<boolean> {
  const [algorithm, iterationsText, saltHex, expectedHex] = storedValue.split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !saltHex || !expectedHex) {
    return false;
  }

  const iterations = Number.parseInt(iterationsText, 10);
  if (!Number.isSafeInteger(iterations) || iterations < 210_000) {
    return false;
  }

  try {
    const salt = hexToBytes(saltHex);
    const expected = hexToBytes(expectedHex);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt,
        iterations,
      },
      key,
      expected.byteLength * 8,
    );
    return timingSafeEqual(new Uint8Array(derived), expected);
  } catch {
    return false;
  }
}

export function secureCookie(value: string, maxAge = 3600): string {
  return `courtscope_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return new URL(origin).host === new URL(request.url).host;
}
