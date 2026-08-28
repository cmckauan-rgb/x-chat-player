const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const OAUTH_TTL_MS = 15 * 60 * 1000;

const title = document.getElementById('title');
const message = document.getElementById('message');
const back = document.getElementById('back');

function fail(text) {
  title.textContent = 'Não foi possível conectar';
  message.textContent = text;
  back.classList.remove('hidden');
}

function readOAuthValue(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function clearOAuthTransaction() {
  sessionStorage.removeItem('x_oauth_state');
  sessionStorage.removeItem('x_pkce_verifier');
  localStorage.removeItem('x_oauth_state');
  localStorage.removeItem('x_pkce_verifier');
  localStorage.removeItem('x_oauth_started_at');
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
  const clientId = localStorage.getItem('x_client_id');
  const startedAt = Number(localStorage.getItem('x_oauth_started_at') || 0);

  if (!code) return fail('O callback não recebeu o código de autorização.');
  if (!clientId) return fail('Client ID não encontrado neste navegador. Volte ao início e configure novamente.');
  if (!verifier) return fail('O verificador PKCE não foi encontrado. Volte ao início e inicie um novo login.');
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
