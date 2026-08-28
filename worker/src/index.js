const ALLOWED_ORIGIN = 'https://cmckauan-rgb.github.io';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const ME_URL = 'https://api.x.com/2/users/me?user.fields=username,name,profile_image_url';
const CONVERSATIONS_URL = 'https://api.x.com/2/chat/conversations';
const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST,OPTIONS,GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function bearerFrom(request) {
  const authorization = request.headers.get('Authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization : null;
}

async function xFetchText(authorization, upstreamUrl) {
  return fetch(upstreamUrl, { headers: { Authorization: authorization } });
}

async function proxyJsonGet(request, origin, upstreamUrl) {
  const authorization = bearerFrom(request);
  if (!authorization) return json({ error: 'missing_bearer_token' }, 401, origin);

  try {
    const upstream = await xFetchText(authorization, upstreamUrl);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    return json({ error: 'x_api_fetch_failed', detail: String(error?.message || error) }, 502, origin);
  }
}

async function proxyBinaryGet(request, origin, upstreamUrl) {
  const authorization = bearerFrom(request);
  if (!authorization) return json({ error: 'missing_bearer_token' }, 401, origin);

  try {
    const upstream = await xFetchText(authorization, upstreamUrl);
    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8'
        }
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream'
      }
    });
  } catch (error) {
    return json({ error: 'x_media_fetch_failed', detail: String(error?.message || error) }, 502, origin);
  }
}

function publicKeysUrl(userId) {
  const upstream = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/public_keys`);
  upstream.searchParams.set(
    'public_key.fields',
    'public_key_version,public_key,signing_public_key,identity_public_key_signature,juicebox_config'
  );
  return upstream.toString();
}

function realmForms(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  return [raw, raw.replace(/^0x/, ''), raw.replace(/[^a-f0-9]/g, '')].filter(Boolean);
}

function realmMatches(a, b) {
  const aa = new Set(realmForms(a));
  return realmForms(b).some((value) => aa.has(value));
}

function findRealmToken(value, realmId, seen = new Set()) {
  if (value == null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length < 200000) {
      try {
        return findRealmToken(JSON.parse(trimmed), realmId, seen);
      } catch (_) {}
    }
    return null;
  }

  if (typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRealmToken(item, realmId, seen);
      if (found) return found;
    }
    return null;
  }

  const directRealm = value.realm_id ?? value.realmId ?? value.id;
  if (directRealm != null && realmMatches(directRealm, realmId) && typeof value.token === 'string' && value.token) {
    return value.token;
  }

  if (value.key != null && realmMatches(value.key, realmId)) {
    const token = value?.value?.token ?? value.token;
    if (typeof token === 'string' && token) return token;
  }

  for (const child of Object.values(value)) {
    const found = findRealmToken(child, realmId, seen);
    if (found) return found;
  }
  return null;
}

async function juiceboxToken(request, origin, url) {
  const authorization = bearerFrom(request);
  if (!authorization) return json({ error: 'missing_bearer_token' }, 401, origin);

  const userId = url.searchParams.get('user_id') || '';
  const realmId = url.searchParams.get('realm') || '';
  if (!/^\d+$/.test(userId) || !realmId) {
    return json({ error: 'missing_user_or_realm' }, 400, origin);
  }

  try {
    const upstream = await xFetchText(authorization, publicKeysUrl(userId));
    const text = await upstream.text();
    if (!upstream.ok) {
      return new Response(text, {
        status: upstream.status,
        headers: { ...corsHeaders(origin), 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' }
      });
    }

    let payload;
    try { payload = JSON.parse(text); } catch (_) {
      return json({ error: 'invalid_public_keys_json' }, 502, origin);
    }

    const token = findRealmToken(payload, realmId);
    if (!token) return json({ error: 'realm_token_not_found' }, 404, origin);

    return new Response(token, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error) {
    return json({ error: 'realm_token_fetch_failed', detail: String(error?.message || error) }, 502, origin);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || ALLOWED_ORIGIN;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({
        ok: true,
        service: 'x-chat-oauth-proxy',
        clientMode: 'confidential-pkce',
        secretConfigured: Boolean(env?.X_CLIENT_SECRET),
        apiProxy: true,
        chatBootstrapProxy: true,
        juiceboxTokenProxy: true,
        chatMediaProxy: true,
        version: 'v10'
      }, 200, origin);
    }

    if (origin !== ALLOWED_ORIGIN) {
      return json({ error: 'origin_not_allowed' }, 403, ALLOWED_ORIGIN);
    }

    if (url.pathname === '/x/me' && request.method === 'GET') {
      return proxyJsonGet(request, origin, ME_URL);
    }

    if (url.pathname === '/x/chat/conversations' && request.method === 'GET') {
      const upstream = new URL(CONVERSATIONS_URL);
      for (const key of ['max_results', 'pagination_token']) {
        const value = url.searchParams.get(key);
        if (value) upstream.searchParams.set(key, value);
      }
      return proxyJsonGet(request, origin, upstream.toString());
    }

    if (url.pathname === '/x/chat/juicebox-token' && request.method === 'GET') {
      return juiceboxToken(request, origin, url);
    }

    const publicKeysMatch = url.pathname.match(/^\/x\/chat\/users\/(\d+)\/public-keys$/);
    if (publicKeysMatch && request.method === 'GET') {
      return proxyJsonGet(request, origin, publicKeysUrl(publicKeysMatch[1]));
    }

    const eventsMatch = url.pathname.match(/^\/x\/chat\/conversations\/([^/]+)\/events$/);
    if (eventsMatch && request.method === 'GET') {
      const conversationId = decodeURIComponent(eventsMatch[1]).replace(/:/g, '-');
      const upstream = new URL(`https://api.x.com/2/chat/conversations/${encodeURIComponent(conversationId)}/events`);
      for (const key of ['max_results', 'pagination_token']) {
        const value = url.searchParams.get(key);
        if (value) upstream.searchParams.set(key, value);
      }
      return proxyJsonGet(request, origin, upstream.toString());
    }

    const mediaMatch = url.pathname.match(/^\/x\/chat\/media\/([^/]+)\/([^/]+)$/);
    if (mediaMatch && request.method === 'GET') {
      const conversationId = decodeURIComponent(mediaMatch[1]).replace(/:/g, '-');
      const mediaHashKey = decodeURIComponent(mediaMatch[2]);
      const upstream = `https://api.x.com/2/chat/media/${encodeURIComponent(conversationId)}/${encodeURIComponent(mediaHashKey)}`;
      return proxyBinaryGet(request, origin, upstream);
    }

    if (url.pathname !== '/oauth/token' || request.method !== 'POST') {
      return json({ error: 'not_found' }, 404, origin);
    }

    if (!env?.X_CLIENT_SECRET) {
      return json({ error: 'x_client_secret_not_configured' }, 500, origin);
    }

    let incoming;
    try {
      incoming = await request.formData();
    } catch {
      return json({ error: 'invalid_form_body' }, 400, origin);
    }

    const grantType = String(incoming.get('grant_type') || '');
    const clientId = String(incoming.get('client_id') || '');
    if (!clientId) return json({ error: 'missing_client_id' }, 400, origin);

    const upstreamBody = new URLSearchParams();
    upstreamBody.set('grant_type', grantType);

    const basic = btoa(`${clientId}:${env.X_CLIENT_SECRET}`);
    const upstreamHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basic}`
    };

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
      if (!refreshToken) return json({ error: 'missing_refresh_token' }, 400, origin);
      upstreamBody.set('refresh_token', refreshToken);
    } else {
      return json({ error: 'unsupported_grant_type' }, 400, origin);
    }

    try {
      const upstream = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: upstreamHeaders,
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
