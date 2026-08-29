(() => {
  const originalFetch = window.fetch.bind(window);
  const mediaRecords = [];
  const MEDIA_TIMEOUT_MS = 45000;
  const MB = 1024 * 1024;
  let mediaAttempt = 0;
  let lastRenderedKey = '';

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input?.url || '';
  }

  function cleanDetail(text) {
    return String(text || '')
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redigido]')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < MB) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / MB).toFixed(2)} MB`;
  }

  function setMediaStatus(text) {
    const status = document.getElementById('mediaStatus');
    if (status) status.textContent = text;
  }

  function joinChunks(chunks, total) {
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  }

  window.fetch = async (input, init = {}) => {
    const url = requestUrl(input);
    if (!url.includes('/x/chat/media/')) {
      return originalFetch(input, init);
    }

    const attempt = ++mediaAttempt;
    const controller = new AbortController();
    const callerSignal = init?.signal || (input instanceof Request ? input.signal : null);
    let timedOut = false;
    let received = 0;
    let expected = 0;
    let contentType = '';
    const startedAt = performance.now();

    const relayAbort = () => controller.abort(callerSignal?.reason);
    if (callerSignal) {
      if (callerSignal.aborted) relayAbort();
      else callerSignal.addEventListener('abort', relayAbort, { once: true });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException('Tempo limite do download atingido', 'AbortError'));
    }, MEDIA_TIMEOUT_MS);

    setMediaStatus(`Mídia ${attempt}: iniciando download…`);

    try {
      const response = await originalFetch(input, { ...init, signal: controller.signal });
      expected = Number(response.headers.get('content-length')) || 0;
      contentType = response.headers.get('content-type') || '';

      const reader = response.body?.getReader?.();
      const chunks = [];
      let lastUiUpdate = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value?.byteLength) continue;
          chunks.push(value);
          received += value.byteLength;

          const now = performance.now();
          if (now - lastUiUpdate > 150) {
            const pct = expected ? Math.min(100, Math.round((received / expected) * 100)) : null;
            setMediaStatus(
              expected
                ? `Mídia ${attempt}: baixando… ${pct}% (${formatBytes(received)} de ${formatBytes(expected)})`
                : `Mídia ${attempt}: baixando… ${formatBytes(received)} recebidos`
            );
            lastUiUpdate = now;
          }
        }
      } else {
        const bytes = new Uint8Array(await response.arrayBuffer());
        chunks.push(bytes);
        received = bytes.byteLength;
      }

      const bytes = joinChunks(chunks, received);
      const durationMs = Math.round(performance.now() - startedAt);
      let detail = '';

      if (!response.ok) {
        try { detail = cleanDetail(new TextDecoder().decode(bytes)); } catch (_) {}
      }

      mediaRecords.push({
        status: response.status,
        ok: response.ok,
        contentType,
        detail,
        bytes: received,
        expected,
        durationMs,
        timedOut: false,
        stage: response.ok ? 'download-complete' : 'http-error'
      });

      if (response.ok) {
        setMediaStatus(`Mídia ${attempt}: download concluído (${formatBytes(received)} em ${(durationMs / 1000).toFixed(1)} s). Descriptografando…`);
      }

      return new Response(bytes, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);
      const detail = timedOut
        ? `Timeout após ${Math.round(MEDIA_TIMEOUT_MS / 1000)} s; ${formatBytes(received)} recebidos.`
        : cleanDetail(error?.message || error || 'Falha de rede');

      mediaRecords.push({
        status: 0,
        ok: false,
        contentType,
        detail,
        bytes: received,
        expected,
        durationMs,
        timedOut,
        stage: timedOut ? 'timeout' : 'network-error'
      });

      setMediaStatus(
        timedOut
          ? `Mídia ${attempt}: download cancelado por timeout após 45 s (${formatBytes(received)} recebidos).`
          : `Mídia ${attempt}: falha de download — ${detail}`
      );

      throw error;
    } finally {
      clearTimeout(timer);
      if (callerSignal) callerSignal.removeEventListener('abort', relayAbort);
    }
  };

  function renderDiagnostics() {
    const status = document.getElementById('mediaStatus');
    const actions = status?.parentElement;
    if (!status || !actions) return;

    const text = status.textContent || '';
    if (!/(falha|carregado|timeout|cancelado)/i.test(text)) return;

    const key = `${text}|${JSON.stringify(mediaRecords)}`;
    if (key === lastRenderedKey) return;
    lastRenderedKey = key;

    document.getElementById('mediaDiagnostics')?.remove();

    const box = document.createElement('div');
    box.id = 'mediaDiagnostics';
    box.className = 'diagnostic-box';

    const title = document.createElement('strong');
    title.textContent = 'Diagnóstico da mídia';
    box.appendChild(title);

    const summary = document.createElement('p');
    if (!mediaRecords.length) {
      summary.textContent = 'Nenhuma requisição de mídia chegou a ser feita. O anexo pode ter sido filtrado antes do download.';
    } else if (mediaRecords.some((item) => item.timedOut)) {
      summary.textContent = 'Pelo menos um download excedeu 45 segundos e foi cancelado automaticamente.';
    } else if (mediaRecords.some((item) => !item.ok)) {
      const failed = mediaRecords.filter((item) => !item.ok).length;
      summary.textContent = `${mediaRecords.length} download(s) tentado(s); ${failed} falharam na API, Worker ou rede.`;
    } else if (/falha/i.test(text)) {
      summary.textContent = `Todos os ${mediaRecords.length} download(s) terminaram. A falha aconteceu depois do download, durante a descriptografia ou interpretação do arquivo.`;
    } else {
      summary.textContent = `${mediaRecords.length} download(s) concluído(s) sem erro HTTP.`;
    }
    box.appendChild(summary);

    mediaRecords.forEach((item, index) => {
      const line = document.createElement('p');
      line.className = 'diagnostic-line';
      const http = item.timedOut ? 'TIMEOUT' : (item.status ? `HTTP ${item.status}` : 'erro de rede');
      const type = item.contentType ? ` · ${item.contentType}` : '';
      const size = ` · ${formatBytes(item.bytes)}` + (item.expected ? ` / ${formatBytes(item.expected)}` : '');
      const time = item.durationMs ? ` · ${(item.durationMs / 1000).toFixed(1)} s` : '';
      const detail = item.detail ? ` · ${item.detail}` : '';
      line.textContent = `Mídia ${index + 1}: ${http}${type}${size}${time}${detail}`;
      box.appendChild(line);
    });

    actions.appendChild(box);
  }

  let renderTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderDiagnostics, 80);
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
})();
