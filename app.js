const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const ME_URL = 'https://api.x.com/2/users/me?user.fields=username,name,profile_image_url';
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

function decodeClientId(clientId) {
  try {
    const normalized = clientId.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
  } catch (_) {
    return '';
  }
}

function isConfidentialClientId(clientId) {
  return decodeClientId(clientId).endsWith(':ci');
}

function clearStoredClientId() {
  localStorage.removeItem('x_client_id');
  deleteCookie('x_client_id');
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

  if (isConfidentialClientId(clientId)) {
    clearStoredClientId();
    $('clientId').value = '';
    alert('Este Client ID é de um cliente confidencial antigo. No X Developer, deixe o app como Native App e copie o Client ID OAuth 2.0 atual. Depois cole o novo Client ID aqui.');
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

  try {
    const res = await fetch(ME_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`X API respondeu ${res.status}`);
    const json = await res.json();
    const user = json.data;
    $('accountInfo').textContent = user?.username
      ? `Conectado como @${user.username}. Próxima etapa: ler conversas e mídias do X Chat.`
      : 'Conectado ao X. Próxima etapa: ler as mídias do X Chat.';
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
  const cachedClientId = localStorage.getItem('x_client_id') || '';
  if (cachedClientId && isConfidentialClientId(cachedClientId)) {
    clearStoredClientId();
    $('clientId').value = '';
  } else {
    $('clientId').value = cachedClientId;
  }

  $('saveAndLogin').addEventListener('click', startLogin);
  $('disconnect').addEventListener('click', disconnect);
  $('clearConfig').addEventListener('click', clearConfig);
  validateSession();
});
