import { EspecieRestricao, OrdemServico, SeverityLevel, Trecho } from '../utils/mockData';

export type Perfil = 'supervisor' | 'tecnico' | 'gestor';

export interface UserSession {
  nome: string;
  apelido: string;
  perfil: Perfil;
  rodovia: string;
  trechoGerenciado: { kmInicial: number; kmFinal: number };
}

export function calcularNivelArtesp(alturaCm: number): SeverityLevel {
  if (!Number.isFinite(alturaCm) || alturaCm < 0) throw new Error('A altura da vegetação deve ser um número válido.');
  if (alturaCm < 15) return 1;
  if (alturaCm < 30) return 2;
  return 3;
}

export function faixaContida(trecho: Trecho, config: { kmInicial: number; kmFinal: number }): boolean {
  return trecho.kmInicial >= config.kmInicial && trecho.kmFinal <= config.kmFinal;
}

export function restricaoAtiva(especie: EspecieRestricao, mes: number, trechoId?: string): boolean {
  const meses = especie.meses ?? mesesEntre(especie.mesInicio, especie.mesFim);
  const periodoAtivo = meses.includes(mes);
  const trechoAtivo = !especie.trechoIds?.length || !trechoId || especie.trechoIds.includes(trechoId);
  return periodoAtivo && trechoAtivo;
}

export function mesesEntre(inicio: number, fim: number): number[] {
  if (inicio < 1 || inicio > 12 || fim < 1 || fim > 12) return [];
  if (inicio <= fim) return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  return [...Array.from({ length: 13 - inicio }, (_, i) => inicio + i), ...Array.from({ length: fim }, (_, i) => i + 1)];
}

export function metodoPermitido(
  ordem: Pick<OrdemServico, 'trechoId' | 'metodo'>,
  fauna: EspecieRestricao[],
  mes: number,
): boolean {
  if (ordem.metodo !== 'mecanizada') return true;
  return !fauna.some((especie) => restricaoAtiva(especie, mes, ordem.trechoId));
}

export function exigirPerfil(perfil: Perfil | undefined, permitidos: Perfil[], acao: string): void {
  if (!perfil || !permitidos.includes(perfil)) {
    throw new Error(`O perfil atual não tem autorização para ${acao}.`);
  }
}

export function validarGps(gps: { lat: number; lng: number; accuracy: number }): void {
  if (![gps.lat, gps.lng, gps.accuracy].every(Number.isFinite) || gps.lat < -90 || gps.lat > 90 || gps.lng < -180 || gps.lng > 180 || gps.accuracy <= 0) {
    throw new Error('A evidência de localização é inválida.');
  }
}

export function deveCriarOrdem(nivel: SeverityLevel): boolean { return nivel === 3; }

export function faixaNotificacaoVisivel(trechoId: string, visiveis: Set<string>): boolean { return visiveis.has(trechoId); }

export function atualizarResumo(trechos: Trecho[], ordens: OrdemServico[]) {
  return {
    totalTrechos: trechos.length,
    nivel3Critico: trechos.filter((t) => t.nivelArtesp === 3).length,
    nivel2Atencao: trechos.filter((t) => t.nivelArtesp === 2).length,
    nivel1Ok: trechos.filter((t) => t.nivelArtesp === 1).length,
    osAbertas: ordens.filter((o) => o.status !== 'concluida').length,
    osUrgentes: ordens.filter((o) => o.urgencia === 'critica' && o.status !== 'concluida').length,
    restricoesAtivas: trechos.filter((t) => t.restricaoAmbiental).length,
    ultimaAtualizacao: new Date().toISOString(),
  };
}
