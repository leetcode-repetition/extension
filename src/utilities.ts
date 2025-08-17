export function base64UrlEncode(buffer: ArrayBuffer): string {
  const uint8Array: Uint8Array = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...uint8Array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generatePKCECodes(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const randomBuffer: ArrayBuffer = window.crypto.getRandomValues(
    new Uint8Array(32)
  ).buffer;
  const verifier: string = base64UrlEncode(randomBuffer);

  const challengeBuffer: ArrayBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );

  const challenge: string = base64UrlEncode(challengeBuffer);
  return { verifier, challenge };
}
