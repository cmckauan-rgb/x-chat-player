import * as juiceboxBg from './juicebox-sdk/juicebox-sdk_bg.js';

const wasmUrl = new URL('./juicebox-sdk/juicebox-sdk_bg.wasm', import.meta.url);
const response = await fetch(wasmUrl, { cache: 'force-cache' });
if (!response.ok) {
  throw new Error(`Falha ao carregar Juicebox WASM: HTTP ${response.status}`);
}

const imports = { './juicebox-sdk_bg.js': juiceboxBg };
let instance;
try {
  if (WebAssembly.instantiateStreaming) {
    ({ instance } = await WebAssembly.instantiateStreaming(response.clone(), imports));
  } else {
    throw new Error('instantiateStreaming indisponível');
  }
} catch (_) {
  const bytes = await response.arrayBuffer();
  ({ instance } = await WebAssembly.instantiate(bytes, imports));
}

juiceboxBg.__wbg_set_wasm(instance.exports);

export const Client = juiceboxBg.Client;
export const Configuration = juiceboxBg.Configuration;
