import { demoPhotoUri } from './demoEvidence';
import { buildReportHtml, ReportState } from './reportContent';

export async function exportReport(state: ReportState, orderId?: string): Promise<void> {
  const images = Object.fromEntries(state.ordens.filter(o => o.fotoUri).map(o => [o.id, o.evidencia?.origem === 'dispositivo' ? o.evidencia.uri : demoPhotoUri]));
  const html = buildReportHtml(state, orderId, images);
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('O navegador bloqueou a janela do relatório. Permita pop-ups locais e tente novamente.');
  preview.onload = () => { preview.focus(); preview.print(); };
  preview.document.write(html);
  preview.document.close();
}
