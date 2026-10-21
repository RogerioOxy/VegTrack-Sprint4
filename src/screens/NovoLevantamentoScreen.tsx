import EvidenceFields from '../components/EvidenceFields';
import { Evidencia, Gps } from '../domain/capture';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { calcularNivelArtesp } from '../store/AppContext';
import { useAppStore } from '../store/AppContext';
import { AlertaAmbiental, AppIcon, Card, Content, MessageBanner, NivelBadge, Page, PrimaryButton, ScreenHeader, SectionHeader, StatePanel } from '../components';
import { BorderRadius, Colors, Spacing, Typography } from '../utils/theme';
import { Levantamento, OrdemServico } from '../utils/mockData';

type Result = { levantamento: Levantamento; ordem: OrdemServico | null; reused: boolean };

export default function NovoLevantamentoScreen({ navigation, route }: { navigation: any; route: any }) {
  const { state, registerSurvey, busy } = useAppStore();
  const initialId = route?.params?.trechoId && state.trechos.some(item => item.id === route.params.trechoId) ? route.params.trechoId : state.trechos[0]?.id || '';
  const [trechoId, setTrechoId] = useState(initialId);
  const [altura, setAltura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [gps, setGps] = useState<Gps | null>(null);
  const [sensorsBusy, setSensorsBusy] = useState(false);
  const [evidencia, setEvidencia] = useState<Evidencia | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    const requested = route?.params?.trechoId;
    if (requested && state.trechos.some(item => item.id === requested)) {
      setTrechoId(requested); setGps(null); setEvidencia(null); setResult(null); setMessage(null);
    }
  }, [route?.params]);
  const trecho = state.trechos.find(item => item.id === trechoId);
  const alturaNum = Number(altura.replace(',', '.'));
  const nivel = altura.trim() && Number.isFinite(alturaNum) && alturaNum > 0 ? calcularNivelArtesp(alturaNum) : null;
  const canSubmit = !!trecho && !!nivel && !!gps && !!evidencia && !busy && !sensorsBusy;

  const reset = () => { setAltura(''); setObservacoes(''); setGps(null); setEvidencia(null); setMessage(null); setResult(null); };

  const submit = async () => {
    if (!trecho || !gps || !evidencia || !nivel || sensorsBusy) return;
    setMessage(null);
    try {
      const created = await registerSurvey({ trechoId: trecho.id, altura, observacoes, fotoUri: evidencia.uri, evidencia, gps });
      setResult(created);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Não foi possível registrar o levantamento.'); }
  };

  if (state.user?.perfil === 'gestor') {
    return <Page><ScreenHeader title="Novo levantamento" /><Content><StatePanel icon="lock-closed-outline" title="Perfil somente leitura" message="O Gestor consulta dados e exporta relatórios. Use os perfis Supervisor ou Técnico para registrar atividades de campo." actionLabel="Voltar ao mapa" onAction={() => navigation.navigate('MapaTab')} /></Content></Page>;
  }

  if (!state.trechos.length) {
    return <Page><ScreenHeader title="Novo levantamento" /><Content><StatePanel icon="map-outline" title="Não há trechos disponíveis" message="O cenário vazio não permite criar registros órfãos. Restaure a demonstração na área Mais." actionLabel="Abrir Mais" onAction={() => navigation.navigate('MaisTab')} /></Content></Page>;
  }

  if (result) {
    const critical = result.levantamento.nivelArtesp === 3;
    return (
      <Page>
        <ScreenHeader title="Levantamento registrado" />
        <ScrollView contentContainerStyle={styles.scroll}><Content form style={styles.content}>
          <View style={styles.successHero}><View style={styles.successIcon}><AppIcon name="checkmark" size={40} color={Colors.white} /></View><Text style={styles.successTitle}>Registro salvo com sucesso</Text><Text style={styles.successText}>O levantamento foi persistido no protótipo antes desta confirmação.</Text></View>
          {result.reused ? <MessageBanner tone="info" title="OS existente preservada" message="Já havia uma ordem aberta para este trecho. O VegTrack atualizou o histórico sem criar duplicidade." /> : null}
          <Card style={styles.summary}><View style={styles.summaryHeader}><Text style={styles.summaryKm}>KM {result.levantamento.kmInicial.toFixed(1)} a {result.levantamento.kmFinal.toFixed(1)}</Text><NivelBadge nivel={result.levantamento.nivelArtesp} /></View><Text style={styles.summaryText}>{result.levantamento.alturaVegetacaoCm} cm · {result.levantamento.faixa}</Text>{result.ordem ? <MessageBanner tone={result.ordem.status === 'bloqueada' ? 'warning' : 'info'} title={`${result.ordem.numero} ${result.reused ? 'mantida' : 'gerada'}`} message={result.ordem.status === 'bloqueada' ? 'A intervenção mecanizada foi bloqueada pela restrição ambiental demonstrativa.' : 'A nova ordem está disponível na fila operacional.'} /> : <MessageBanner tone="success" title="Sem necessidade de OS" message={critical ? 'O domínio avaliou o contexto e manteve a ordem existente.' : 'A medição ficou abaixo do Nível 3.'} />}</Card>
          <PrimaryButton label="Ver ordens de serviço" icon="clipboard-outline" onPress={() => navigation.navigate('OrdensTab')} />
          <PrimaryButton label="Registrar outro levantamento" icon="add-circle-outline" variant="outline" onPress={reset} />
          <PrimaryButton label="Voltar ao mapa" icon="map-outline" variant="ghost" onPress={() => navigation.navigate('MapaTab')} />
        </Content></ScrollView>
      </Page>
    );
  }

  return (
    <Page>
      <ScreenHeader title="Novo levantamento" subtitle="Medição de campo com GPS e evidência identificados" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Content form style={styles.content}>
            <MessageBanner message="Escolha uma foto e uma localização. O registro identifica separadamente o que veio do dispositivo e o que é demonstrativo." />
            {message ? <MessageBanner tone="error" title="Registro não concluído" message={message} /> : null}

            <View>
              <SectionHeader title="1. Selecione o trecho" subtitle="Somente trechos existentes no contexto configurado" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentRow}>
                {state.trechos.map(item => {
                  const selected = item.id === trechoId;
                  return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected }} disabled={busy || sensorsBusy} onPress={() => { setTrechoId(item.id); setGps(null); setEvidencia(null); setMessage(null); }} style={({ pressed }) => [styles.segmentCard, selected && styles.segmentSelected, pressed && styles.pressed]}><Text style={[styles.segmentKm, selected && styles.segmentKmSelected]}>KM {item.kmInicial.toFixed(1)} a {item.kmFinal.toFixed(1)}</Text><Text numberOfLines={2} style={styles.segmentFaixa}>{item.faixa}</Text><NivelBadge nivel={item.nivelArtesp} compact /></Pressable>;
                })}
              </ScrollView>
            </View>

            {trecho?.restricaoAmbiental && trecho.especieEmRestricao ? <AlertaAmbiental especie={trecho.especieEmRestricao} /> : null}

            <View>
              <SectionHeader title="2. Informe a medição" subtitle="O nível ARTESP demonstrativo é calculado enquanto você digita" />
              <Text style={styles.label}>Altura da vegetação</Text>
              <View style={styles.heightRow}><TextInput accessibilityLabel="Altura da vegetação em centímetros" value={altura} onChangeText={setAltura} keyboardType="decimal-pad" placeholder="Ex.: 47" placeholderTextColor={Colors.textTertiary} style={[styles.input, styles.heightInput]} /><Text style={styles.unit}>cm</Text></View>
              {nivel ? <View style={styles.levelPreview}><NivelBadge nivel={nivel} /><Text style={[styles.levelMessage, nivel === 3 && { color: Colors.nivel3 }]}>{nivel === 3 ? 'Uma OS será criada ou reutilizada automaticamente.' : 'O histórico será atualizado sem gerar nova OS.'}</Text></View> : null}
            </View>

            <EvidenceFields contextKey={trechoId} trecho={trecho} gps={gps} evidencia={evidencia} onGps={setGps} onEvidencia={setEvidencia} onBusy={setSensorsBusy} disabled={busy} />

            <View><Text style={styles.label}>Observações (opcional)</Text><TextInput accessibilityLabel="Observações" value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={4} textAlignVertical="top" placeholder="Ex.: vegetação próxima à sinalização." placeholderTextColor={Colors.textTertiary} style={[styles.input, styles.notes]} /></View>
            <PrimaryButton label="Registrar levantamento" icon="checkmark-circle-outline" onPress={submit} loading={busy} disabled={!canSubmit} />
            {!canSubmit ? <Text style={styles.help}>Selecione um trecho, informe uma altura válida e adicione a foto e a localização. Aguarde as capturas terminarem.</Text> : null}
          </Content>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, scroll: { paddingBottom: Spacing.xxxl }, content: { gap: Spacing.xl },
  segmentRow: { gap: Spacing.sm, paddingBottom: Spacing.sm }, segmentCard: { width: 180, minHeight: 118, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, padding: Spacing.md, gap: 6 }, segmentSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }, pressed: { opacity: 0.72 }, segmentKm: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: Typography.weight.extrabold }, segmentKmSelected: { color: Colors.primaryDark }, segmentFaixa: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 17, flex: 1 },
  label: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold, marginBottom: Spacing.sm }, input: { minHeight: 54, borderWidth: 1.5, borderColor: Colors.borderStrong, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: Typography.size.base }, heightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, heightInput: { width: 150, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, textAlign: 'center' }, unit: { color: Colors.textTertiary, fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  levelPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center', marginTop: Spacing.md }, levelMessage: { flex: 1, minWidth: 210, color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20 },
  photoWrap: { height: 220, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated }, photo: { width: '100%', height: '100%' }, photoLabel: { position: 'absolute', top: Spacing.sm, left: Spacing.sm }, photoEmpty: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderStyle: 'dashed' }, photoTitle: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold }, photoText: { color: Colors.textTertiary, fontSize: Typography.size.sm, textAlign: 'center' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }, gpsCard: { gap: 5 }, gpsTitle: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }, gpsStatus: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold }, coords: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.mono }, accuracy: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18 }, notes: { minHeight: 110, paddingTop: Spacing.md }, help: { color: Colors.textTertiary, fontSize: Typography.size.sm, lineHeight: 20, textAlign: 'center' },
  successHero: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }, successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, successTitle: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold, textAlign: 'center' }, successText: { color: Colors.textTertiary, fontSize: Typography.size.base, lineHeight: 24, textAlign: 'center' }, summary: { gap: Spacing.md }, summaryHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm }, summaryKm: { color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: Typography.weight.extrabold }, summaryText: { color: Colors.textSecondary, fontSize: Typography.size.base },
});
