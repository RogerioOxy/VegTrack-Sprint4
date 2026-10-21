import Constants from 'expo-constants';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/AppContext';
import { AppIcon, Card, Content, DemoBadge, IconName, LabelValue, MessageBanner, Page, PrimaryButton, ScreenHeader, SectionHeader } from '../components';
import { BorderRadius, Colors, Spacing, Typography } from '../utils/theme';

type Scenario = 'normal' | 'empty' | 'error' | 'offline';

function MenuItem({ icon, title, subtitle, onPress, badge }: { icon: IconName; title: string; subtitle: string; onPress: () => void; badge?: string }) {
  return <Card onPress={onPress} accessibilityLabel={title} style={styles.menuItem}><View style={styles.menuIcon}><AppIcon name={icon} color={Colors.primary} /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View>{badge ? <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{badge}</Text></View> : null}<AppIcon name="chevron-forward" size={20} color={Colors.textTertiary} /></Card>;
}

const scenarios: { key: Scenario; label: string; detail: string }[] = [
  { key: 'normal', label: 'Normal', detail: 'Dados completos' }, { key: 'empty', label: 'Vazio', detail: 'Listas sem registros' },
  { key: 'error', label: 'Erro', detail: 'Próxima ação falha' }, { key: 'offline', label: 'Offline', detail: 'Fila local simulada' },
];

export default function MaisScreen({ navigation }: { navigation: any }) {
  const { state, scenario, setScenario, sync, resetDemo, logout, retry, error, busy } = useAppStore();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const user = state.user!;
  const unread = state.notifications.filter(item => !item.lida).length;
  const run = async (action: () => Promise<void>, success: string) => {
    setMessage(null); try { await action(); setMessage({ tone: 'success', text: success }); } catch (err) { setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'A operação não foi concluída.' }); }
  };
  const role = user.perfil === 'supervisor' ? 'Supervisor' : user.perfil === 'tecnico' ? 'Técnico' : 'Gestor';

  return (
    <Page>
      <ScreenHeader title="Mais" subtitle="Conta, relatórios e cenários da demonstração" right={<DemoBadge />} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Content style={styles.content}>
          {message ? <MessageBanner tone={message.tone} message={message.text} /> : null}
          {error ? <MessageBanner tone="error" title="Cenário de erro ativo" message={error} actionLabel="Recuperar cenário normal" onAction={() => run(retry, 'Cenário normal restaurado.')} /> : null}
          {scenario === 'offline' || state.pendingSync > 0 ? <View style={styles.queue}><MessageBanner tone="warning" title={scenario === 'offline' ? 'Modo offline demonstrativo' : 'Fila pronta para sincronizar'} message={scenario === 'offline' ? `${state.pendingSync} alteração(ões) estão na fila local. Volte ao cenário normal para sincronizar.` : `${state.pendingSync} alteração(ões) locais aguardam a sincronização demonstrativa.`} />{user.perfil !== 'gestor' ? <PrimaryButton compact variant="outline" icon="sync-outline" label={scenario === 'offline' ? 'Volte ao cenário normal para sincronizar' : 'Sincronizar fila'} disabled={scenario === 'offline' || !state.pendingSync} onPress={() => run(sync, 'Fila demonstrativa sincronizada.')} /> : null}</View> : null}
          <Card style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{user.apelido.slice(0, 1).toUpperCase()}</Text></View><View style={styles.profileCopy}><Text style={styles.name}>{user.nome}</Text><Text style={styles.role}>{role} · {user.rodovia}</Text></View></Card>

          <View style={styles.menuList}>
            <MenuItem icon="notifications-outline" title="Notificações" subtitle="Caixa de entrada e evento simulado" badge={unread ? String(unread) : undefined} onPress={() => navigation.navigate('Notificacoes')} />
            <MenuItem icon="options-outline" title="Configurações do trecho" subtitle={`KM ${state.config.kmInicial} a ${state.config.kmFinal} · mês ${state.config.mes}`} onPress={() => navigation.navigate('Configuracoes')} />
            <MenuItem icon="document-text-outline" title="Relatórios" subtitle="Resumo e exportação em PDF" onPress={() => navigation.navigate('Relatorios')} />
          </View>

          <View>
            <SectionHeader title="Cenários para testes manuais" subtitle="Troque o estado do protótipo sem apagar a base normal" />
            <View style={styles.scenarios}>{scenarios.map(item => { const selected = scenario === item.key; return <Card key={item.key} onPress={() => { setScenario(item.key); setMessage({ tone: 'success', text: `Cenário ${item.label.toLowerCase()} ativado.` }); }} accessibilityLabel={`Ativar cenário ${item.label}`} style={[styles.scenario, selected && styles.scenarioSelected]}><View style={styles.scenarioTop}><Text style={[styles.scenarioTitle, selected && styles.scenarioTitleSelected]}>{item.label}</Text>{selected ? <AppIcon name="checkmark-circle" size={20} color={Colors.primary} /> : null}</View><Text style={styles.scenarioDetail}>{item.detail}</Text></Card>; })}</View>
          </View>

          <Card><LabelValue label="Perfil ativo" value={role} /><LabelValue label="Registros de auditoria" value={String(state.audit.length)} /><LabelValue label="Pendências de sincronização" value={String(state.pendingSync)} /></Card>
          <Card><SectionHeader title={`Sobre o VegTrack ${Constants.expoConfig?.version ?? 'não informada'}`} /><Text>Real: câmera e GPS acionados por você no Android, fotos salvas no app, registros locais e exportação em PDF.</Text><Text>Demonstrativo: contas, trechos, mapa esquemático, fauna, regras ambientais, OS iniciais, notificações e sincronização sem servidor.</Text><Text>Foto de exemplo e localização demonstrativa são opções identificadas. No navegador, somente essas opções estão disponíveis.</Text></Card>
          <View style={styles.actions}>{user.perfil === 'supervisor' ? <PrimaryButton label="Restaurar demonstração" icon="refresh-outline" variant="outline" loading={busy} onPress={() => run(resetDemo, 'Dados da demonstração restaurados.')} /> : null}<PrimaryButton label="Sair da conta" icon="log-out-outline" variant="ghost" disabled={busy} onPress={() => { void logout(); }} /></View>
        </Content>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxxl }, content: { gap: Spacing.xl }, profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: Colors.white, fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold }, profileCopy: { flex: 1 }, name: { color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: Typography.weight.extrabold }, role: { color: Colors.textTertiary, fontSize: Typography.size.sm, lineHeight: 20, marginTop: 2 },
  menuList: { gap: Spacing.sm }, menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, menuIcon: { width: 46, height: 46, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }, menuCopy: { flex: 1 }, menuTitle: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold }, menuSubtitle: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 2 }, menuBadge: { minWidth: 25, height: 25, paddingHorizontal: 6, borderRadius: 13, backgroundColor: Colors.nivel3, alignItems: 'center', justifyContent: 'center' }, menuBadgeText: { color: Colors.white, fontSize: Typography.size.xs, fontWeight: Typography.weight.extrabold },
  queue: { gap: Spacing.sm }, scenarios: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, scenario: { flexGrow: 1, flexBasis: 145, minHeight: 86 }, scenarioSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }, scenarioTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }, scenarioTitle: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold }, scenarioTitleSelected: { color: Colors.primaryDark }, scenarioDetail: { color: Colors.textTertiary, fontSize: Typography.size.xs, marginTop: 5 }, actions: { gap: Spacing.sm },
});
