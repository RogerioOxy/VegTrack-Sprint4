import { normalizarEvidencia, normalizarGps, origemValida } from './capture';
import type { Source } from './engine';
import { calcularNivelArtesp } from './rules';

type Row = Record<string, unknown>;
const object = (v: unknown): v is Row => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const positive = (v: unknown): boolean => finite(v) && v > 0;
const month = (v: unknown): boolean => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 12;
const date = (v: unknown): boolean => text(v) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 19) === v.slice(0, 19);
const optional = (r: Row, key: string, check: (value: unknown) => boolean): boolean => r[key] === undefined || check(r[key]);
const strings = (r: Row, keys: string[]) => keys.every(key => text(r[key]));
const range = (r: Row) => finite(r.kmInicial) && finite(r.kmFinal) && r.kmInicial >= 0 && r.kmInicial < r.kmFinal;
const gps = (r: Row) => finite(r.lat) && Math.abs(r.lat) <= 90 && finite(r.lng) && Math.abs(r.lng) <= 180;
const level = (r: Row) => finite(r.alturaVegetacaoCm) && r.alturaVegetacaoCm >= 0 && r.nivelArtesp === calcularNivelArtesp(r.alturaVegetacaoCm);
const faixa = (r: Row) => ['Canteiro Central Externo', 'Canteiro Central Interno', 'Faixa Marginal Direita', 'Faixa Marginal Esquerda'].includes(String(r.faixa));
function rows(value: unknown, check: (r: Row) => boolean): value is Row[] {
  return Array.isArray(value) && value.every(r => object(r) && text(r.id) && check(r)) && new Set(value.map(r => r.id)).size === value.length;
}

// Campos novos são opcionais apenas para ler os registros da Sprint 3.
function captura(r: Row): boolean {
  try {
    if (r.gps !== undefined) {
      if (!object(r.gps)) return false;
      const g = r.gps;
      if (!origemValida(g.origem) || !finite(g.lat) || !finite(g.lng) || !finite(g.accuracy)) return false;
      const normalized = normalizarGps({ latitude: g.lat, longitude: g.lng, accuracy: g.accuracy }, g.origem);
      if (normalized.lat !== r.lat || normalized.lng !== r.lng || normalized.accuracy !== r.accuracy) return false;
    }
    if (r.evidencia !== undefined) {
      if (!object(r.evidencia) || !text(r.evidencia.uri)) return false;
      if (!origemValida(r.evidencia.origem)) return false;
      const e = normalizarEvidencia(r.evidencia.uri, r.evidencia.origem);
      if (e.uri !== r.fotoUri || r.temFoto === false) return false;
    }
    return true;
  } catch { return false; }
}

// Validar antes de publicar evita falhas tardias nas telas ou gravação sobre dados inválidos.
export function validarFonte(value: unknown): asserts value is Source {
  const fail = () => { throw new Error('Os dados locais estão incompletos ou inválidos. Tente novamente ou restaure a demonstração.'); };
  if (!object(value)) return fail();
  const { trechos, ordens, levantamentos, fauna, notifications, audit, config, pendingSync } = value;
  if (!object(config) || !range(config) || Number(config.kmInicial) < 23 || Number(config.kmFinal) > 67 || !month(config.mes) || !Number.isSafeInteger(pendingSync) || Number(pendingSync) < 0) return fail();
  if (!rows(trechos, r => range(r) && faixa(r) && gps(r) && level(r) && date(r.ultimoLevantamento) && finite(r.diasSemRocada) && r.diasSemRocada >= 0 && typeof r.restricaoAmbiental === 'boolean' && optional(r, 'especieEmRestricao', text))) return fail();
  const byId = new Map(trechos.map(t => [t.id, t]));
  const linked = (r: Row) => { const t = byId.get(r.trechoId); return Boolean(t && r.kmInicial === t.kmInicial && r.kmFinal === t.kmFinal && r.faixa === t.faixa); };
  if (!rows(ordens, r => strings(r, ['numero', 'trechoId']) && linked(r) && captura(r) && ['mecanizada', 'manual_seletiva'].includes(String(r.metodo)) && ['pendente', 'em_execucao', 'concluida', 'bloqueada'].includes(String(r.status)) && ['normal', 'urgente', 'critica'].includes(String(r.urgencia)) && positive(r.prazoHoras) && date(r.criadaEm) && optional(r, 'concluidaEm', date) && ['motivaBloqueio', 'equipeResponsavel', 'observacoes', 'fotoUri', 'concluidaPor'].every(k => optional(r, k, text)) && optional(r, 'lat', v => finite(v) && Math.abs(v) <= 90) && optional(r, 'lng', v => finite(v) && Math.abs(v) <= 180) && optional(r, 'accuracy', positive))) return fail();
  if (new Set(ordens.map(o => o.numero)).size !== ordens.length) return fail();
  const open = ordens.filter(o => o.status !== 'concluida');
  if (new Set(open.map(o => o.trechoId)).size !== open.length) return fail();
  if (!rows(levantamentos, r => linked(r) && captura(r) && level(r) && gps(r) && date(r.dataRegistro) && text(r.tecnicoNome) && typeof r.temFoto === 'boolean' && optional(r, 'accuracy', positive) && optional(r, 'fotoUri', text) && optional(r, 'observacoes', text))) return fail();
  if (!rows(fauna, r => strings(r, ['nome', 'nomePopular', 'periodoRestricao', 'tipoRestricao', 'kmAfetados']) && month(r.mesInicio) && month(r.mesFim) && ['alto', 'medio'].includes(String(r.nivelRisco)) && optional(r, 'meses', v => Array.isArray(v) && v.length > 0 && v.every(month)) && optional(r, 'trechoIds', v => Array.isArray(v) && v.every(id => text(id) && byId.has(id))))) return fail();
  if (!rows(notifications, r => strings(r, ['titulo', 'mensagem', 'trechoId']) && byId.has(r.trechoId) && typeof r.lida === 'boolean')) return fail();
  if (!rows(audit, r => strings(r, ['acao', 'usuario', 'detalhe']) && date(r.data))) return fail();
}
