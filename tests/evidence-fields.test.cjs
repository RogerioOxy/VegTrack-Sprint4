const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const capture = require('./.test-build/domain/capture.js');
const { comPrazo } = require('./.test-build/services/deadline.js');

// Executa o componente real com hooks e fronteiras nativas controlados.
function screen({ granted = false, denied = false, services = true, pending = false, delayed = false } = {}) {
  const slots = [], effects = [], listeners = new Map(), results = [], busy = [];
  let index = 0, tree, focused = true;
  const calls = { camera: 0, gps: 0, queries: 0, position: 0 };
  let startPosition, releasePosition;
  const positionStarted = new Promise(resolve=>{ startPosition = resolve; });
  const positionResult = new Promise(resolve=>{ releasePosition = resolve; });
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    createElement(type, props, ...children) { return { type, props: props ?? {}, children: children.flat() }; },
    useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
    useRef(initial) { const i = index++; if (!(i in slots)) slots[i] = {current: initial}; return slots[i]; },
    useEffect(effect, deps) {
      const i = index++, previous = slots[i];
      if (!previous || !same(previous.deps, deps)) effects.push(() => { previous?.cleanup?.(); slots[i] = {deps, cleanup: effect()}; });
    },
  };
  const appState = { currentState: 'active', addEventListener(name, callback) { listeners.set(name, callback); return {remove() { listeners.delete(name); }}; } };
  const permissionDialog = async name => {
    calls[name]++;
    appState.currentState = 'background'; listeners.get('change')('background'); render();
    await Promise.resolve();
    appState.currentState = 'active'; listeners.get('change')('active'); render();
    return {granted: !denied};
  };
  const modules = {
    react,
    'react-native': { AppState: appState, Platform:{OS:'android'}, StyleSheet:{create:v=>v}, Image:'Image', Modal:'Modal', ScrollView:'ScrollView', Text:'Text', View:'View' },
    '@react-navigation/native': {useIsFocused:()=>focused},
    'expo-camera': {CameraView:'CameraView',useCameraPermissions:()=>[{granted},()=>permissionDialog('camera')]},
    'expo-location': {
      Accuracy:{High:4}, async getForegroundPermissionsAsync() { calls.queries++; return {granted}; },
      requestForegroundPermissionsAsync:()=>permissionDialog('gps'), async hasServicesEnabledAsync() { return services; },
      async getCurrentPositionAsync() { calls.position++; startPosition(); return delayed ? positionResult : pending ? new Promise(()=>{}) : {coords:{latitude:-23.5329,longitude:-46.8015,accuracy:7.4}}; },
    },
    'expo-file-system': {}, 'react-native-safe-area-context':{SafeAreaView:'SafeAreaView'},
    './index': Object.fromEntries(['AppIcon','Card','DemoBadge','MessageBanner','PrimaryButton','SectionHeader'].map(name=>[name,name])),
    './PhotoCredit':{default:'PhotoCredit'}, '../domain/capture':capture, '../services/demoEvidence':{demoPhotoUri:'demo.jpg'},
    '../services/deadline':{comPrazo:operation=>comPrazo(operation, 10)},
    '../utils/theme':require('./.test-build/utils/theme.js'),
  };
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync('src/components/EvidenceFields.tsx','utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,esModuleInterop:true},
  }).outputText;
  vm.runInNewContext(code, {Error,exports:module.exports,require(name) { assert.ok(name in modules, name); return modules[name]; }});
  let contextKey = 'trecho-1';
  function render() {
    index = 0;
    tree = module.exports.default({contextKey,gps:null,evidencia:null,onGps:value=>results.push(value),onEvidencia() {},onBusy:value=>busy.push(value)});
    effects.splice(0).forEach(effect=>effect());
    return tree;
  }
  const nodes = (node = tree) => !node || typeof node !== 'object' ? [] : [node,...node.children.flatMap(child=>nodes(child))];
  render(); render();
  return {calls,results,busy,render,nodes,positionStarted,releasePosition,
    button:label=>nodes().find(n=>n.type === 'PrimaryButton' && n.props.label === label),
    background() { appState.currentState='background'; listeners.get('change')('background'); render(); },
    switchContext() { contextKey='trecho-2'; render(); },
    blur() { focused=false; render(); },
  };
}

test('um toque abre câmera após conceder permissão, mesmo com background do diálogo', async () => {
  const run = screen(); await run.button('Abrir câmera').props.onPress(); run.render();
  assert.equal(run.calls.camera, 1);
  assert.equal(run.nodes().find(n=>n.type === 'Modal').props.visible, true);
  assert.equal(run.busy.at(-1), false);
  run.background(); assert.equal(run.nodes().find(n=>n.type === 'Modal').props.visible, false);
});

test('um toque lê GPS após conceder permissão e mantém coordenadas após AppState', async () => {
  const run = screen(); await run.button('Capturar localização').props.onPress(); run.render();
  assert.equal(run.calls.queries, 1); assert.equal(run.calls.gps, 1); assert.equal(run.calls.position, 1);
  assert.deepEqual(run.results.at(-1), {lat:-23.5329,lng:-46.8015,accuracy:7.4,origem:'dispositivo'});
  assert.equal(run.busy.at(-1), false);
});

test('câmera e GPS já autorizados não solicitam novamente a permissão', async () => {
  const run = screen({granted:true}); await run.button('Abrir câmera').props.onPress();
  await run.button('Capturar localização').props.onPress();
  assert.equal(run.calls.camera, 0); assert.equal(run.calls.gps, 0); assert.equal(run.calls.queries, 1);
  assert.equal(run.results.at(-1).origem, 'dispositivo');
});

test('negação da câmera e GPS é exibida no primeiro toque e libera os botões', async () => {
  for (const label of ['Abrir câmera','Capturar localização']) {
    const run = screen({denied:true}); await run.button(label).props.onPress(); run.render();
    assert.ok(run.nodes().some(n=>n.type === 'MessageBanner' && /negada/.test(n.props.message)));
    assert.equal(run.busy.at(-1), false); assert.equal(run.calls.position, 0);
  }
});

test('GPS desligado ou pendente apresenta erro ou timeout e termina a espera', async () => {
  for (const options of [{granted:true,services:false},{granted:true,pending:true}]) {
    const run = screen(options); await run.button('Capturar localização').props.onPress(); run.render();
    assert.ok(run.nodes().some(n=>n.type === 'MessageBanner' && /desligado|Tempo de localização esgotado/.test(n.props.message)));
    assert.equal(run.busy.at(-1), false); assert.equal(run.results.at(-1), null);
  }
});

test('background real, troca de trecho e saída da tela descartam GPS tardio', async () => {
  for (const cancel of ['background','switchContext','blur']) {
    const run = screen({granted:true,delayed:true});
    const operation = run.button('Capturar localização').props.onPress();
    await run.positionStarted;
    run[cancel](); run.releasePosition({coords:{latitude:-23.5329,longitude:-46.8015,accuracy:7.4}}); await operation;
    assert.equal(run.results.filter(Boolean).length, 0);
  }
});
