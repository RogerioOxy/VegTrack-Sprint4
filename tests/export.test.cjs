const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const content = require('./.test-build/services/reportContent.js');
const capture = require('./.test-build/domain/capture.js');

function exporter(fail = false, assetUri = 'assets_evidence_demo', failCopy = false) {
  const reads = [], printed = [], shared = [], copies = [], files = new Map();
  const modules = {
    'expo-print': { async printToFileAsync(options) { printed.push(options.html); return {uri:'file:///cache/export.pdf'}; } },
    'expo-sharing': { async isAvailableAsync() { return true; }, async shareAsync(uri) { shared.push(uri); } },
    'expo-file-system': { cacheDirectory:'file:///cache/', EncodingType:{Base64:'base64'}, async copyAsync(options) { copies.push({...options}); if (failCopy) throw new Error('falha ao copiar'); files.set(options.to, options.from); }, async readAsStringAsync(uri) { reads.push(uri); if (fail || !uri.startsWith('file://')) throw new Error('arquivo ausente'); return Buffer.from(files.get(uri) ?? uri).toString('base64'); } },
    './demoEvidence': { demoPhotoAsset:{localUri:assetUri, async downloadAsync() {} } },
    './reportContent': content, '../domain/capture': capture,
  };
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync('src/services/reports.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(code, { exports:module.exports, require(name) { assert.ok(name in modules, name); return modules[name]; }, Date });
  return {exportReport:module.exports.exportReport,reads,printed,shared,copies};
}
const state = {user:{nome:'Teste'},config:{kmInicial:23,kmFinal:67,mes:6},levantamentos:[],trechos:[],ordens:[
  {id:'a',numero:'OS-A',status:'concluida',fotoUri:'file:///app/evidencias/a.jpg',evidencia:{uri:'file:///app/evidencias/a.jpg',origem:'dispositivo'},criadaEm:'2026-10-20T12:00:00Z'},
  {id:'b',numero:'OS-B',status:'concluida',fotoUri:'file:///app/evidencias/b.jpg',evidencia:{uri:'file:///app/evidencias/b.jpg',origem:'dispositivo'},criadaEm:'2026-10-20T12:00:00Z'},
  {id:'c',numero:'OS-C',status:'concluida',fotoUri:'demo',criadaEm:'2026-10-20T12:00:00Z'},
]};

test('exportador nativo lê cada foto persistida e embute o conteúdo na OS correta', async () => {
  const run = exporter(); await run.exportReport(state);
  assert.deepEqual(run.reads, ['file:///app/evidencias/a.jpg','file:///app/evidencias/b.jpg','file:///cache/vegtrack-foto-exemplo.jpg']);
  const sections = [...run.printed[0].matchAll(/<section>(.*?)<\/section>/g)].map(m=>m[1]);
  for (let i=0;i<2;i++) assert.ok(sections[i].includes(Buffer.from(run.reads[i]).toString('base64')));
  assert.ok(sections[2].includes(Buffer.from('assets_evidence_demo').toString('base64')));
  assert.deepEqual(run.copies[0], {from:'assets_evidence_demo',to:'file:///cache/vegtrack-foto-exemplo.jpg'});
  assert.equal(run.shared.length,1);
});

test('foto de exemplo em recurso, asset ou arquivo é copiada antes da leitura Base64', async () => {
  for (const uri of ['assets_evidence_demo', 'asset:/assets/evidence-demo.jpg', 'file:///assets/exemplo.jpg']) {
    const run = exporter(false, uri); await run.exportReport(state, 'c');
    assert.deepEqual(run.copies[0], {from:uri,to:'file:///cache/vegtrack-foto-exemplo.jpg'});
    assert.deepEqual(run.reads, ['file:///cache/vegtrack-foto-exemplo.jpg']);
    assert.ok(run.printed[0].includes(Buffer.from(uri).toString('base64')));
  }
  const failed = exporter(false, 'assets_evidence_demo', true);
  await assert.rejects(failed.exportReport(state, 'c'), /A foto de OS-C não pôde ser lida/);
  assert.equal(failed.printed.length, 0); assert.equal(failed.shared.length, 0);
});

test('exportação individual não lê anexos de outras OS e foto ausente impede PDF', async () => {
  const run = exporter(); await run.exportReport(state, 'b');
  assert.deepEqual(run.reads, ['file:///app/evidencias/b.jpg']); assert.doesNotMatch(run.printed[0], /OS-A|OS-C/);
  const failure = exporter(true); await assert.rejects(failure.exportReport(state, 'a'), /A foto de OS-A não pôde ser lida/);
  assert.equal(failure.printed.length,0); assert.equal(failure.shared.length,0);
});
