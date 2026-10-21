import type { Evidencia, Gps } from '../domain/capture';
// ============================================================
// VEGTRACK: dados fictícios para demonstração acadêmica
// Contexto: concessionária fictícia | rodovia demonstrativa SP-021
// Trechos: KM 23 a KM 67 | Supervisão: Cadú Rocha
// ============================================================

export type SeverityLevel = 1 | 2 | 3;
export type FaixaDominio = 'Canteiro Central Externo' | 'Canteiro Central Interno' | 'Faixa Marginal Direita' | 'Faixa Marginal Esquerda';
export type OSStatus = 'pendente' | 'em_execucao' | 'concluida' | 'bloqueada';
export type OSMethod = 'mecanizada' | 'manual_seletiva';

// ─── USUÁRIO AUTENTICADO ────────────────────────────────────
export const mockUser = {
  id: 'usr_001',
  nome: 'Carlos Eduardo Rocha',
  apelido: 'Cadú',
  cargo: 'Supervisor de Conservação e Operações de Campo',
  perfil: 'supervisor' as const,
  trechoGerenciado: { kmInicial: 23, kmFinal: 67 },
  rodovia: 'SP-021, rodovia demonstrativa',
  avatar: null,
};

// ─── TRECHOS DA RODOVIA ─────────────────────────────────────
export interface Trecho {
  id: string;
  kmInicial: number;
  kmFinal: number;
  faixa: FaixaDominio;
  alturaVegetacaoCm: number;
  nivelArtesp: SeverityLevel;
  ultimoLevantamento: string; // ISO date
  diasSemRocada: number;
  lat: number;
  lng: number;
  restricaoAmbiental: boolean;
  especieEmRestricao?: string;
}

export const mockTrechos: Trecho[] = [
  {
    id: 'trecho_001',
    kmInicial: 23.0, kmFinal: 23.5,
    faixa: 'Faixa Marginal Direita',
    alturaVegetacaoCm: 47,
    nivelArtesp: 3,
    ultimoLevantamento: '2025-05-28T08:14:00Z',
    diasSemRocada: 38,
    lat: -23.7421, lng: -46.5812,
    restricaoAmbiental: true,
    especieEmRestricao: 'Turdus rufiventris (Sabiá-laranjeira)',
  },
  {
    id: 'trecho_002',
    kmInicial: 23.5, kmFinal: 24.0,
    faixa: 'Canteiro Central Externo',
    alturaVegetacaoCm: 22,
    nivelArtesp: 2,
    ultimoLevantamento: '2025-05-30T10:45:00Z',
    diasSemRocada: 21,
    lat: -23.7445, lng: -46.5834,
    restricaoAmbiental: false,
  },
  {
    id: 'trecho_003',
    kmInicial: 24.0, kmFinal: 24.5,
    faixa: 'Faixa Marginal Esquerda',
    alturaVegetacaoCm: 11,
    nivelArtesp: 1,
    ultimoLevantamento: '2025-06-01T14:20:00Z',
    diasSemRocada: 8,
    lat: -23.7468, lng: -46.5856,
    restricaoAmbiental: false,
  },
  {
    id: 'trecho_004',
    kmInicial: 31.0, kmFinal: 31.5,
    faixa: 'Faixa Marginal Direita',
    alturaVegetacaoCm: 52,
    nivelArtesp: 3,
    ultimoLevantamento: '2025-05-25T09:00:00Z',
    diasSemRocada: 44,
    lat: -23.7920, lng: -46.6201,
    restricaoAmbiental: false,
  },
  {
    id: 'trecho_005',
    kmInicial: 31.5, kmFinal: 32.0,
    faixa: 'Canteiro Central Interno',
    alturaVegetacaoCm: 34,
    nivelArtesp: 3,
    ultimoLevantamento: '2025-05-26T11:30:00Z',
    diasSemRocada: 41,
    lat: -23.7944, lng: -46.6225,
    restricaoAmbiental: true,
    especieEmRestricao: 'Bothrops jararaca (Jararaca)',
  },
  {
    id: 'trecho_006',
    kmInicial: 45.0, kmFinal: 45.5,
    faixa: 'Faixa Marginal Esquerda',
    alturaVegetacaoCm: 18,
    nivelArtesp: 2,
    ultimoLevantamento: '2025-06-02T16:10:00Z',
    diasSemRocada: 15,
    lat: -23.8650, lng: -46.7010,
    restricaoAmbiental: false,
  },
  {
    id: 'trecho_007',
    kmInicial: 58.0, kmFinal: 58.5,
    faixa: 'Faixa Marginal Direita',
    alturaVegetacaoCm: 8,
    nivelArtesp: 1,
    ultimoLevantamento: '2025-06-03T07:50:00Z',
    diasSemRocada: 5,
    lat: -23.9310, lng: -46.7580,
    restricaoAmbiental: false,
  },
  {
    id: 'trecho_008',
    kmInicial: 62.0, kmFinal: 62.5,
    faixa: 'Canteiro Central Externo',
    alturaVegetacaoCm: 41,
    nivelArtesp: 3,
    ultimoLevantamento: '2025-05-27T13:00:00Z',
    diasSemRocada: 35,
    lat: -23.9680, lng: -46.7900,
    restricaoAmbiental: false,
  },
];

// ─── ORDENS DE SERVIÇO ──────────────────────────────────────
export interface OrdemServico {
  id: string;
  numero: string;
  trechoId: string;
  kmInicial: number;
  kmFinal: number;
  faixa: FaixaDominio;
  metodo: OSMethod;
  status: OSStatus;
  urgencia: 'normal' | 'urgente' | 'critica';
  prazoHoras: number;
  criadaEm: string;
  motivaBloqueio?: string;
  equipeResponsavel?: string;
  observacoes?: string;
  concluidaEm?: string;
  fotoUri?: string;
  gps?: Gps;
  evidencia?: Evidencia;
  lat?: number;
  lng?: number;
  accuracy?: number;
  concluidaPor?: string;
}

export const mockOrdens: OrdemServico[] = [
  {
    id: 'os_001',
    numero: 'OS-2025-0847',
    trechoId: 'trecho_004',
    kmInicial: 31.0, kmFinal: 31.5,
    faixa: 'Faixa Marginal Direita',
    metodo: 'mecanizada',
    status: 'pendente',
    urgencia: 'critica',
    prazoHoras: 48,
    criadaEm: '2025-06-03T08:00:00Z',
    equipeResponsavel: 'Equipe Ômega : Roçada Mecânica',
    observacoes: 'Vegetação de 52 cm, nível 3 no critério simulado. Conferir sinalização no KM 31,3.',
  },
  {
    id: 'os_002',
    numero: 'OS-2025-0848',
    trechoId: 'trecho_005',
    kmInicial: 31.5, kmFinal: 32.0,
    faixa: 'Canteiro Central Interno',
    metodo: 'manual_seletiva',
    status: 'bloqueada',
    urgencia: 'critica',
    prazoHoras: 48,
    criadaEm: '2025-06-03T08:05:00Z',
    motivaBloqueio: 'Regra fictícia ativa em junho: execução mecanizada indisponível. A ordem manual aguarda liberação explícita para início.',
    equipeResponsavel: 'Equipe Alfa : Roçada Manual',
  },
  {
    id: 'os_003',
    numero: 'OS-2025-0831',
    trechoId: 'trecho_001',
    kmInicial: 23.0, kmFinal: 23.5,
    faixa: 'Faixa Marginal Direita',
    metodo: 'manual_seletiva',
    status: 'em_execucao',
    urgencia: 'critica',
    prazoHoras: 48,
    criadaEm: '2025-05-29T07:30:00Z',
    equipeResponsavel: 'Equipe Beta : Roçada Manual',
    observacoes: 'Método manual definido para esta ordem demonstrativa. O calendário simula restrição entre agosto e dezembro.',
  },
  {
    id: 'os_004',
    numero: 'OS-2025-0802',
    trechoId: 'trecho_008',
    kmInicial: 62.0, kmFinal: 62.5,
    faixa: 'Canteiro Central Externo',
    metodo: 'mecanizada',
    status: 'pendente',
    urgencia: 'urgente',
    prazoHoras: 72,
    criadaEm: '2025-06-01T10:00:00Z',
    equipeResponsavel: 'Equipe Ômega : Roçada Mecânica',
  },
  {
    id: 'os_005',
    numero: 'OS-2025-0788',
    trechoId: 'trecho_002',
    kmInicial: 23.5, kmFinal: 24.0,
    faixa: 'Canteiro Central Externo',
    metodo: 'mecanizada',
    status: 'concluida',
    urgencia: 'normal',
    prazoHoras: 120,
    criadaEm: '2025-05-15T09:00:00Z',
    equipeResponsavel: 'Equipe Ômega : Roçada Mecânica',
  },
];

// ─── CALENDÁRIO DE FAUNA ────────────────────────────────────
export interface EspecieRestricao {
  id: string;
  nome: string;
  nomePopular: string;
  periodoRestricao: string;
  mesInicio: number;
  mesFim: number;
  tipoRestricao: string;
  kmAfetados: string;
  nivelRisco: 'alto' | 'medio';
  meses?: number[];
  trechoIds?: string[];
}

export const mockFauna: EspecieRestricao[] = [
  {
    id: 'fauna_001',
    nome: 'Turdus rufiventris',
    nomePopular: 'Sabiá-laranjeira',
    periodoRestricao: 'Agosto a Dezembro',
    mesInicio: 8, mesFim: 12,
    tipoRestricao: 'Regra do protótipo: execução mecanizada indisponível no período. Usar método manual seletivo.',
    kmAfetados: 'KM 23,0 a 23,5',
    nivelRisco: 'alto',
    meses: [8, 9, 10, 11, 12],
    trechoIds: ['trecho_001'],
  },
  {
    id: 'fauna_002',
    nome: 'Bothrops jararaca',
    nomePopular: 'Jararaca',
    periodoRestricao: 'Março a Junho (acasalamento) e Outubro a Novembro (filhotes)',
    mesInicio: 3, mesFim: 6,
    tipoRestricao: 'Regra do protótipo: execução mecanizada indisponível no período. Usar método manual seletivo.',
    kmAfetados: 'KM 31,5 a 32,0',
    nivelRisco: 'alto',
    meses: [3, 4, 5, 6, 10, 11],
    trechoIds: ['trecho_005'],
  },
  {
    id: 'fauna_003',
    nome: 'Didelphis albiventris',
    nomePopular: 'Gambá-de-orelha-branca',
    periodoRestricao: 'Janeiro a Março (lactação)',
    mesInicio: 1, mesFim: 3,
    tipoRestricao: 'Regra do protótipo: execução mecanizada indisponível no período. Usar método manual seletivo.',
    kmAfetados: 'KM 45,0 a 45,5',
    nivelRisco: 'medio',
    meses: [1, 2, 3],
    trechoIds: ['trecho_006'],
  },
];

// ─── HISTÓRICO DE LEVANTAMENTOS ─────────────────────────────
export interface Levantamento {
  id: string;
  trechoId: string;
  kmInicial: number;
  kmFinal: number;
  faixa: FaixaDominio;
  alturaVegetacaoCm: number;
  nivelArtesp: SeverityLevel;
  dataRegistro: string;
  tecnicoNome: string;
  lat: number;
  lng: number;
  temFoto: boolean;
  observacoes?: string;
  fotoUri?: string;
  gps?: Gps;
  evidencia?: Evidencia;
  accuracy?: number;
}

export const mockHistoricoLevantamentos: Levantamento[] = [
  {
    id: 'lev_001', trechoId: 'trecho_001',
    kmInicial: 23.0, kmFinal: 23.5,
    faixa: 'Faixa Marginal Direita',
    alturaVegetacaoCm: 47, nivelArtesp: 3,
    dataRegistro: '2025-05-28T08:14:00Z',
    tecnicoNome: 'João Moreira', lat: -23.7421, lng: -46.5812,
    temFoto: false,
    observacoes: 'Vegetação densa próxima à placa de sinalização de velocidade. Visibilidade comprometida.',
  },
  {
    id: 'lev_002', trechoId: 'trecho_001',
    kmInicial: 23.0, kmFinal: 23.5,
    faixa: 'Faixa Marginal Direita',
    alturaVegetacaoCm: 31, nivelArtesp: 3,
    dataRegistro: '2025-04-30T09:00:00Z',
    tecnicoNome: 'João Moreira', lat: -23.7421, lng: -46.5812,
    temFoto: false,
  },
  {
    id: 'lev_003', trechoId: 'trecho_001',
    kmInicial: 23.0, kmFinal: 23.5,
    faixa: 'Faixa Marginal Direita',
    alturaVegetacaoCm: 18, nivelArtesp: 2,
    dataRegistro: '2025-03-28T07:45:00Z',
    tecnicoNome: 'Carlos Rocha (Cadú)', lat: -23.7421, lng: -46.5812,
    temFoto: false,
  },
];

// ─── RESUMO DASHBOARD ───────────────────────────────────────
export const mockDashboardStats = {
  totalTrechos: mockTrechos.length,
  nivel3Critico: mockTrechos.filter(t => t.nivelArtesp === 3).length,
  nivel2Atencao: mockTrechos.filter(t => t.nivelArtesp === 2).length,
  nivel1Ok: mockTrechos.filter(t => t.nivelArtesp === 1).length,
  osAbertas: mockOrdens.filter(o => o.status !== 'concluida').length,
  osUrgentes: mockOrdens.filter(o => o.urgencia === 'critica' && o.status !== 'concluida').length,
  restricoesAtivas: mockTrechos.filter(t => t.restricaoAmbiental).length,
  ultimaAtualizacao: '2025-06-04T06:30:00Z',
};
