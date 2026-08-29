(() => {
  const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';
  const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
  const COOKIE_PATH = '/x-chat-player/';
  const SCOPES = ['tweet.read', 'users.read', 'dm.read', 'media.write', 'offline.access'].join(' ');
  const MEDIA_SCOPE_FLAG = 'x_media_scope_v13';

  function randomBase64Url(bytes = 64) {
    const data = new Uint8Array(bytes);
    crypto.getRandomValues(data);
    let binary = '';
    data.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function sha256Base64Url(value) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    let binary = '';
    new Uint8Array(digest).forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function setTempCookie(name, value, maxAge = 900) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${COOKIE_PATH}; Secure; SameSite=Lax`;
  }

  function saveOAuthTransaction(verifier, state, clientId) {
    const startedAt = String(Date.now());
    sessionStorage.setItem('x_pkce_verifier', verifier);
    sessionStorage.setItem('x_oauth_state', state);
    localStorage.setItem('x_pkce_verifier', verifier);
    localStorage.setItem('x_oauth_state', state);
    localStorage.setItem('x_oauth_started_at', startedAt);
    localStorage.setItem('x_client_id', clientId);
    localStorage.setItem(MEDIA_SCOPE_FLAG, '1');
    setTempCookie('x_pkce_verifier', verifier);
    setTempCookie('x_oauth_state', state);
    setTempCookie('x_oauth_started_at', startedAt);
    setTempCookie('x_client_id', clientId);
  }

  async function startMediaLogin() {
    const clientId = (document.getElementById('clientId')?.value || localStorage.getItem('x_client_id') || '').trim();
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

  function replaceSetupLoginButton() {
    const oldButton = document.getElementById('saveAndLogin');
    if (!oldButton) return;
    const button = oldButton.cloneNode(true);
    button.textContent = 'Salvar e entrar com X';
    oldButton.replaceWith(button);
    button.addEventListener('click', startMediaLogin);
  }

  function addReconnectButton() {
    const card = document.getElementById('connectedCard');
    const disconnect = document.getElementById('disconnect');
    if (!card || !disconnect || document.getElementById('mediaScopeReconnect')) return;
    if (localStorage.getItem(MEDIA_SCOPE_FLAG) === '1') return;

    const hint = document.createElement('p');
    hint.id = 'mediaScopeHint';
    hint.className = 'hint';
    hint.textContent = 'O download de mídia do X Chat exige a permissão media.write. Reconecte uma vez para liberar os vídeos.';

    const button = document.createElement('button');
    button.id = 'mediaScopeReconnect';
    button.className = 'primary';
    button.textContent = 'Reconectar com acesso à mídia';
    button.addEventListener('click', startMediaLogin);

    card.insertBefore(hint, disconnect);
    card.insertBefore(button, disconnect);
  }

  window.addEventListener('DOMContentLoaded', () => {
    replaceSetupLoginButton();
    addReconnectButton();
  });
})();
