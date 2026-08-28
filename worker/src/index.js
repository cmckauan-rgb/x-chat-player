const ALLOWED_ORIGIN = 'https://cmckauan-rgb.github.io';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST,OPTIONS,GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
}

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || ALLOWED_ORIGIN;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({
        ok: true,
        service: 'x-chat-oauth-proxy',
        clientMode: 'public-pkce',
        version: 'v5'
      }, 200, origin);
    }

    if (url.pathname !== '/oauth/token' || request.method !== 'POST') {
      return json({ error: 'not_found' }, 404, origin);
    }

    if (origin !== ALLOWED_ORIGIN) {
      return json({ error: 'origin_not_allowed' }, 403, ALLOWED_ORIGIN);
    }

    let incoming;
    try {
      incoming = await request.formData();
    } catch {
      return json({ error: 'invalid_form_body' }, 400, origin);
    }

    const grantType = String(incoming.get('grant_type') || '');
    const clientId = String(incoming.get('client_id') || '');

    if (!clientId) {
      return json({ error: 'missing_client_id' }, 400, origin);
    }

    // This project uses X OAuth 2.0 Authorization Code + PKCE as a public client.
    // The X app must therefore be configured as Native App (or Single Page App,
    // if that option is available). Public clients authenticate the token request
    // with client_id in the form body and do not use a Client Secret.
    const upstreamBody = new URLSearchParams();
    upstreamBody.set('grant_type', grantType);
    upstreamBody.set('client_id', clientId);

    if (grantType === 'authorization_code') {
      const code = String(incoming.get('code') || '');
      const verifier = String(incoming.get('code_verifier') || '');
      const redirectUri = String(incoming.get('redirect_uri') || '');

      if (!code || !verifier || redirectUri !== REDIRECT_URI) {
        return json({ error: 'invalid_authorization_code_request' }, 400, origin);
      }

      upstreamBody.set('code', code);
      upstreamBody.set('code_verifier', verifier);
      upstreamBody.set('redirect_uri', REDIRECT_URI);
    } else if (grantType === 'refresh_token') {
      const refreshToken = String(incoming.get('refresh_token') || '');
      if (!refreshToken) {
        return json({ error: 'missing_refresh_token' }, 400, origin);
      }
      upstreamBody.set('refresh_token', refreshToken);
    } else {
      return json({ error: 'unsupported_grant_type' }, 400, origin);
    }

    try {
      const upstream = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: upstreamBody.toString()
      });

      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8'
        }
      });
    } catch (error) {
      return json({ error: 'upstream_fetch_failed', detail: String(error?.message || error) }, 502, origin);
    }
  }
};
