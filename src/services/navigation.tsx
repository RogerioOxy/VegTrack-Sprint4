import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import OrdensScreen from '../screens/OrdensScreen';
import NovoLevantamentoScreen from '../screens/NovoLevantamentoScreen';
import FaunaScreen from '../screens/FaunaScreen';
import MaisScreen from '../screens/MaisScreen';
import LoginScreen from '../screens/LoginScreen';
import DetalheTrechoScreen from '../screens/DetalheTrechoScreen';
import DetalheOrdemScreen from '../screens/DetalheOrdemScreen';
import ConclusaoScreen from '../screens/ConclusaoScreen';
import NotificacoesScreen from '../screens/NotificacoesScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';
import RelatoriosScreen from '../screens/RelatoriosScreen';
import { AppIcon, IconName, Page, StatePanel } from '../components';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../utils/theme';
import { useAppStore } from '../store/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabs: { icon: IconName; activeIcon: IconName; label: string }[] = [
  { icon: 'map-outline', activeIcon: 'map', label: 'Mapa' },
  { icon: 'clipboard-outline', activeIcon: 'clipboard', label: 'Ordens' },
  { icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Registrar' },
  { icon: 'leaf-outline', activeIcon: 'leaf', label: 'Fauna' },
  { icon: 'grid-outline', activeIcon: 'grid', label: 'Mais' },
];

export function TabBar({ state, navigation, descriptors }: any) {
  const { state: appState } = useAppStore();
  const [keyboardShown, setKeyboardShown] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardShown(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardShown(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const abertas = appState.ordens.filter((ordem: any) => ordem.status !== 'concluida').length;
  const naoLidas = appState.notifications.filter((item: any) => !item.lida).length;
  // A barra personalizada precisa aplicar a mesma opção da BottomTabBar padrão.
  if (keyboardShown && descriptors[state.routes[state.index].key].options.tabBarHideOnKeyboard) return null;
  return (
    <View style={styles.barShell}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const selected = state.index === index;
          const tab = tabs[index];
          const badge = index === 1 ? abertas : index === 4 ? naoLidas : 0;
          return (
            <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }}
              onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name); }}
              style={({ pressed }) => [styles.tab, index === 2 && styles.registerTab, pressed && styles.pressed]}>
              <View style={[styles.tabIcon, index === 2 && styles.registerIcon, selected && index !== 2 && styles.tabIconSelected]}>
                <AppIcon name={selected ? tab.activeIcon : tab.icon} size={index === 2 ? 30 : 23} color={index === 2 ? Colors.white : selected ? Colors.primary : Colors.textTertiary} />
                {badge > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View> : null}
              </View>
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, lazy: false, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="MapaTab" component={DashboardScreen} />
      <Tab.Screen name="OrdensTab" component={OrdensScreen} />
      <Tab.Screen name="RegistrarTab" component={NovoLevantamentoScreen} initialParams={{}} />
      <Tab.Screen name="FaunaTab" component={FaunaScreen} />
      <Tab.Screen name="MaisTab" component={MaisScreen} />
    </Tab.Navigator>
  );
}

function BootstrapState({ error, retry, reset }: { error: string | null; retry: () => Promise<void>; reset: () => Promise<void> }) {
  const [recovering, setRecovering] = React.useState(false);
  const [recoveryError, setRecoveryError] = React.useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setRecovering(true); setRecoveryError(null);
    try { await action(); } catch (err) { setRecoveryError(err instanceof Error ? err.message : 'Não foi possível recuperar os dados locais.'); }
    finally { setRecovering(false); }
  };
  if (!error) return <Page><StatePanel loading title="Preparando o VegTrack" message="Carregando os dados locais da demonstração." /></Page>;
  return <Page><View style={styles.bootstrap}><StatePanel icon="cloud-offline-outline" title="Não foi possível preparar o protótipo" message={recoveryError || error} /><View style={styles.bootstrapActions}><Pressable accessibilityRole="button" disabled={recovering} onPress={() => run(retry)} style={styles.bootstrapPrimary}><Text style={styles.bootstrapPrimaryText}>{recovering ? 'Tentando...' : 'Tentar novamente'}</Text></Pressable><Pressable accessibilityRole="button" disabled={recovering} onPress={() => run(reset)} style={styles.bootstrapSecondary}><Text style={styles.bootstrapSecondaryText}>Restaurar dados da demonstração</Text></Pressable></View><Text style={styles.bootstrapHelp}>A restauração substitui apenas o estado local fictício deste protótipo.</Text></View></Page>;
}

export default function AppNavigator() {
  const { state, ready, error, retry, resetDemo } = useAppStore();
  if (!ready) {
    return <BootstrapState error={error} retry={retry} reset={resetDemo} />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        {!state.user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="DetalheTrecho" component={DetalheTrechoScreen} />
            <Stack.Screen name="DetalheOrdem" component={DetalheOrdemScreen} />
            <Stack.Screen name="Conclusao" component={ConclusaoScreen} />
            <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
            <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
            <Stack.Screen name="Relatorios" component={RelatoriosScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootstrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  bootstrapActions: { width: '100%', maxWidth: 420, gap: Spacing.sm },
  bootstrapPrimary: { minHeight: 54, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  bootstrapPrimaryText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
  bootstrapSecondary: { minHeight: 54, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  bootstrapSecondaryText: { color: Colors.primary, fontSize: Typography.size.base, fontWeight: Typography.weight.bold, textAlign: 'center' },
  bootstrapHelp: { color: Colors.textTertiary, fontSize: Typography.size.xs, lineHeight: 18, textAlign: 'center', marginTop: Spacing.md },
  barShell: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 22 : 7, ...Shadow.md },
  bar: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', paddingHorizontal: Spacing.xs, paddingTop: 7 },
  tab: { flex: 1, minHeight: 57, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: BorderRadius.md },
  registerTab: { marginTop: -18 }, pressed: { opacity: 0.7 },
  tabIcon: { width: 42, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full, position: 'relative' },
  tabIconSelected: { backgroundColor: Colors.primaryLight },
  registerIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, borderWidth: 4, borderColor: Colors.surface, ...Shadow.lg },
  tabLabel: { color: Colors.textTertiary, fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold }, tabLabelSelected: { color: Colors.primary, fontWeight: Typography.weight.extrabold },
  badge: { position: 'absolute', right: -5, top: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: Colors.nivel3, borderWidth: 2, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.white, fontSize: Typography.size.xs, fontWeight: Typography.weight.extrabold },
});
