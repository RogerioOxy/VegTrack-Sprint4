import { rotuloFoto, rotuloGps, origemDoRegistro } from '../domain/capture';
import PhotoCredit from '../components/PhotoCredit';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore, formatarDataHora } from '../store/AppContext';
import { AppIcon, Card, Content, LabelValue, MessageBanner, Page, Pill, PrimaryButton, ScreenHeader, SectionHeader, StatePanel, StatusBadge } from '../components';
import { BorderRadius, Colors, Spacing, Typography } from '../utils/theme';
import { OrdemServico } from '../utils/mockData';
import { exportReport } from '../services/reports';

type DetailedOrder = OrdemServico & { concluidaEm?: string; fotoUri?: string; lat?: number; lng?: number; accuracy?: number; concluidaPor?: string };

const statusLabel = (status: OrdemServico['status']) => ({ pendente: 'Pendente', em_execucao: 'Em execução', concluida: 'Concluída', bloqueada: 'Bloqueada' }[status]);
const urgencyLabel = (urgency: OrdemServico['urgencia']) => ({ normal: 'Normal', urgente: 'Urgente', critica: 'Crítica' }[urgency]);
const auditLabel = (action: string) => ({
  ordem_criada: 'Ordem criada', ordem_iniciada: 'Ordem iniciada', ordem_concluida: 'Ordem concluída',
  ordem_escalada: 'Urgência escalada', levantamento_registrado: 'Levantamento registrado',
  notificacao_lida: 'Notificação lida', configuracao_alterada: 'Configuração alterada',
}[action] || action.replace(/_/g, ' ').replace(/^./, letter => letter.toUpperCase()));

export default function DetalheOrdemScreen({ navigation, route }: { navigation: any; route: any }) {
  const { state, startOrder, escalateOrder, busy } = useAppStore();
  const order = state.ordens.find(item => item.id === route.params?.orderId) as DetailedOrder | undefined;
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  useFocusEffect(React.useCallback(() => {
    setMessage(null);
  }, []));
  if (!order) return <Page><ScreenHeader title="Detalhe da ordem" onBack={() => navigation.goBack()} /><Content><StatePanel icon="clipboard-outline" title="Ordem não encontrada" message="O cenário ou o intervalo gerenciado pode ter mudado." actionLabel="Voltar às ordens" onAction={() => navigation.navigate('Main', { screen: 'OrdensTab' })} /></Content></Page>;

  const related = state.levantamentos.filter(item => item.trechoId === order.trechoId).sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro));
  const audits = state.audit.filter(item => item.detalhe.includes(order.id) || item.detalhe.includes(order.numero));
  const run = async (action: () => Promise<void>, success: string) => { setMessage(null); try { await action(); setMessage({ tone: 'success', text: success }); } catch (err) { setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'A operação não foi concluída.' }); } };
  const handleExport = async () => { setMessage(null); setExporting(true); try { await exportReport(state, order.id); setMessage({ tone: 'success', text: 'Relatório preparado para compartilhamento.' }); } catch (err) { setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Não foi possível exportar o relatório.' }); } finally { setExporting(false); } };

  return (
    <Page>
      <ScreenHeader title={order.numero} subtitle={`KM ${order.kmInicial.toFixed(1)} a ${order.kmFinal.toFixed(1)} · ${order.faixa}`} onBack={() => navigation.goBack()} right={<StatusBadge status={order.status} />} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Content form style={styles.content}>
        {message ? <MessageBanner tone={message.tone} message={message.text} /> : null}
        {order.status === 'bloqueada' && order.motivaBloqueio ? <MessageBanner tone="warning" title="Restrição ambiental" message={order.motivaBloqueio} /> : null}
        <Card><View style={styles.heroRow}><View style={styles.methodIcon}><AppIcon name={order.metodo === 'mecanizada' ? 'cog-outline' : 'hand-left-outline'} size={28} color={Colors.primary} /></View><View style={styles.heroCopy}><Text style={styles.method}>{order.metodo === 'mecanizada' ? 'Roçada mecanizada' : 'Roçada manual seletiva'}</Text><Text style={styles.team}>{order.equipeResponsavel || 'Equipe ainda não atribuída'}</Text></View><Pill label={`${order.prazoHoras} h`} tone={order.urgencia === 'critica' ? 'red' : order.urgencia === 'urgente' ? 'amber' : 'neutral'} icon="time-outline" /></View></Card>
        <Card><SectionHeader title="Dados da ordem" /><LabelValue label="Status" value={statusLabel(order.status)} /><LabelValue label="Urgência" value={urgencyLabel(order.urgencia)} /><LabelValue label="Emitida em" value={formatarDataHora(order.criadaEm)} />{order.concluidaEm ? <LabelValue label="Concluída em" value={formatarDataHora(order.concluidaEm)} /> : null}{order.concluidaPor ? <LabelValue label="Responsável pela conclusão" value={order.concluidaPor} /> : null}{order.observacoes ? <View style={styles.notes}><Text style={styles.notesLabel}>Observações</Text><Text style={styles.notesText}>{order.observacoes}</Text></View> : null}</Card>

        {order.status === 'concluida' ? <Card><SectionHeader title="Evidência de conclusão" subtitle="Origem da evidência e localização registradas" />{order.fotoUri ? <><Image source={{ uri: order.fotoUri }} style={styles.photo} resizeMode="contain" /><Text>{rotuloFoto(order.evidencia)}</Text>{origemDoRegistro(order.evidencia) === 'demonstracao' ? <PhotoCredit /> : null}</> : <MessageBanner message="Este registro histórico não possui anexo fotográfico no mock original." />}{typeof order.lat === 'number' ? <LabelValue label={rotuloGps(order.gps)} value={`${order.lat.toFixed(5)}, ${order.lng?.toFixed(5)} · ±${order.accuracy?.toFixed(1)} m`} /> : null}</Card> : null}

        <View style={styles.actions}>
          {state.user?.perfil !== 'gestor' && (order.status === 'pendente' || order.status === 'bloqueada') ? <PrimaryButton label={order.status === 'bloqueada' ? 'Iniciar método manual' : 'Iniciar execução'} icon="play-circle-outline" loading={busy} onPress={() => run(() => startOrder(order.id), 'Execução iniciada e registrada na auditoria.')} /> : null}
          {state.user?.perfil !== 'gestor' && order.status === 'em_execucao' ? <PrimaryButton label="Registrar conclusão" icon="checkmark-done-outline" onPress={() => navigation.navigate('Conclusao', { orderId: order.id })} /> : null}
          {state.user?.perfil === 'supervisor' && order.status !== 'concluida' && order.urgencia !== 'critica' ? <PrimaryButton label="Escalar urgência" icon="arrow-up-circle-outline" variant="outline" loading={busy} onPress={() => run(() => escalateOrder(order.id), 'Urgência escalada sem alterar o status operacional.')} /> : null}
          {order.status === 'concluida' ? <PrimaryButton label="Exportar relatório desta OS" icon="download-outline" variant="outline" loading={exporting} onPress={handleExport} /> : null}
        </View>

        <View><SectionHeader title="Levantamentos relacionados" subtitle={`${related.length} registro(s)`} />{related.slice(0, 5).map(item => <Card key={item.id} style={styles.related}><View><Text style={styles.relatedValue}>{item.alturaVegetacaoCm} cm · Nível {item.nivelArtesp}</Text><Text style={styles.relatedMeta}>{formatarDataHora(item.dataRegistro)} · {item.tecnicoNome}</Text></View><AppIcon name="image-outline" color={item.temFoto ? Colors.primary : Colors.textTertiary} /></Card>)}{!related.length ? <Text style={styles.emptyText}>Nenhum levantamento relacionado.</Text> : null}</View>
        <View><SectionHeader title="Trilha de auditoria" subtitle="Eventos visíveis deste fluxo" />{audits.slice(0, 6).map(item => <View key={item.id} style={styles.audit}><View style={styles.auditDot} /><View style={styles.auditCopy}><Text style={styles.auditAction}>{auditLabel(item.acao)}</Text><Text style={styles.auditMeta}>{formatarDataHora(item.data)} · {item.usuario}</Text><Text style={styles.auditDetail}>{item.detalhe}</Text></View></View>)}{!audits.length ? <Text style={styles.emptyText}>Nenhum evento específico encontrado para esta OS.</Text> : null}</View>
      </Content></ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxxl }, content: { gap: Spacing.xl }, heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, methodIcon: { width: 54, height: 54, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }, heroCopy: { flex: 1 }, method: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold }, team: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 3 }, notes: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.md }, notesLabel: { color: Colors.textTertiary, fontSize: Typography.size.xs, fontWeight: Typography.weight.bold }, notesText: { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 21, marginTop: 4 }, photo: { width: '100%', height: 230, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceElevated }, actions: { gap: Spacing.sm }, related: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }, relatedValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: Typography.weight.bold }, relatedMeta: { color: Colors.textTertiary, fontSize: Typography.size.xs, marginTop: 3 }, emptyText: { color: Colors.textTertiary, fontSize: Typography.size.sm }, audit: { flexDirection: 'row', gap: Spacing.md, paddingBottom: Spacing.md }, auditDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 5 }, auditCopy: { flex: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md }, auditAction: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: Typography.weight.bold }, auditMeta: { color: Colors.textTertiary, fontSize: Typography.size.xs, marginTop: 2 }, auditDetail: { color: Colors.textSecondary, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 4 },
});
