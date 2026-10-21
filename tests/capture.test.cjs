const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizarGps, normalizarEvidencia, rotuloGps, rotuloFoto } = require('./.test-build/domain/capture.js');
const { comPrazo } = require('./.test-build/services/deadline.js');
const { VegTrackStore, STORAGE_KEY } = require('./.test-build/domain/engine.js');
const { validarFonte } = require('./.test-build/domain/validation.js');
const gps = normalizarGps({ latitude: -23.5, longitude: -46.6, accuracy: 8.25 }, 'dispositivo');
const evidencia = normalizarEvidencia('file:///data/app/files/evidencias/campo.jpg', 'dispositivo');

test('GPS preserva coordenadas, precisão e origem do dispositivo ou demonstração', () => {
  assert.deepEqual(gps, { lat: -23.5, lng: -46.6, accuracy: 8.25, origem: 'dispositivo' });
  assert.equal(normalizarGps({ latitude: 90, longitude: -180, accuracy: 0.1 }, 'demonstracao').origem, 'demonstracao');
  assert.equal(rotuloGps(gps), 'GPS do dispositivo');
  assert.equal(rotuloGps(), 'GPS demonstrativo');
  assert.equal(rotuloFoto(evidencia), 'Foto do dispositivo');
  assert.equal(rotuloFoto(), 'Foto de exemplo');
});

test('GPS recusa leitura inválida, precisão ausente e origem desconhecida', () => {
  for (const value of [{latitude: 91}, {latitude: -91}, {longitude: 181}, {longitude: -181}, {latitude: NaN}, {longitude: Infinity}, {accuracy: null}, {accuracy: 0}, {accuracy: -1}, {accuracy: NaN}, {latitude: '23'}]) {
    assert.throws(() => normalizarGps({ latitude: 0, longitude: 0, accuracy: 8, ...value }, 'dispositivo'), /localização/);
  }
  assert.throws(() => normalizarGps({ latitude: 0, longitude: 0, accuracy: 8 }, 'outra'), /localização/);
});

test('evidência real exige cópia permanente e exemplo mantém origem explícita', () => {
  for (const uri of ['', 'file:///cache/foto.jpg', 'https://exemplo/foto.jpg', 'file:///data/evidencias/sub/foto.jpg']) assert.throws(() => normalizarEvidencia(uri, 'dispositivo'), /evidencias/);
  assert.throws(() => normalizarEvidencia('demo.jpg', 'outra'), /evidencias/);
  assert.deepEqual(normalizarEvidencia('demo.jpg', 'demonstracao'), {uri: 'demo.jpg', origem: 'demonstracao'});
});

test('prazo encerra leitura pendente e preserva sucesso ou erro anterior ao limite', async () => {
  assert.equal(await comPrazo(Promise.resolve('ok'), 50), 'ok');
  await assert.rejects(comPrazo(Promise.reject(new Error('serviço desligado')), 50), /serviço desligado/);
  let complete;
  const pending = new Promise(resolve => { complete = resolve; });
  await assert.rejects(comPrazo(pending, 5), /Tempo de localização esgotado/);
  complete('resultado tardio');
});

test('origens independentes e foto permanente sobrevivem à persistência e recarga', async () => {
  const data = new Map();
  const storage = { async getItem(k) { return data.get(k) ?? null; }, async setItem(k,v) { data.set(k,v); } };
  const store = new VegTrackStore(storage);
  await store.hydrate(); await store.login('supervisor@vegtrack.demo', 'vegtrack123');
  const created = await store.registerSurvey({trechoId:'trecho_003', altura:'35', observacoes:'campo', gps, evidencia, fotoUri:evidencia.uri});
  assert.deepEqual(created.levantamento.gps, gps); assert.deepEqual(created.levantamento.evidencia, evidencia);
  await store.startOrder(created.ordem.id);
  const demoGps = {...gps, origem: 'demonstracao'};
  await store.finishOrder(created.ordem.id, {gps:demoGps, evidencia, fotoUri:evidencia.uri, observacoes:''});
  const reloaded = new VegTrackStore(storage); await reloaded.hydrate();
  const done = reloaded.state.ordens.find(o => o.id === created.ordem.id);
  assert.deepEqual(done.gps, demoGps); assert.deepEqual(done.evidencia, evidencia); assert.equal(done.fotoUri, evidencia.uri);
  const source = JSON.parse(data.get(STORAGE_KEY)); validarFonte(source);
  for (const mutate of [s => s.ordens.find(o=>o.id===done.id).gps.origem='outra', s => s.ordens.find(o=>o.id===done.id).evidencia.uri='file:///cache/foto.jpg', s => s.levantamentos[0].gps.lat=0]) {
    const broken = structuredClone(source); mutate(broken); assert.throws(() => validarFonte(broken), /inválidos/);
  }
});

test('captura inválida falha sem publicar nova OS, auditoria ou alteração local', async () => {
  let writes = 0;
  const store = new VegTrackStore({ async getItem() { return null; }, async setItem() { writes++; } });
  await store.hydrate(); await store.login('supervisor@vegtrack.demo','vegtrack123');
  const before = store.state;
  await assert.rejects(store.registerSurvey({trechoId:'trecho_003', altura:'35', observacoes:'', gps, evidencia:{uri:'file:///cache/foto.jpg',origem:'dispositivo'}}), /evidencias/);
  assert.equal(writes, 0); assert.deepEqual(store.state.ordens,before.ordens); assert.deepEqual(store.state.audit,before.audit);
});
