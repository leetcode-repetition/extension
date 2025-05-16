export function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generatePKCECodes() {
  const verifier = base64UrlEncode(
    window.crypto.getRandomValues(new Uint8Array(32))
  );
  const challengeBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  const challenge = base64UrlEncode(challengeBuffer);
  return { verifier, challenge };
}
