import { generatePKCECodes } from './utilities.js';

const CLIENT_ID =
  '968959270720-vupaquhphp0jjs58r3mm4pm0t0u7l16i.apps.googleusercontent.com';
const REDIRECT_URI = browser.identity.getRedirectURL();

async function buildAuthUrl() {
  const { verifier, challenge } = await generatePKCECodes();
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
