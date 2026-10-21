import { formatarDecimal } from '../domain/capture';
import { rotuloFoto, rotuloGps } from '../domain/capture';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore, formatarData, formatarDataHora, nivelColor } from '../store/AppContext';
import { AlertaAmbiental, AppIcon, Card, Content, Divider, LabelValue, NivelBadge, Page, PrimaryButton, ScreenHeader, SectionHeader, StatePanel } from '../components';
import { BorderRadius, Colors, Spacing, Typography } from '../utils/theme';

export default function DetalheTrechoScreen({ navigation, route }: { navigation: any; route: any }) {
  const { state } = useAppStore();
  const trecho = state.trechos.find(item => item.id === route.params?.trechoId);
  if (!trecho) return <Page><ScreenHeader title="Detalhe do trecho" onBack={() => navigation.goBack()} /><Content><StatePanel icon="map-outline" title="Trecho não encontrado" message="O intervalo configurado ou o cenário pode ter mudado." actionLabel="Voltar ao mapa" onAction={() => navigation.navigate('Main', { screen: 'MapaTab' })} /></Content></Page>;

  const history = state.levantamentos.filter(item => item.trechoId === trecho.id).sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro));
  const chart = [...history].reverse();
  const max = Math.max(60, ...chart.map(item => item.alturaVegetacaoCm));
  const relatedOrders = state.ordens.filter(item => item.trechoId === trecho.id);

  return (
    <Page>
      <ScreenHeader title={`KM ${trecho.kmInicial.toFixed(1)} a ${trecho.kmFinal.toFixed(1)}`} subtitle={trecho.faixa} onBack={() => navigation.goBack()} right={<NivelBadge nivel={trecho.nivelArtesp} compact />} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Content style={styles.content}>
        {trecho.restricaoAmbiental && trecho.especieEmRestricao ? <AlertaAmbiental especie={trecho.especieEmRestricao} /> : null}
        <Card><SectionHeader title="Situação atual" subtitle="Dados do último levantamento" /><LabelValue label="Altura da vegetação" value={`${trecho.alturaVegetacaoCm} cm`} /><LabelValue label="Classificação" value={`Nível ${trecho.nivelArtesp}`} valueStyle={{ color: nivelColor(trecho.nivelArtesp) }} /><LabelValue label="Dias sem roçada" value={`${trecho.diasSemRocada} dias`} /><LabelValue label="Última atualização" value={formatarDataHora(trecho.ultimoLevantamento)} /><LabelValue label="Coordenadas fictícias" value={`${formatarDecimal(trecho.lat, 4)}, ${formatarDecimal(trecho.lng, 4)}`} /></Card>

        <Card><SectionHeader title="Tendência da vegetação" subtitle={`${history.length} medição(ões) no histórico visível`} />
          {chart.length ? <><View style={styles.chartLegend}><View style={styles.chartLegendLine} /><Text style={styles.chartLegendText}>Limite demonstrativo do Nível 3: 30 cm</Text></View><View style={styles.chart}><View style={styles.threshold} />{chart.map(item => <View key={item.id} style={styles.barColumn}><View style={styles.barSpace}><Text style={styles.barValue}>{item.alturaVegetacaoCm}</Text><View style={[styles.bar, { height: Math.max(12, (item.alturaVegetacaoCm / max) * 130), backgroundColor: nivelColor(item.nivelArtesp) }]} /></View><Text style={styles.barDate}>{formatarData(item.dataRegistro).slice(0, 5)}</Text></View>)}</View></> : <StatePanel icon="stats-chart-outline" title="Sem histórico para este trecho" message="Um novo levantamento aparecerá aqui depois de registrado." />}
          <Text style={styles.chartNote}>Barras de tendência com base nos mocks locais; não representam telemetria em tempo real.</Text>
        </Card>

        <View><SectionHeader title="Histórico de levantamentos" />{history.length ? <View style={styles.timeline}>{history.map((item, index) => <Card key={item.id} style={styles.historyCard}><View style={styles.historyIcon}><AppIcon name="resize-outline" size={19} color={nivelColor(item.nivelArtesp)} /></View><View style={styles.historyCopy}><View style={styles.historyTop}><Text style={styles.historyHeight}>{item.alturaVegetacaoCm} cm</Text><NivelBadge nivel={item.nivelArtesp} compact /></View><Text style={styles.historyMeta}>{formatarDataHora(item.dataRegistro)} · {item.tecnicoNome}</Text>{item.observacoes ? <Text style={styles.historyNotes}>{item.observacoes}</Text> : null}<Text style={styles.historyEvidence}>{item.temFoto ? rotuloFoto(item.evidencia) : 'Sem evidência fotográfica'}</Text><Text style={styles.historyEvidence}>{rotuloGps(item.gps)}: {formatarDecimal(item.lat, 5)}, {formatarDecimal(item.lng, 5)}</Text></View></Card>)}</View> : <StatePanel icon="time-outline" title="Nenhum levantamento registrado" />}</View>

        <View><SectionHeader title="Ordens relacionadas" subtitle={`${relatedOrders.length} ordem(ns)`} />{relatedOrders.map(order => <Card key={order.id} onPress={() => navigation.navigate('DetalheOrdem', { orderId: order.id })} style={styles.orderRow}><View style={styles.orderCopy}><Text style={styles.orderNumber}>{order.numero}</Text><Text style={styles.orderMeta}>{({ pendente: 'Pendente', em_execucao: 'Em execução', concluida: 'Concluída', bloqueada: 'Bloqueada' }[order.status])} · {order.metodo === 'mecanizada' ? 'Roçada mecanizada' : 'Manual seletiva'}</Text></View><AppIcon name="chevron-forward" color={Colors.primary} /></Card>)}{!relatedOrders.length ? <Text style={styles.none}>Nenhuma ordem associada ao trecho.</Text> : null}</View>
        {state.user?.perfil !== 'gestor' ? <PrimaryButton label="Registrar neste trecho" icon="add-circle-outline" onPress={() => navigation.navigate('Main', { screen: 'RegistrarTab', params: { trechoId: trecho.id } })} /> : null}
      </Content></ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxxl }, content: { gap: Spacing.xl }, chartLegend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }, chartLegendLine: { width: 28, borderTopWidth: 2, borderStyle: 'dashed', borderColor: Colors.nivel3 }, chartLegendText: { flex: 1, color: Colors.nivel3, fontSize: Typography.size.xs, lineHeight: 18, fontWeight: Typography.weight.semibold }, chart: { height: 190, flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderStrong, position: 'relative', paddingTop: Spacing.lg }, threshold: { position: 'absolute', left: 0, right: 0, bottom: 68, borderTopWidth: 1, borderStyle: 'dashed', borderColor: Colors.nivel3 }, barColumn: { flex: 1, alignItems: 'center', minWidth: 44 }, barSpace: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' }, bar: { width: 30, borderTopLeftRadius: 6, borderTopRightRadius: 6 }, barValue: { color: Colors.textSecondary, fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, marginBottom: 3 }, barDate: { color: Colors.textTertiary, fontSize: Typography.size.xs, marginTop: 5 }, chartNote: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18, marginTop: Spacing.md },
  timeline: { gap: Spacing.sm }, historyCard: { flexDirection: 'row', gap: Spacing.md }, historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }, historyCopy: { flex: 1 }, historyTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, alignItems: 'center' }, historyHeight: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold }, historyMeta: { color: Colors.textTertiary, fontSize: Typography.size.xs, marginTop: 4 }, historyNotes: { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20, marginTop: Spacing.sm }, historyEvidence: { color: Colors.primary, fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, marginTop: Spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }, orderCopy: { flex: 1 }, orderNumber: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.mono, fontSize: Typography.size.sm, fontWeight: Typography.weight.extrabold }, orderMeta: { color: Colors.textTertiary, fontSize: Typography.size.xs, marginTop: 3, textTransform: 'capitalize' }, none: { color: Colors.textTertiary, fontSize: Typography.size.sm },
});
