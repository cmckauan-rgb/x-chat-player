const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const OAUTH_TTL_MS = 15 * 60 * 1000;
const COOKIE_PATH = '/x-chat-player/';

const title = document.getElementById('title');
const message = document.getElementById('message');
const back = document.getElementById('back');

function fail(text) {
  title.textContent = 'Não foi possível conectar';
  message.textContent = text;
  back.classList.remove('hidden');
}

function getCookie(name) {
  const prefix = `${name}=`;
  const item = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=${COOKIE_PATH}; Secure; SameSite=Lax`;
}

function readOAuthValue(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key) || getCookie(key);
}

function clearOAuthTransaction() {
  ['x_oauth_state', 'x_pkce_verifier', 'x_oauth_started_at'].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    deleteCookie(key);
  });
}

async function exchangeCode() {
  const params = new URLSearchParams(location.search);
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  const code = params.get('code');
  const returnedState = params.get('state');

  if (error) {
    clearOAuthTransaction();
    fail(errorDescription || `O X retornou o erro: ${error}`);
    return;
  }

  const expectedState = readOAuthValue('x_oauth_state');
  const verifier = readOAuthValue('x_pkce_verifier');
  const clientId = localStorage.getItem('x_client_id') || getCookie('x_client_id');
  const startedAt = Number(readOAuthValue('x_oauth_started_at') || 0);

  if (!code) return fail('O callback não recebeu o código de autorização.');
  if (!clientId) return fail('Client ID não encontrado no retorno. Volte ao início e inicie um novo login.');
  if (!verifier) return fail('PKCE v3: o verificador ainda não chegou ao callback. Volte ao início e inicie um novo login.');
  if (startedAt && Date.now() - startedAt > OAUTH_TTL_MS) {
    clearOAuthTransaction();
    return fail('Esta tentativa de login expirou. Volte ao início e entre novamente.');
  }
  if (!expectedState || returnedState !== expectedState) {
    clearOAuthTransaction();
    return fail('Falha na validação de segurança do OAuth (state inválido). Inicie um novo login.');
  }

  try {
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    });

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (_) {}

    if (!res.ok || !data.access_token) {
      const detail = data.error_description || data.error || text || `HTTP ${res.status}`;
      throw new Error(detail);
    }

    sessionStorage.setItem('x_access_token', data.access_token);
    if (data.refresh_token) sessionStorage.setItem('x_refresh_token', data.refresh_token);
    if (data.expires_in) sessionStorage.setItem('x_token_expires_at', String(Date.now() + Number(data.expires_in) * 1000));

    clearOAuthTransaction();

    title.textContent = 'Conectado!';
    message.textContent = 'OAuth concluído. Voltando para o player…';
    setTimeout(() => location.replace('./?connected=1'), 700);
  } catch (e) {
    fail(`A troca do código por token falhou: ${e.message}.`);
  }
}

exchangeCode();
