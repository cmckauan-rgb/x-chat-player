const REDIRECT_URI = 'https://cmckauan-rgb.github.io/x-chat-player/callback.html';
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const WORKER_BASE = 'https://x-chat-player.cmckauan.workers.dev';
const ME_URL = `${WORKER_BASE}/x/me`;
const CONVERSATIONS_URL = `${WORKER_BASE}/x/chat/conversations`;
const SCOPES = ['tweet.read', 'users.read', 'dm.read', 'offline.access'].join(' ');
const COOKIE_PATH = '/x-chat-player/';
const BUILD_VERSION = 'v10';

const $ = (id) => document.getElementById(id);

let currentUser = null;
let currentKeyRecord = null;
let currentConversations = [];
let chatInstance = null;
let chatSdk = null;
let mediaCandidates = [];
const objectUrls = new Set();

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

function accessToken() {
  return sessionStorage.getItem('x_access_token') || '';
}

async function fetchJson(url, token = accessToken()) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch (_) {}
  if (!res.ok) {
    const detail = json?.detail || json?.error || json?.title || text || `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return json;
}

function normalizeDataArray(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.conversations)) return payload.data.conversations;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];
  return [];
}

function keyVersionOf(record) {
  return String(record?.public_key_version ?? record?.version ?? record?.key_version ?? '');
}

function juiceboxConfigOf(record) {
  if (!record || typeof record !== 'object') return null;
  return record.juicebox_config ?? record.juiceboxConfig ?? record.token_map ?? record.tokenMap ?? null;
}

function juiceboxConfigJson(record) {
  const config = juiceboxConfigOf(record);
  if (config == null) return null;
  if (typeof config === 'string') {
    JSON.parse(config);
    return config;
  }
  return JSON.stringify(config);
}

function chooseKeyRecord(records) {
  if (!records.length) return null;
  return records.find((r) => juiceboxConfigOf(r) != null) || records[0];
}

function conversationIdOf(conversation) {
  if (!conversation) return '';
  if (typeof conversation === 'string') return conversation;
  for (const key of ['conversation_id', 'conversationId', 'id', 'rest_id', 'restId']) {
    if (typeof conversation[key] === 'string' && conversation[key]) return conversation[key];
  }
  return '';
}

function collectUserIds(value, out = new Set(), keyHint = '', seen = new Set()) {
  if (value == null) return out;
  if (typeof value === 'string') {
    if (/^\d{5,}$/.test(value) && /(user|member|participant|sender|admin|creator|owner)/i.test(keyHint)) {
      out.add(value);
    }
    return out;
  }
  if (typeof value !== 'object' || seen.has(value)) return out;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => collectUserIds(item, out, keyHint, seen));
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    collectUserIds(child, out, key, seen);
  }
  return out;
}

function addConversationIdParticipants(conversationId, out) {
  if (/^\d+[-:]\d+$/.test(conversationId)) {
    conversationId.split(/[-:]/).forEach((id) => out.add(id));
  }
}

function renderUnlockPanel(count, hasConfig) {
  const library = $('libraryState');
  library.classList.add('unlock-state');
  library.innerHTML = `
    <div class="unlock-summary">
      <div class="play">✓</div>
      <p><strong>${count} conversa${count === 1 ? '' : 's'} encontrada${count === 1 ? '' : 's'}.</strong><br>${hasConfig ? 'Registro criptográfico encontrado.' : 'Configuração de recuperação não encontrada.'}</p>
    </div>
    <div class="unlock-box">
      <label for="xChatPin">PIN do X Chat</label>
      <input id="xChatPin" type="password" inputmode="numeric" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Digite somente aqui">
      <p class="hint">O PIN é usado somente neste navegador para recuperar suas chaves. Ele não é enviado ao Cloudflare nem salvo pelo site.</p>
      <button id="unlockXChat" class="primary" ${hasConfig ? '' : 'disabled'}>Desbloquear X Chat</button>
      <p id="unlockStatus" class="inline-status"></p>
    </div>
  `;
  if (hasConfig) $('unlockXChat').addEventListener('click', unlockXChat);
}

async function loadChatBootstrap(token, user) {
  if (!$('libraryState') || !user?.id) return;
  $('libraryState').classList.remove('unlock-state');
  $('libraryState').innerHTML = '<div class="spinner small-spinner" aria-hidden="true"></div><p>Buscando conversas e chaves do X Chat…</p>';

  try {
    const [conversationsPayload, keysPayload] = await Promise.all([
      fetchJson(`${CONVERSATIONS_URL}?max_results=100`, token),
      fetchJson(`${WORKER_BASE}/x/chat/users/${encodeURIComponent(user.id)}/public-keys`, token)
    ]);

    currentConversations = normalizeDataArray(conversationsPayload);
    currentKeyRecord = chooseKeyRecord(normalizeDataArray(keysPayload));
    currentUser = user;

    sessionStorage.setItem('x_user_id', String(user.id));
    sessionStorage.setItem('x_chat_conversation_count', String(currentConversations.length));

    const hasConfig = Boolean(currentKeyRecord && juiceboxConfigOf(currentKeyRecord) != null);
    renderUnlockPanel(currentConversations.length, hasConfig);
  } catch (error) {
    $('libraryState').innerHTML = '<div class="play">!</div><p id="chatLoadError"></p>';
    $('chatLoadError').textContent = `OAuth validado, mas não foi possível carregar o X Chat: ${String(error.message || error)}`;
  }
}

async function getRealmToken(realmId) {
  const token = accessToken();
  if (!token || !currentUser?.id) throw new Error('Sessão OAuth indisponível.');
  const url = `${WORKER_BASE}/x/chat/juicebox-token?user_id=${encodeURIComponent(currentUser.id)}&realm=${encodeURIComponent(realmId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Juicebox token HTTP ${res.status}`);
  return text;
}

async function importChatSdk() {
  if (!chatSdk) {
    chatSdk = await import(`./vendor/chat-xdk/index.js?build=${BUILD_VERSION}`);
  }
  return chatSdk;
}

async function unlockXChat() {
  const button = $('unlockXChat');
  const input = $('xChatPin');
  const status = $('unlockStatus');
  if (!button || !input || !status) return;

  let pin = input.value;
  if (!pin) {
    status.textContent = 'Digite seu PIN do X Chat.';
    return;
  }

  button.disabled = true;
  input.disabled = true;
  status.textContent = 'Carregando o módulo criptográfico no navegador…';

  let candidateChat = null;
  try {
    const sdk = await importChatSdk();
    const configJson = juiceboxConfigJson(currentKeyRecord);
    if (!configJson) throw new Error('A conta não retornou juicebox_config.');

    candidateChat = await sdk.createChat({
      juiceboxConfig: configJson,
      getAuthToken: getRealmToken
    });

    status.textContent = 'Recuperando as chaves com o PIN…';
    await candidateChat.unlock(pin);

    const version = keyVersionOf(currentKeyRecord);
    if (!version) throw new Error('Versão da chave pública não encontrada.');
    candidateChat.setIdentity(String(currentUser.id), version);
    candidateChat.setCacheKeys(true);

    if (chatInstance) {
      try { chatInstance.free(); } catch (_) {}
    }
    chatInstance = candidateChat;
    candidateChat = null;

    status.textContent = 'X Chat desbloqueado. Lendo o histórico criptografado…';
    await scanConversationsForMedia();
  } catch (error) {
    if (candidateChat) {
      try { candidateChat.free(); } catch (_) {}
    }
    let remaining = null;
    try { remaining = chatSdk?.guessesRemaining?.(error) ?? null; } catch (_) {}
    if (remaining != null) {
      status.textContent = `PIN não aceito. Tentativas restantes informadas pelo cofre: ${remaining}. Não tente adivinhar o PIN.`;
    } else {
      status.textContent = `Não foi possível desbloquear: ${String(error.message || error)}`;
    }
    button.disabled = false;
    input.disabled = false;
  } finally {
    input.value = '';
    pin = '';
  }
}

function collectEncodedEvents(payload) {
  const out = [];
  const seenValues = new Set();
  const visited = new Set();

  function add(value) {
    if (typeof value === 'string' && value.length > 20 && !seenValues.has(value)) {
      seenValues.add(value);
      out.push(value);
    }
  }

  function walk(value, keyHint = '') {
    if (value == null) return;
    if (typeof value === 'string') {
      if (/^(encoded_event|encodedEvent|conversation_key_change_event|conversationKeyChangeEvent)$/i.test(keyHint)) add(value);
      if (/conversation_key_events/i.test(keyHint)) add(value);
      return;
    }
    if (typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, keyHint));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === 'string' && ['encoded_event', 'encodedEvent', 'conversation_key_change_event', 'conversationKeyChangeEvent'].includes(key)) {
        add(child);
      } else {
        walk(child, key);
      }
    }
  }

  walk(payload);
  return out;
}

async function fetchConversationHistories() {
  const histories = [];
  for (const conversation of currentConversations) {
    const conversationId = conversationIdOf(conversation);
    if (!conversationId) continue;
    const url = `${WORKER_BASE}/x/chat/conversations/${encodeURIComponent(conversationId)}/events?max_results=100`;
    const payload = await fetchJson(url);
    histories.push({ conversation, conversationId, payload });
  }
  return histories;
}

async function loadSigningKeys(histories) {
  const ids = new Set([String(currentUser.id)]);
  currentConversations.forEach((conversation) => {
    collectUserIds(conversation, ids);
    addConversationIdParticipants(conversationIdOf(conversation), ids);
  });
  histories.forEach(({ payload, conversationId }) => {
    collectUserIds(payload, ids);
    addConversationIdParticipants(conversationId, ids);
  });

  const entries = [];
  await Promise.all([...ids].map(async (userId) => {
    try {
      const payload = await fetchJson(`${WORKER_BASE}/x/chat/users/${encodeURIComponent(userId)}/public-keys`);
      for (const record of normalizeDataArray(payload)) {
        const publicKeyVersion = keyVersionOf(record);
        const publicKey = record?.signing_public_key ?? record?.signingPublicKey;
        const identityPublicKey = record?.public_key ?? record?.publicKey;
        const identityPublicKeySignature = record?.identity_public_key_signature ?? record?.identityPublicKeySignature;
        if (publicKeyVersion && publicKey && identityPublicKey && identityPublicKeySignature) {
          entries.push({
            userId: String(record?.user_id ?? record?.userId ?? userId),
            publicKeyVersion,
            publicKey,
            identityPublicKey,
            identityPublicKeySignature
          });
        }
      }
    } catch (_) {
      // A conversation may contain a stale/deleted participant. DecryptEvents
      // will report per-event verification failures without aborting the batch.
    }
  }));

  if (!entries.length) throw new Error('Não foi possível carregar as chaves de assinatura dos participantes.');
  chatInstance.setSigningKeys(entries);
  return entries.length;
}

function addMediaCandidate(map, event, conversationId, keyMap, ref, extra = {}) {
  const mediaHashKey = ref?.mediaHashKey ?? ref?.media_hash_key ?? ref;
  if (typeof mediaHashKey !== 'string' || !mediaHashKey) return;
  const keyVersion = String(event?.keyVersion ?? event?.key_version ?? '');
  const key = keyMap?.[keyVersion];
  if (!key) return;
  const effectiveConversationId = String(event?.conversationId ?? event?.conversation_id ?? conversationId);
  const dedupe = `${effectiveConversationId}|${mediaHashKey}|${keyVersion}`;
  if (!map.has(dedupe)) {
    map.set(dedupe, {
      conversationId: effectiveConversationId,
      mediaHashKey,
      keyVersion,
      key,
      filename: extra.filename || '',
      mediaType: extra.mediaType || '',
      source: extra.source || ''
    });
  } else {
    const item = map.get(dedupe);
    if (!item.filename && extra.filename) item.filename = extra.filename;
    if (!item.mediaType && extra.mediaType) item.mediaType = extra.mediaType;
  }
}

function mediaFromDecryptResult(result, conversationId) {
  const found = new Map();
  const keyMap = result?.conversationKeys?.keys || {};
  for (const message of result?.messages || []) {
    const event = message?.event;
    if (!event || event.type !== 'message') continue;

    for (const attachment of event.attachments || []) {
      if ((attachment?.attachmentType || '').toLowerCase() === 'media' || attachment?.mediaHashKey) {
        addMediaCandidate(found, event, conversationId, keyMap, attachment, {
          filename: attachment?.filename,
          mediaType: attachment?.mediaType,
          source: 'attachment'
        });
      }
    }

    for (const attachment of event?.content?.attachments || []) {
      addMediaCandidate(found, event, conversationId, keyMap, attachment, {
        filename: attachment?.filename,
        mediaType: attachment?.media_type ?? attachment?.mediaType,
        source: 'content'
      });
    }

    for (const ref of event.mediaHashes || []) {
      addMediaCandidate(found, event, conversationId, keyMap, ref, { source: ref?.source || 'mediaHashes' });
    }
  }
  return [...found.values()];
}

async function scanConversationsForMedia() {
  const status = $('unlockStatus');
  try {
    status.textContent = 'Carregando até 100 eventos de cada conversa…';
    const histories = await fetchConversationHistories();

    status.textContent = 'Carregando chaves públicas dos participantes…';
    await loadSigningKeys(histories);

    const candidates = [];
    let decryptedCount = 0;
    let errorCount = 0;

    for (const { conversationId, payload } of histories) {
      const encodedEvents = collectEncodedEvents(payload);
      if (!encodedEvents.length) continue;
      const result = chatInstance.decryptEvents(encodedEvents);
      decryptedCount += (result?.messages || []).length;
      errorCount += Object.keys(result?.errors || {}).length;
      candidates.push(...mediaFromDecryptResult(result, conversationId));
    }

    const unique = new Map();
    candidates.forEach((item) => unique.set(`${item.conversationId}|${item.mediaHashKey}|${item.keyVersion}`, item));
    mediaCandidates = [...unique.values()];

    status.textContent = `X Chat desbloqueado. ${decryptedCount} evento(s) descriptografado(s)${errorCount ? `; ${errorCount} evento(s) não puderam ser verificados` : ''}.`;
    renderMediaReady();
  } catch (error) {
    status.textContent = `O X Chat foi desbloqueado, mas a leitura do histórico falhou: ${String(error.message || error)}`;
  }
}

function renderMediaReady() {
  const library = $('libraryState');
  const unlockStatus = $('unlockStatus')?.textContent || 'X Chat desbloqueado.';
  library.innerHTML = `
    <div class="unlock-summary">
      <div class="play">✓</div>
      <p><strong>X Chat desbloqueado.</strong><br><span id="decryptSummary"></span></p>
    </div>
    <div class="media-actions">
      <p>${mediaCandidates.length} anexo${mediaCandidates.length === 1 ? '' : 's'} de mídia encontrado${mediaCandidates.length === 1 ? '' : 's'} nos eventos carregados.</p>
      ${mediaCandidates.length ? '<button id="loadVideos" class="primary">Descriptografar e carregar vídeos</button>' : ''}
      <p class="hint">O download chega criptografado pelo Worker e é descriptografado somente neste navegador. O teste carrega no máximo 25 anexos por vez.</p>
      <p id="mediaStatus" class="inline-status"></p>
    </div>
    <div id="videosContainer" class="media-grid"></div>
  `;
  $('decryptSummary').textContent = unlockStatus;
  if ($('loadVideos')) $('loadVideos').addEventListener('click', loadVideos);
}

function mimeFromFilename(filename) {
  const name = String(filename || '').toLowerCase();
  if (name.endsWith('.mp4') || name.endsWith('.m4v')) return 'video/mp4';
  if (name.endsWith('.webm')) return 'video/webm';
  if (name.endsWith('.mov')) return 'video/quicktime';
  if (name.endsWith('.mkv')) return 'video/x-matroska';
  return '';
}

function knownImage(candidate) {
  const type = String(candidate.mediaType || '').toLowerCase();
  return type.includes('image') || /\.(jpe?g|png|gif|webp|heic)$/i.test(candidate.filename || '');
}

async function fetchAndDecryptMedia(candidate) {
  const token = accessToken();
  const url = `${WORKER_BASE}/x/chat/media/${encodeURIComponent(candidate.conversationId)}/${encodeURIComponent(candidate.mediaHashKey)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const encrypted = new Uint8Array(await res.arrayBuffer());
  const plaintext = chatInstance.decryptStream(encrypted, candidate.key);
  let mime = '';
  try { mime = chatSdk.detectMimeType(plaintext) || ''; } catch (_) {}
  if (!mime) mime = mimeFromFilename(candidate.filename);
  return { plaintext, mime };
}

function appendVideo(candidate, plaintext, mime, index) {
  const container = $('videosContainer');
  const blob = new Blob([plaintext], { type: mime || 'video/mp4' });
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);

  const card = document.createElement('article');
  card.className = 'media-card';
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.src = url;
  const caption = document.createElement('p');
  caption.className = 'media-caption';
  caption.textContent = candidate.filename || `Vídeo ${index + 1}`;
  card.append(video, caption);
  container.appendChild(card);
}

async function loadVideos() {
  const button = $('loadVideos');
  const status = $('mediaStatus');
  if (!button || !status) return;
  button.disabled = true;

  [...objectUrls].forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
  $('videosContainer').replaceChildren();

  const queue = [
    ...mediaCandidates.filter((item) => !knownImage(item) && (String(item.mediaType || '').toLowerCase().includes('video') || mimeFromFilename(item.filename))),
    ...mediaCandidates.filter((item) => !knownImage(item) && !(String(item.mediaType || '').toLowerCase().includes('video') || mimeFromFilename(item.filename)))
  ].slice(0, 25);

  let videos = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    status.textContent = `Processando mídia ${i + 1} de ${queue.length}…`;
    try {
      const { plaintext, mime } = await fetchAndDecryptMedia(candidate);
      if (String(mime).toLowerCase().startsWith('video/')) {
        appendVideo(candidate, plaintext, mime, videos);
        videos += 1;
      } else {
        skipped += 1;
      }
    } catch (_) {
      failed += 1;
    }
  }

  status.textContent = `${videos} vídeo${videos === 1 ? '' : 's'} carregado${videos === 1 ? '' : 's'}.${skipped ? ` ${skipped} mídia(s) não eram vídeo.` : ''}${failed ? ` ${failed} falha(s) de download/descriptografia.` : ''}`;
  button.disabled = false;
}

async function validateSession() {
  const token = accessToken();
  if (!token) return;

  $('setupCard').classList.add('hidden');
  $('connectedCard').classList.remove('hidden');
  $('accountInfo').textContent = 'Validando sua sessão pelo Cloudflare Worker…';

  try {
    const json = await fetchJson(ME_URL, token);
    const user = json.data;
    $('accountInfo').textContent = user?.username
      ? `Conectado como @${user.username}. OAuth e acesso à API validados.`
      : 'Conectado ao X. OAuth e acesso à API validados.';
    await loadChatBootstrap(token, user);
  } catch (error) {
    $('accountInfo').textContent = `OAuth concluído, mas a validação da API falhou: ${error.message}`;
  }
}

function clearCryptoSession() {
  if (chatInstance) {
    try { chatInstance.free(); } catch (_) {}
    chatInstance = null;
  }
  [...objectUrls].forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
  mediaCandidates = [];
  currentKeyRecord = null;
  currentConversations = [];
  currentUser = null;
}

function disconnect() {
  clearCryptoSession();
  ['x_access_token', 'x_refresh_token', 'x_token_expires_at', 'x_user_id', 'x_chat_conversation_count'].forEach((key) => sessionStorage.removeItem(key));
  location.href = './';
}

function clearConfig() {
  clearCryptoSession();
  ['x_client_id', 'x_pkce_verifier', 'x_oauth_state', 'x_oauth_started_at'].forEach((key) => {
    localStorage.removeItem(key);
    deleteCookie(key);
  });
  sessionStorage.clear();
  $('clientId').value = '';
}

window.addEventListener('pagehide', () => {
  if (chatInstance) {
    try { chatInstance.lock(); } catch (_) {}
  }
  [...objectUrls].forEach((url) => URL.revokeObjectURL(url));
});

window.addEventListener('DOMContentLoaded', () => {
  $('clientId').value = localStorage.getItem('x_client_id') || '';
  $('saveAndLogin').addEventListener('click', startLogin);
  $('disconnect').addEventListener('click', disconnect);
  $('clearConfig').addEventListener('click', clearConfig);
  validateSession();
});
