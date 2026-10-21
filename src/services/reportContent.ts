import type { OrdemServico, Levantamento, Trecho } from '../utils/mockData';
import { formatarDecimal, origemDoRegistro, rotuloFoto, rotuloGps } from '../domain/capture';

export interface ReportState {
  user: { nome: string } | null;
  config: { kmInicial: number; kmFinal: number; mes: number };
  ordens: OrdemServico[];
  levantamentos: Levantamento[];
  trechos: Trecho[];
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));
}

export function buildReportHtml(state: ReportState, orderId?: string, images: Record<string, string> = {}): string {
  const orders = state.ordens.filter(o => o.status === 'concluida' && (!orderId || o.id === orderId));
  if (!state.user) throw new Error('Entre na conta de demonstração para exportar.');
  if (!orders.length) throw new Error('Não há ordens concluídas neste recorte para exportar.');
  const h = escapeHtml;
  const details = orders.map(order => {
    const o = order;
    const gps = o.gps ?? o;
    const evidence = images[o.id];
    const photo = o.fotoUri && evidence ? `<img class="evidence" src="${h(evidence)}" alt="${rotuloFoto(o.evidencia)}"><p>${origemDoRegistro(o.evidencia) === 'dispositivo' ? 'Foto capturada no dispositivo e salva no armazenamento do app.' : 'Foto de exemplo: Jcomeau ictx. Não foi capturada pelo grupo e não corresponde ao trecho ou GPS do protótipo. <a href="https://commons.wikimedia.org/wiki/File:Another_view_of_the_roadside_vegetation.JPG">Fonte: Wikimedia Commons</a>. <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>. Original sem alterações.'}</p>` : `<p>${o.fotoUri ? `${rotuloFoto(o.evidencia)}: imagem indisponível nesta exportação.` : 'Sem anexo fotográfico neste registro histórico.'}</p>`;
    return `<section><h2>${h(o.numero)}</h2><p>KM ${h(o.kmInicial)} a ${h(o.kmFinal)} | ${h(o.faixa)}</p><table><tr><th>Método</th><td>${o.metodo === 'manual_seletiva' ? 'Roçada manual seletiva' : 'Roçada mecanizada'}</td></tr><tr><th>Conclusão</th><td>${h(o.concluidaEm ? new Date(o.concluidaEm).toLocaleString('pt-BR') : 'Registro histórico da base demonstrativa')}</td></tr><tr><th>Responsável</th><td>${h(o.concluidaPor ?? o.equipeResponsavel)}</td></tr><tr><th>${rotuloGps(o.gps)}</th><td>${h(formatarDecimal(gps.lat, 6))} / ${h(formatarDecimal(gps.lng, 6))} | precisão: ${h(formatarDecimal(gps.accuracy, 1))} m</td></tr></table><p>${h(o.observacoes)}</p>${photo}</section>`;
  }).join('');
  const history = state.levantamentos.filter(l => orders.some(o => o.trechoId === l.trechoId)).map(l => `<tr><td>${h(l.kmInicial)} a ${h(l.kmFinal)}</td><td>${h(l.alturaVegetacaoCm)} cm</td><td>${h(new Date(l.dataRegistro).toLocaleString('pt-BR'))}</td><td>${h(l.tecnicoNome)}</td></tr>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>VegTrack | Relatório demonstrativo</title><style>@page{size:A4;margin:12mm}body{font:12px Arial,sans-serif;color:#18332a;line-height:1.4}h1{font-size:24px;color:#14532d}h2{font-size:16px}header{border-bottom:3px solid #15803d}aside{background:#fff7ed;padding:9px;border-left:4px solid #b45309}table{border-collapse:collapse;width:100%}td,th{text-align:left;border:1px solid #d5dfd9;padding:6px}section{margin-top:16px;break-inside:avoid}.evidence{max-width:100%;width:280px;max-height:200px;object-fit:contain;margin-top:8px}p{margin:8px 0}footer{font-size:10px;color:#475569;break-inside:avoid}</style></head><body><header><h1>VegTrack</h1><p>Relatório demonstrativo de intervenções</p></header><aside>Protótipo acadêmico com dados fictícios. Este documento não comprova conformidade regulatória.</aside><p>Emitido por ${h(state.user.nome)} em ${h(new Date().toLocaleString('pt-BR'))}. Contexto gerenciado: KM ${h(state.config.kmInicial)} a ${h(state.config.kmFinal)}. Mês simulado: ${h(state.config.mes)}.</p><p>Ordens concluídas no recorte: ${orders.length}. Trechos no recorte: ${state.trechos.length}. Período dos registros: ${h(orders.map(o => o.criadaEm.slice(0,10)).sort()[0])} a ${h(new Date().toISOString().slice(0,10))}.</p>${details}<h2>Histórico de levantamentos relacionados</h2>${history ? `<table><thead><tr><th>Trecho</th><th>Altura</th><th>Registro</th><th>Técnico</th></tr></thead><tbody>${history}</tbody></table>` : '<p>Nenhum levantamento relacionado neste recorte.</p>'}<footer><p>Challenge Motiva | FIAP | Sprint 4. A origem do GPS e de cada foto está indicada no registro. Regras ambientais e contexto operacional são demonstrativos.</p></footer></body></html>`;
}
