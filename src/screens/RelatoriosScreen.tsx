import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatarDataHora, useAppStore } from '../store/AppContext';
import { AppIcon, Card, Content, DemoBadge, LabelValue, MessageBanner, Page, PrimaryButton, ScreenHeader, SectionHeader, StatePanel, StatusBadge } from '../components';
import { BorderRadius, Colors, Spacing, Typography } from '../utils/theme';
import { exportReport } from '../services/reports';

export default function RelatoriosScreen({ navigation }: { navigation: any }) {
  const { state } = useAppStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string; target?: string } | null>(null);
  const completed = state.ordens.filter(item => item.status === 'concluida');
  const exportPdf = async (orderId?: string) => { setMessage(null); setExporting(orderId || 'all'); try { await exportReport(state, orderId); setMessage({ target: orderId, tone: 'success', text: 'Relatório preparado. Use o diálogo do dispositivo para salvar ou compartilhar o PDF.' }); } catch (err) { setMessage({ target: orderId, tone: 'error', text: err instanceof Error ? err.message : 'Não foi possível exportar o relatório.' }); } finally { setExporting(null); } };
  return (
    <Page>
      <ScreenHeader title="Relatórios" subtitle="Resumo do contexto visível" onBack={() => navigation.goBack()} right={<DemoBadge label="PDF demonstrativo" />} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Content style={styles.content}>
        <MessageBanner tone="warning" title="Documento acadêmico" message="O PDF usa trechos e regras ambientais fictícios e identifica a origem do GPS e das fotos. Ele não comprova conformidade regulatória." />
        <View style={styles.summaryGrid}><Card style={styles.summaryCard}><AppIcon name="checkmark-done-outline" color={Colors.success} /><Text style={styles.summaryValue}>{completed.length}</Text><Text style={styles.summaryLabel}>OS concluídas</Text></Card><Card style={styles.summaryCard}><AppIcon name="map-outline" color={Colors.primary} /><Text style={styles.summaryValue}>{state.trechos.length}</Text><Text style={styles.summaryLabel}>Trechos no recorte</Text></Card><Card style={styles.summaryCard}><AppIcon name="resize-outline" color={Colors.info} /><Text style={styles.summaryValue}>{state.levantamentos.length}</Text><Text style={styles.summaryLabel}>Levantamentos</Text></Card></View>
        <Card><SectionHeader title="Contexto do relatório" /><LabelValue label="Responsável" value={state.user?.nome || 'Sessão não identificada'} /><LabelValue label="Intervalo" value={`KM ${state.config.kmInicial} a ${state.config.kmFinal}`} /><LabelValue label="Mês simulado" value={String(state.config.mes).padStart(2, '0')} /><LabelValue label="Fonte" value="Mocks locais da Sprint 3" /></Card>
        <PrimaryButton label="Exportar relatório consolidado" icon="download-outline" onPress={() => exportPdf()} loading={exporting === 'all'} disabled={!completed.length || !!exporting} />
        {message && !message.target ? <MessageBanner tone={message.tone} message={message.text} /> : null}
        {!completed.length ? <StatePanel icon="document-outline" title="Nenhuma OS concluída para exportar" message="Conclua uma ordem em execução ou restaure o cenário normal para habilitar o relatório." /> : <View><SectionHeader title="Relatórios individuais" subtitle="Ordens concluídas no recorte atual" /><View style={styles.list}>{completed.map(order => <Card key={order.id}><View style={styles.order}><View style={styles.orderCopy}><View style={styles.orderTop}><Text style={styles.orderNumber}>{order.numero}</Text><StatusBadge status={order.status} /></View><Text style={styles.orderMeta}>KM {order.kmInicial.toFixed(1)} a {order.kmFinal.toFixed(1)} · {order.faixa}</Text><Text style={styles.orderMeta}>{(order as any).concluidaEm ? `Concluída em ${formatarDataHora((order as any).concluidaEm)}` : 'Registro histórico da base demonstrativa'}</Text></View><PrimaryButton compact label="PDF" icon="document-text-outline" variant="outline" onPress={() => exportPdf(order.id)} loading={exporting === order.id} disabled={!!exporting && exporting !== order.id} /></View>{message?.target === order.id ? <MessageBanner tone={message.tone} message={message.text} /> : null}</Card>)}</View></View>}
      </Content></ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxxl }, content: { gap: Spacing.xl }, summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, summaryCard: { flex: 1, minWidth: 120, minHeight: 126, alignItems: 'center', justifyContent: 'center', gap: 4 }, summaryValue: { color: Colors.textPrimary, fontSize: Typography.size.xxl, fontWeight: Typography.weight.extrabold }, summaryLabel: { color: Colors.textTertiary, fontSize: Typography.size.xs, textAlign: 'center' }, list: { gap: Spacing.sm }, order: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, orderCopy: { flex: 1 }, orderTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm }, orderNumber: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.mono, fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold }, orderMeta: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 3 },
});
