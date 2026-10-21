import EvidenceFields from '../components/EvidenceFields';
import { Evidencia, Gps } from '../domain/capture';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/AppContext';
import { AppIcon, Card, Content, LabelValue, MessageBanner, Page, PrimaryButton, ScreenHeader, SectionHeader, StatePanel } from '../components';
import { BorderRadius, Colors, Spacing, Typography } from '../utils/theme';


export default function ConclusaoScreen({ navigation, route }: { navigation: any; route: any }) {
  const { state, finishOrder, busy } = useAppStore();
  const order = state.ordens.find(item => item.id === route.params?.orderId);
  const trecho = state.trechos.find(item => item.id === order?.trechoId);
  const [evidencia, setEvidencia] = useState<Evidencia | null>(null);
  const [gps, setGps] = useState<Gps | null>(null);
  const [sensorsBusy, setSensorsBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { setEvidencia(null); setGps(null); setNotes(''); setError(null); setDone(false); }, [route.params?.orderId]);
  if (!order) return <Page><ScreenHeader title="Conclusão da OS" onBack={() => navigation.goBack()} /><Content><StatePanel icon="clipboard-outline" title="Ordem não encontrada" actionLabel="Voltar às ordens" onAction={() => navigation.navigate('Main', { screen: 'OrdensTab' })} /></Content></Page>;
  if (state.user?.perfil === 'gestor') return <Page><ScreenHeader title="Conclusão da OS" onBack={() => navigation.goBack()} /><Content><StatePanel icon="lock-closed-outline" title="Perfil somente leitura" message="A conclusão de ordens está disponível para os perfis de campo." actionLabel="Ver detalhes da OS" onAction={() => navigation.replace('DetalheOrdem', { orderId: order.id })} /></Content></Page>;
  if (order.status === 'concluida' && !done) return <Page><ScreenHeader title="Conclusão da OS" onBack={() => navigation.goBack()} /><Content><StatePanel icon="checkmark-circle-outline" title="Esta ordem já foi concluída" message="O registro final não pode ser gravado novamente." actionLabel="Ver detalhes" onAction={() => navigation.replace('DetalheOrdem', { orderId: order.id })} /></Content></Page>;

  const finish = async () => {
    if (!evidencia || !gps || sensorsBusy) return;
    setError(null);
    try { await finishOrder(order.id, { fotoUri: evidencia.uri, evidencia, observacoes: notes, gps }); setDone(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível concluir a ordem.'); }
  };

  if (done) return (
    <Page><ScreenHeader title="Ordem concluída" /><ScrollView contentContainerStyle={styles.scroll}><Content form style={styles.content}>
      <View style={styles.success}><View style={styles.successIcon}><AppIcon name="checkmark" size={42} color={Colors.white} /></View><Text style={styles.successTitle}>Conclusão registrada</Text><Text style={styles.successText}>{order.numero} foi concluída e o evento entrou na trilha de auditoria.</Text></View>
      <MessageBanner tone="success" title="Persistência confirmada" message="A foto e a localização ficaram associadas ao registro, com suas origens identificadas, antes desta mensagem." />
      <PrimaryButton label="Ver ordem concluída" icon="clipboard-outline" onPress={() => navigation.replace('DetalheOrdem', { orderId: order.id })} />
      <PrimaryButton label="Voltar às ordens" icon="list-outline" variant="outline" onPress={() => navigation.navigate('Main', { screen: 'OrdensTab' })} />
    </Content></ScrollView></Page>
  );

  return (
    <Page>
      <ScreenHeader title="Registrar conclusão" subtitle={order.numero} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><Content form style={styles.content}>
        <MessageBanner tone="warning" title="Revise antes de confirmar" message="A conclusão recebe data automática e não pode ser registrada duas vezes. Confira a origem da foto e da localização abaixo." />
        {error ? <MessageBanner tone="error" title="Conclusão não registrada" message={error} /> : null}
        <Card><SectionHeader title="Resumo da intervenção" /><LabelValue label="Trecho" value={`KM ${order.kmInicial.toFixed(1)} a ${order.kmFinal.toFixed(1)}`} /><LabelValue label="Método" value={order.metodo === 'mecanizada' ? 'Roçada mecanizada' : 'Roçada manual seletiva'} /><LabelValue label="Equipe" value={order.equipeResponsavel || 'Não atribuída'} /></Card>

        <EvidenceFields contextKey={order.id} trecho={trecho} gps={gps} evidencia={evidencia} onGps={setGps} onEvidencia={setEvidencia} onBusy={setSensorsBusy} disabled={busy} />

        <View><Text style={styles.label}>Observações da conclusão (opcional)</Text><TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" placeholder="Descreva o serviço executado." placeholderTextColor={Colors.textTertiary} style={styles.input} accessibilityLabel="Observações da conclusão" /></View>
        <PrimaryButton label="Confirmar conclusão" icon="checkmark-done-outline" onPress={finish} loading={busy} disabled={!evidencia || !gps || sensorsBusy || busy} />
        {!evidencia || !gps || sensorsBusy ? <Text style={styles.help}>Inclua a foto e a localização e aguarde as capturas para confirmar.</Text> : null}
      </Content></ScrollView></KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, scroll: { paddingBottom: Spacing.xxxl }, content: { gap: Spacing.xl }, photoWrap: { height: 240, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated }, photo: { width: '100%', height: '100%' }, photoLabel: { position: 'absolute', top: Spacing.sm, left: Spacing.sm }, placeholder: { minHeight: 150, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }, placeholderTitle: { color: Colors.textSecondary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold, textAlign: 'center' }, actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }, gpsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, gpsTitle: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold }, coords: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.mono, fontSize: Typography.size.sm, marginTop: Spacing.sm }, gpsHelp: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 4 }, label: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold, marginBottom: Spacing.sm }, input: { minHeight: 110, borderWidth: 1.5, borderColor: Colors.borderStrong, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: Typography.size.base }, help: { color: Colors.textTertiary, fontSize: Typography.size.sm, lineHeight: 20, textAlign: 'center' }, success: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl }, successIcon: { width: 78, height: 78, borderRadius: 39, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, successTitle: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold }, successText: { color: Colors.textTertiary, fontSize: Typography.size.base, lineHeight: 24, textAlign: 'center' },
});
