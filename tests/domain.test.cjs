const test = require('node:test');
const assert = require('node:assert/strict');
const { VegTrackStore, STORAGE_KEY, BACKUP_KEY, initialSource } = require('./.test-build/domain/engine.js');
const { validarFonte } = require('./.test-build/domain/validation.js');
const gps = { lat: -23.7, lng: -46.5, accuracy: 8 };
const survey = (altura = '35', trechoId = 'trecho_003') => ({ trechoId, altura, observacoes: 'Teste demonstrativo', gps });
function storage(seed) {
  const data = new Map(seed === undefined ? [] : [[STORAGE_KEY, seed]]);
  return { data, writes: [], fail: false, hold: null,
    async getItem(key) { return data.get(key) ?? null; },
    async setItem(key, value) { if (this.hold) await this.hold; if (this.fail) throw new Error('Falha simulada de armazenamento'); this.writes.push([key,value]); data.set(key,value); },
  };
}
async function setup(perfil = 'supervisor', seed) {
  const adapter = storage(seed); const store = new VegTrackStore(adapter, undefined, () => new Date('2026-09-19T15:00:00.000Z'));
  await store.hydrate(); await store.login(`${perfil}@vegtrack.demo`, 'vegtrack123'); return { store, adapter };
}
const order = (store, id) => store.state.ordens.find(o => o.id === id);

test('fixtures completas passam pela mesma validação de hidratação', () => validarFonte(initialSource()));
test('credenciais inválidas são rejeitadas e sessão não é persistida', async () => {
  const {store,adapter} = await setup(); await store.logout();
  await assert.rejects(store.login('gestor@vegtrack.demo','errada'), /inválidos/);
  assert.equal(store.state.user,null); assert.equal(adapter.writes.length,0);
});
test('levantamentos níveis 1 e 2 persistem sem OS; nível 3 cria OS real', async () => {
  const {store} = await setup(); const before = store.state.ordens.length;
  for (const altura of ['0','14,9','15','29.9']) assert.equal((await store.registerSurvey(survey(altura))).ordem,null);
  const result = await store.registerSurvey(survey('30'));
  assert.equal(result.ordem.status,'pendente'); assert.equal(result.ordem.prazoHoras,48);
  assert.equal(store.state.ordens.length,before+1); assert.equal(store.state.levantamentos[0].id,result.levantamento.id);
});
test('OS aberta é reaproveitada e IDs continuam únicos no mesmo milissegundo e após recarga', async () => {
  const {store,adapter} = await setup(); const first = await store.registerSurvey(survey());
  const second = await store.registerSurvey(survey()); assert.equal(second.ordem.id,first.ordem.id); assert.equal(second.reused,true);
  const reopened = await setup('supervisor',adapter.data.get(STORAGE_KEY));
  const third = await reopened.store.registerSurvey(survey());
  assert.equal(new Set([first.levantamento.id,second.levantamento.id,third.levantamento.id]).size,3);
});
test('gestor consulta, mas operações de domínio não escrevem', async () => {
  const {store,adapter} = await setup('gestor');
  for (const action of [() => store.registerSurvey(survey()), () => store.startOrder('os_001'), () => store.finishOrder('os_003',{fotoUri:'demo',observacoes:'',gps}), () => store.escalateOrder('os_004'), () => store.saveConfig({kmInicial:23,kmFinal:24,mes:6}), () => store.simulateNotification(), () => store.sync(), () => store.resetDemo()]) await assert.rejects(action(),/autorização/);
  assert.equal(adapter.writes.length,0);
});
test('recorte aceita KM decimal e bloqueia ações em entidades fora do intervalo', async () => {
  const {store} = await setup(); await store.saveConfig({kmInicial:23.5,kmFinal:24,mes:6});
  assert.deepEqual(store.state.trechos.map(t=>t.id),['trecho_002']);
  await assert.rejects(store.registerSurvey(survey()),/intervalo/);
  await assert.rejects(store.startOrder('os_001'),/intervalo/);
  await assert.rejects(store.escalateOrder('os_004'),/intervalo/);
  await assert.rejects(store.finishOrder('os_003',{fotoUri:'demo',observacoes:'',gps}),/intervalo/);
  for (const mes of [0,1.2,13,NaN]) await assert.rejects(store.saveConfig({kmInicial:23,kmFinal:24,mes}),/mês/);
});
test('calendário e bloqueio usam outubro e novembro adicionais da mesma regra', async () => {
  const {store} = await setup();
  for (const mes of [6,10,11]) { await store.saveConfig({kmInicial:31.5,kmFinal:32,mes}); assert.equal(store.state.trechos[0].restricaoAmbiental,true); }
  await store.saveConfig({kmInicial:31.5,kmFinal:32,mes:7}); assert.equal(store.state.trechos[0].restricaoAmbiental,false);
});
test('ordem manual bloqueada pode iniciar explicitamente; escalada mantém método', async () => {
  const {store} = await setup(); await store.startOrder('os_002'); assert.equal(order(store,'os_002').status,'em_execucao');
  await store.escalateOrder('os_004'); assert.equal(order(store,'os_004').urgencia,'critica'); assert.equal(order(store,'os_004').prazoHoras,48);
});
test('nova restrição bloqueia início mecanizado sem mudar método', async () => {
  const {store} = await setup(); const created = await store.registerSurvey(survey('35','trecho_006'));
  assert.equal(created.ordem.metodo,'mecanizada'); await store.saveConfig({kmInicial:23,kmFinal:67,mes:2});
  await assert.rejects(store.startOrder(created.ordem.id),/restrição/); assert.equal(order(store,created.ordem.id).metodo,'mecanizada');
});
test('conclusão exige foto e GPS, bloqueia nova restrição e não regrava data', async () => {
  const {store} = await setup(); const created = await store.registerSurvey(survey('35','trecho_006')); await store.startOrder(created.ordem.id);
  await assert.rejects(store.finishOrder(created.ordem.id,{fotoUri:'',observacoes:'',gps}),/foto/);
  await assert.rejects(store.finishOrder(created.ordem.id,{fotoUri:'demo',observacoes:'',gps:{...gps,lat:91}}),/localização/);
  await store.saveConfig({kmInicial:23,kmFinal:67,mes:2});
  await assert.rejects(store.finishOrder(created.ordem.id,{fotoUri:'demo',observacoes:'',gps}),/restrição/);
  await store.saveConfig({kmInicial:23,kmFinal:67,mes:6});
  await store.finishOrder(created.ordem.id,{fotoUri:'demo',observacoes:'concluído',gps}); const done=order(store,created.ordem.id);
  await assert.rejects(store.finishOrder(created.ordem.id,{fotoUri:'outra',observacoes:'',gps}),/concluída/);
  assert.deepEqual(order(store,created.ordem.id),done); assert.equal(done.concluidaEm,'2026-09-19T15:00:00.000Z');
});
test('notificação simulada pertence a trecho restrito visível; leitura é persistida', async () => {
  const {store} = await setup(); await store.saveConfig({kmInicial:31.5,kmFinal:32,mes:6}); await store.simulateNotification();
  const notification=store.state.notifications[0]; assert.equal(notification.trechoId,'trecho_005'); await store.markNotification(notification.id); assert.equal(store.state.notifications[0].lida,true);
  await store.saveConfig({kmInicial:23.5,kmFinal:24,mes:6}); assert.equal(store.state.notifications.length,0);
  await assert.rejects(store.markNotification(notification.id),/intervalo/); await assert.rejects(store.simulateNotification(),/restrição ativa/);
});
test('falha de persistência não publica levantamento, OS, fila ou auditoria; retry permite nova tentativa', async () => {
  const {store,adapter}=await setup(); const before=store.state; store.setScenario('offline'); adapter.fail=true;
  await assert.rejects(store.registerSurvey(survey()),/armazenamento/);
  assert.deepEqual(store.state.levantamentos,before.levantamentos); assert.deepEqual(store.state.ordens,before.ordens); assert.deepEqual(store.state.audit,before.audit); assert.equal(store.state.pendingSync,0); assert.equal(adapter.data.has(STORAGE_KEY),false);
  adapter.fail=false; await store.retry(); await store.registerSurvey(survey());
  const persisted=JSON.parse(adapter.data.get(STORAGE_KEY)); assert.equal(persisted.levantamentos.length,before.levantamentos.length+1); assert.equal(persisted.audit.length,1); assert.equal(persisted.ordens.length,before.ordens.length+1); assert.equal(adapter.writes.length,1);
});
test('mutex abrange operações, retry e reset enquanto persistência está pendente', async () => {
  const {store,adapter}=await setup(); let release; adapter.hold=new Promise(resolve=>release=resolve); const count=store.state.levantamentos.length;
  const pending=store.registerSurvey(survey()); assert.equal(store.busy,true); assert.equal(store.state.levantamentos.length,count);
  await assert.rejects(store.registerSurvey(survey()),/Aguarde/); await assert.rejects(store.retry(),/Aguarde/); await assert.rejects(store.resetDemo(),/Aguarde/);
  store.setScenario('offline'); assert.equal(store.scenario,'normal'); release(); await pending; assert.equal(store.busy,false); assert.equal(adapter.writes.length,1);
});
test('offline persiste fila; recarga restaura; sincronização mock esvazia fila atomicamente', async () => {
  const {store,adapter}=await setup(); store.setScenario('offline'); await store.registerSurvey(survey()); assert.equal(store.state.pendingSync,1);
  await assert.rejects(store.sync(),/offline/); const reloaded=await setup('supervisor',adapter.data.get(STORAGE_KEY)); assert.equal(reloaded.store.state.pendingSync,1);
  await reloaded.store.sync(); assert.equal(reloaded.store.state.pendingSync,0); assert.equal(JSON.parse(reloaded.adapter.data.get(STORAGE_KEY)).pendingSync,0);
});
test('cenário vazio preserva fonte e cenário erro rejeita até retry', async () => {
  const {store,adapter}=await setup(); const count=store.state.trechos.length;
  store.setScenario('empty'); assert.equal(store.state.trechos.length,0); await assert.rejects(store.registerSurvey(survey()),/vazio/);
  store.setScenario('normal'); assert.equal(store.state.trechos.length,count); store.setScenario('error'); await assert.rejects(store.registerSurvey(survey()),/cenário de erro/);
  await store.retry(); assert.equal(store.scenario,'normal'); assert.equal(adapter.writes.length,0);
});
test('hidratação corrompida não expõe mocks nem permite ações ou apaga o original', async () => {
  for(const raw of ['{',JSON.stringify({...initialSource(),notifications:null}),JSON.stringify({...initialSource(),ordens:[{id:'inválida'}]}),JSON.stringify({...initialSource(),pendingSync:-1})]) {
    const adapter=storage(raw),store=new VegTrackStore(adapter); await assert.rejects(store.hydrate(),/corrompidos|inválidos/);
    assert.equal(store.ready,false); assert.equal(store.state.trechos.length,0); await assert.rejects(store.login('supervisor@vegtrack.demo','vegtrack123')); await assert.rejects(store.retry()); assert.equal(adapter.data.get(STORAGE_KEY),raw); assert.equal(adapter.writes.length,0);
    await store.resetDemo(); assert.equal(store.ready,true); assert.equal(adapter.data.get(BACKUP_KEY),raw); assert.equal(store.state.user,null); validarFonte(JSON.parse(adapter.data.get(STORAGE_KEY)));
  }
});
test('reset explícito funciona no cenário erro e falha sem destruir original quando backup falha', async () => {
  const {store,adapter}=await setup(); await store.registerSurvey(survey()); const original=adapter.data.get(STORAGE_KEY); store.setScenario('error'); adapter.fail=true;
  await assert.rejects(store.resetDemo(),/armazenamento/); assert.equal(adapter.data.get(STORAGE_KEY),original);
  adapter.fail=false; await store.resetDemo(); assert.equal(adapter.data.get(BACKUP_KEY),original); assert.equal(store.scenario,'normal'); assert.equal(store.state.user,null);
});

test('gestor não altera nem o recibo persistido de uma notificação', async () => {
  const {store,adapter}=await setup(); await store.simulateNotification(); const id=store.state.notifications[0].id;
  await store.logout(); await store.login('gestor@vegtrack.demo','vegtrack123'); const writes=adapter.writes.length;
  await assert.rejects(store.markNotification(id),/autorização/); assert.equal(adapter.writes.length,writes); assert.equal(store.state.notifications[0].lida,false);
});
test('falha ao salvar conclusão preserva status, evidência e auditoria', async () => {
  const {store,adapter}=await setup(); const before=order(store,'os_003'); const audits=store.state.audit.length; adapter.fail=true;
  await assert.rejects(store.finishOrder('os_003',{fotoUri:'demo',observacoes:'feito',gps}),/armazenamento/);
  assert.deepEqual(order(store,'os_003'),before); assert.equal(store.state.audit.length,audits);
  adapter.fail=false; await store.finishOrder('os_003',{fotoUri:'demo',observacoes:'feito',gps}); assert.equal(order(store,'os_003').status,'concluida'); assert.equal(adapter.writes.length,1);
});
test('hidratação rejeita referências órfãs, duplicidades, campos de tela e datas impossíveis', () => {
  const mutations=[
    s=>s.trechos[0].id=null,
    s=>s.trechos[0].nivelArtesp=1,
    s=>s.trechos[0].ultimoLevantamento='2026-02-31T08:00:00Z',
    s=>s.ordens[0].trechoId='órfão',
    s=>s.ordens[0].kmInicial=0,
    s=>s.ordens.push({...s.ordens[0]}),
    s=>s.ordens.push({...s.ordens[0],id:'outra',numero:'outra'}),
    s=>s.fauna[0].meses=[13],
    s=>s.fauna[0].trechoIds=['órfão'],
    s=>s.levantamentos[0].lat=91,
    s=>s.notifications=[{id:'n',titulo:null,trechoId:'trecho_001',lida:false}],
    s=>s.audit=[{id:'a',acao:'teste',usuario:'equipe',detalhe:[],data:'inválida'}],
    s=>s.config.mes=1.5,
  ];
  for(const mutate of mutations){const source=initialSource();mutate(source);assert.throws(()=>validarFonte(source),/inválidos/);}
});
