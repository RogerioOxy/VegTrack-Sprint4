import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { demoPhotoAsset } from './demoEvidence';
import { buildReportHtml, ReportState } from './reportContent';
import { origemDoRegistro } from '../domain/capture';

export async function exportReport(state: ReportState, orderId?: string): Promise<void> {
  const images: Record<string, string> = {};
  const orders = state.ordens.filter(o => o.status === 'concluida' && (!orderId || o.id === orderId));
  for (const order of orders) {
    if (!order.fotoUri) continue;
    let local = order.evidencia?.uri ?? order.fotoUri;
    try {
      if (origemDoRegistro(order.evidencia) === 'demonstracao') {
        await demoPhotoAsset.downloadAsync();
        if (!demoPhotoAsset.localUri || !FileSystem.cacheDirectory) throw new Error('Foto de exemplo indisponível.');
        // SDK 51: copyAsync aceita recursos Android sem esquema; a leitura Base64 exige um arquivo.
        local = `${FileSystem.cacheDirectory}vegtrack-foto-exemplo.jpg`;
        await FileSystem.copyAsync({ from: demoPhotoAsset.localUri, to: local });
      }
      const image = await FileSystem.readAsStringAsync(local, { encoding: FileSystem.EncodingType.Base64 });
      images[order.id] = `data:image/jpeg;base64,${image}`;
    } catch { throw new Error(`A foto de ${order.numero} não pôde ser lida. O relatório não foi gerado. Confira o arquivo no dispositivo.`); }
  }
  const html = buildReportHtml(state, orderId, images);
  const file = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (!FileSystem.cacheDirectory) throw new Error('O armazenamento temporário está indisponível.');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const exportUri = `${FileSystem.cacheDirectory}VegTrack_${orderId ? 'ordem' : 'relatorio'}_${stamp}.pdf`;
  await FileSystem.copyAsync({ from: file.uri, to: exportUri });
  if (!await Sharing.isAvailableAsync()) {
    await Print.printAsync({ uri: exportUri });
    return;
  }
  await Sharing.shareAsync(exportUri, { mimeType: 'application/pdf', dialogTitle: 'Relatório VegTrack', UTI: '.pdf' });
}
