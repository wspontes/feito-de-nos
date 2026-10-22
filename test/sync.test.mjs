import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(RAIZ, 'index.html');
const html = fs.readFileSync(HTML, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('script inline nao encontrado');
const script = m[1];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function makeBackend() {
  const store = { data: null, updatedAt: 0, gets: 0, posts: 0, failGet: false };
  const fetchImpl = async (url, opts) => {
    if (opts && opts.method === 'POST') {
      store.posts++;
      const body = JSON.parse(opts.body);
      store.data = body.data;
      store.updatedAt = Number(body.updatedAt) || Date.now();
      return { ok: true, status: 200, json: async () => ({ ok: true, updatedAt: store.updatedAt }) };
    }
    store.gets++;
    if (store.failGet) return { ok: true, status: 200, json: async () => ({ ok: false, error: 'Chave de acesso invalida' }) };
    return {
      ok: true, status: 200,
      json: async () => ({ ok: true, data: store.data, updatedAt: store.updatedAt })
    };
  };
  return { store, fetchImpl };
}

function fakeEl(id) {
  return {
    id, textContent: '', innerHTML: '', value: '', className: '', style: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, remove() {}, querySelector() { return fakeEl('x'); }, querySelectorAll() { return []; },
    focus() {}, click() {}, files: []
  };
}

async function makeDevice(url, backend, storage = new Map(), accessKey = '') {
  const cache = {};
  const localStorage = {
    getItem: k => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k)
  };
  const document = {
    activeElement: null,
    getElementById(id) { return cache[id] || (cache[id] = fakeEl(id)); },
    querySelector() { return fakeEl('q'); },
    querySelectorAll() { return []; },
    createElement() { return fakeEl('n'); }
  };
  const sandbox = {
    window: { FN_CONFIG: { backendUrl: url, accessKey, pollSeconds: 10 } },
    document, localStorage,
    location: { search: '' },
    fetch: backend.fetchImpl,
    navigator: { clipboard: { writeText: async () => {} } },
    confirm: () => true, alert: () => {}, prompt: () => null,
    Blob: class {}, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    FileReader: class { readAsText() {} },
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    Date, Math, JSON, Number, String, Object, Array, isNaN, parseInt, parseFloat, RegExp, Error
  };
  sandbox.window.localStorage = localStorage;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const expose = `
;globalThis.__t = {
  get S(){ return S; },
  get dirty(){ return _dirty; },
  get backend(){ return BACKEND_URL; },
  set backend(v){ BACKEND_URL = v; },
  syncLoad, syncSave, save, seed, seedFicha, toast
};`;
  vm.runInContext(script + expose, ctx, { filename: 'index-inline.js' });
  await sleep(60);
  return ctx.__t;
}

let falhas = 0;
function check(nome, cond, extra) {
  if (cond) console.log('  OK   ' + nome);
  else { falhas++; console.log('  FALHA ' + nome + (extra ? ' -> ' + extra : '')); }
}

const backend = makeBackend();
const URL_MOCK = 'http://mock.appscript/exec';

console.log('\n[1] backend vazio nao pode receber a amostra do aparelho');
const A = await makeDevice(URL_MOCK, backend);
check('syncLoad devolve "empty"', await A.syncLoad() === 'empty');
check('nenhum POST disparado', backend.store.posts === 0, 'posts=' + backend.store.posts);
check('backend continua vazio', backend.store.data === null);

console.log('\n[2] envio explicito do aparelho A');
A.S.__updatedAt = Date.now();
await A.syncSave();
check('POST gravou no backend', backend.store.posts === 1, 'posts=' + backend.store.posts);
check('backend tem dados', backend.store.data && Array.isArray(backend.store.data.vendas));
check('backend guardou updatedAt', backend.store.updatedAt > 0);

console.log('\n[3] aparelho B novo le o que A gravou');
const B = await makeDevice(URL_MOCK, backend);
const resB = await B.syncLoad();
check('syncLoad devolve "ok"', resB === 'ok', resB);
check('B recebeu as vendas de A', JSON.stringify(B.S.vendas) === JSON.stringify(backend.store.data.vendas));
check('B nao sobrescreveu o backend (sem POST)', backend.store.posts === 1, 'posts=' + backend.store.posts);

console.log('\n[4] alteracao em B chega em A pelo polling');
B.S.vendas.push({ id: 'teste-1', produto: 'Caneca', qtd: 2, precoUnit: 60, data: '2026-10-21', status: 'Entregue' });
B.save();
await sleep(1000);
check('B gravou no backend', backend.store.posts === 2, 'posts=' + backend.store.posts);
const resA = await A.syncLoad({ silent: true });
check('A leu o remoto ("ok")', resA === 'ok', resA);
check('A tem a venda nova', A.S.vendas.some(v => v.id === 'teste-1'));
check('A nao fez POST ao ler', backend.store.posts === 2, 'posts=' + backend.store.posts);

console.log('\n[5] backend com erro nao pode apagar os dados');
backend.store.failGet = true;
const antes = JSON.stringify(A.S.vendas);
const resErr = await A.syncLoad();
check('syncLoad devolve "error"', resErr === 'error', resErr);
check('dados locais intactos', JSON.stringify(A.S.vendas) === antes);
check('nenhum POST com backend quebrado', backend.store.posts === 2, 'posts=' + backend.store.posts);
backend.store.failGet = false;

console.log('\n[6] alteracao local mais nova nao e sobrescrita pelo remoto antigo');
const snapshotRemoto = JSON.parse(JSON.stringify(backend.store.data));
A.S.vendas.push({ id: 'local-novo', produto: 'Prato', qtd: 1, precoUnit: 40, data: '2026-10-21', status: 'Entregue' });
A.save();
await sleep(1000);
check('A gravou a alteracao local', backend.store.posts === 3, 'posts=' + backend.store.posts);
check('backend tem o dado novo', backend.store.data.vendas.some(v => v.id === 'local-novo'));
check('remoto nao perdeu nada', snapshotRemoto.vendas.every(v => backend.store.data.vendas.some(x => x.id === v.id)));

console.log('\n[7] o outro aparelho ainda ve o estado mais novo');
const resB2 = await B.syncLoad();
check('B leu "ok"', resB2 === 'ok', resB2);
check('B tem o dado local-novo', B.S.vendas.some(v => v.id === 'local-novo'));

console.log('\n[8] chave de acesso vai na URL (GET) e no corpo (POST)');
const backend2 = makeBackend();
let ultimaUrl = '', ultimoBody = null;
backend2.fetchImpl = async (url, opts) => {
  ultimaUrl = String(url);
  if (opts && opts.method === 'POST') {
    ultimoBody = JSON.parse(opts.body);
    backend2.store.data = ultimoBody.data;
    backend2.store.updatedAt = ultimoBody.updatedAt;
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  }
  return { ok: true, status: 200, json: async () => ({ ok: true, data: backend2.store.data, updatedAt: backend2.store.updatedAt }) };
};
const C = await makeDevice(URL_MOCK, backend2, new Map(), 'segredo123');
await C.syncLoad();
check('GET leva ?key=', ultimaUrl.includes('key=segredo123'), ultimaUrl);
await C.syncSave();
check('POST leva a chave no corpo', ultimoBody && ultimoBody.key === 'segredo123');

console.log('\n[9] sem chave configurada, a URL fica limpa');
const backend3 = makeBackend();
let url3 = '';
backend3.fetchImpl = async (url) => {
  url3 = String(url);
  return { ok: true, status: 200, json: async () => ({ ok: true, data: backend3.store.data, updatedAt: 0 }) };
};
const D = await makeDevice(URL_MOCK, backend3);
await D.syncLoad();
check('GET sem ?key=', !url3.includes('key='), url3);

console.log('\n' + (falhas ? falhas + ' FALHA(S)' : 'TODOS OS TESTES PASSARAM'));
process.exit(falhas ? 1 : 0);
