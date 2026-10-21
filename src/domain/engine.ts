import { Evidencia, Gps, normalizarEvidencia, normalizarGps } from './capture';
import { mockTrechos, mockOrdens, mockFauna, mockHistoricoLevantamentos, mockUser, Trecho, OrdemServico, EspecieRestricao, Levantamento } from '../utils/mockData';
import { UserSession, atualizarResumo, calcularNivelArtesp, deveCriarOrdem, exigirPerfil, faixaContida, metodoPermitido, restricaoAtiva, validarGps } from './rules';
import { validarFonte } from './validation';

export type Scenario = 'normal' | 'empty' | 'error' | 'offline';
export interface AppConfig { kmInicial: number; kmFinal: number; mes: number; }
export interface Notification { id: string; titulo: string; mensagem: string; trechoId: string; lida: boolean; }
export interface AuditEntry { id: string; acao: string; data: string; usuario: string; detalhe: string; }
export interface Source {
  trechos: Trecho[]; ordens: OrdemServico[]; fauna: EspecieRestricao[]; levantamentos: Levantamento[];
  config: AppConfig; notifications: Notification[]; audit: AuditEntry[]; pendingSync: number;
}
export interface AppState extends Source { user: UserSession | null; dashboardStats: ReturnType<typeof atualizarResumo>; }
export interface SurveyInput { trechoId: string; altura: string; observacoes: string; fotoUri?: string; evidencia?: Evidencia; gps: { lat: number; lng: number; accuracy: number; origem?: Gps['origem'] }; }
export interface CompletionInput { fotoUri: string; evidencia?: Evidencia; observacoes: string; gps: { lat: number; lng: number; accuracy: number; origem?: Gps['origem'] }; }
export interface StorageAdapter { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; }
export const STORAGE_KEY = '@vegtrack/sprint3';
export const BACKUP_KEY = `${STORAGE_KEY}/antes-do-reset`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export function proximoNumeroOrdem(ordens: Pick<OrdemServico, 'numero'>[], ano: number): string {
  const maior = ordens.reduce((max, ordem) => {
    const match = /^OS-\d{4}-(\d+)$/.exec(ordem.numero);
    const numero = match ? Number(match[1]) : 0;
    return Number.isSafeInteger(numero) ? Math.max(max, numero) : max;
  }, 0);
  if (!Number.isSafeInteger(maior + 1)) throw new Error('Limite de numeração de ordens atingido.');
  return `OS-${ano}-${String(maior + 1).padStart(4, '0')}`;
}
export function initialSource(): Source {
  return clone({ trechos: mockTrechos, ordens: mockOrdens, fauna: mockFauna, levantamentos: mockHistoricoLevantamentos,
    config: { kmInicial: 23, kmFinal: 67, mes: 6 }, notifications: [], audit: [], pendingSync: 0 });
}
const credentials = {
  'supervisor@vegtrack.demo': { perfil: 'supervisor', nome: mockUser.nome, apelido: mockUser.apelido },
  'tecnico@vegtrack.demo': { perfil: 'tecnico', nome: 'João Moreira', apelido: 'João' },
  'gestor@vegtrack.demo': { perfil: 'gestor', nome: 'Marina Alves', apelido: 'Marina' },
} as const;

// O mesmo motor atende ao Context e aos testes, inclusive o limite da persistência.
export class VegTrackStore {
  private source = initialSource();
  private user: UserSession | null = null;
  private hydrated = false;
  private counter = 0;
  ready = false;
  busy = false;
  error: string | null = null;
  scenario: Scenario = 'normal';
  constructor(private storage: StorageAdapter, private changed: () => void = () => {}, private now: () => Date = () => new Date()) {}

  get state(): AppState {
    const hidden = !this.hydrated || this.scenario === 'empty';
    const trechos = hidden ? [] : this.source.trechos.filter(t => faixaContida(t, this.source.config)).map(t => {
      const active = this.source.fauna.find(f => restricaoAtiva(f, this.source.config.mes, t.id));
      return { ...t, restricaoAmbiental: Boolean(active), especieEmRestricao: active?.nomePopular };
    });
    const ids = new Set(trechos.map(t => t.id));
    const ordens = this.source.ordens.filter(o => ids.has(o.trechoId));
    return clone({ ...this.source, user: this.user, trechos, ordens,
      levantamentos: this.source.levantamentos.filter(l => ids.has(l.trechoId)),
      fauna: hidden ? [] : this.source.fauna.filter(f => !f.trechoIds?.length || f.trechoIds.some(id => ids.has(id))),
      notifications: this.source.notifications.filter(n => ids.has(n.trechoId)),
      audit: hidden ? [] : this.source.audit, dashboardStats: atualizarResumo(trechos, ordens) });
  }
  private id(prefix: string): string {
    // Timestamp inteiro e contador, com verificação contra os registros persistidos.
    let id: string;
    const used = new Set([...this.source.trechos, ...this.source.ordens, ...this.source.fauna, ...this.source.levantamentos, ...this.source.notifications, ...this.source.audit].map(v => v.id));
    do { id = `${prefix}_${this.now().getTime()}_${++this.counter}`; } while (used.has(id));
    return id;
  }
  private audit(next: Source, acao: string, detalhe: string) {
    next.audit.unshift({ id: this.id('audit'), acao, detalhe, data: this.now().toISOString(), usuario: this.user?.apelido ?? 'Demonstração' });
  }
  private async persist(next: Source, queue = true) {
    if (queue && this.scenario === 'offline') next.pendingSync += 1;
    // Só publica os dados, a auditoria e a fila após a única gravação terminar.
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.source = next;
  }
  private async run<T>(action: () => Promise<T>, recovery = false): Promise<T> {
    if (this.busy) throw new Error('Aguarde a conclusão da ação anterior.');
    this.busy = true; this.changed();
    try {
      if (!recovery) {
        if (!this.ready) throw new Error('A demonstração ainda está carregando.');
        if (!this.hydrated) throw new Error('Os dados locais não puderam ser carregados. Tente novamente ou restaure a demonstração explicitamente.');
        if (this.scenario === 'error') throw new Error('O cenário de erro está ativo. Tente novamente para continuar.');
      }
      const result = await action(); this.error = null; return result;
    } catch (cause) {
      this.error = cause instanceof Error ? cause.message : 'Não foi possível concluir a ação.';
      throw new Error(this.error);
    } finally { this.busy = false; this.changed(); }
  }
  hydrate = () => this.run(async () => {
    try {
      const raw = await this.storage.getItem(STORAGE_KEY);
      let next: unknown;
      try { next = raw === null ? initialSource() : JSON.parse(raw); }
      catch { throw new Error('Os dados locais estão corrompidos. Tente novamente ou restaure a demonstração.'); }
      validarFonte(next);
      this.source = next; this.hydrated = true;
    } catch (cause) { this.hydrated = false; throw cause; }
    finally { this.ready = this.hydrated; }
  }, true);
  retry = async () => { await this.hydrate(); this.scenario = 'normal'; this.changed(); };
  setScenario = (value: Scenario) => {
    if (this.busy) return;
    this.scenario = value;
    if (this.hydrated) this.error = value === 'error' ? 'Cenário de erro ativo. Use tentar novamente para continuar.' : null;
    this.changed();
  };
  login = (email: string, password: string) => this.run(async () => {
    const account = credentials[email.trim().toLowerCase() as keyof typeof credentials];
    if (!account || password !== 'vegtrack123') throw new Error('E-mail ou senha inválidos para a demonstração.');
    this.user = { ...account, rodovia: mockUser.rodovia, trechoGerenciado: { ...mockUser.trechoGerenciado } };
  });
  logout = () => this.run(async () => { this.user = null; });
  private writable(action: string, supervisor = false) {
    exigirPerfil(this.user?.perfil, supervisor ? ['supervisor'] : ['tecnico', 'supervisor'], action);
    if (this.scenario === 'empty') throw new Error('O cenário vazio não possui registros para alterar. Volte ao cenário normal.');
  }
  private trecho(id: string): Trecho {
    const trecho = this.source.trechos.find(t => t.id === id);
    if (!trecho || !faixaContida(trecho, this.source.config) || !this.user || !faixaContida(trecho, this.user.trechoGerenciado)) throw new Error('O trecho não está disponível no intervalo gerenciado.');
    return trecho;
  }
  private order(id: string): OrdemServico {
    const ordem = this.source.ordens.find(o => o.id === id);
    if (!ordem) throw new Error('Ordem de serviço não encontrada.');
    this.trecho(ordem.trechoId); return ordem;
  }
  registerSurvey = (input: SurveyInput) => this.run(async () => {
    this.writable('registrar levantamentos'); validarGps(input.gps);
    const gps = normalizarGps({ latitude: input.gps.lat, longitude: input.gps.lng, accuracy: input.gps.accuracy }, input.gps.origem ?? 'demonstracao');
    const evidencia = input.evidencia ? normalizarEvidencia(input.evidencia.uri, input.evidencia.origem) : input.fotoUri?.trim() ? normalizarEvidencia(input.fotoUri, 'demonstracao') : undefined;
    const trecho = this.trecho(input.trechoId);
    if (!input.altura.trim()) throw new Error('Informe a altura da vegetação.');
    const altura = Number(input.altura.replace(',', '.')); const nivel = calcularNivelArtesp(altura);
    const levantamento: Levantamento = { id: this.id('lev'), trechoId: trecho.id, kmInicial: trecho.kmInicial, kmFinal: trecho.kmFinal, faixa: trecho.faixa,
      alturaVegetacaoCm: altura, nivelArtesp: nivel, dataRegistro: this.now().toISOString(), tecnicoNome: this.user!.apelido,
      lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy, gps, evidencia, temFoto: Boolean(evidencia), fotoUri: evidencia?.uri, observacoes: input.observacoes.trim() || undefined };
    const next = clone(this.source); next.levantamentos.unshift(levantamento);
    next.trechos = next.trechos.map(t => t.id === trecho.id ? { ...t, alturaVegetacaoCm: altura, nivelArtesp: nivel, ultimoLevantamento: levantamento.dataRegistro } : t);
    let ordem = next.ordens.find(o => o.trechoId === trecho.id && o.status !== 'concluida') ?? null;
    const reused = Boolean(ordem);
    if (!ordem && deveCriarOrdem(nivel)) {
      const id = this.id('os');
      ordem = { id, numero: proximoNumeroOrdem(next.ordens, this.now().getFullYear()), trechoId: trecho.id, kmInicial: trecho.kmInicial, kmFinal: trecho.kmFinal, faixa: trecho.faixa,
        metodo: next.fauna.some(f => restricaoAtiva(f, next.config.mes, trecho.id)) ? 'manual_seletiva' : 'mecanizada', status: 'pendente', urgencia: 'critica', prazoHoras: 48,
        criadaEm: levantamento.dataRegistro, equipeResponsavel: 'Equipe de demonstração', observacoes: levantamento.observacoes };
      next.ordens.unshift(ordem);
    }
    this.audit(next, 'levantamento_registrado', `${levantamento.id}: ${ordem ? `${reused ? 'associado à' : 'gerou'} ${ordem.numero}` : 'nível abaixo do crítico, sem nova OS'}.`);
    await this.persist(next); return clone({ levantamento, ordem, reused });
  });
  startOrder = (id: string) => this.run(async () => {
    this.writable('iniciar ordens'); const current = this.order(id);
    if (current.status !== 'pendente' && !(current.status === 'bloqueada' && current.metodo === 'manual_seletiva')) throw new Error('Somente ordens pendentes ou manuais bloqueadas podem ser iniciadas.');
    if (!metodoPermitido(current, this.source.fauna, this.source.config.mes)) throw new Error('A restrição ativa bloqueia a execução mecanizada. O método foi preservado; revise a ordem antes de continuar.');
    const next = clone(this.source); next.ordens = next.ordens.map(o => o.id === id ? { ...o, status: 'em_execucao', motivaBloqueio: undefined } : o);
    this.audit(next, 'ordem_iniciada', current.numero); await this.persist(next);
  });
  finishOrder = (id: string, input: CompletionInput) => this.run(async () => {
    this.writable('concluir ordens'); const current = this.order(id); validarGps(input.gps);
    if (!input.fotoUri.trim() && !input.evidencia) throw new Error('A conclusão exige uma foto.');
    const gps = normalizarGps({ latitude: input.gps.lat, longitude: input.gps.lng, accuracy: input.gps.accuracy }, input.gps.origem ?? 'demonstracao');
    const evidencia = normalizarEvidencia(input.evidencia?.uri ?? input.fotoUri, input.evidencia?.origem ?? 'demonstracao');
    if (current.status !== 'em_execucao') throw new Error('A ordem deve estar em execução e ainda não concluída.');
    if (!metodoPermitido(current, this.source.fauna, this.source.config.mes)) throw new Error('Uma restrição ativa impede a conclusão com o método original. Revise a ordem antes de continuar.');
    const next = clone(this.source); next.ordens = next.ordens.map(o => o.id === id ? { ...o, status: 'concluida', concluidaEm: this.now().toISOString(),
      fotoUri: evidencia.uri, evidencia, gps, lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy, concluidaPor: this.user!.apelido, observacoes: input.observacoes.trim() || o.observacoes } : o);
    this.audit(next, 'ordem_concluida', current.numero); await this.persist(next);
  });
  escalateOrder = (id: string) => this.run(async () => {
    this.writable('escalar ordens', true); const current = this.order(id);
    if (current.status === 'concluida') throw new Error('Uma ordem concluída não pode ser escalada.');
    const next = clone(this.source); next.ordens = next.ordens.map(o => o.id === id ? { ...o, urgencia: 'critica', prazoHoras: 48 } : o);
    this.audit(next, 'ordem_escalada', current.numero); await this.persist(next);
  });
  saveConfig = (input: AppConfig) => this.run(async () => {
    exigirPerfil(this.user?.perfil, ['supervisor'], 'alterar a configuração');
    const managed = this.user!.trechoGerenciado;
    if (!Number.isFinite(input.kmInicial) || !Number.isFinite(input.kmFinal) || input.kmInicial < managed.kmInicial || input.kmFinal > managed.kmFinal || input.kmInicial >= input.kmFinal || !Number.isInteger(input.mes) || input.mes < 1 || input.mes > 12) throw new Error('Informe um intervalo dentro do trecho gerenciado e um mês inteiro de 1 a 12.');
    const next = clone(this.source); next.config = { ...input };
    this.audit(next, 'configuracao_atualizada', `KM ${input.kmInicial} a ${input.kmFinal}, mês ${input.mes}.`); await this.persist(next);
  });
  markNotification = (id: string) => this.run(async () => {
    exigirPerfil(this.user?.perfil, ['supervisor', 'tecnico'], 'marcar notificações como lidas');
    const current = this.state.notifications.find(n => n.id === id);
    if (!current) throw new Error('Notificação não encontrada no intervalo atual.');
    const next = clone(this.source); next.notifications = next.notifications.map(n => n.id === id ? { ...n, lida: true } : n); await this.persist(next, false);
  });
  simulateNotification = () => this.run(async () => {
    this.writable('simular notificações');
    const trecho = this.state.trechos.find(t => t.restricaoAmbiental);
    if (!trecho) throw new Error('Não há restrição ativa no mês e intervalo atuais para simular uma notificação.');
    const next = clone(this.source); next.notifications.unshift({ id: this.id('not'), titulo: 'Restrição ativa no trecho', mensagem: `${trecho.especieEmRestricao}: restrição demonstrativa no mês ${next.config.mes}. KM ${trecho.kmInicial} a ${trecho.kmFinal}.`, trechoId: trecho.id, lida: false });
    this.audit(next, 'notificacao_simulada', trecho.id); await this.persist(next);
  });
  sync = () => this.run(async () => {
    this.writable('processar a fila simulada');
    if (this.scenario === 'offline') throw new Error('A sincronização está indisponível no cenário offline.');
    const next = clone(this.source); next.pendingSync = 0; this.audit(next, 'sincronizacao', 'Fila processada somente no mock local.'); await this.persist(next, false);
  });
  resetDemo = () => this.run(async () => {
    if (this.hydrated) exigirPerfil(this.user?.perfil, ['supervisor'], 'restaurar a demonstração');
    // Uma cópia local preserva os dados anteriores, inclusive conteúdo corrompido.
    const previous = await this.storage.getItem(STORAGE_KEY);
    if (previous !== null) await this.storage.setItem(BACKUP_KEY, previous);
    const next = initialSource(); this.audit(next, 'demonstracao_restaurada', 'Restauração solicitada explicitamente. Os dados anteriores, quando existentes, foram copiados para backup local.');
    await this.persist(next, false); this.user = null; this.hydrated = true; this.ready = true; this.scenario = 'normal';
  }, true);
}
