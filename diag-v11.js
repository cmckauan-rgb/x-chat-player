(() => {
  const originalFetch = window.fetch.bind(window);
  const mediaRecords = [];

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

  window.fetch = async (...args) => {
    const url = requestUrl(args[0]);
    try {
      const response = await originalFetch(...args);
      if (url.includes('/x/chat/media/')) {
        const record = {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type') || '',
          detail: ''
        };
        if (!response.ok) {
          try {
            record.detail = cleanDetail(await response.clone().text());
          } catch (_) {}
        }
        mediaRecords.push(record);
      }
      return response;
    } catch (error) {
      if (url.includes('/x/chat/media/')) {
        mediaRecords.push({
          status: 0,
          ok: false,
          contentType: '',
          detail: cleanDetail(error?.message || error || 'Falha de rede')
        });
      }
      throw error;
    }
  };

  function renderDiagnostics() {
    const status = document.getElementById('mediaStatus');
    const actions = status?.parentElement;
    if (!status || !actions) return;

    const text = status.textContent || '';
    if (!/(vídeo|mídia|falha|carregado)/i.test(text)) return;
    if (!/falha|carregado/i.test(text)) return;

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
    } else if (mediaRecords.some((item) => !item.ok)) {
      const failed = mediaRecords.filter((item) => !item.ok).length;
      summary.textContent = `${mediaRecords.length} download(s) tentado(s); ${failed} falharam na própria API/Worker.`;
    } else if (/falha/i.test(text)) {
      summary.textContent = `Todos os ${mediaRecords.length} download(s) responderam HTTP 200. A falha aconteceu depois do download, durante a descriptografia ou interpretação do arquivo.`;
    } else {
      summary.textContent = `${mediaRecords.length} download(s) concluído(s) sem erro HTTP.`;
    }
    box.appendChild(summary);

    mediaRecords.forEach((item, index) => {
      const line = document.createElement('p');
      line.className = 'diagnostic-line';
      const http = item.status ? `HTTP ${item.status}` : 'erro de rede';
      const type = item.contentType ? ` · ${item.contentType}` : '';
      const detail = item.detail ? ` · ${item.detail}` : '';
      line.textContent = `Mídia ${index + 1}: ${http}${type}${detail}`;
      box.appendChild(line);
    });

    actions.appendChild(box);
  }

  const observer = new MutationObserver(() => renderDiagnostics());
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
})();
