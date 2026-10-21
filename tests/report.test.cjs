const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReportHtml } = require('./.test-build/services/reportContent.js');

const completed = { id: 'a', numero: 'OS-001', status: 'concluida', trechoId: 't', kmInicial: 23, kmFinal: 23.5, faixa: 'Marginal', metodo: 'manual_seletiva', criadaEm: '2026-09-19T12:00:00Z', observacoes: '<script>alert(1)</script>', fotoUri: 'demo' };
const state = { user: { nome: 'Supervisor & equipe' }, config: { kmInicial: 23, kmFinal: 24, mes: 9 }, trechos: [], levantamentos: [], ordens: [completed, {...completed, id:'b', numero:'OS-NÃO-CONCLUÍDA', status:'pendente'}] };
test('PDF apresenta GPS e precisão em português brasileiro', () => {
  for (const origem of ['dispositivo', 'demonstracao']) {
    const html = buildReportHtml({...state, ordens:[{...completed,gps:{lat:-23.5329,lng:-46.8015,accuracy:7.4,origem}}]});
    assert.match(html, /-23,532900 \/ -46,801500 \| precisão: 7,4 m/);
    assert.doesNotMatch(html, /7\.4 m|-23\.5329|-46\.8015/);
  }
});
test('relatório inclui somente concluídas e escapa conteúdo de formulário', () => {
  const html = buildReportHtml(state, undefined, {a: 'data:image/png;base64,AA=='});
  assert.match(html, /OS-001/);
  assert.doesNotMatch(html, /OS-NÃO-CONCLUÍDA/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Supervisor &amp; equipe/);
  assert.match(html, /não comprova conformidade regulatória/);
  assert.match(html, /evidence/);
});
test('exportação sem sessão ou sem ordem concluída falha sem PDF vazio', () => {
  assert.throws(() => buildReportHtml({...state,user:null}), /Entre na conta/);
  assert.throws(() => buildReportHtml({...state,ordens:[]}), /Não há ordens/);
  assert.throws(() => buildReportHtml(state, 'inexistente'), /Não há ordens/);
});

test('PDF associa imagem por OS e separa origem de GPS, foto real e exemplo', () => {
  const real = {...completed, id:'real', numero:'OS-REAL', gps:{lat:-23,lng:-46,accuracy:12,origem:'demonstracao'}, evidencia:{uri:'file:///app/evidencias/campo.jpg',origem:'dispositivo'}};
  const demo = {...completed, id:'demo', numero:'OS-DEMO', gps:{lat:-24,lng:-47,accuracy:6,origem:'dispositivo'}, evidencia:{uri:'demo',origem:'demonstracao'}};
  const html = buildReportHtml({...state, ordens:[real,demo]}, undefined, {real:'data:image/jpeg;base64,REAL',demo:'data:image/jpeg;base64,DEMO'});
  const sections = [...html.matchAll(/<section>(.*?)<\/section>/g)].map(m=>m[1]);
  assert.match(sections[0], /OS-REAL/); assert.match(sections[0], /base64,REAL/); assert.doesNotMatch(sections[0], /base64,DEMO|Jcomeau/);
  assert.match(sections[0], /GPS demonstrativo/); assert.match(sections[0], /Foto do dispositivo/);
  assert.match(sections[1], /GPS do dispositivo/); assert.match(sections[1], /base64,DEMO/); assert.match(sections[1], /Jcomeau ictx/);
  const one = buildReportHtml({...state, ordens:[real,demo]}, 'real', {real:'REAL',demo:'DEMO'});
  assert.doesNotMatch(one, /OS-DEMO|Jcomeau ictx/);
});

test('registros da Sprint 3 continuam demonstrativos e imagem ausente é declarada', () => {
  const html = buildReportHtml(state);
  assert.match(html, /GPS demonstrativo/); assert.match(html, /Foto de exemplo: imagem indisponível/);
  assert.doesNotMatch(html, /Foto do dispositivo/);
});
