const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const WORKER_BASE = 'https://x-chat-player.cmckauan.workers.dev';
const ME_URL = `${WORKER_BASE}/x/me`;
const SCOPES = ['tweet.read', 'users.read', 'dm.read', 'offline.access'].join(' ');
const COOKIE_PATH = '/x-chat-player/';

const $ = (id) => document.getElementById(id);

function randomBase64Url(bytes = 64) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  let binary = '';
  data.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  let binary = '';
  new Uint8Array(digest).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function setTempCookie(name, value, maxAge = 900) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${COOKIE_PATH}; Secure; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=${COOKIE_PATH}; Secure; SameSite=Lax`;
}

function saveOAuthTransaction(verifier, state, clientId) {
  const startedAt = String(Date.now());

  sessionStorage.setItem('x_pkce_verifier', verifier);
  sessionStorage.setItem('x_oauth_state', state);

  localStorage.setItem('x_pkce_verifier', verifier);
  localStorage.setItem('x_oauth_state', state);
  localStorage.setItem('x_oauth_started_at', startedAt);
  localStorage.setItem('x_client_id', clientId);

  setTempCookie('x_pkce_verifier', verifier);
  setTempCookie('x_oauth_state', state);
  setTempCookie('x_oauth_started_at', startedAt);
  setTempCookie('x_client_id', clientId);
}

async function startLogin() {
  const clientId = $('clientId').value.trim();
  if (!clientId) {
    alert('Informe o Client ID do OAuth 2.0.');
    return;
  }

  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const state = randomBase64Url(24);

  saveOAuthTransaction(verifier, state, clientId);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });

  location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
}

async function validateSession() {
  const token = sessionStorage.getItem('x_access_token');
  if (!token) return;

  $('setupCard').classList.add('hidden');
  $('connectedCard').classList.remove('hidden');
  $('accountInfo').textContent = 'Validando sua sessão pelo Cloudflare Worker…';

  try {
    const res = await fetch(ME_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch (_) {}

    if (!res.ok) {
      const detail = json?.detail || json?.error || text || `HTTP ${res.status}`;
      throw new Error(detail);
    }

    const user = json.data;
    $('accountInfo').textContent = user?.username
      ? `Conectado como @${user.username}. OAuth e acesso à API validados.`
      : 'Conectado ao X. OAuth e acesso à API validados.';

    if ($('libraryState')) {
      $('libraryState').innerHTML = '<div class="play">▶</div><p>Conexão validada. Próxima etapa: carregar os vídeos do X Chat.</p>';
    }
  } catch (error) {
    $('accountInfo').textContent = `OAuth concluído, mas a validação da API falhou: ${error.message}`;
  }
}

function disconnect() {
  sessionStorage.removeItem('x_access_token');
  sessionStorage.removeItem('x_refresh_token');
  sessionStorage.removeItem('x_token_expires_at');
  location.href = './';
}

function clearConfig() {
  ['x_client_id', 'x_pkce_verifier', 'x_oauth_state', 'x_oauth_started_at'].forEach((key) => {
    localStorage.removeItem(key);
    deleteCookie(key);
  });
  sessionStorage.clear();
  $('clientId').value = '';
}

window.addEventListener('DOMContentLoaded', () => {
  $('clientId').value = localStorage.getItem('x_client_id') || '';
  $('saveAndLogin').addEventListener('click', startLogin);
  $('disconnect').addEventListener('click', disconnect);
  $('clearConfig').addEventListener('click', clearConfig);
  validateSession();
});
