export function base64UrlEncode(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...uint8Array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generatePKCECodes(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const randomBuffer = window.crypto.getRandomValues(new Uint8Array(32)).buffer;
  const verifier = base64UrlEncode(randomBuffer);

  const challengeBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );

  const challenge = base64UrlEncode(challengeBuffer);
  return { verifier, challenge };
}
